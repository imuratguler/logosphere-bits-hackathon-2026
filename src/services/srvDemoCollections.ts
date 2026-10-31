/**
 * Logosphere BITS — shared workspace collections (shared scope).
 *
 * Reads the collection nodes hanging under one parent (a library at
 * the first level, a collection deeper down), every demo profile
 * seeing the same rows. Takes no persona parameter and applies no
 * ownership filter: the query is identical for every persona by
 * signature. The query stays inside the public demo scope (nodes, anon
 * SELECT) with explicit columns and never touches private tables.
 * Ordering is sort_order, then name, so the pick is deterministic.
 * Creation goes through the demo_create_collection RPC with the
 * caller's session id only — never a persona, role, or profile value —
 * and the server authorizes the (create, collection) cell before
 * inserting. The client validates parent suitability first with its
 * own reads (parent exists, kind holds collections, same workspace,
 * collection parents hold no sets or products), so the form fails
 * fast; the server rechecks every rule and stamps the formed date as
 * today. The client sends no date.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjDemoCollection = {
  fldStrId: string;
  fldStrName: string;
};

type fldObjDemoCollectionRow = {
  id: string;
  name: string;
};

function fncRunIsDemoCollectionRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoCollectionRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoCollectionRow>;
  return typeof fldObjRow.id === 'string' && typeof fldObjRow.name === 'string';
}

export async function srvApiGetDemoCollections(
  fldObjClient: SupabaseClient,
  fldStrWorkspaceId: string,
  fldStrParentId: string,
): Promise<fldObjDemoCollection[]> {
  if (fldStrWorkspaceId.trim() === '') {
    throw new Error('Logosphere BITS: demo workspace ID is missing or blank.');
  }
  if (fldStrParentId.trim() === '') {
    throw new Error('Logosphere BITS: demo parent ID is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('id, name')
    .eq('workspace_id', fldStrWorkspaceId)
    .eq('kind', 'collection')
    .eq('parent_id', fldStrParentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo collections unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDemoCollectionRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: nodes returned an unexpected shape (need id + name).',
      );
    }
    return { fldStrId: fldObjRow.id, fldStrName: fldObjRow.name };
  });
}

type fldObjDemoParentRow = {
  kind: string;
  workspace_id: string;
};

function fncRunIsDemoParentRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoParentRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoParentRow>;
  return (
    typeof fldObjRow.kind === 'string' &&
    typeof fldObjRow.workspace_id === 'string'
  );
}

function fncRunReadRpcId(
  fldObjRpcData: unknown,
  fldStrFunction: string,
): string {
  const fldStrId = Array.isArray(fldObjRpcData)
    ? fldObjRpcData[0]
    : fldObjRpcData;
  if (typeof fldStrId !== 'string' || fldStrId.trim() === '') {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        `(need the collection id).`,
    );
  }
  return fldStrId;
}

async function fncRunRequireCollectionParent(
  fldObjClient: SupabaseClient,
  fldStrWorkspaceId: string,
  fldStrParentId: string,
): Promise<void> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('kind, workspace_id')
    .eq('id', fldStrParentId)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo parent unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    throw new Error('Logosphere BITS: demo parent was not found.');
  }
  if (!fncRunIsDemoParentRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape ' +
        '(need kind + workspace_id).',
    );
  }
  if (fldObjRow.kind !== 'library' && fldObjRow.kind !== 'collection') {
    throw new Error('Logosphere BITS: demo parent cannot hold collections.');
  }
  if (fldObjRow.workspace_id !== fldStrWorkspaceId) {
    throw new Error('Logosphere BITS: demo parent is outside the workspace.');
  }
  if (fldObjRow.kind === 'library') {
    return;
  }
  const { data: fldArrSets, error: fldObjSetsError } = await fldObjClient
    .from('sets')
    .select('id')
    .eq('collection_id', fldStrParentId)
    .limit(1);
  if (fldObjSetsError) {
    throw new Error(
      `Logosphere BITS: demo parent check unavailable (sets read failed: ` +
        `${fldObjSetsError.message}).`,
    );
  }
  const { data: fldArrProducts, error: fldObjProductsError } =
    await fldObjClient
      .from('products')
      .select('id')
      .eq('collection_id', fldStrParentId)
      .limit(1);
  if (fldObjProductsError) {
    throw new Error(
      `Logosphere BITS: demo parent check unavailable (products read failed: ` +
        `${fldObjProductsError.message}).`,
    );
  }
  if (
    (Array.isArray(fldArrSets) && fldArrSets.length > 0) ||
    (Array.isArray(fldArrProducts) && fldArrProducts.length > 0)
  ) {
    throw new Error(
      'Logosphere BITS: demo collection already holds sets or products.',
    );
  }
}

export async function srvApiCreateDemoCollection(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrWorkspaceId: string,
  fldStrParentId: string,
  fldStrName: string,
): Promise<string> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then save again.',
    );
  }
  if (fldStrWorkspaceId.trim() === '') {
    throw new Error('Logosphere BITS: demo workspace ID is missing or blank.');
  }
  if (fldStrParentId.trim() === '') {
    throw new Error('Logosphere BITS: demo parent ID is missing or blank.');
  }
  if (fldStrName.trim() === '') {
    throw new Error('Logosphere BITS: collection name is missing or blank.');
  }
  await fncRunRequireCollectionParent(
    fldObjClient,
    fldStrWorkspaceId,
    fldStrParentId,
  );
  const fldStrTrimmedName = fldStrName.trim();
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_create_collection',
    {
      p_session_id: fldStrSessionId,
      p_workspace_id: fldStrWorkspaceId,
      p_parent_id: fldStrParentId,
      p_name: fldStrTrimmedName,
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo collection create failed ` +
        `(demo_create_collection failed: ${fldObjRpcError.message}).`,
    );
  }
  return fncRunReadRpcId(fldObjRpcData, 'demo_create_collection');
}
