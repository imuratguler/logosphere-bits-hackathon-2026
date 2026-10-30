/**
 * Logosphere BITS — app root: gesture root, safe area, startup gate, demo nav.
 *
 * Startup resolves the locale (English-locked in the demo) after a brief
 * splash delay. A startup failure shows a retryable error instead of an
 * infinite loader. On fldBooReady the demo navigation mounts (splash and
 * persona selection routes) inside the demo session provider; the demo
 * client is built once and stays down the tree.
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (vwAppRoot, lowercase vw root); registered under the uppercase alias App in index.js (K35 D6 exception). Hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { vwSplash as VwSplash } from './src/components/vwSplash';
import { VwDemoSessionProvider } from './src/contexts/ctxDemoSession';
import { vwApplication as VwApplication } from './src/navigation/navApplication';
import { srvApiGetDemoClient } from './src/services/srvDemoClient';
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
  const [fldObjClient] = React.useState(srvApiGetDemoClient);

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
    <GestureHandlerRootView style={vwAppRootStyles.fldObjRoot}>
      <SafeAreaProvider>
        {fldBooReady ? (
          <VwDemoSessionProvider fldObjClient={fldObjClient}>
            <VwApplication fldObjStrings={fldObjStrings} />
          </VwDemoSessionProvider>
        ) : (
          <VwSplash
            fldBooLoading={fldStrError === null}
            fldObjStrings={fldObjStrings}
            fldStrError={fldStrError}
            actHandOnRetry={fncRunStartup}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const vwAppRootStyles = StyleSheet.create({
  fldObjRoot: {
    flex: 1,
  },
});
