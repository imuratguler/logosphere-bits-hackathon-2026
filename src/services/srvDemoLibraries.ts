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
 * create RPC persists the name; the shortcut type is validated against
 * the allowed vocabulary here (null stays allowed for settings callers).
 * Settings saves go through demo_save_library_details, which renames
 * the node and upserts the library_details row in one call; reads come
 * from the shared anon SELECT on that table (null row means no details
 * saved yet). Blank optional values normalize to null — missing data
 * is never stored as an empty string.
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
  fncRunRequireShortcutType(fldObjShortcut.fldStrLibraryType);
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

const fldRegIsoDate = /^\d{4}-\d{2}-\d{2}$/;

function fncRunRequireShortcutType(fldStrValue: string | null): void {
  if (fldStrValue === null || fldStrValue.trim() === '') {
    return;
  }
  if (
    !(fldArrLibraryShortcutTypes as readonly string[]).includes(fldStrValue)
  ) {
    throw new Error(
      'Logosphere BITS: library type must be Branch, Department, or Hall.',
    );
  }
}

function fncRunRequireIsoDate(fldStrValue: string | null): void {
  if (fldStrValue === null || fldStrValue.trim() === '') {
    return;
  }
  const fldStrTrimmed = fldStrValue.trim();
  if (
    !fldRegIsoDate.test(fldStrTrimmed) ||
    !Number.isFinite(Date.parse(fldStrTrimmed))
  ) {
    throw new Error(
      'Logosphere BITS: library founded date must be YYYY-MM-DD.',
    );
  }
}

function fncRunNullIfBlank(fldStrValue: string | null): string | null {
  if (fldStrValue === null || fldStrValue.trim() === '') {
    return null;
  }
  return fldStrValue;
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
        `(need the library id).`,
    );
  }
  return fldStrId;
}

export async function srvApiSaveDemoLibraryDetails(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrLibraryId: string,
  fldObjDetails: fldObjLibraryInput,
): Promise<string> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then save again.',
    );
  }
  if (fldStrLibraryId.trim() === '') {
    throw new Error('Logosphere BITS: demo library ID is missing or blank.');
  }
  const fldStrRawName = fldObjDetails.fldStrName;
  if (fldStrRawName === null || fldStrRawName.trim() === '') {
    throw new Error('Logosphere BITS: library name is missing or blank.');
  }
  const fldStrRawCode = fldObjDetails.fldStrCode;
  if (fldStrRawCode === null || fldStrRawCode.trim() === '') {
    throw new Error('Logosphere BITS: library code is missing or blank.');
  }
  fncRunRequireShortcutType(fldObjDetails.fldStrLibraryType);
  fncRunRequireIsoDate(fldObjDetails.fldDatFoundedDate);
  const fldObjParts = fldObjDetails.fldObjAddressParts;
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_save_library_details',
    {
      p_session_id: fldStrSessionId,
      p_node_id: fldStrLibraryId,
      p_name: fldStrRawName.trim(),
      p_code: fldStrRawCode.trim(),
      p_library_type: fncRunNullIfBlank(fldObjDetails.fldStrLibraryType),
      p_founded_date: fncRunNullIfBlank(fldObjDetails.fldDatFoundedDate),
      p_country_code: fncRunNullIfBlank(fldObjParts.fldObjCountry.fldStrCode),
      p_country_text: fncRunNullIfBlank(fldObjParts.fldObjCountry.fldStrText),
      p_state_code: fncRunNullIfBlank(fldObjParts.fldObjState.fldStrCode),
      p_state_text: fncRunNullIfBlank(fldObjParts.fldObjState.fldStrText),
      p_city_code: fncRunNullIfBlank(fldObjParts.fldObjCity.fldStrCode),
      p_city_text: fncRunNullIfBlank(fldObjParts.fldObjCity.fldStrText),
      p_district_code: fncRunNullIfBlank(fldObjParts.fldObjDistrict.fldStrCode),
      p_district_text: fncRunNullIfBlank(fldObjParts.fldObjDistrict.fldStrText),
      p_town_code: fncRunNullIfBlank(fldObjParts.fldObjTown.fldStrCode),
      p_town_text: fncRunNullIfBlank(fldObjParts.fldObjTown.fldStrText),
      p_neighborhood_code: fncRunNullIfBlank(
        fldObjParts.fldObjNeighborhood.fldStrCode,
      ),
      p_neighborhood_text: fncRunNullIfBlank(
        fldObjParts.fldObjNeighborhood.fldStrText,
      ),
      p_street_code: fncRunNullIfBlank(fldObjParts.fldObjStreet.fldStrCode),
      p_street_text: fncRunNullIfBlank(fldObjParts.fldObjStreet.fldStrText),
      p_extra_description: fncRunNullIfBlank(
        fldObjParts.fldStrExtraDescription,
      ),
      p_postal_code: fncRunNullIfBlank(fldObjParts.fldStrPostalCode),
      p_building: fncRunNullIfBlank(fldObjParts.fldStrBuilding),
      p_floor: fncRunNullIfBlank(fldObjParts.fldStrFloor),
      p_apartment: fncRunNullIfBlank(fldObjParts.fldStrApartment),
      p_website: fncRunNullIfBlank(fldObjDetails.fldStrWebsite),
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo library save failed (demo_save_library_details ` +
        `failed: ${fldObjRpcError.message}).`,
    );
  }
  return fncRunReadRpcId(fldObjRpcData, 'demo_save_library_details');
}

type fldObjLibraryDetailsRow = {
  code: string;
  library_type: string | null;
  founded_date: string | null;
  country_code: string | null;
  country_text: string | null;
  state_code: string | null;
  state_text: string | null;
  city_code: string | null;
  city_text: string | null;
  district_code: string | null;
  district_text: string | null;
  town_code: string | null;
  town_text: string | null;
  neighborhood_code: string | null;
  neighborhood_text: string | null;
  street_code: string | null;
  street_text: string | null;
  extra_description: string | null;
  postal_code: string | null;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  website: string | null;
};

function fncRunIsLibraryDetailsRow(
  fldObjValue: unknown,
): fldObjValue is fldObjLibraryDetailsRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjLibraryDetailsRow>;
  if (typeof fldObjRow.code !== 'string') {
    return false;
  }
  const fldArrRest: (string | null | undefined)[] = [
    fldObjRow.library_type,
    fldObjRow.founded_date,
    fldObjRow.country_code,
    fldObjRow.country_text,
    fldObjRow.state_code,
    fldObjRow.state_text,
    fldObjRow.city_code,
    fldObjRow.city_text,
    fldObjRow.district_code,
    fldObjRow.district_text,
    fldObjRow.town_code,
    fldObjRow.town_text,
    fldObjRow.neighborhood_code,
    fldObjRow.neighborhood_text,
    fldObjRow.street_code,
    fldObjRow.street_text,
    fldObjRow.extra_description,
    fldObjRow.postal_code,
    fldObjRow.building,
    fldObjRow.floor,
    fldObjRow.apartment,
    fldObjRow.website,
  ];
  return fldArrRest.every(
    fldStrValue => fldStrValue === null || typeof fldStrValue === 'string',
  );
}

function fncRunMapDetailsRow(fldObjRow: fldObjLibraryDetailsRow) {
  const fncConvGeoField = (
    fldStrCode: string | null,
    fldStrText: string | null,
  ) => ({ fldStrCode, fldStrText });
  return {
    fldStrCode: fldObjRow.code,
    fldStrLibraryType: fldObjRow.library_type,
    fldDatFoundedDate: fldObjRow.founded_date,
    fldObjAddressParts: {
      fldObjCountry: fncConvGeoField(
        fldObjRow.country_code,
        fldObjRow.country_text,
      ),
      fldObjState: fncConvGeoField(fldObjRow.state_code, fldObjRow.state_text),
      fldObjCity: fncConvGeoField(fldObjRow.city_code, fldObjRow.city_text),
      fldObjDistrict: fncConvGeoField(
        fldObjRow.district_code,
        fldObjRow.district_text,
      ),
      fldObjTown: fncConvGeoField(fldObjRow.town_code, fldObjRow.town_text),
      fldObjNeighborhood: fncConvGeoField(
        fldObjRow.neighborhood_code,
        fldObjRow.neighborhood_text,
      ),
      fldObjStreet: fncConvGeoField(
        fldObjRow.street_code,
        fldObjRow.street_text,
      ),
      fldStrExtraDescription: fldObjRow.extra_description,
      fldStrPostalCode: fldObjRow.postal_code,
      fldStrBuilding: fldObjRow.building,
      fldStrFloor: fldObjRow.floor,
      fldStrApartment: fldObjRow.apartment,
    },
    fldStrWebsite: fldObjRow.website,
  };
}

export async function srvApiGetDemoLibraryDetails(
  fldObjClient: SupabaseClient,
  fldStrLibraryId: string,
): Promise<fldObjLibraryInput | null> {
  if (fldStrLibraryId.trim() === '') {
    throw new Error('Logosphere BITS: demo library ID is missing or blank.');
  }
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('library_details')
    .select(
      'code, library_type, founded_date, ' +
        'country_code, country_text, state_code, state_text, ' +
        'city_code, city_text, district_code, district_text, ' +
        'town_code, town_text, neighborhood_code, neighborhood_text, ' +
        'street_code, street_text, extra_description, postal_code, ' +
        'building, floor, apartment, website',
    )
    .eq('node_id', fldStrLibraryId)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo library details unavailable ` +
        `(library_details read failed: ${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    return null;
  }
  if (!fncRunIsLibraryDetailsRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: library_details returned an unexpected shape ' +
        '(need the detail columns).',
    );
  }
  return {
    fldStrName: null,
    fldStrAddress: null,
    ...fncRunMapDetailsRow(fldObjRow),
  };
}
