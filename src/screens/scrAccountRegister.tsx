/**
 * Logosphere BITS — HIDDEN real-account registration screen.
 *
 * Individual/corporate membership selection plus the matching
 * registration form, all inside the real account module: Auth
 * sign-up, then the authenticated profile row, then (corporate
 * only) the owned organization with the creator as account_manager.
 * Identity comes only from the server user object; the flow takes
 * no persona, opens no demo session, and never reads or writes
 * demo_personas, so real registration cannot alter the shared demo
 * persona seed. This module is NOT imported by demo startup,
 * persona selection, the demo navigator, or any demo module — no
 * demo path can show it.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountRegister); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

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
import {
  srvApiGetRealClient,
  srvAuthRegister,
} from '../services/srvRealAccount';
import {
  srvApiCreateAccountOrganization,
  srvApiSaveAccountProfile,
} from '../services/srvAccountProfile';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import type { fldStrAccountProfileType } from '../validation/vldAccount';
import { vldSchAccountRegister } from '../validation/vldAccount';

type scrAccountRegisterProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
  actHandOnRegistered: (fldObjIdentity: fldObjRealAccountIdentity) => void;
};

export function scrAccountRegister({
  fldObjStrings,
  fldObjClient,
  actHandOnRegistered,
}: scrAccountRegisterProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldStrProfileType, actSetProfileType] =
    React.useState<fldStrAccountProfileType>('individual');
  const [fldStrEmail, actSetEmail] = React.useState('');
  const [fldStrPassword, actSetPassword] = React.useState('');
  const [fldStrDisplayName, actSetDisplayName] = React.useState('');
  const [fldStrOrganizationName, actSetOrganizationName] = React.useState('');
  const [fldStrEmailError, actSetEmailError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrPasswordError, actSetPasswordError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrDisplayNameError, actSetDisplayNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrOrganizationError, actSetOrganizationError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrSubmitError, actSetSubmitError] = React.useState<string | null>(
    null,
  );
  const [fldBooLoading, actSetLoading] = React.useState(false);

  const fldObjCopy = fldObjStrings.fldObjAccountRegister;
  const fldBooCorporate = fldStrProfileType === 'corporate';

  const fncRunSubmit = React.useCallback(() => {
    if (fldBooLoading) {
      return;
    }
    const fldObjErrors = vldSchAccountRegister(
      {
        fldStrProfileType,
        fldStrEmail,
        fldStrPassword,
        fldStrDisplayName,
        fldStrOrganizationName,
      },
      {
        fldStrTypeInvalid: fldObjCopy.fldStrTypeInvalid,
        fldStrEmailRequired: fldObjCopy.fldStrEmailRequired,
        fldStrEmailInvalid: fldObjCopy.fldStrEmailInvalid,
        fldStrPasswordRequired: fldObjCopy.fldStrPasswordRequired,
        fldStrPasswordTooShort: fldObjCopy.fldStrPasswordTooShort,
        fldStrDisplayNameRequired: fldObjCopy.fldStrDisplayNameRequired,
        fldStrOrganizationRequired: fldObjCopy.fldStrOrganizationRequired,
      },
    );
    actSetEmailError(fldObjErrors.fldStrEmail);
    actSetPasswordError(fldObjErrors.fldStrPassword);
    actSetDisplayNameError(fldObjErrors.fldStrDisplayName);
    actSetOrganizationError(fldObjErrors.fldStrOrganizationName);
    if (Object.keys(fldObjErrors).length > 0) {
      return;
    }
    actSetSubmitError(null);
    actSetLoading(true);
    const fncRunRegister = async (): Promise<void> => {
      const fldObjIdentity = await srvAuthRegister(fldObjActiveClient, {
        fldStrEmail,
        fldStrPassword,
      });
      await srvApiSaveAccountProfile(fldObjActiveClient, {
        fldStrDisplayName,
        fldStrProfileType,
      });
      if (fldBooCorporate) {
        await srvApiCreateAccountOrganization(
          fldObjActiveClient,
          fldStrOrganizationName,
        );
      }
      actSetLoading(false);
      actHandOnRegistered(fldObjIdentity);
    };
    fncRunRegister().catch((fldObjError: unknown) => {
      actSetLoading(false);
      actSetSubmitError((fldObjError as Error).message);
    });
  }, [
    fldBooCorporate,
    fldBooLoading,
    fldObjActiveClient,
    fldObjCopy,
    fldStrDisplayName,
    fldStrEmail,
    fldStrOrganizationName,
    fldStrPassword,
    fldStrProfileType,
    actHandOnRegistered,
  ]);

  return (
    <SafeAreaView style={scrAccountRegisterStyles.fldObjScreen}>
      <View style={scrAccountRegisterStyles.fldObjHeader}>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
      </View>
      <View style={scrAccountRegisterStyles.fldObjGap}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrIndividualButton}
          fldBooDisabled={fldBooLoading || !fldBooCorporate}
          actHandOnPress={() => {
            actSetProfileType('individual');
            actSetOrganizationError(undefined);
          }}
        />
      </View>
      <View style={scrAccountRegisterStyles.fldObjGap}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrCorporateButton}
          fldBooDisabled={fldBooLoading || fldBooCorporate}
          actHandOnPress={() => {
            actSetProfileType('corporate');
          }}
        />
      </View>
      {fldStrSubmitError !== null && (
        <View style={scrAccountRegisterStyles.fldObjGap}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrErrorTitle}
            fldStrMessage={fldStrSubmitError}
          />
        </View>
      )}
      <View style={scrAccountRegisterStyles.fldObjGap}>
        <VwTextInput
          fldStrValue={fldStrDisplayName}
          actHandOnChange={fldStrText => {
            actSetDisplayName(fldStrText);
            actSetDisplayNameError(undefined);
          }}
          fldStrPlaceholder={fldObjCopy.fldStrDisplayNamePlaceholder}
          fldStrError={fldStrDisplayNameError}
          fldBooDisabled={fldBooLoading}
        />
      </View>
      <View style={scrAccountRegisterStyles.fldObjGap}>
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
      <View style={scrAccountRegisterStyles.fldObjGap}>
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
      {fldBooCorporate && (
        <View style={scrAccountRegisterStyles.fldObjGap}>
          <VwTextInput
            fldStrValue={fldStrOrganizationName}
            actHandOnChange={fldStrText => {
              actSetOrganizationName(fldStrText);
              actSetOrganizationError(undefined);
            }}
            fldStrPlaceholder={fldObjCopy.fldStrOrganizationPlaceholder}
            fldStrError={fldStrOrganizationError}
            fldBooDisabled={fldBooLoading}
          />
        </View>
      )}
      <VwButton
        fldStrLabel={fldObjCopy.fldStrRegister}
        fldBooLoading={fldBooLoading}
        actHandOnPress={fncRunSubmit}
      />
      <View style={scrAccountRegisterStyles.fldObjFoot} />
    </SafeAreaView>
  );
}

const scrAccountRegisterStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjHeader: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjGap: {
    marginBottom: fldNumSpacingSm,
  },
  fldObjFoot: {
    height: fldNumSpacingMd,
  },
});
