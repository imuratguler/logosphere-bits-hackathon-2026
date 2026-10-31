/**
 * Logosphere BITS — HIDDEN account relation screen.
 *
 * Basic person/org relation list plus add/remove: each link names
 * exactly one peer (a profile id or an organization id) with a
 * contact/partner/blocked mark, owned by the authenticated user.
 * This module is NOT imported by the demo navigator or any demo
 * module — no demo path can show it, and relations never gate
 * any demo flow.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountRelations); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

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
import type { fldObjAccountRelationLink } from '../services/srvAccountSocial';
import {
  srvApiAddAccountRelation,
  srvApiGetAccountRelations,
  srvApiRemoveAccountRelation,
} from '../services/srvAccountSocial';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import type { fldStrAccountRelation } from '../validation/vldAccount';

type scrAccountRelationsProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
};

const fldArrRelationChoices: fldStrAccountRelation[] = [
  'contact',
  'partner',
  'blocked',
];

export function scrAccountRelations({
  fldObjStrings,
  fldObjClient,
}: scrAccountRelationsProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldArrLinks, actSetLinks] = React.useState<
    fldObjAccountRelationLink[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrProfileId, actSetProfileId] = React.useState('');
  const [fldStrOrgId, actSetOrgId] = React.useState('');
  const [fldStrRelation, actSetRelation] =
    React.useState<fldStrAccountRelation>('contact');
  const [fldStrPeerError, actSetPeerError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldBooWorking, actSetWorking] = React.useState(false);
  const [fldStrOpError, actSetOpError] = React.useState<string | null>(null);

  const fldObjCopy = fldObjStrings.fldObjAccountRelations;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetAccountRelations(fldObjActiveClient).then(
      fldArrRows => {
        if (!fldBooCancelled) {
          actSetLinks(fldArrRows);
        }
      },
      fldObjLoadError => {
        if (!fldBooCancelled) {
          actSetError((fldObjLoadError as Error).message);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjActiveClient]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fncRunAdd = React.useCallback(() => {
    if (fldBooWorking) {
      return;
    }
    const fldNumPeers =
      (fldStrProfileId.trim() === '' ? 0 : 1) +
      (fldStrOrgId.trim() === '' ? 0 : 1);
    if (fldNumPeers !== 1) {
      actSetPeerError(fldObjCopy.fldStrPeerRequired);
      return;
    }
    actSetPeerError(undefined);
    actSetOpError(null);
    actSetWorking(true);
    srvApiAddAccountRelation(fldObjActiveClient, {
      fldStrPeerProfileId:
        fldStrProfileId.trim() === '' ? undefined : fldStrProfileId.trim(),
      fldStrPeerOrganizationId:
        fldStrOrgId.trim() === '' ? undefined : fldStrOrgId.trim(),
      fldStrRelation,
    }).then(
      () => {
        actSetWorking(false);
        actSetProfileId('');
        actSetOrgId('');
        fncRunLoad();
      },
      fldObjAddError => {
        actSetWorking(false);
        actSetOpError((fldObjAddError as Error).message);
      },
    );
  }, [
    fldBooWorking,
    fldObjActiveClient,
    fldObjCopy,
    fldStrOrgId,
    fldStrProfileId,
    fldStrRelation,
    fncRunLoad,
  ]);

  const fncRunRemove = React.useCallback(
    (fldStrLinkId: string) => {
      if (fldBooWorking) {
        return;
      }
      actSetOpError(null);
      actSetWorking(true);
      srvApiRemoveAccountRelation(fldObjActiveClient, fldStrLinkId).then(
        () => {
          actSetWorking(false);
          fncRunLoad();
        },
        fldObjRemoveError => {
          actSetWorking(false);
          actSetOpError((fldObjRemoveError as Error).message);
        },
      );
    },
    [fldBooWorking, fldObjActiveClient, fncRunLoad],
  );

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountRelationsStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountRelationsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrLinks === null) {
    return (
      <SafeAreaView style={scrAccountRelationsStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountRelationsStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountRelationsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        </View>
        {fldStrOpError !== null && (
          <View style={scrAccountRelationsStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrOpErrorTitle}
              fldStrMessage={fldStrOpError}
            />
          </View>
        )}
        {fldArrLinks.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrLinks.map(fldObjLink => (
            <View
              key={fldObjLink.fldStrId}
              style={scrAccountRelationsStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">
                {fldObjLink.fldStrPeerName ?? fldObjCopy.fldStrUnnamedPeer}
              </VwText>
              <VwText fldStrVariant="caption">
                {fldObjLink.fldStrPeerProfileId !== null
                  ? fldObjLink.fldStrPeerProfileId
                  : fldObjLink.fldStrPeerOrganizationId ?? ''}
              </VwText>
              <VwText fldStrVariant="caption">
                {fldObjLink.fldStrRelation}
              </VwText>
              <View style={scrAccountRelationsStyles.fldObjCell}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrRemove}
                  fldBooDisabled={fldBooWorking}
                  actHandOnPress={() => {
                    fncRunRemove(fldObjLink.fldStrId);
                  }}
                />
              </View>
            </View>
          ))
        )}
        <View style={scrAccountRelationsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrAddTitle}</VwText>
        </View>
        <View style={scrAccountRelationsStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrProfileId}
            actHandOnChange={fldStrText => {
              actSetProfileId(fldStrText);
              actSetPeerError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrProfilePlaceholder}
            fldStrError={fldStrPeerError}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        <View style={scrAccountRelationsStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrOrgId}
            actHandOnChange={fldStrText => {
              actSetOrgId(fldStrText);
              actSetPeerError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrOrgPlaceholder}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        {fldArrRelationChoices.map(fldStrChoice => (
          <View key={fldStrChoice} style={scrAccountRelationsStyles.fldObjCell}>
            <VwButton
              fldStrLabel={fldStrChoice}
              fldBooDisabled={fldBooWorking || fldStrRelation === fldStrChoice}
              actHandOnPress={() => {
                actSetRelation(fldStrChoice);
              }}
            />
          </View>
        ))}
        <View style={scrAccountRelationsStyles.fldObjFoot}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrAdd}
            fldBooLoading={fldBooWorking}
            actHandOnPress={fncRunAdd}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAccountRelationsStyles = StyleSheet.create({
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
    marginBottom: fldNumSpacingMd,
  },
  fldObjCell: {
    marginTop: fldNumSpacingSm,
  },
  fldObjFoot: {
    marginTop: fldNumSpacingMd,
  },
});
