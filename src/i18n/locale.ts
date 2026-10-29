/**
 * Logosphere BITS — central language init: locale resolution + switching infra.
 *
 * Demo lock: the app opens in English for everyone. The resolver accepts the
 * device tag and the stored preference as inputs, but the lock overrides both
 * while it stands. No language selector is shown in the demo UI.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / fnc roots).
 */

import { I18nManager } from 'react-native';
import { fldObjStringsEn, fldObjStringsTr } from './translations';
import type { fldObjAppStrings } from './translations';

export type fldStrLocale = 'en' | 'tr';

export const fldStrLocaleEn: fldStrLocale = 'en';
export const fldStrLocaleTr: fldStrLocale = 'tr';

export const fldBooDemoEnglishLock = true;

export function fncConvDeviceTagToLocale(
  fldStrDeviceTag: string | null,
): fldStrLocale | null {
  if (fldStrDeviceTag === null) {
    return null;
  }
  const fldStrLower = fldStrDeviceTag.toLowerCase();
  const fldStrPrimary = fldStrLower.split(/[-_]/)[0];
  if (fldStrPrimary === fldStrLocaleEn) {
    return fldStrLocaleEn;
  }
  if (fldStrPrimary === fldStrLocaleTr) {
    return fldStrLocaleTr;
  }
  return null;
}

export function fncRunReadDeviceTag(): string | null {
  const fldStrTag = I18nManager.getConstants().localeIdentifier;
  return typeof fldStrTag === 'string' ? fldStrTag : null;
}

export function fncConvLocaleToStrings(
  fldStrLocale: fldStrLocale,
): fldObjAppStrings {
  return fldStrLocale === fldStrLocaleTr ? fldObjStringsTr : fldObjStringsEn;
}

export function fncRunResolveStartupLocale(
  fldStrDeviceTag: string | null,
  fldStrStoredLocale: fldStrLocale | null,
  fldBooEnglishLock: boolean = fldBooDemoEnglishLock,
): fldStrLocale {
  if (fldBooEnglishLock) {
    return fldStrLocaleEn;
  }
  if (fldStrStoredLocale !== null) {
    return fldStrStoredLocale;
  }
  return fncConvDeviceTagToLocale(fldStrDeviceTag) ?? fldStrLocaleEn;
}
