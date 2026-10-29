/**
 * Logosphere BITS — translation dictionary parity (EN/TR key structure).
 */

import { fldObjStringsEn, fldObjStringsTr } from '../src/i18n/translations';

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
  });

  it('keeps the splash brand title identical in both languages', () => {
    expect(fldObjStringsTr.fldObjSplash.fldStrTitle).toBe(
      fldObjStringsEn.fldObjSplash.fldStrTitle,
    );
  });
});
