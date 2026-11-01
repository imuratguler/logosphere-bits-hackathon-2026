/**
 * Logosphere BITS — shared home screen (libraries, not accounts).
 *
 * Shows the shared workspace libraries every demo persona sees, under
 * a brand header with the current persona name and a Change Demo
 * Profile action, with the demo footer pinned below the content.
 * Renders no memberships, permissions, or become-a-
 * member calls, and changing the persona deletes no shared data and
 * opens no private workspace — selection only swaps the demo session.
 * Below the list sits the quick-create shortcut: name plus one of the
 * three library types, both required, founded date stamped as today in
 * the background; no code or detailed address is asked here. Saves go
 * through the ready libraries service with the session id only.
 * Tapping a library row opens the collection browser at that
 * library; the browser root offers the settings screen.
 * All reads delegate to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrHome); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwListRow as VwListRow } from '../components/vwListRow';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwLogo as VwLogo } from '../components/vwLogo';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjDemoLibrary } from '../services/srvDemoLibraries';
import {
  srvApiCreateDemoLibrary,
  srvApiGetDemoLibraries,
} from '../services/srvDemoLibraries';
import { srvApiGetDemoWorkspace } from '../services/srvDemoWorkspace';
import {
  fldArrLibraryShortcutTypes,
  type fldStrLibraryShortcutType,
} from '../types/typModels';
import {
  colBackground,
  colDanger,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';
import {
  fncConvNameTypeToLibraryInput,
  vldChgIsLibraryShortcutType,
  vldChgIsTextPresent,
} from '../validation/vldDetails';

type scrHomeProps = {
  fldObjStrings: fldObjAppStrings;
};

export function scrHome({ fldObjStrings }: scrHomeProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const { fldObjPersona, fldObjSession, srvApiClearPersona } = useDemoSession();
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const [fldArrLibraries, actSetLibraries] = React.useState<
    fldObjDemoLibrary[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrWorkspaceId, actSetWorkspaceId] = React.useState<string | null>(
    null,
  );
  const [fldStrShortcutName, actSetShortcutName] = React.useState('');
  const [fldStrShortcutType, actSetShortcutType] =
    React.useState<fldStrLibraryShortcutType | null>(null);
  const [fldStrShortcutNameError, actSetShortcutNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldStrShortcutTypeError, actSetShortcutTypeError] = React.useState<
    string | null
  >(null);
  const [fldBooShortcutSaving, actSetShortcutSaving] = React.useState(false);
  const [fldStrShortcutSaveError, actSetShortcutSaveError] = React.useState<
    string | null
  >(null);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoWorkspace(fldObjClient)
      .then(fldObjWorkspace => {
        if (!fldBooCancelled) {
          actSetWorkspaceId(fldObjWorkspace.fldStrId);
        }
        return srvApiGetDemoLibraries(fldObjClient, fldObjWorkspace.fldStrId);
      })
      .then(
        fldArrRows => {
          if (!fldBooCancelled) {
            actSetLibraries(fldArrRows);
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

  const fldObjCopy = fldObjStrings.fldObjHome;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjShortcutCopy = fldObjStrings.fldObjLibraryShortcut;
  const fldObjTypeLabels: Record<fldStrLibraryShortcutType, string> = {
    Branch: fldObjShortcutCopy.fldStrTypeBranch,
    Department: fldObjShortcutCopy.fldStrTypeDepartment,
    Hall: fldObjShortcutCopy.fldStrTypeHall,
  };

  const fncRunSaveShortcut = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldStrShortcutName);
    const fldBooTypeOk = vldChgIsLibraryShortcutType(fldStrShortcutType);
    actSetShortcutNameError(
      fldBooNameOk ? undefined : fldObjShortcutCopy.fldStrNameRequired,
    );
    actSetShortcutTypeError(
      fldBooTypeOk ? null : fldObjShortcutCopy.fldStrTypeRequired,
    );
    if (!fldBooNameOk || !fldBooTypeOk) {
      return;
    }
    const fldObjInput = fncConvNameTypeToLibraryInput(
      fldStrShortcutName,
      fldStrShortcutType,
    );
    actSetShortcutSaving(true);
    actSetShortcutSaveError(null);
    srvApiCreateDemoLibrary(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrWorkspaceId ?? '',
      fldObjInput,
    ).then(
      () => {
        actSetShortcutName('');
        actSetShortcutType(null);
        actSetShortcutSaving(false);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetShortcutSaving(false);
        actSetShortcutSaveError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjShortcutCopy,
    fldStrShortcutName,
    fldStrShortcutType,
    fldStrWorkspaceId,
    fncRunLoad,
  ]);

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrHomeStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrHomeStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
        <View style={scrHomeStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrLibraries === null) {
    return (
      <SafeAreaView style={scrHomeStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrHomeStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrHomeStyles.fldObjScreen}>
      <ScrollView
        style={scrHomeStyles.fldObjScroll}
        contentContainerStyle={scrHomeStyles.fldObjScrollContent}
      >
        <View style={scrHomeStyles.fldObjHeader}>
          <VwLogo fldNumWidth={64} />
          <VwBrandHeader
            fldStrName={fldObjBrandCopy.fldStrName}
            fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
          />
          {fldObjPersona !== null && (
            <VwText fldStrVariant="body">
              {fldObjPersona.fldStrDisplayName}
            </VwText>
          )}
          <VwButton
            fldStrLabel={fldObjCopy.fldStrChangeProfile}
            actHandOnPress={() => {
              // Fire-and-forget: clearing never rejects by design.
              srvApiClearPersona();
            }}
          />
        </View>
        <VwText fldStrVariant="header">
          {fldObjCopy.fldStrLibrariesTitle}
        </VwText>
        {fldArrLibraries.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrLibraries.map(fldObjItem => (
            <VwListRow
              key={fldObjItem.fldStrId}
              fldStrTitle={fldObjItem.fldStrName}
              fldBooChecked={null}
              fldBooChevron
              actHandOnPress={() => {
                fldObjNavigation.navigate('CollectionBrowser', {
                  fldStrLibraryId: fldObjItem.fldStrId,
                  fldStrLibraryName: fldObjItem.fldStrName,
                  fldStrParentId: fldObjItem.fldStrId,
                  fldStrTitle: fldObjItem.fldStrName,
                });
              }}
            />
          ))
        )}
        <View style={scrHomeStyles.fldObjShortcut}>
          <VwText fldStrVariant="header">
            {fldObjShortcutCopy.fldStrTitle}
          </VwText>
          <View style={scrHomeStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldStrShortcutName}
              actHandOnChange={fldStrText => {
                actSetShortcutName(fldStrText);
                actSetShortcutNameError(undefined);
              }}
              fldStrPlaceholder={fldObjShortcutCopy.fldStrNamePlaceholder}
              fldStrError={fldStrShortcutNameError}
              fldBooDisabled={fldBooShortcutSaving}
            />
          </View>
          {fldArrLibraryShortcutTypes.map(fldStrType => {
            const fldStrLabel = fldObjTypeLabels[fldStrType];
            return (
              <View key={fldStrType} style={scrHomeStyles.fldObjRow}>
                <VwButton
                  fldStrLabel={
                    fldStrShortcutType === fldStrType
                      ? `${fldStrLabel} — ${fldObjShortcutCopy.fldStrSelected}`
                      : fldStrLabel
                  }
                  fldBooDisabled={fldBooShortcutSaving}
                  actHandOnPress={() => {
                    actSetShortcutType(fldStrType);
                    actSetShortcutTypeError(null);
                  }}
                />
              </View>
            );
          })}
          {fldStrShortcutTypeError !== null && (
            <Text style={scrHomeStyles.fldObjTypeError}>
              {fldStrShortcutTypeError}
            </Text>
          )}
          {fldStrShortcutSaveError !== null && (
            <View style={scrHomeStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldObjShortcutCopy.fldStrSaveErrorTitle}
                fldStrMessage={fldStrShortcutSaveError}
              />
            </View>
          )}
          <VwButton
            fldStrLabel={fldObjShortcutCopy.fldStrSave}
            fldBooLoading={fldBooShortcutSaving}
            actHandOnPress={fncRunSaveShortcut}
          />
        </View>
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
    </SafeAreaView>
  );
}

const scrHomeStyles = StyleSheet.create({
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
  },
  fldObjFoot: {
    marginTop: 'auto',
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
  fldObjShortcut: {
    marginTop: fldNumSpacingLg,
  },
  fldObjTypeError: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 13,
    lineHeight: 20,
    color: colDanger,
    marginTop: fldNumSpacingSm,
  },
});
