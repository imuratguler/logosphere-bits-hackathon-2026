/**
 * Logosphere BITS — geo reference reads (shared scope, read-only).
 *
 * Lists the loaded geo_nodes reference rows every demo profile sees:
 * country roots plus children of a selected parent, ordered by name
 * with a list guard. Reads need no session and no persona (anon
 * SELECT on the reference table); writes stay revoked server-side.
 * Town, street, and postal values are absent in the source transfer,
 * so those levels legitimately come back empty and the form falls
 * back to free text — missing values are never fabricated here.
 * Loaded rows are filtered client-side; the fold keeps Turkish search
 * working (dotted capitals, circumflexes, dotless i).
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjGeoNode = {
  fldStrId: string;
  fldStrCode: string;
  fldStrName: string;
  fldStrLevel: string;
  fldStrParentId: string | null;
  fldStrPostalCode: string | null;
};

type fldObjGeoNodeRow = {
  id: string;
  code: string;
  name: string;
  level: string;
  parent_id: string | null;
  postal_code: string | null;
};

const fldNumGeoListLimit = 200;
const fldNumGeoMatchLimit = 10;

function fncRunIsGeoNodeRow(
  fldObjValue: unknown,
): fldObjValue is fldObjGeoNodeRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjGeoNodeRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.code === 'string' &&
    typeof fldObjRow.name === 'string' &&
    typeof fldObjRow.level === 'string' &&
    (fldObjRow.parent_id === null || typeof fldObjRow.parent_id === 'string') &&
    (fldObjRow.postal_code === null ||
      typeof fldObjRow.postal_code === 'string')
  );
}

function fncConvFoldSearchText(fldStrValue: string): string {
  return fldStrValue
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

export function fncConvFilterGeoNodesByQuery(
  fldArrRows: fldObjGeoNode[],
  fldStrQuery: string,
): fldObjGeoNode[] {
  const fldStrFolded = fncConvFoldSearchText(fldStrQuery.trim());
  const fldArrMatches =
    fldStrFolded === ''
      ? fldArrRows
      : fldArrRows.filter(fldObjRow =>
          fncConvFoldSearchText(fldObjRow.fldStrName).includes(fldStrFolded),
        );
  return fldArrMatches.slice(0, fldNumGeoMatchLimit);
}

function fncRunMapGeoRows(fldObjRows: unknown): fldObjGeoNode[] {
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: geo_nodes returned an unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsGeoNodeRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: geo_nodes returned an unexpected shape ' +
          '(need id + code + name + level).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrCode: fldObjRow.code,
      fldStrName: fldObjRow.name,
      fldStrLevel: fldObjRow.level,
      fldStrParentId: fldObjRow.parent_id,
      fldStrPostalCode: fldObjRow.postal_code,
    };
  });
}

export async function srvApiGetGeoRoots(
  fldObjClient: SupabaseClient,
): Promise<fldObjGeoNode[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('geo_nodes')
    .select('id, code, parent_id, level, name, postal_code')
    .is('parent_id', null)
    .eq('level', 'country')
    .order('name', { ascending: true })
    .limit(fldNumGeoListLimit);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: geo reference unavailable (geo_nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  return fncRunMapGeoRows(fldObjRows);
}

export async function srvApiGetGeoChildren(
  fldObjClient: SupabaseClient,
  fldStrParentId: string,
): Promise<fldObjGeoNode[]> {
  if (fldStrParentId.trim() === '') {
    throw new Error('Logosphere BITS: geo parent ID is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('geo_nodes')
    .select('id, code, parent_id, level, name, postal_code')
    .eq('parent_id', fldStrParentId)
    .order('name', { ascending: true })
    .limit(fldNumGeoListLimit);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: geo reference unavailable (geo_nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  return fncRunMapGeoRows(fldObjRows);
}
