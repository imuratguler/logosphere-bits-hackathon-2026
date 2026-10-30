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
});
