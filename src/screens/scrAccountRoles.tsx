/**
 * Logosphere BITS — HIDDEN account role and matrix screen.
 *
 * Account roles with their 7-action by 3-scope grant grid plus
 * org member assignment, all under real-account auth rules: cell
 * toggles and role changes ride on manager-gated account RPCs,
 * and the UI disables them (visibly, never touchable-but-dead)
 * for non-managers while the server stays the enforcer. Roles
 * come only from server membership rows and the matrix — demo
 * persona types never count as role assignment, and this module
 * takes no persona. NOT imported by the demo navigator or any
 * demo module — no demo path can show it.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountRoles); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SupabaseClient } from '@supabase/supabase-js';

import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetRealClient } from '../services/srvRealAccount';
import { srvApiAssignAccountRole } from '../services/srvAccountProfile';
import type {
  fldObjAccountRole,
  fldObjOrgMember,
} from '../services/srvAccountRoles';
import {
  srvApiGetAccountMatrix,
  srvApiGetAccountRoles,
  srvApiGetOrgMembers,
  srvApiGetOwnProfileId,
  srvApiSetAccountMatrixCell,
} from '../services/srvAccountRoles';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import type {
  fldObjRolePermissionCell,
  fldStrPermissionAction,
  fldStrPermissionScope,
} from '../validation/vldAuthorization';
import { vldChgIsCellGranted } from '../validation/vldAuthorization';

type scrAccountRolesProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
  fldStrOrganizationId: string;
  fldStrOrganizationName: string;
};

const fldArrMatrixActions: fldStrPermissionAction[] = [
  'view',
  'create',
  'delete',
  'sell_toggle',
  'price',
  'buy',
  'sell',
];

const fldArrMatrixScopes: fldStrPermissionScope[] = [
  'item',
  'collection',
  'library',
];

export function scrAccountRoles({
  fldObjStrings,
  fldObjClient,
  fldStrOrganizationId,
  fldStrOrganizationName,
}: scrAccountRolesProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldArrRoles, actSetRoles] = React.useState<fldObjAccountRole[] | null>(
    null,
  );
  const [fldArrMatrix, actSetMatrix] = React.useState<
    fldObjRolePermissionCell[]
  >([]);
  const [fldArrMembers, actSetMembers] = React.useState<fldObjOrgMember[]>([]);
  const [fldStrOwnId, actSetOwnId] = React.useState<string | null>(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldBooWorking, actSetWorking] = React.useState(false);
  const [fldStrOpError, actSetOpError] = React.useState<string | null>(null);

  const fldObjCopy = fldObjStrings.fldObjAccountRoles;
  const fldBooManager =
    fldStrOwnId !== null &&
    fldArrMembers.some(
      fldObjMember =>
        fldObjMember.fldStrProfileId === fldStrOwnId &&
        fldObjMember.fldStrRoleCode === 'account_manager',
    );

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    Promise.all([
      srvApiGetAccountRoles(fldObjActiveClient),
      srvApiGetAccountMatrix(fldObjActiveClient),
      srvApiGetOrgMembers(fldObjActiveClient, fldStrOrganizationId),
      srvApiGetOwnProfileId(fldObjActiveClient),
    ]).then(
      ([
        fldArrLoadedRoles,
        fldArrLoadedMatrix,
        fldArrLoadedMembers,
        fldStrLoadedOwn,
      ]) => {
        if (!fldBooCancelled) {
          actSetRoles(fldArrLoadedRoles);
          actSetMatrix(fldArrLoadedMatrix);
          actSetMembers(fldArrLoadedMembers);
          actSetOwnId(fldStrLoadedOwn);
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
  }, [fldObjActiveClient, fldStrOrganizationId]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fncRunToggleCell = React.useCallback(
    (
      fldStrRoleCode: string,
      fldStrAction: fldStrPermissionAction,
      fldStrScope: fldStrPermissionScope,
      fldBooGranted: boolean,
    ) => {
      if (fldBooWorking || !fldBooManager) {
        return;
      }
      actSetOpError(null);
      actSetWorking(true);
      srvApiSetAccountMatrixCell(fldObjActiveClient, {
        fldStrRoleCode,
        fldStrAction,
        fldStrScope,
        fldBooGrant: !fldBooGranted,
      }).then(
        () => {
          actSetWorking(false);
          fncRunLoad();
        },
        fldObjCellError => {
          actSetWorking(false);
          actSetOpError((fldObjCellError as Error).message);
        },
      );
    },
    [fldBooManager, fldBooWorking, fldObjActiveClient, fncRunLoad],
  );

  const fncRunAssign = React.useCallback(
    (fldStrProfileId: string, fldStrRoleCode: string) => {
      if (fldBooWorking || !fldBooManager) {
        return;
      }
      actSetOpError(null);
      actSetWorking(true);
      srvApiAssignAccountRole(fldObjActiveClient, {
        fldStrOrganizationId,
        fldStrProfileId,
        fldStrRoleCode,
      }).then(
        () => {
          actSetWorking(false);
          fncRunLoad();
        },
        fldObjAssignError => {
          actSetWorking(false);
          actSetOpError((fldObjAssignError as Error).message);
        },
      );
    },
    [
      fldBooManager,
      fldBooWorking,
      fldObjActiveClient,
      fldStrOrganizationId,
      fncRunLoad,
    ],
  );

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountRolesStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountRolesStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrRoles === null) {
    return (
      <SafeAreaView style={scrAccountRolesStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountRolesStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountRolesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="caption">{fldStrOrganizationName}</VwText>
        </View>
        {!fldBooManager && (
          <View style={scrAccountRolesStyles.fldObjGap}>
            <VwText fldStrVariant="caption">
              {fldObjCopy.fldStrReadOnlyHint}
            </VwText>
          </View>
        )}
        {fldStrOpError !== null && (
          <View style={scrAccountRolesStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrSaveErrorTitle}
              fldStrMessage={fldStrOpError}
            />
          </View>
        )}
        <View style={scrAccountRolesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrRolesTitle}</VwText>
        </View>
        {fldArrRoles.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyRoles} />
        ) : (
          fldArrRoles.map(fldObjRole => (
            <View
              key={fldObjRole.fldStrCode}
              style={scrAccountRolesStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">{fldObjRole.fldStrCode}</VwText>
              <VwText fldStrVariant="caption">
                {fldObjRole.fldStrDescription}
              </VwText>
            </View>
          ))
        )}
        <View style={scrAccountRolesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrMatrixTitle}</VwText>
        </View>
        {fldArrRoles.map(fldObjRole => (
          <View
            key={`matrix-${fldObjRole.fldStrCode}`}
            style={scrAccountRolesStyles.fldObjGap}
          >
            <VwText fldStrVariant="body">{fldObjRole.fldStrCode}</VwText>
            {fldArrMatrixActions.map(fldStrAction => (
              <View
                key={`${fldObjRole.fldStrCode}-${fldStrAction}`}
                style={scrAccountRolesStyles.fldObjRow}
              >
                <VwText fldStrVariant="caption">{fldStrAction}</VwText>
                {fldArrMatrixScopes.map(fldStrScope => {
                  const fldBooGranted = vldChgIsCellGranted(
                    fldArrMatrix
                      .filter(
                        fldObjCell =>
                          fldObjCell.fldStrRoleCode === fldObjRole.fldStrCode,
                      )
                      .map(fldObjCell => ({
                        fldStrAction: fldObjCell.fldStrAction,
                        fldStrScope: fldObjCell.fldStrScope,
                      })),
                    fldStrAction,
                    fldStrScope,
                  );
                  return (
                    <View
                      key={`${fldObjRole.fldStrCode}-${fldStrAction}-${fldStrScope}`}
                      style={scrAccountRolesStyles.fldObjCell}
                    >
                      <VwButton
                        fldStrLabel={`${fldStrScope} — ${
                          fldBooGranted
                            ? fldObjCopy.fldStrGranted
                            : fldObjCopy.fldStrRevoked
                        }`}
                        fldBooDisabled={fldBooWorking || !fldBooManager}
                        actHandOnPress={() => {
                          fncRunToggleCell(
                            fldObjRole.fldStrCode,
                            fldStrAction,
                            fldStrScope,
                            fldBooGranted,
                          );
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}
        <View style={scrAccountRolesStyles.fldObjHeader}>
          <VwText fldStrVariant="header">
            {fldObjCopy.fldStrMembersTitle}
          </VwText>
        </View>
        {fldArrMembers.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyMembers} />
        ) : (
          fldArrMembers.map(fldObjMember => (
            <View
              key={fldObjMember.fldStrProfileId}
              style={scrAccountRolesStyles.fldObjGap}
            >
              <VwText fldStrVariant="body">
                {fldObjMember.fldStrDisplayName ??
                  fldObjCopy.fldStrUnnamedMember}
              </VwText>
              <VwText fldStrVariant="caption">
                {`${fldObjCopy.fldStrMemberRoleLabel}: ${fldObjMember.fldStrRoleCode}`}
              </VwText>
              {fldArrRoles.map(fldObjRole => (
                <View
                  key={`${fldObjMember.fldStrProfileId}-${fldObjRole.fldStrCode}`}
                  style={scrAccountRolesStyles.fldObjCell}
                >
                  <VwButton
                    fldStrLabel={fldObjRole.fldStrCode}
                    fldBooDisabled={
                      fldBooWorking ||
                      !fldBooManager ||
                      fldObjMember.fldStrRoleCode === fldObjRole.fldStrCode
                    }
                    actHandOnPress={() => {
                      fncRunAssign(
                        fldObjMember.fldStrProfileId,
                        fldObjRole.fldStrCode,
                      );
                    }}
                  />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAccountRolesStyles = StyleSheet.create({
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
  fldObjCell: {
    marginTop: fldNumSpacingSm,
  },
});
