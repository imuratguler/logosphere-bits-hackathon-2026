/**
 * Logosphere BITS — shared home screen (libraries, not accounts).
 *
 * Shows the shared workspace libraries every demo persona sees, under
 * a brand header with the current persona name and a Change Demo
 * Profile action. Renders no memberships, permissions, or become-a-
 * member calls, and changing the persona deletes no shared data and
 * opens no private workspace — selection only swaps the demo session.
 * All reads delegate to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrHome); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwLogo as VwLogo } from '../components/vwLogo';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjDemoLibrary } from '../services/srvDemoLibraries';
import { srvApiGetDemoLibraries } from '../services/srvDemoLibraries';
import { srvApiGetDemoWorkspace } from '../services/srvDemoWorkspace';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrHomeProps = {
  fldObjStrings: fldObjAppStrings;
};

export function scrHome({ fldObjStrings }: scrHomeProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const { fldObjPersona, srvApiClearPersona } = useDemoSession();
  const [fldArrLibraries, actSetLibraries] = React.useState<
    fldObjDemoLibrary[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoWorkspace(fldObjClient)
      .then(fldObjWorkspace =>
        srvApiGetDemoLibraries(fldObjClient, fldObjWorkspace.fldStrId),
      )
      .then(
        fldArrRows => {
          if (!fldBooCancelled) {
            actSetLibraries(fldArrRows);
          }
        },
        fldObjError => {
          if (!fldBooCancelled) {
            actSetError((fldObjError as Error).message);
          }
        },
      );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjHome;

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrHomeStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrHomeStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrLibraries === null) {
    return (
      <SafeAreaView style={scrHomeStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrHomeStyles.fldObjScreen}>
      <View style={scrHomeStyles.fldObjHeader}>
        <VwLogo fldNumWidth={64} />
        <VwText fldStrVariant="header">
          {fldObjStrings.fldObjSplash.fldStrTitle}
        </VwText>
        {fldObjPersona !== null && (
          <VwText fldStrVariant="body">
            {fldObjPersona.fldStrDisplayName}
          </VwText>
        )}
        <VwButton
          fldStrLabel={fldObjCopy.fldStrChangeProfile}
          actHandOnPress={() => {
            // Fire-and-forget: clearing never rejects by design.
            srvApiClearPersona();
          }}
        />
      </View>
      <VwText fldStrVariant="header">{fldObjCopy.fldStrLibrariesTitle}</VwText>
      {fldArrLibraries.length === 0 ? (
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
      ) : (
        <FlatList
          data={fldArrLibraries}
          keyExtractor={fldObjItem => fldObjItem.fldStrId}
          renderItem={({ item: fldObjItem }) => (
            <View style={scrHomeStyles.fldObjRow}>
              <VwText fldStrVariant="body">{fldObjItem.fldStrName}</VwText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const scrHomeStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjHeader: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjGap: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjRow: {
    marginBottom: fldNumSpacingSm,
  },
});
