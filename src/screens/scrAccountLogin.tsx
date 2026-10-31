/**
 * Logosphere BITS — HIDDEN real-account login screen.
 *
 * Email/password login through the real account service
 * (srvAuthLogin on the real client): the authenticated identity is
 * the server user object, never a persona, flag, or demo session.
 * This module is NOT imported by the demo navigator, demo startup,
 * or any demo screen or service — no demo menu, route, or deep
 * link can open it; it renders only when a future real-account
 * shell mounts it directly. Field validation runs before any Auth
 * call; submit failures surface the server message with the form
 * kept, and values are never logged.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountLogin); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SupabaseClient } from '@supabase/supabase-js';

import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjRealAccountIdentity } from '../services/srvRealAccount';
import { srvApiGetRealClient, srvAuthLogin } from '../services/srvRealAccount';
import { colBackground, fldNumSpacingMd } from '../utils/utlTheme';
import { vldSchAccountLogin } from '../validation/vldAccount';

type scrAccountLoginProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
  actHandOnLogin: (fldObjIdentity: fldObjRealAccountIdentity) => void;
};

export function scrAccountLogin({
  fldObjStrings,
  fldObjClient,
  actHandOnLogin,
}: scrAccountLoginProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldStrEmail, actSetEmail] = React.useState('');
  const [fldStrPassword, actSetPassword] = React.useState('');
  const [fldStrEmailError, actSetEmailError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrPasswordError, actSetPasswordError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrSubmitError, actSetSubmitError] = React.useState<string | null>(
    null,
  );
  const [fldBooLoading, actSetLoading] = React.useState(false);

  const fldObjCopy = fldObjStrings.fldObjAccountLogin;

  const fncRunSubmit = React.useCallback(() => {
    if (fldBooLoading) {
      return;
    }
    const fldObjErrors = vldSchAccountLogin(
      { fldStrEmail, fldStrPassword },
      {
        fldStrEmailRequired: fldObjCopy.fldStrEmailRequired,
        fldStrEmailInvalid: fldObjCopy.fldStrEmailInvalid,
        fldStrPasswordRequired: fldObjCopy.fldStrPasswordRequired,
      },
    );
    actSetEmailError(fldObjErrors.fldStrEmail);
    actSetPasswordError(fldObjErrors.fldStrPassword);
    if (
      fldObjErrors.fldStrEmail !== undefined ||
      fldObjErrors.fldStrPassword !== undefined
    ) {
      return;
    }
    actSetSubmitError(null);
    actSetLoading(true);
    srvAuthLogin(fldObjActiveClient, { fldStrEmail, fldStrPassword }).then(
      fldObjIdentity => {
        actSetLoading(false);
        actHandOnLogin(fldObjIdentity);
      },
      fldObjError => {
        actSetLoading(false);
        actSetSubmitError((fldObjError as Error).message);
      },
    );
  }, [
    fldBooLoading,
    fldObjActiveClient,
    fldObjCopy,
    fldStrEmail,
    fldStrPassword,
    actHandOnLogin,
  ]);

  return (
    <SafeAreaView style={scrAccountLoginStyles.fldObjScreen}>
      <View style={scrAccountLoginStyles.fldObjHeader}>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
      </View>
      {fldStrSubmitError !== null && (
        <View style={scrAccountLoginStyles.fldObjGap}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrErrorTitle}
            fldStrMessage={fldStrSubmitError}
          />
        </View>
      )}
      <View style={scrAccountLoginStyles.fldObjGap}>
        <VwTextInput
          fldStrValue={fldStrEmail}
          actHandOnChange={fldStrText => {
            actSetEmail(fldStrText);
            actSetEmailError(undefined);
          }}
          fldStrPlaceholder={fldObjCopy.fldStrEmailPlaceholder}
          fldStrError={fldStrEmailError}
          fldBooDisabled={fldBooLoading}
        />
      </View>
      <View style={scrAccountLoginStyles.fldObjGap}>
        <VwTextInput
          fldStrValue={fldStrPassword}
          actHandOnChange={fldStrText => {
            actSetPassword(fldStrText);
            actSetPasswordError(undefined);
          }}
          fldStrPlaceholder={fldObjCopy.fldStrPasswordPlaceholder}
          fldStrError={fldStrPasswordError}
          fldBooDisabled={fldBooLoading}
          fldBooSecureEntry={true}
        />
      </View>
      <VwButton
        fldStrLabel={fldObjCopy.fldStrLogin}
        fldBooLoading={fldBooLoading}
        actHandOnPress={fncRunSubmit}
      />
    </SafeAreaView>
  );
}

const scrAccountLoginStyles = StyleSheet.create({
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
});
