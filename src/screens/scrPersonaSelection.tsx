/**
 * Logosphere BITS — demo entry screen (not a real login).
 *
 * Every cold start lands here, even with a stored demo choice:
 * one demo-user dropdown (default "CV Meta Hackathon 2026") with
 * a Log in button below it. Picking only highlights; Log in opens
 * the picked persona's RPC demo session through the demo context —
 * no password, no membership, no Supabase Auth. The approved logo
 * file renders unchanged above, with a centered small-caps BITS
 * line under its wordmark (the in-image Logosphere word is never
 * reprinted). List loading and errors stay local; session failures
 * surface the context retry state. All reads and writes delegate
 * to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrPersonaSelection); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwDropdown as VwDropdown } from '../components/vwDropdown';
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
  colTextPrimary,
  colTextSecondary,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumSpacingXl,
  fldStrFontFamilyBrand,
  fldStrFontFamilyUi,
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
        <View style={scrPersonaSelectionStyles.fldObjLogoBlock}>
          <VwLogo fldNumWidth={144} />
          <Text style={scrPersonaSelectionStyles.fldObjBits}>
            {fldObjBrandCopy.fldStrSuffix}
          </Text>
        </View>
        <Text style={scrPersonaSelectionStyles.fldObjTitle}>
          {fldObjCopy.fldStrTitle}
        </Text>
        {fldStrSessionError !== null && (
          <View style={scrPersonaSelectionStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrSessionErrorTitle}
              fldStrMessage={fldStrSessionError}
            />
            <VwButton
              fldStrLabel={fldObjCopy.fldStrRetry}
              fldStrVariant="text"
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
            <VwDropdown
              fldArrOptions={fldArrPersonas.map(fldObjPersona => ({
                fldStrId: fldObjPersona.fldStrId,
                fldStrLabel: fldObjPersona.fldStrDisplayName,
              }))}
              fldStrPickedId={fldStrPickedId}
              fldStrPlaceholder={fldObjCopy.fldStrPickerPlaceholder}
              fldStrTitle={fldObjCopy.fldStrTitle}
              fldStrCancelLabel={fldObjCopy.fldStrCancel}
              fldBooDisabled={fldBooSessionRefreshing}
              actHandOnPick={actSetPickedId}
            />
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
            <View style={scrPersonaSelectionStyles.fldObjCaption}>
              <VwText fldStrVariant="caption">
                {fldObjCopy.fldStrNoPassword}
              </VwText>
            </View>
          </View>
        )}
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
  fldObjLogoBlock: {
    alignItems: 'center',
    marginBottom: fldNumSpacingXl + fldNumSpacingMd,
  },
  fldObjBits: {
    fontFamily: fldStrFontFamilyBrand,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 3,
    color: colTextPrimary,
    marginTop: 6,
  },
  fldObjTitle: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: 'bold',
    color: colTextSecondary,
    textAlign: 'center',
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
    width: '85%',
    alignSelf: 'center',
  },
  fldObjCaption: {
    alignItems: 'center',
    marginTop: fldNumSpacingLg,
  },
});
