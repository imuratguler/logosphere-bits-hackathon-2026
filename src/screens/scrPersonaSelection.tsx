/**
 * Logosphere BITS — demo persona selection screen (not a login).
 *
 * Centered card in the BASE login-card arrangement (logo, brand,
 * divider, selection box, Continue) with the demo footer pinned
 * below: tapping a row only highlights it, and Continue opens
 * that persona's RPC demo session through the demo context —
 * no password, no membership, no extra authority. "CV Meta
 * Hackathon 2026" arrives preselected; every persona still
 * leads to the same shared workspace data. List loading and
 * errors stay local; session failures surface the context
 * retry state. All reads and writes delegate to the ready
 * services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrPersonaSelection); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwCard as VwCard } from '../components/vwCard';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwLogo as VwLogo } from '../components/vwLogo';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjDemoPersona } from '../services/srvDemoPersonas';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiGetDemoPersonas } from '../services/srvDemoPersonas';
import {
  colBackground,
  colTextSecondary,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrPersonaSelectionProps = {
  fldObjStrings: fldObjAppStrings;
};

const fldStrDefaultPersonaName = 'CV Meta Hackathon 2026';

function fncPickDefaultPersonaId(
  fldArrPersonas: fldObjDemoPersona[],
): string | null {
  const fldObjDefault = fldArrPersonas.find(
    fldObjPersona =>
      fldObjPersona.fldStrDisplayName === fldStrDefaultPersonaName,
  );
  return (fldObjDefault ?? fldArrPersonas[0])?.fldStrId ?? null;
}

export function scrPersonaSelection({
  fldObjStrings,
}: scrPersonaSelectionProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const {
    fldBooSessionRefreshing,
    fldStrSessionError,
    srvApiSelectPersona,
    srvApiRefreshSession,
  } = useDemoSession();
  const [fldArrPersonas, actSetPersonas] = React.useState<
    fldObjDemoPersona[] | null
  >(null);
  const [fldStrPickedId, actSetPickedId] = React.useState<string | null>(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldBooReloading, actSetReloading] = React.useState(false);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    actSetReloading(true);
    let fldBooCancelled = false;
    srvApiGetDemoPersonas(fldObjClient).then(
      fldArrRows => {
        if (fldBooCancelled) {
          return;
        }
        actSetPersonas(fldArrRows);
        actSetPickedId(fldStrPrevious => {
          if (
            fldStrPrevious !== null &&
            fldArrRows.some(fldObjRow => fldObjRow.fldStrId === fldStrPrevious)
          ) {
            return fldStrPrevious;
          }
          return fncPickDefaultPersonaId(fldArrRows);
        });
        actSetReloading(false);
      },
      fldObjError => {
        if (!fldBooCancelled) {
          actSetError((fldObjError as Error).message);
          actSetReloading(false);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjPersonaSelection;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;

  const fncRunContinue = React.useCallback(() => {
    const fldObjPicked =
      fldArrPersonas?.find(
        fldObjPersona => fldObjPersona.fldStrId === fldStrPickedId,
      ) ?? null;
    if (fldObjPicked === null || fldBooSessionRefreshing) {
      return;
    }
    // Fire-and-forget: context operations never reject;
    // failures land in the session error state.
    srvApiSelectPersona(fldObjPicked);
  }, [
    fldArrPersonas,
    fldBooSessionRefreshing,
    fldStrPickedId,
    srvApiSelectPersona,
  ]);

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
            fldBooLoading={fldBooReloading}
            actHandOnPress={fncRunLoad}
          />
        </View>
        <View style={scrPersonaSelectionStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrPersonas === null) {
    return (
      <SafeAreaView style={scrPersonaSelectionStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrPersonaSelectionStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrPersonaSelectionStyles.fldObjScreen}>
      <ScrollView
        style={scrPersonaSelectionStyles.fldObjScroll}
        contentContainerStyle={scrPersonaSelectionStyles.fldObjScrollContent}
      >
        <VwCard>
          <View style={scrPersonaSelectionStyles.fldObjCardHead}>
            <VwLogo fldNumWidth={96} />
            <VwBrandHeader
              fldStrName={fldObjBrandCopy.fldStrName}
              fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
            />
            <VwText fldStrVariant="body">{fldObjCopy.fldStrSubtitle}</VwText>
          </View>
          <View style={scrPersonaSelectionStyles.fldObjDivider} />
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
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
            <View style={scrPersonaSelectionStyles.fldObjGap}>
              {fldArrPersonas.map(fldObjPersona => {
                const fldBooPicked = fldObjPersona.fldStrId === fldStrPickedId;
                return (
                  <View
                    key={fldObjPersona.fldStrId}
                    style={scrPersonaSelectionStyles.fldObjRow}
                  >
                    <VwButton
                      fldStrLabel={
                        fldBooPicked
                          ? `${fldObjPersona.fldStrDisplayName} — ${fldObjCopy.fldStrSelected}`
                          : fldObjPersona.fldStrDisplayName
                      }
                      fldBooDisabled={fldBooSessionRefreshing}
                      actHandOnPress={() => {
                        actSetPickedId(fldObjPersona.fldStrId);
                      }}
                    />
                  </View>
                );
              })}
            </View>
          )}
          {fldArrPersonas.length > 0 && (
            <View style={scrPersonaSelectionStyles.fldObjGap}>
              <VwButton
                fldStrLabel={fldObjCopy.fldStrContinue}
                fldBooLoading={fldBooSessionRefreshing}
                fldBooDisabled={fldStrPickedId === null}
                actHandOnPress={fncRunContinue}
              />
            </View>
          )}
        </VwCard>
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
    </SafeAreaView>
  );
}

const scrPersonaSelectionStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  fldObjFoot: {
    marginTop: 'auto',
  },
  fldObjCardHead: {
    alignItems: 'center',
    marginBottom: fldNumSpacingMd,
  },
  fldObjDivider: {
    height: 1,
    backgroundColor: colTextSecondary,
    opacity: 0.3,
    marginBottom: fldNumSpacingLg,
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
  },
  fldObjRow: {
    marginBottom: fldNumSpacingSm,
  },
});
