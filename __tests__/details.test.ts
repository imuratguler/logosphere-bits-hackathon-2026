/**
 * Logosphere BITS — library/collection detail readiness.
 */

import {
  vldChgIsCollectionReady,
  vldChgIsLibraryFullReady,
  vldChgIsLibraryShortcutReady,
  vldChgIsTextPresent,
} from '../src/validation/vldDetails';
import type {
  fldObjCollectionInput,
  fldObjLibraryInput,
} from '../src/validation/vldDetails';

function fncConvArgsToLibraryInput(
  fldObjOverrides: Partial<fldObjLibraryInput> = {},
): fldObjLibraryInput {
  return {
    fldStrCode: 'L-001',
    fldStrName: 'Main Library',
    fldStrLibraryType: null,
    fldDatFoundedDate: null,
    fldStrAddress: '12 Archive Street',
    fldStrWebsite: null,
    ...fldObjOverrides,
  };
}

function fncConvArgsToCollectionInput(
  fldObjOverrides: Partial<fldObjCollectionInput> = {},
): fldObjCollectionInput {
  return {
    fldStrName: 'First Folio',
    fldDatFormedDate: null,
    fldStrHallRoom: null,
    fldStrCabinetFace: null,
    fldStrBlock: null,
    fldStrRow: null,
    fldStrShelf: null,
    fldStrWebsite: null,
    ...fldObjOverrides,
  };
}

describe('detail readiness', () => {
  it('treats blank text as missing', () => {
    expect(vldChgIsTextPresent(null)).toBe(false);
    expect(vldChgIsTextPresent('')).toBe(false);
    expect(vldChgIsTextPresent('   ')).toBe(false);
    expect(vldChgIsTextPresent('x')).toBe(true);
  });

  it('requires code, name, and address for full library creation', () => {
    expect(vldChgIsLibraryFullReady(fncConvArgsToLibraryInput())).toBe(true);
    expect(
      vldChgIsLibraryFullReady(
        fncConvArgsToLibraryInput({ fldStrAddress: null }),
      ),
    ).toBe(false);
    expect(
      vldChgIsLibraryFullReady(fncConvArgsToLibraryInput({ fldStrCode: '  ' })),
    ).toBe(false);
    expect(
      vldChgIsLibraryFullReady(fncConvArgsToLibraryInput({ fldStrName: '' })),
    ).toBe(false);
    expect(
      vldChgIsLibraryFullReady(
        fncConvArgsToLibraryInput({
          fldStrLibraryType: 'public',
          fldDatFoundedDate: '2020-01-15',
          fldStrWebsite: 'https://example.org',
        }),
      ),
    ).toBe(true);
  });

  it('never requires the detailed address for shortcut creation', () => {
    expect(
      vldChgIsLibraryShortcutReady(
        fncConvArgsToLibraryInput({ fldStrAddress: null }),
      ),
    ).toBe(true);
    expect(
      vldChgIsLibraryShortcutReady(
        fncConvArgsToLibraryInput({ fldStrCode: null }),
      ),
    ).toBe(false);
    expect(
      vldChgIsLibraryShortcutReady(
        fncConvArgsToLibraryInput({ fldStrName: null }),
      ),
    ).toBe(false);
  });

  it('requires only the name for collection creation', () => {
    expect(vldChgIsCollectionReady(fncConvArgsToCollectionInput())).toBe(true);
    expect(
      vldChgIsCollectionReady(
        fncConvArgsToCollectionInput({ fldStrName: null }),
      ),
    ).toBe(false);
    expect(
      vldChgIsCollectionReady(
        fncConvArgsToCollectionInput({ fldStrName: '  ' }),
      ),
    ).toBe(false);
  });
});
