/**
 * Logosphere BITS — library/collection detail readiness (no DB, no IO).
 *
 * Mirrors the models.ts detail contract: full library creation needs
 * code, name, and the detailed address; shortcut creation needs only
 * code and name; collection creation needs only the name. The demo
 * quick-create shortcut is a narrower variant: it asks only name and
 * one of the three allowed types, stamps today as the founded date in
 * the background, and never asks code or the detailed address. Every
 * other detail field fills in later (null until filled). Inputs carry
 * only user-entered details; identity, links, ordering, pricing, and
 * sale state are assigned by the caller. Presence means non-blank
 * text — null, empty, and whitespace-only all count as missing.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld / fnc roots).
 */

import {
  fldArrLibraryShortcutTypes,
  type fldStrLibraryShortcutType,
} from '../types/typModels';

export type fldObjLibraryInput = {
  fldStrCode: string | null;
  fldStrName: string | null;
  fldStrLibraryType: string | null;
  fldDatFoundedDate: string | null;
  fldStrAddress: string | null;
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
    fldStrWebsite: null,
  };
}
