/**
 * Logosphere BITS — app root: SafeAreaProvider plus splash startup gate.
 *
 * Startup resolves the locale (English-locked in the demo) after a brief
 * splash delay. A startup failure shows a retryable error instead of an
 * infinite loader. The demo persona selection mounts on fldBooReady in its
 * own step (no navigation, backend, or accounts yet).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (vwAppRoot, lowercase vw root); registered under the uppercase alias App in index.js (K35 D6 exception). Hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { vwSplash as VwSplash } from './src/components/vwSplash';
import {
  fncConvLocaleToStrings,
  fncRunReadDeviceTag,
  fncRunResolveStartupLocale,
} from './src/i18n/intLocale';
import { fldObjStringsEn } from './src/i18n/intTranslations';
import type { fldObjAppStrings } from './src/i18n/intTranslations';

const fldNumSplashDelayMs = 800;

export default function vwAppRoot(): React.JSX.Element {
  const [fldBooReady, actSetReady] = React.useState(false);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldObjStrings, actSetStrings] =
    React.useState<fldObjAppStrings>(fldObjStringsEn);

  const fncRunStartup = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    const fldNumTimer = setTimeout(() => {
      try {
        const fldStrLocale = fncRunResolveStartupLocale(
          fncRunReadDeviceTag(),
          null,
        );
        if (!fldBooCancelled) {
          actSetStrings(fncConvLocaleToStrings(fldStrLocale));
          actSetReady(true);
        }
      } catch {
        if (!fldBooCancelled) {
          actSetError(fldObjStringsEn.fldObjSplash.fldStrErrorMessage);
        }
      }
    }, fldNumSplashDelayMs);
    return () => {
      fldBooCancelled = true;
      clearTimeout(fldNumTimer);
    };
  }, []);

  React.useEffect(() => fncRunStartup(), [fncRunStartup]);

  return (
    <SafeAreaProvider>
      <VwSplash
        fldBooLoading={!fldBooReady && fldStrError === null}
        fldObjStrings={fldObjStrings}
        fldStrError={fldStrError}
        actHandOnRetry={fncRunStartup}
      />
    </SafeAreaProvider>
  );
}
