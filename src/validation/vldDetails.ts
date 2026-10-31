/**
 * Logosphere BITS — library/collection detail readiness (no DB, no IO).
 *
 * Mirrors the models.ts detail contract: full library creation needs
 * code, name, and the detailed address; shortcut creation needs only
 * code and name; collection creation needs only the name. The demo
 * quick-create shortcut is a narrower variant: it asks only name and
 * one of the three allowed types, stamps today as the founded date in
 * the background, and never asks code or the detailed address. The
 * settings form edits the structured address instead of the legacy
 * single-line address: one geo field per hierarchy level plus extra
 * description, postal code, building, floor, and apartment. Each geo
 * field stores the selected reference code separately from the typed
 * text (free text carries a null code); postal codes stay nullable
 * and manually editable; missing town, street, or postal values stay
 * null and are never fabricated. Every other detail field fills in
 * later (null until filled). Inputs carry only user-entered details;
 * identity, links, ordering, pricing, and sale state are assigned by
 * the caller. Presence means non-blank text — null, empty, and
 * whitespace-only all count as missing.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld / fnc roots).
 */

import {
  fldArrLibraryShortcutTypes,
  type fldStrLibraryShortcutType,
} from '../types/typModels';

export type fldObjGeoFieldInput = {
  fldStrCode: string | null;
  fldStrText: string | null;
};

export type fldObjLibraryAddressInput = {
  fldObjCountry: fldObjGeoFieldInput;
  fldObjState: fldObjGeoFieldInput;
  fldObjCity: fldObjGeoFieldInput;
  fldObjDistrict: fldObjGeoFieldInput;
  fldObjTown: fldObjGeoFieldInput;
  fldObjNeighborhood: fldObjGeoFieldInput;
  fldObjStreet: fldObjGeoFieldInput;
  fldStrExtraDescription: string | null;
  fldStrPostalCode: string | null;
  fldStrBuilding: string | null;
  fldStrFloor: string | null;
  fldStrApartment: string | null;
};

export type fldObjLibraryInput = {
  fldStrCode: string | null;
  fldStrName: string | null;
  fldStrLibraryType: string | null;
  fldDatFoundedDate: string | null;
  fldStrAddress: string | null;
  fldObjAddressParts: fldObjLibraryAddressInput;
  fldStrWebsite: string | null;
};

export type fldObjCollectionInput = {
  fldStrName: string | null;
  fldDatFormedDate: string | null;
  fldStrHallRoom: string | null;
  fldStrCabinetFace: string | null;
  fldStrBlock: string | null;
  fldStrRow: string | null;
  fldStrShelf: string | null;
  fldStrWebsite: string | null;
};

export function vldChgIsTextPresent(fldStrValue: string | null): boolean {
  return fldStrValue !== null && fldStrValue.trim().length > 0;
}

export function vldChgIsLibraryFullReady(
  fldObjInput: fldObjLibraryInput,
): boolean {
  return (
    vldChgIsTextPresent(fldObjInput.fldStrCode) &&
    vldChgIsTextPresent(fldObjInput.fldStrName) &&
    vldChgIsTextPresent(fldObjInput.fldStrAddress)
  );
}

export function vldChgIsLibraryShortcutReady(
  fldObjInput: fldObjLibraryInput,
): boolean {
  return (
    vldChgIsTextPresent(fldObjInput.fldStrCode) &&
    vldChgIsTextPresent(fldObjInput.fldStrName)
  );
}

export function vldChgIsCollectionReady(
  fldObjInput: fldObjCollectionInput,
): boolean {
  return vldChgIsTextPresent(fldObjInput.fldStrName);
}

export function vldChgIsLibraryShortcutType(
  fldStrValue: string | null,
): fldStrValue is fldStrLibraryShortcutType {
  if (fldStrValue === null) {
    return false;
  }
  return (fldArrLibraryShortcutTypes as readonly string[]).includes(
    fldStrValue,
  );
}

export function fncConvBlankAddressParts(): fldObjLibraryAddressInput {
  const fncConvBlankGeoField = (): fldObjGeoFieldInput => ({
    fldStrCode: null,
    fldStrText: null,
  });
  return {
    fldObjCountry: fncConvBlankGeoField(),
    fldObjState: fncConvBlankGeoField(),
    fldObjCity: fncConvBlankGeoField(),
    fldObjDistrict: fncConvBlankGeoField(),
    fldObjTown: fncConvBlankGeoField(),
    fldObjNeighborhood: fncConvBlankGeoField(),
    fldObjStreet: fncConvBlankGeoField(),
    fldStrExtraDescription: null,
    fldStrPostalCode: null,
    fldStrBuilding: null,
    fldStrFloor: null,
    fldStrApartment: null,
  };
}

export function fncConvNameTypeToLibraryInput(
  fldStrName: string,
  fldStrLibraryType: fldStrLibraryShortcutType,
): fldObjLibraryInput {
  const fldObjToday = new Date();
  const fldStrMonth = String(fldObjToday.getMonth() + 1).padStart(2, '0');
  const fldStrDay = String(fldObjToday.getDate()).padStart(2, '0');
  return {
    fldStrCode: null,
    fldStrName,
    fldStrLibraryType,
    fldDatFoundedDate: `${fldObjToday.getFullYear()}-${fldStrMonth}-${fldStrDay}`,
    fldStrAddress: null,
    fldObjAddressParts: fncConvBlankAddressParts(),
    fldStrWebsite: null,
  };
}
