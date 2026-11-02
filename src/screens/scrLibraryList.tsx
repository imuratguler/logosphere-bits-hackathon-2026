/**
 * Logosphere BITS — shared library list (one folder level).
 *
 * Top strip carries the selected demo persona name with a back
 * arrow; below it every shared workspace library renders as a
 * tall row, and a fixed + Library button above the footer opens
 * the short create modal (name plus one of the three library
 * types, both required, founded date stamped as today). Tapping
 * a row opens the collection browser at that library. Every
 * persona opens this same shared catalog: selection never splits
 * data and creates no private workspace. Saves go through the
 * ready libraries service with the session id only.
 * All reads delegate to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrLibraryList); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwListRow as VwListRow } from '../components/vwListRow';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
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
  colScrim,
  fldNumRadiusLg,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumSpacingXl,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';
import {
  fncConvNameTypeToLibraryInput,
  vldChgIsLibraryShortcutType,
  vldChgIsTextPresent,
} from '../validation/vldDetails';

type scrLibraryListProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrPersonaName: string;
};

export function scrLibraryList({
  fldObjStrings,
  fldStrPersonaName,
}: scrLibraryListProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const { fldObjSession } = useDemoSession();
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
  const [fldBooShortcutVisible, actSetShortcutVisible] = React.useState(false);

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

  const fldObjCopy = fldObjStrings.fldObjLibraryList;
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
        actSetShortcutVisible(false);
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

  const fncRunOpenShortcut = React.useCallback(() => {
    actSetShortcutName('');
    actSetShortcutType(null);
    actSetShortcutNameError(undefined);
    actSetShortcutTypeError(null);
    actSetShortcutSaveError(null);
    actSetShortcutVisible(true);
  }, []);

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrLibraryListStyles.fldObjScreen}>
        <VwTopBar
          fldStrTitle={fldStrPersonaName}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={() => {
            fldObjNavigation.goBack();
          }}
        />
        <View style={scrLibraryListStyles.fldObjBody}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrErrorTitle}
            fldStrMessage={fldStrError}
          />
          <View style={scrLibraryListStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrRetry}
              actHandOnPress={fncRunLoad}
            />
          </View>
        </View>
        <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
      </SafeAreaView>
    );
  }

  if (fldArrLibraries === null) {
    return (
      <SafeAreaView style={scrLibraryListStyles.fldObjScreen}>
        <VwTopBar
          fldStrTitle={fldStrPersonaName}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={() => {
            fldObjNavigation.goBack();
          }}
        />
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrLibraryListStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrLibraryListStyles.fldObjScreen}>
      <VwTopBar
        fldStrTitle={fldStrPersonaName}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={() => {
          fldObjNavigation.goBack();
        }}
      />
      <ScrollView
        style={scrLibraryListStyles.fldObjScroll}
        contentContainerStyle={scrLibraryListStyles.fldObjScrollContent}
      >
        {fldArrLibraries.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrLibraries.map(fldObjItem => (
            <VwListRow
              key={fldObjItem.fldStrId}
              fldStrTitle={fldObjItem.fldStrName}
              fldBooChecked={null}
              fldBooChevron
              fldStrIcon="🧱"
              fldBooTall
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
      </ScrollView>
      <View style={scrLibraryListStyles.fldObjFixedBar}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrAddLibrary}
          actHandOnPress={fncRunOpenShortcut}
        />
      </View>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
      {fldBooShortcutVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={true}
          onRequestClose={() => {
            actSetShortcutVisible(false);
          }}
        >
          <View style={scrLibraryListStyles.fldObjOverlay}>
            <View style={scrLibraryListStyles.fldObjCard}>
              <VwText fldStrVariant="header">
                {fldObjShortcutCopy.fldStrTitle}
              </VwText>
              <View style={scrLibraryListStyles.fldObjGap}>
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
                  <View key={fldStrType} style={scrLibraryListStyles.fldObjRow}>
                    <VwButton
                      fldStrLabel={
                        fldStrShortcutType === fldStrType
                          ? `${fldStrLabel} — ${fldObjShortcutCopy.fldStrSelected}`
                          : fldStrLabel
                      }
                      fldStrVariant="secondary"
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
                <Text style={scrLibraryListStyles.fldObjTypeError}>
                  {fldStrShortcutTypeError}
                </Text>
              )}
              {fldStrShortcutSaveError !== null && (
                <View style={scrLibraryListStyles.fldObjGap}>
                  <VwEmptyState
                    fldStrTitle={fldObjShortcutCopy.fldStrSaveErrorTitle}
                    fldStrMessage={fldStrShortcutSaveError}
                  />
                </View>
              )}
              <View style={scrLibraryListStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldObjShortcutCopy.fldStrSave}
                  fldBooLoading={fldBooShortcutSaving}
                  fldBooDisabled={
                    fldStrShortcutName.trim() === '' ||
                    fldStrShortcutType === null
                  }
                  actHandOnPress={fncRunSaveShortcut}
                />
              </View>
              <VwButton
                fldStrLabel={fldObjShortcutCopy.fldStrCancel}
                fldStrVariant="text"
                fldBooDisabled={fldBooShortcutSaving}
                actHandOnPress={() => {
                  actSetShortcutVisible(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const scrLibraryListStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjBody: {
    flex: 1,
    padding: fldNumSpacingMd,
  },
  fldObjScroll: {
    flex: 1,
    padding: fldNumSpacingMd,
  },
  fldObjScrollContent: {
    paddingTop: fldNumSpacingMd,
    paddingBottom: fldNumSpacingMd,
  },
  fldObjFoot: {
    marginTop: 'auto',
  },
  fldObjFixedBar: {
    paddingHorizontal: fldNumSpacingMd,
    paddingBottom: fldNumSpacingSm,
  },
  fldObjGap: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjRow: {
    marginBottom: fldNumSpacingSm,
  },
  fldObjOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colScrim,
    padding: fldNumSpacingXl,
  },
  fldObjCard: {
    backgroundColor: colBackground,
    borderRadius: fldNumRadiusLg,
    padding: fldNumSpacingLg,
  },
  fldObjTypeError: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 13,
    lineHeight: 20,
    color: colDanger,
    marginTop: fldNumSpacingSm,
  },
});
