/**
 * Logosphere BITS — shared demo workspace (shared scope, read-only).
 *
 * Reads the single shared workspace every demo profile sees. Takes no
 * persona parameter and applies no ownership filter: the query is
 * identical for every persona by signature, so changing the persona
 * cannot produce different data. The query stays inside the public
 * demo scope (workspaces, anon SELECT) with explicit columns and never
 * touches private tables. Demo scope assumes one shared workspace
 * (seed); oldest-first keeps the pick deterministic.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjDemoWorkspace = {
  fldStrId: string;
  fldStrName: string;
};

type fldObjDemoWorkspaceRow = {
  id: string;
  name: string;
};

function fncRunIsDemoWorkspaceRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoWorkspaceRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoWorkspaceRow>;
  return typeof fldObjRow.id === 'string' && typeof fldObjRow.name === 'string';
}

export async function srvApiGetDemoWorkspace(
  fldObjClient: SupabaseClient,
): Promise<fldObjDemoWorkspace> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('workspaces')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: shared demo workspace unavailable (workspaces ` +
        `read failed: ${fldObjError.message}).`,
    );
  }
  const fldObjRow = Array.isArray(fldObjRows) ? fldObjRows[0] : undefined;
  if (fldObjRow === undefined) {
    throw new Error(
      'Logosphere BITS: shared demo workspace is missing (need one ' +
        'seeded workspace row).',
    );
  }
  if (!fncRunIsDemoWorkspaceRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: workspaces returned an unexpected shape ' +
        '(need id + name).',
    );
  }
  return { fldStrId: fldObjRow.id, fldStrName: fldObjRow.name };
}
