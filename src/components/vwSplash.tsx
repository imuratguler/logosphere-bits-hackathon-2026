/**
 * Logosphere BITS — splash screen: brand mark plus brief loading state.
 * An error replaces the spinner (never an infinite loader); retry re-runs
 * startup. Persona selection mounts on parent readiness in its own step.
 * D6 JSX-alias exception: shared views are used through capitalized aliases.
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vwButton as VwButton } from './vwButton';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwLoading as VwLoading } from './vwLoading';
import { vwLogo as VwLogo } from './vwLogo';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingXl,
} from '../utils/theme';
import type { fldObjAppStrings } from '../i18n/translations';

type vwSplashProps = {
  fldBooLoading: boolean;
  fldObjStrings: fldObjAppStrings;
  fldStrError: string | null;
  actHandOnRetry: () => void;
};

export function vwSplash({
  fldBooLoading,
  fldObjStrings,
  fldStrError,
  actHandOnRetry,
}: vwSplashProps): React.JSX.Element {
  return (
    <SafeAreaView style={vwSplashStyles.fldObjScreen}>
      <StatusBar barStyle="light-content" />
      <View style={vwSplashStyles.fldObjBrand}>
        <VwLogo fldNumWidth={200} />
      </View>
      {fldStrError !== null ? (
        <View style={vwSplashStyles.fldObjState}>
          <VwEmptyState
            fldStrTitle={fldObjStrings.fldObjSplash.fldStrErrorTitle}
            fldStrMessage={fldStrError}
          />
          <View style={vwSplashStyles.fldObjRetry}>
            <VwButton
              fldStrLabel={fldObjStrings.fldObjSplash.fldStrRetry}
              actHandOnPress={actHandOnRetry}
            />
          </View>
        </View>
      ) : (
        fldBooLoading && (
          <View style={vwSplashStyles.fldObjState}>
            <VwLoading
              fldStrMessage={fldObjStrings.fldObjSplash.fldStrLoading}
            />
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const vwSplashStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjBrand: {
    marginBottom: fldNumSpacingXl,
  },
  fldObjState: {
    alignItems: 'center',
  },
  fldObjRetry: {
    marginTop: fldNumSpacingMd,
  },
});
