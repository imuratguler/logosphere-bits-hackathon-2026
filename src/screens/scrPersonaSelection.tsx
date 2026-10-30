/**
 * Logosphere BITS — demo persona selection screen (not a login).
 *
 * Lists the shared demo personas in server order with their English
 * names; tapping one establishes that persona's RPC demo session
 * through the demo context. This screen asks for no password,
 * membership, or corporate registration, and selecting never creates
 * a private workspace or API rights — every persona opens the same
 * shared data. List loading and errors stay local; session failures
 * surface the context retry state. All reads and writes delegate to
 * the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrPersonaSelection); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjDemoPersona } from '../services/srvDemoPersonas';
import { srvApiGetDemoPersonas } from '../services/srvDemoPersonas';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrPersonaSelectionProps = {
  fldObjStrings: fldObjAppStrings;
};

export function scrPersonaSelection({
  fldObjStrings,
}: scrPersonaSelectionProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const {
    fldObjPersona: fldObjSelected,
    fldBooSessionRefreshing,
    fldStrSessionError,
    srvApiSelectPersona,
    srvApiRefreshSession,
  } = useDemoSession();
  const [fldArrPersonas, actSetPersonas] = React.useState<
    fldObjDemoPersona[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoPersonas(fldObjClient).then(
      fldArrRows => {
        if (!fldBooCancelled) {
          actSetPersonas(fldArrRows);
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

  const fldObjCopy = fldObjStrings.fldObjPersonaSelection;

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrPersonaSelectionStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrPersonaSelectionStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrPersonas === null) {
    return (
      <SafeAreaView style={scrPersonaSelectionStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrPersonaSelectionStyles.fldObjScreen}>
      <View style={scrPersonaSelectionStyles.fldObjHeader}>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        <VwText fldStrVariant="body">{fldObjCopy.fldStrSubtitle}</VwText>
      </View>
      {fldStrSessionError !== null && (
        <View style={scrPersonaSelectionStyles.fldObjGap}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrSessionErrorTitle}
            fldStrMessage={fldStrSessionError}
          />
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={() => {
              // Fire-and-forget: context operations never reject;
              // failures land in state.
              srvApiRefreshSession();
            }}
          />
        </View>
      )}
      {fldArrPersonas.length === 0 ? (
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
      ) : (
        <FlatList
          data={fldArrPersonas}
          keyExtractor={fldObjItem => fldObjItem.fldStrId}
          renderItem={({ item: fldObjItem }) => {
            const fldBooSelected =
              fldObjSelected?.fldStrId === fldObjItem.fldStrId;
            return (
              <View style={scrPersonaSelectionStyles.fldObjRow}>
                <VwButton
                  fldStrLabel={
                    fldBooSelected
                      ? `${fldObjItem.fldStrDisplayName} — ${fldObjCopy.fldStrSelected}`
                      : fldObjItem.fldStrDisplayName
                  }
                  fldBooDisabled={fldBooSessionRefreshing}
                  actHandOnPress={() => {
                    srvApiSelectPersona(fldObjItem);
                  }}
                />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const scrPersonaSelectionStyles = StyleSheet.create({
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
