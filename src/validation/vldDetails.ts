/**
 * Logosphere BITS — library/collection detail readiness (no DB, no IO).
 *
 * Mirrors the models.ts detail contract: full library creation needs
 * code, name, and the detailed address; shortcut creation needs only
 * code and name; collection creation needs only the name. Every other
 * detail field fills in later (null until filled). Inputs carry only
 * user-entered details; identity, links, ordering, pricing, and sale
 * state are assigned by the caller. Presence means non-blank text —
 * null, empty, and whitespace-only all count as missing.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

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
