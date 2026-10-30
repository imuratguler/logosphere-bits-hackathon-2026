/**
 * Logosphere BITS — demo persona list (shared scope, read-only).
 *
 * Reads the shared persona list every demo profile sees. The selected
 * persona is identity/view context only: this service takes no persona
 * parameter and applies no ownership filter, so changing the persona
 * cannot produce different data. The query stays inside the public
 * demo scope (demo_personas, anon SELECT) with explicit columns and
 * never touches private tables (profiles, organizations,
 * memberships, pipeline_*). Ordering follows the seed sort_order.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjDemoPersona = {
  fldStrId: string;
  fldStrDisplayName: string;
  fldNumSortOrder: number;
};

type fldObjDemoPersonaRow = {
  id: string;
  display_name: string;
  sort_order: number;
};

function fncRunIsDemoPersonaRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoPersonaRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDemoPersonaRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.display_name === 'string' &&
    typeof fldObjRow.sort_order === 'number'
  );
}

export async function srvApiGetDemoPersonas(
  fldObjClient: SupabaseClient,
): Promise<fldObjDemoPersona[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('demo_personas')
    .select('id, display_name, sort_order')
    .order('sort_order', { ascending: true });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo persona list unavailable (demo_personas ` +
        `read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: demo_personas returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDemoPersonaRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: demo_personas returned an unexpected shape ' +
          '(need id + display_name + sort_order).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrDisplayName: fldObjRow.display_name,
      fldNumSortOrder: fldObjRow.sort_order,
    };
  });
}
