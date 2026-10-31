/**
 * Logosphere BITS — HIDDEN account message screen.
 *
 * Basic message list plus compose: exactly one recipient (a
 * profile id or an organization id) and a body, sent as the
 * authenticated user; received messages flip to read through
 * the recipient-checked RPC. This module is NOT imported by the
 * demo navigator or any demo module — no demo path can show it,
 * and messaging is not a precondition of any demo flow.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountMessages); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

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
import type { fldObjAccountMessage } from '../services/srvAccountSocial';
import {
  srvApiGetAccountMessages,
  srvApiMarkAccountMessageRead,
  srvApiSendAccountMessage,
} from '../services/srvAccountSocial';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrAccountMessagesProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
};

export function scrAccountMessages({
  fldObjStrings,
  fldObjClient,
}: scrAccountMessagesProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldArrMessages, actSetMessages] = React.useState<
    fldObjAccountMessage[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrProfileId, actSetProfileId] = React.useState('');
  const [fldStrOrgId, actSetOrgId] = React.useState('');
  const [fldStrBody, actSetBody] = React.useState('');
  const [fldStrRecipientError, actSetRecipientError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrBodyError, actSetBodyError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldBooWorking, actSetWorking] = React.useState(false);
  const [fldStrOpError, actSetOpError] = React.useState<string | null>(null);

  const fldObjCopy = fldObjStrings.fldObjAccountMessages;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetAccountMessages(fldObjActiveClient).then(
      fldArrRows => {
        if (!fldBooCancelled) {
          actSetMessages(fldArrRows);
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

  const fncRunSend = React.useCallback(() => {
    if (fldBooWorking) {
      return;
    }
    const fldNumRecipients =
      (fldStrProfileId.trim() === '' ? 0 : 1) +
      (fldStrOrgId.trim() === '' ? 0 : 1);
    if (fldNumRecipients !== 1) {
      actSetRecipientError(fldObjCopy.fldStrRecipientRequired);
      return;
    }
    if (fldStrBody.trim() === '') {
      actSetBodyError(fldObjCopy.fldStrBodyRequired);
      return;
    }
    actSetRecipientError(undefined);
    actSetBodyError(undefined);
    actSetOpError(null);
    actSetWorking(true);
    srvApiSendAccountMessage(fldObjActiveClient, {
      fldStrRecipientProfileId:
        fldStrProfileId.trim() === '' ? undefined : fldStrProfileId.trim(),
      fldStrRecipientOrganizationId:
        fldStrOrgId.trim() === '' ? undefined : fldStrOrgId.trim(),
      fldStrBody,
    }).then(
      () => {
        actSetWorking(false);
        actSetProfileId('');
        actSetOrgId('');
        actSetBody('');
        fncRunLoad();
      },
      fldObjSendError => {
        actSetWorking(false);
        actSetOpError((fldObjSendError as Error).message);
      },
    );
  }, [
    fldBooWorking,
    fldObjActiveClient,
    fldObjCopy,
    fldStrBody,
    fldStrOrgId,
    fldStrProfileId,
    fncRunLoad,
  ]);

  const fncRunMarkRead = React.useCallback(
    (fldStrMessageId: string) => {
      if (fldBooWorking) {
        return;
      }
      actSetOpError(null);
      actSetWorking(true);
      srvApiMarkAccountMessageRead(fldObjActiveClient, fldStrMessageId).then(
        () => {
          actSetWorking(false);
          fncRunLoad();
        },
        fldObjReadError => {
          actSetWorking(false);
          actSetOpError((fldObjReadError as Error).message);
        },
      );
    },
    [fldBooWorking, fldObjActiveClient, fncRunLoad],
  );

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountMessagesStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountMessagesStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrMessages === null) {
    return (
      <SafeAreaView style={scrAccountMessagesStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountMessagesStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountMessagesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        </View>
        {fldStrOpError !== null && (
          <View style={scrAccountMessagesStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrOpErrorTitle}
              fldStrMessage={fldStrOpError}
            />
          </View>
        )}
        {fldArrMessages.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrMessages.map(fldObjMessage => (
            <View
              key={fldObjMessage.fldStrId}
              style={scrAccountMessagesStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">{fldObjMessage.fldStrBody}</VwText>
              <VwText fldStrVariant="caption">
                {fldObjMessage.fldStrRecipientProfileId ??
                  fldObjMessage.fldStrRecipientOrganizationId ??
                  ''}
              </VwText>
              <VwText fldStrVariant="caption">
                {fldObjMessage.fldBooIsRead
                  ? fldObjCopy.fldStrReadLabel
                  : fldObjCopy.fldStrUnreadLabel}
              </VwText>
              {!fldObjMessage.fldBooIsRead && (
                <View style={scrAccountMessagesStyles.fldObjCell}>
                  <VwButton
                    fldStrLabel={fldObjCopy.fldStrMarkRead}
                    fldBooDisabled={fldBooWorking}
                    actHandOnPress={() => {
                      fncRunMarkRead(fldObjMessage.fldStrId);
                    }}
                  />
                </View>
              )}
            </View>
          ))
        )}
        <View style={scrAccountMessagesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">
            {fldObjCopy.fldStrComposeTitle}
          </VwText>
        </View>
        <View style={scrAccountMessagesStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrProfileId}
            actHandOnChange={fldStrText => {
              actSetProfileId(fldStrText);
              actSetRecipientError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrProfilePlaceholder}
            fldStrError={fldStrRecipientError}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        <View style={scrAccountMessagesStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrOrgId}
            actHandOnChange={fldStrText => {
              actSetOrgId(fldStrText);
              actSetRecipientError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrOrgPlaceholder}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        <View style={scrAccountMessagesStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrBody}
            actHandOnChange={fldStrText => {
              actSetBody(fldStrText);
              actSetBodyError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrBodyPlaceholder}
            fldStrError={fldStrBodyError}
            fldBooDisabled={fldBooWorking}
          />
        </View>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrSend}
          fldBooLoading={fldBooWorking}
          actHandOnPress={fncRunSend}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAccountMessagesStyles = StyleSheet.create({
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
});
