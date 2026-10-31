/**
 * Logosphere BITS — shared workspace libraries (shared scope).
 *
 * Reads the library nodes of one workspace, every demo profile seeing
 * the same rows. Takes no persona parameter and applies no ownership
 * filter: the query is identical for every persona by signature. The
 * query stays inside the public demo scope (nodes, anon SELECT) with
 * explicit columns and never touches private tables. Ordering is
 * sort_order, then name, so the pick is deterministic.
 * Creation goes through the demo_create_library RPC with the caller's
 * session id only — never a persona, role, or profile value — and the
 * server authorizes the (create, library) cell before inserting. The
 * demo RPC persists the name; the shortcut type is validated against
 * the allowed vocabulary here and travels with the client input until
 * the detail-columns RPC lands. No RPC deletes, moves, or edits detail
 * columns (migration 20261030080608_demo_write_policy).
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { fldArrLibraryShortcutTypes } from '../types/typModels';
import type { fldObjLibraryInput } from '../validation/vldDetails';

export type fldObjDemoLibrary = {
  fldStrId: string;
  fldStrName: string;
};

type fldObjDemoLibraryRow = {
  id: string;
  name: string;
};

function fncRunIsDemoLibraryRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoLibraryRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoLibraryRow>;
  return typeof fldObjRow.id === 'string' && typeof fldObjRow.name === 'string';
}

export async function srvApiGetDemoLibraries(
  fldObjClient: SupabaseClient,
  fldStrWorkspaceId: string,
): Promise<fldObjDemoLibrary[]> {
  if (fldStrWorkspaceId.trim() === '') {
    throw new Error('Logosphere BITS: demo workspace ID is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('id, name')
    .eq('workspace_id', fldStrWorkspaceId)
    .eq('kind', 'library')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo libraries unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDemoLibraryRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: nodes returned an unexpected shape (need id + name).',
      );
    }
    return { fldStrId: fldObjRow.id, fldStrName: fldObjRow.name };
  });
}

export async function srvApiCreateDemoLibrary(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrWorkspaceId: string,
  fldObjShortcut: fldObjLibraryInput,
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
  const fldStrRawName = fldObjShortcut.fldStrName;
  if (fldStrRawName === null || fldStrRawName.trim() === '') {
    throw new Error('Logosphere BITS: library name is missing or blank.');
  }
  if (
    !(fldArrLibraryShortcutTypes as readonly string[]).includes(
      fldObjShortcut.fldStrLibraryType ?? '',
    )
  ) {
    throw new Error(
      'Logosphere BITS: library type must be Branch, Department, or Hall.',
    );
  }
  const fldStrTrimmedName = fldStrRawName.trim();
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_create_library',
    {
      p_session_id: fldStrSessionId,
      p_workspace_id: fldStrWorkspaceId,
      p_name: fldStrTrimmedName,
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo library create failed (demo_create_library ` +
        `failed: ${fldObjRpcError.message}).`,
    );
  }
  const fldStrNewId = Array.isArray(fldObjRpcData)
    ? fldObjRpcData[0]
    : fldObjRpcData;
  if (typeof fldStrNewId !== 'string' || fldStrNewId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo_create_library returned an unexpected shape ' +
        '(need the new library id).',
    );
  }
  return fldStrNewId;
}
