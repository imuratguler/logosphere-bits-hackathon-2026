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
