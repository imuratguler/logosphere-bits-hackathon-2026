/**
 * Logosphere BITS — HIDDEN real-account profile screen.
 *
 * Individual/corporate profile view and display-name editing for
 * the authenticated user, plus the organizations they belong to
 * with their role in each. All data comes from the account plane
 * (profiles, organization_memberships) — shared demo tables are
 * never read, and real profile data never mixes with demo data.
 * This module is NOT imported by the demo navigator or any demo
 * module — no demo path can show it.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountProfile); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SupabaseClient } from '@supabase/supabase-js';

import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetRealClient } from '../services/srvRealAccount';
import type {
  fldObjAccountMembership,
  fldObjAccountProfile,
} from '../services/srvAccountProfile';
import {
  srvApiGetAccountMemberships,
  srvApiGetAccountProfile,
  srvApiSaveAccountProfile,
} from '../services/srvAccountProfile';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrAccountProfileProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
};

export function scrAccountProfile({
  fldObjStrings,
  fldObjClient,
}: scrAccountProfileProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldObjProfile, actSetProfile] =
    React.useState<fldObjAccountProfile | null>(null);
  const [fldBooLoaded, actSetLoaded] = React.useState(false);
  const [fldArrMemberships, actSetMemberships] = React.useState<
    fldObjAccountMembership[]
  >([]);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrDisplayName, actSetDisplayName] = React.useState('');
  const [fldStrNameError, actSetNameError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldStrSaveError, actSetSaveError] = React.useState<string | null>(
    null,
  );
  const [fldBooSaving, actSetSaving] = React.useState(false);

  const fldObjCopy = fldObjStrings.fldObjAccountProfile;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    Promise.all([
      srvApiGetAccountProfile(fldObjActiveClient),
      srvApiGetAccountMemberships(fldObjActiveClient),
    ]).then(
      ([fldObjLoadedProfile, fldArrLoadedMemberships]) => {
        if (!fldBooCancelled) {
          actSetProfile(fldObjLoadedProfile);
          actSetMemberships(fldArrLoadedMemberships);
          actSetDisplayName(fldObjLoadedProfile?.fldStrDisplayName ?? '');
          actSetLoaded(true);
        }
      },
      fldObjLoadError => {
        if (!fldBooCancelled) {
          actSetError((fldObjLoadError as Error).message);
          actSetLoaded(true);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjActiveClient]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fncRunSave = React.useCallback(() => {
    if (fldBooSaving || fldObjProfile === null) {
      return;
    }
    if (fldStrDisplayName.trim() === '') {
      actSetNameError(fldObjCopy.fldStrDisplayNameRequired);
      return;
    }
    actSetNameError(undefined);
    actSetSaveError(null);
    actSetSaving(true);
    srvApiSaveAccountProfile(fldObjActiveClient, {
      fldStrDisplayName,
      fldStrProfileType: fldObjProfile.fldStrProfileType,
    }).then(
      () => {
        actSetSaving(false);
        fncRunLoad();
      },
      fldObjSaveError => {
        actSetSaving(false);
        actSetSaveError((fldObjSaveError as Error).message);
      },
    );
  }, [
    fldBooSaving,
    fldObjActiveClient,
    fldObjCopy,
    fldObjProfile,
    fldStrDisplayName,
    fncRunLoad,
  ]);

  if (!fldBooLoaded) {
    return (
      <SafeAreaView style={scrAccountProfileStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountProfileStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountProfileStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldObjProfile === null) {
    return (
      <SafeAreaView style={scrAccountProfileStyles.fldObjScreen}>
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        <View style={scrAccountProfileStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountProfileStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountProfileStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="caption">
            {fldObjProfile.fldStrProfileType}
          </VwText>
        </View>
        {fldStrSaveError !== null && (
          <View style={scrAccountProfileStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrSaveErrorTitle}
              fldStrMessage={fldStrSaveError}
            />
          </View>
        )}
        <View style={scrAccountProfileStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrDisplayName}
            actHandOnChange={fldStrText => {
              actSetDisplayName(fldStrText);
              actSetNameError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrDisplayNamePlaceholder}
            fldStrError={fldStrNameError}
            fldBooDisabled={fldBooSaving}
          />
        </View>
        <View style={scrAccountProfileStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrSave}
            fldBooLoading={fldBooSaving}
            actHandOnPress={fncRunSave}
          />
        </View>
        <View style={scrAccountProfileStyles.fldObjHeader}>
          <VwText fldStrVariant="header">
            {fldObjCopy.fldStrOrganizationsTitle}
          </VwText>
        </View>
        {fldArrMemberships.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyOrganizations} />
        ) : (
          fldArrMemberships.map(fldObjMembership => (
            <View
              key={`${fldObjMembership.fldStrOrganizationId}:${fldObjMembership.fldStrProfileId}`}
              style={scrAccountProfileStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">
                {fldObjMembership.fldStrOrganizationName}
              </VwText>
              <VwText fldStrVariant="caption">
                {`${fldObjCopy.fldStrRoleLabel}: ${fldObjMembership.fldStrRoleCode}`}
              </VwText>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAccountProfileStyles = StyleSheet.create({
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
