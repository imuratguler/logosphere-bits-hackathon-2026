/**
 * Logosphere BITS — shared collection sets and their products (shared scope).
 *
 * Reads the sets hanging under one collection plus the collection's
 * products, every demo profile seeing the same rows. Takes no persona
 * parameter and applies no ownership filter: the queries are
 * identical for every persona by signature. The queries stay inside
 * the public demo scope (sets, products, anon SELECT) with explicit
 * columns and never touch private tables. Ordering is sort_order,
 * then name, so the pick is deterministic. A set holds products
 * only: members are the products whose set link points at it, counted
 * and grouped on the client from the single products read (no query
 * per set). Per-product photo counts come from one product_images
 * read, grouped on the client the same way.
 * Creation goes through the demo_create_set RPC with the caller's
 * session id only — never a persona, role, or profile value — and the
 * server authorizes the (create, collection) cell before inserting.
 * The client validates the parent first with its own read (the
 * parent exists and is a collection), so the form fails fast; the
 * server rechecks the collection kind. The collection link always
 * comes from the visible parent — callers pass no workspace, the
 * server derives scope via the collection join.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjDemoSet = {
  fldStrId: string;
  fldStrName: string;
};

export type fldObjDemoSetProduct = {
  fldStrId: string;
  fldStrName: string;
  fldStrSetId: string | null;
};

type fldObjDemoSetRow = {
  id: string;
  name: string;
};

type fldObjDemoSetProductRow = {
  id: string;
  name: string;
  set_id: string | null;
};

function fncRunIsDemoSetRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoSetRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoSetRow>;
  return typeof fldObjRow.id === 'string' && typeof fldObjRow.name === 'string';
}

function fncRunIsDemoSetProductRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoSetProductRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoSetProductRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.name === 'string' &&
    (fldObjRow.set_id === null || typeof fldObjRow.set_id === 'string')
  );
}

export async function srvApiGetDemoSets(
  fldObjClient: SupabaseClient,
  fldStrCollectionId: string,
): Promise<fldObjDemoSet[]> {
  if (fldStrCollectionId.trim() === '') {
    throw new Error('Logosphere BITS: demo collection ID is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('sets')
    .select('id, name')
    .eq('collection_id', fldStrCollectionId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo sets unavailable (sets read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: sets returned an unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDemoSetRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: sets returned an unexpected shape (need id + name).',
      );
    }
    return { fldStrId: fldObjRow.id, fldStrName: fldObjRow.name };
  });
}

export async function srvApiGetDemoSetProducts(
  fldObjClient: SupabaseClient,
  fldStrCollectionId: string,
): Promise<fldObjDemoSetProduct[]> {
  if (fldStrCollectionId.trim() === '') {
    throw new Error('Logosphere BITS: demo collection ID is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('products')
    .select('id, name, set_id')
    .eq('collection_id', fldStrCollectionId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo set products unavailable (products read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: products returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDemoSetProductRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: products returned an unexpected shape ' +
          '(need id + name + set_id).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrName: fldObjRow.name,
      fldStrSetId: fldObjRow.set_id,
    };
  });
}

type fldObjDemoProductPhotoRow = {
  product_id: string;
};

function fncRunIsDemoProductPhotoRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoProductPhotoRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoProductPhotoRow>;
  return typeof fldObjRow.product_id === 'string';
}

export async function srvApiGetDemoProductPhotoCounts(
  fldObjClient: SupabaseClient,
  fldArrProductIds: string[],
): Promise<Record<string, number>> {
  if (fldArrProductIds.length === 0) {
    return {};
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('product_images')
    .select('product_id')
    .in('product_id', fldArrProductIds);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo photo counts unavailable (product_images ` +
        `read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: product_images returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldObjCounts: Record<string, number> = {};
  for (const fldStrId of fldArrProductIds) {
    fldObjCounts[fldStrId] = 0;
  }
  for (const fldObjRow of fldObjRows) {
    if (!fncRunIsDemoProductPhotoRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: product_images returned an unexpected shape ' +
          '(need product_id).',
      );
    }
    fldObjCounts[fldObjRow.product_id] =
      (fldObjCounts[fldObjRow.product_id] ?? 0) + 1;
  }
  return fldObjCounts;
}

type fldObjDemoSetParentRow = {
  kind: string;
};

function fncRunIsDemoSetParentRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoSetParentRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoSetParentRow>;
  return typeof fldObjRow.kind === 'string';
}

export async function srvApiCreateDemoSet(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrCollectionId: string,
  fldStrName: string,
): Promise<string> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then save again.',
    );
  }
  if (fldStrCollectionId.trim() === '') {
    throw new Error('Logosphere BITS: demo collection ID is missing or blank.');
  }
  if (fldStrName.trim() === '') {
    throw new Error('Logosphere BITS: set name is missing or blank.');
  }
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('kind')
    .eq('id', fldStrCollectionId)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo collection unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    throw new Error('Logosphere BITS: demo collection was not found.');
  }
  if (!fncRunIsDemoSetParentRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape (need kind).',
    );
  }
  if (fldObjRow.kind !== 'collection') {
    throw new Error('Logosphere BITS: demo set parent must be a collection.');
  }
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_create_set',
    {
      p_session_id: fldStrSessionId,
      p_collection_id: fldStrCollectionId,
      p_name: fldStrName.trim(),
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo set create failed (demo_create_set failed: ` +
        `${fldObjRpcError.message}).`,
    );
  }
  const fldStrId = Array.isArray(fldObjRpcData)
    ? fldObjRpcData[0]
    : fldObjRpcData;
  if (typeof fldStrId !== 'string' || fldStrId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo_create_set returned an unexpected shape ' +
        '(need the set id).',
    );
  }
  return fldStrId;
}
