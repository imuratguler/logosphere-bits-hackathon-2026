/**
 * Logosphere BITS — HIDDEN account invitation screen.
 *
 * Basic invitation management inside an organization: the visible
 * invitation list, manager email invitations with a server-minted
 * token (shown once for out-of-band delivery), and token
 * accept/decline into memberships. This module is NOT imported by
 * the demo navigator or any demo module — no demo path can show
 * it, and invitations never gate any demo flow.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountInvitations); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

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
import type { fldObjAccountInvitation } from '../services/srvAccountSocial';
import {
  srvApiAcceptAccountInvitation,
  srvApiDeclineAccountInvitation,
  srvApiGetAccountInvitations,
  srvApiInviteAccountMember,
} from '../services/srvAccountSocial';
import type { fldObjAccountRole } from '../services/srvAccountRoles';
import { srvApiGetAccountRoles } from '../services/srvAccountRoles';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { vldChgIsEmailValid } from '../validation/vldAccount';

type scrAccountInvitationsProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
  fldStrOrganizationId: string;
  fldStrOrganizationName: string;
};

export function scrAccountInvitations({
  fldObjStrings,
  fldObjClient,
  fldStrOrganizationId,
  fldStrOrganizationName,
}: scrAccountInvitationsProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldArrInvitations, actSetInvitations] = React.useState<
    fldObjAccountInvitation[] | null
  >(null);
  const [fldArrRoles, actSetRoles] = React.useState<fldObjAccountRole[]>([]);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrEmail, actSetEmail] = React.useState('');
  const [fldStrRoleCode, actSetRoleCode] = React.useState('');
  const [fldStrEmailError, actSetEmailError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrToken, actSetToken] = React.useState('');
  const [fldStrIssuedToken, actSetIssuedToken] = React.useState<string | null>(
    null,
  );
  const [fldBooWorking, actSetWorking] = React.useState(false);
  const [fldStrOpError, actSetOpError] = React.useState<string | null>(null);

  const fldObjCopy = fldObjStrings.fldObjAccountInvitations;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    Promise.all([
      srvApiGetAccountInvitations(fldObjActiveClient),
      srvApiGetAccountRoles(fldObjActiveClient),
    ]).then(
      ([fldArrLoadedInvitations, fldArrLoadedRoles]) => {
        if (!fldBooCancelled) {
          actSetInvitations(fldArrLoadedInvitations);
          actSetRoles(fldArrLoadedRoles);
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

  const fncRunInvite = React.useCallback(() => {
    if (fldBooWorking) {
      return;
    }
    if (fldStrEmail.trim() === '') {
      actSetEmailError(fldObjCopy.fldStrEmailRequired);
      return;
    }
    if (!vldChgIsEmailValid(fldStrEmail)) {
      actSetEmailError(fldObjCopy.fldStrEmailInvalid);
      return;
    }
    if (fldStrRoleCode === '') {
      actSetOpError(fldObjCopy.fldStrRoleRequired);
      return;
    }
    actSetEmailError(undefined);
    actSetOpError(null);
    actSetIssuedToken(null);
    actSetWorking(true);
    srvApiInviteAccountMember(fldObjActiveClient, {
      fldStrOrganizationId,
      fldStrEmail,
      fldStrRoleCode,
    }).then(
      fldObjIssued => {
        actSetWorking(false);
        actSetEmail('');
        actSetIssuedToken(fldObjIssued.fldStrToken);
        fncRunLoad();
      },
      fldObjInviteError => {
        actSetWorking(false);
        actSetOpError((fldObjInviteError as Error).message);
      },
    );
  }, [
    fldBooWorking,
    fldObjActiveClient,
    fldObjCopy,
    fldStrEmail,
    fldStrOrganizationId,
    fldStrRoleCode,
    fncRunLoad,
  ]);

  const fncRunDecide = React.useCallback(
    (fldBooAccept: boolean) => {
      if (fldBooWorking) {
        return;
      }
      if (fldStrToken.trim() === '') {
        actSetOpError(fldObjCopy.fldStrTokenRequired);
        return;
      }
      actSetOpError(null);
      actSetWorking(true);
      const fldObjDecision = fldBooAccept
        ? srvApiAcceptAccountInvitation(fldObjActiveClient, fldStrToken)
        : srvApiDeclineAccountInvitation(fldObjActiveClient, fldStrToken).then(
            () => undefined,
          );
      fldObjDecision.then(
        () => {
          actSetWorking(false);
          actSetToken('');
          fncRunLoad();
        },
        fldObjDecideError => {
          actSetWorking(false);
          actSetOpError((fldObjDecideError as Error).message);
        },
      );
    },
    [fldBooWorking, fldObjActiveClient, fldObjCopy, fldStrToken, fncRunLoad],
  );

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountInvitationsStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountInvitationsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrInvitations === null) {
    return (
      <SafeAreaView style={scrAccountInvitationsStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountInvitationsStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountInvitationsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="caption">{fldStrOrganizationName}</VwText>
        </View>
        {fldStrOpError !== null && (
          <View style={scrAccountInvitationsStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrOpErrorTitle}
              fldStrMessage={fldStrOpError}
            />
          </View>
        )}
        {fldStrIssuedToken !== null && (
          <View style={scrAccountInvitationsStyles.fldObjGap}>
            <VwText fldStrVariant="caption">
              {fldObjCopy.fldStrTokenIssuedLabel}
            </VwText>
            <VwText fldStrVariant="body">{fldStrIssuedToken}</VwText>
          </View>
        )}
        {fldArrInvitations.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrInvitations.map(fldObjInvitation => (
            <View
              key={fldObjInvitation.fldStrId}
              style={scrAccountInvitationsStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">
                {fldObjInvitation.fldStrEmail}
              </VwText>
              <VwText fldStrVariant="caption">
                {`${fldObjInvitation.fldStrOrganizationName} — ${fldObjInvitation.fldStrRoleCode} — ${fldObjInvitation.fldStrStatus}`}
              </VwText>
            </View>
          ))
        )}
        <View style={scrAccountInvitationsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrInviteTitle}</VwText>
        </View>
        <View style={scrAccountInvitationsStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrEmail}
            actHandOnChange={fldStrText => {
              actSetEmail(fldStrText);
              actSetEmailError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrEmailPlaceholder}
            fldStrError={fldStrEmailError}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        {fldArrRoles.map(fldObjRole => (
          <View
            key={fldObjRole.fldStrCode}
            style={scrAccountInvitationsStyles.fldObjCell}
          >
            <VwButton
              fldStrLabel={fldObjRole.fldStrCode}
              fldBooDisabled={
                fldBooWorking || fldStrRoleCode === fldObjRole.fldStrCode
              }
              actHandOnPress={() => {
                actSetRoleCode(fldObjRole.fldStrCode);
              }}
            />
          </View>
        ))}
        <View style={scrAccountInvitationsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrInvite}
            fldBooLoading={fldBooWorking}
            actHandOnPress={fncRunInvite}
          />
        </View>
        <View style={scrAccountInvitationsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrDecideTitle}</VwText>
        </View>
        <View style={scrAccountInvitationsStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrToken}
            actHandOnChange={actSetToken}
            fldStrPlaceholder={fldObjCopy.fldStrTokenPlaceholder}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        <View style={scrAccountInvitationsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrAccept}
            fldBooDisabled={fldBooWorking}
            actHandOnPress={() => {
              fncRunDecide(true);
            }}
          />
        </View>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrDecline}
          fldBooDisabled={fldBooWorking}
          actHandOnPress={() => {
            fncRunDecide(false);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAccountInvitationsStyles = StyleSheet.create({
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
    marginBottom: fldNumSpacingSm,
  },
});
