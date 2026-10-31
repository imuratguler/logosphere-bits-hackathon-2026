/**
 * Logosphere BITS — translation dictionary parity (EN/TR key structure).
 */

import { fldObjStringsEn, fldObjStringsTr } from '../src/i18n/intTranslations';

describe('translations', () => {
  it('uses identical key structure in English and Turkish', () => {
    expect(Object.keys(fldObjStringsTr).sort()).toEqual(
      Object.keys(fldObjStringsEn).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjSplash).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjSplash).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjCommon).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjCommon).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjPersonaSelection).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjPersonaSelection).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjHome).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjHome).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjLibraryShortcut).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjLibraryShortcut).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjLibrarySettings).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjLibrarySettings).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjCollectionBrowser).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjCollectionBrowser).sort(),
    );
    expect(
      Object.keys(fldObjStringsTr.fldObjCollectionShortcut).sort(),
    ).toEqual(Object.keys(fldObjStringsEn.fldObjCollectionShortcut).sort());
    expect(
      Object.keys(fldObjStringsTr.fldObjCollectionSettings).sort(),
    ).toEqual(Object.keys(fldObjStringsEn.fldObjCollectionSettings).sort());
    expect(Object.keys(fldObjStringsTr.fldObjSetShortcut).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjSetShortcut).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjProductDetails).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjProductDetails).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjMultiSelect).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjMultiSelect).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjMovePicker).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjMovePicker).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjCollectionMerge).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjCollectionMerge).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjSetBatch).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjSetBatch).sort(),
    );
    expect(Object.keys(fldObjStringsTr.fldObjDelete).sort()).toEqual(
      Object.keys(fldObjStringsEn.fldObjDelete).sort(),
    );
  });

  it('keeps the splash brand title identical in both languages', () => {
    expect(fldObjStringsTr.fldObjSplash.fldStrTitle).toBe(
      fldObjStringsEn.fldObjSplash.fldStrTitle,
    );
  });

  it('provides non-empty splash strings in both languages', () => {
    const fldObjSplashEn = fldObjStringsEn.fldObjSplash;
    const fldObjSplashTr = fldObjStringsTr.fldObjSplash;
    const fldArrKeys = Object.keys(
      fldObjSplashEn,
    ) as (keyof typeof fldObjSplashEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjSplashEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjSplashTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty persona selection strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjPersonaSelection;
    const fldObjTr = fldObjStringsTr.fldObjPersonaSelection;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty home strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjHome;
    const fldObjTr = fldObjStringsTr.fldObjHome;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty library shortcut strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjLibraryShortcut;
    const fldObjTr = fldObjStringsTr.fldObjLibraryShortcut;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty library settings strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjLibrarySettings;
    const fldObjTr = fldObjStringsTr.fldObjLibrarySettings;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty collection browser strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjCollectionBrowser;
    const fldObjTr = fldObjStringsTr.fldObjCollectionBrowser;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty collection shortcut strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjCollectionShortcut;
    const fldObjTr = fldObjStringsTr.fldObjCollectionShortcut;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty collection settings strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjCollectionSettings;
    const fldObjTr = fldObjStringsTr.fldObjCollectionSettings;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty set shortcut strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjSetShortcut;
    const fldObjTr = fldObjStringsTr.fldObjSetShortcut;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty product details strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjProductDetails;
    const fldObjTr = fldObjStringsTr.fldObjProductDetails;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty multi-select strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjMultiSelect;
    const fldObjTr = fldObjStringsTr.fldObjMultiSelect;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty move picker strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjMovePicker;
    const fldObjTr = fldObjStringsTr.fldObjMovePicker;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty collection merge strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjCollectionMerge;
    const fldObjTr = fldObjStringsTr.fldObjCollectionMerge;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty set batch strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjSetBatch;
    const fldObjTr = fldObjStringsTr.fldObjSetBatch;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('provides non-empty delete strings in both languages', () => {
    const fldObjEn = fldObjStringsEn.fldObjDelete;
    const fldObjTr = fldObjStringsTr.fldObjDelete;
    const fldArrKeys = Object.keys(fldObjEn) as (keyof typeof fldObjEn)[];
    for (const fldStrKey of fldArrKeys) {
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });
});
