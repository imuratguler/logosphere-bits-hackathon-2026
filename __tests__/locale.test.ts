/**
 * Logosphere BITS — startup locale lock: English regardless of device or stored Turkish.
 */

import {
  fldBooDemoEnglishLock,
  fldStrLocaleEn,
  fldStrLocaleTr,
  fncConvDeviceTagToLocale,
  fncConvLocaleToStrings,
  fncRunReadDeviceTag,
  fncRunResolveStartupLocale,
} from '../src/i18n/locale';
import { fldObjStringsEn, fldObjStringsTr } from '../src/i18n/translations';

describe('startup locale', () => {
  it('opens in English when device and stored locales are Turkish', () => {
    expect(fncRunResolveStartupLocale('tr-TR', fldStrLocaleTr)).toBe(
      fldStrLocaleEn,
    );
  });

  it('opens in English with no device or stored locale', () => {
    expect(fncRunResolveStartupLocale(null, null)).toBe(fldStrLocaleEn);
  });

  it('keeps the demo lock enabled', () => {
    expect(fldBooDemoEnglishLock).toBe(true);
  });

  it('prefers stored, then device, then English once the lock is lifted', () => {
    expect(fncRunResolveStartupLocale('en-US', fldStrLocaleTr, false)).toBe(
      fldStrLocaleTr,
    );
    expect(fncRunResolveStartupLocale('tr-TR', null, false)).toBe(
      fldStrLocaleTr,
    );
    expect(fncRunResolveStartupLocale('de-DE', null, false)).toBe(
      fldStrLocaleEn,
    );
    expect(fncRunResolveStartupLocale(null, null, false)).toBe(fldStrLocaleEn);
  });

  it('converts device tags to supported locales', () => {
    expect(fncConvDeviceTagToLocale('tr-TR')).toBe(fldStrLocaleTr);
    expect(fncConvDeviceTagToLocale('tr_TR')).toBe(fldStrLocaleTr);
    expect(fncConvDeviceTagToLocale('en-US')).toBe(fldStrLocaleEn);
    expect(fncConvDeviceTagToLocale('EN')).toBe(fldStrLocaleEn);
    expect(fncConvDeviceTagToLocale('de-DE')).toBeNull();
    expect(fncConvDeviceTagToLocale('')).toBeNull();
    expect(fncConvDeviceTagToLocale(null)).toBeNull();
  });

  it('selects the matching dictionary per locale', () => {
    expect(fncConvLocaleToStrings(fldStrLocaleEn)).toBe(fldObjStringsEn);
    expect(fncConvLocaleToStrings(fldStrLocaleTr)).toBe(fldObjStringsTr);
  });

  it('reads the device tag without crashing when unavailable', () => {
    const fldStrTag = fncRunReadDeviceTag();
    expect(fldStrTag === null || typeof fldStrTag === 'string').toBe(true);
  });
});
