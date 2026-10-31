/**
 * Logosphere BITS — collection browser (one recursive level).
 *
 * Shows the collections hanging under one parent: the tapped library
 * at the first level, a collection deeper down. The same route is
 * pushed again for a sub-collection, so the stack grows one entry per
 * level and the system back action walks back up; a visible Back
 * button does the same on every state (list, loading, empty, error).
 * The title is the current parent name, carried in the route params
 * from the tapped row — no extra read. At the library root a settings
 * action opens the library editor; deeper levels offer the current
 * collection's settings instead. Below the list sits the quick-create
 * shortcut: name only,
 * the formed date stamped as today in the background by the server;
 * the parent is validated on the client before the save call, and a
 * successful save clears the form and reloads this parent's list.
 * Collection levels also list the visible parent's sets with member
 * counts and product names (sets hold products only), plus a New-set
 * button opening a custom name modal; the set link comes from the
 * visible parent, blank names are rejected, and a failed save keeps
 * the modal input. Library root shows no sets section.
 * All reads delegate to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCollectionBrowser); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwSetNameModal as VwSetNameModal } from '../components/vwSetNameModal';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjDemoCollection } from '../services/srvDemoCollections';
import {
  srvApiCreateDemoCollection,
  srvApiGetDemoCollections,
} from '../services/srvDemoCollections';
import type {
  fldObjDemoSet,
  fldObjDemoSetProduct,
} from '../services/srvDemoSets';
import {
  srvApiCreateDemoSet,
  srvApiGetDemoSetProducts,
  srvApiGetDemoSets,
} from '../services/srvDemoSets';
import { srvApiGetDemoWorkspace } from '../services/srvDemoWorkspace';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { vldChgIsTextPresent } from '../validation/vldDetails';

type scrCollectionBrowserProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrLibraryId: string;
  fldStrLibraryName: string;
  fldStrParentId: string;
  fldStrTitle: string;
};

export function scrCollectionBrowser({
  fldObjStrings,
  fldStrLibraryId,
  fldStrLibraryName,
  fldStrParentId,
  fldStrTitle,
}: scrCollectionBrowserProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const { fldObjSession } = useDemoSession();
  const [fldArrCollections, actSetCollections] = React.useState<
    fldObjDemoCollection[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrWorkspaceId, actSetWorkspaceId] = React.useState<string | null>(
    null,
  );
  const [fldStrShortcutName, actSetShortcutName] = React.useState('');
  const [fldStrShortcutNameError, actSetShortcutNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldBooShortcutSaving, actSetShortcutSaving] = React.useState(false);
  const [fldStrShortcutSaveError, actSetShortcutSaveError] = React.useState<
    string | null
  >(null);
  const [fldArrSets, actSetSets] = React.useState<fldObjDemoSet[]>([]);
  const [fldArrSetProducts, actSetSetProducts] = React.useState<
    fldObjDemoSetProduct[]
  >([]);
  const [fldBooSetModalVisible, actSetSetModalVisible] = React.useState(false);
  const [fldStrSetName, actSetSetName] = React.useState('');
  const [fldStrSetNameError, actSetSetNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldBooSetSaving, actSetSetSaving] = React.useState(false);
  const [fldStrSetSaveError, actSetSetSaveError] = React.useState<
    string | null
  >(null);

  const fldBooIsLibraryRoot = fldStrParentId === fldStrLibraryId;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoWorkspace(fldObjClient)
      .then(fldObjWorkspace => {
        if (!fldBooCancelled) {
          actSetWorkspaceId(fldObjWorkspace.fldStrId);
        }
        return srvApiGetDemoCollections(
          fldObjClient,
          fldObjWorkspace.fldStrId,
          fldStrParentId,
        ).then(fldArrLoadedCollections => {
          if (fldBooIsLibraryRoot) {
            return {
              fldArrCollections: fldArrLoadedCollections,
              fldArrSets: [],
              fldArrProducts: [],
            };
          }
          return Promise.all([
            srvApiGetDemoSets(fldObjClient, fldStrParentId),
            srvApiGetDemoSetProducts(fldObjClient, fldStrParentId),
          ]).then(([fldArrLoadedSets, fldArrLoadedProducts]) => ({
            fldArrCollections: fldArrLoadedCollections,
            fldArrSets: fldArrLoadedSets,
            fldArrProducts: fldArrLoadedProducts,
          }));
        });
      })
      .then(
        fldObjLoaded => {
          if (!fldBooCancelled) {
            actSetCollections(fldObjLoaded.fldArrCollections);
            actSetSets(fldObjLoaded.fldArrSets);
            actSetSetProducts(fldObjLoaded.fldArrProducts);
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
  }, [fldObjClient, fldStrParentId, fldBooIsLibraryRoot]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjCollectionBrowser;
  const fldObjShortcutCopy = fldObjStrings.fldObjCollectionShortcut;
  const fldObjSetShortcutCopy = fldObjStrings.fldObjSetShortcut;

  const fncRunSaveShortcut = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldStrShortcutName);
    actSetShortcutNameError(
      fldBooNameOk ? undefined : fldObjShortcutCopy.fldStrNameRequired,
    );
    if (!fldBooNameOk) {
      return;
    }
    actSetShortcutSaving(true);
    actSetShortcutSaveError(null);
    srvApiCreateDemoCollection(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrWorkspaceId ?? '',
      fldStrParentId,
      fldStrShortcutName,
    ).then(
      () => {
        actSetShortcutName('');
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
    fldStrParentId,
    fldStrShortcutName,
    fldStrWorkspaceId,
    fncRunLoad,
  ]);

  const fncRunSaveSet = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldStrSetName);
    actSetSetNameError(
      fldBooNameOk ? undefined : fldObjSetShortcutCopy.fldStrNameRequired,
    );
    if (!fldBooNameOk) {
      return;
    }
    actSetSetSaving(true);
    actSetSetSaveError(null);
    srvApiCreateDemoSet(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrParentId,
      fldStrSetName,
    ).then(
      () => {
        actSetSetName('');
        actSetSetSaving(false);
        actSetSetModalVisible(false);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetSetSaving(false);
        actSetSetSaveError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjSetShortcutCopy,
    fldStrParentId,
    fldStrSetName,
    fncRunLoad,
  ]);

  return (
    <SafeAreaView style={scrCollectionBrowserStyles.fldObjScreen}>
      <View style={scrCollectionBrowserStyles.fldObjHeader}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrBack}
          actHandOnPress={() => {
            fldObjNavigation.goBack();
          }}
        />
        <VwText fldStrVariant="header">{fldStrTitle}</VwText>
        {fldBooIsLibraryRoot ? (
          <VwButton
            fldStrLabel={fldObjCopy.fldStrLibrarySettings}
            actHandOnPress={() => {
              fldObjNavigation.navigate('LibrarySettings', {
                fldStrLibraryId,
                fldStrLibraryName,
              });
            }}
          />
        ) : (
          <VwButton
            fldStrLabel={fldObjCopy.fldStrCollectionSettings}
            actHandOnPress={() => {
              fldObjNavigation.navigate('CollectionSettings', {
                fldStrCollectionId: fldStrParentId,
                fldStrCollectionName: fldStrTitle,
              });
            }}
          />
        )}
      </View>
      <VwText fldStrVariant="header">
        {fldObjCopy.fldStrCollectionsTitle}
      </VwText>
      {fldStrError !== null ? (
        <View style={scrCollectionBrowserStyles.fldObjGap}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrErrorTitle}
            fldStrMessage={fldStrError}
          />
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      ) : fldArrCollections === null ? (
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      ) : fldArrCollections.length === 0 ? (
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
      ) : (
        <FlatList
          data={fldArrCollections}
          keyExtractor={fldObjItem => fldObjItem.fldStrId}
          renderItem={({ item: fldObjItem }) => (
            <Pressable
              style={scrCollectionBrowserStyles.fldObjRow}
              accessibilityRole="button"
              onPress={() => {
                fldObjNavigation.push('CollectionBrowser', {
                  fldStrLibraryId,
                  fldStrLibraryName,
                  fldStrParentId: fldObjItem.fldStrId,
                  fldStrTitle: fldObjItem.fldStrName,
                });
              }}
            >
              <VwText fldStrVariant="body">{fldObjItem.fldStrName}</VwText>
            </Pressable>
          )}
        />
      )}
      {fldStrError === null &&
        fldArrCollections !== null &&
        !fldBooIsLibraryRoot && (
          <View style={scrCollectionBrowserStyles.fldObjSets}>
            <VwText fldStrVariant="header">{fldObjCopy.fldStrSetsTitle}</VwText>
            {fldArrSets.length === 0 ? (
              <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoSetsTitle} />
            ) : (
              fldArrSets.map(fldObjSet => {
                const fldArrMembers = fldArrSetProducts.filter(
                  fldObjProduct =>
                    fldObjProduct.fldStrSetId === fldObjSet.fldStrId,
                );
                return (
                  <View
                    key={fldObjSet.fldStrId}
                    style={scrCollectionBrowserStyles.fldObjSetRow}
                  >
                    <VwText fldStrVariant="body">{fldObjSet.fldStrName}</VwText>
                    <VwText fldStrVariant="caption">
                      {`${fldObjCopy.fldStrMembersLabel}: ${fldArrMembers.length}`}
                    </VwText>
                    {fldArrMembers.map(fldObjProduct => (
                      <View
                        key={fldObjProduct.fldStrId}
                        style={scrCollectionBrowserStyles.fldObjSetProduct}
                      >
                        <VwText fldStrVariant="body">
                          {fldObjProduct.fldStrName}
                        </VwText>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
            <View style={scrCollectionBrowserStyles.fldObjGap}>
              <VwButton
                fldStrLabel={fldObjCopy.fldStrNewSet}
                actHandOnPress={() => {
                  actSetSetName('');
                  actSetSetNameError(undefined);
                  actSetSetSaveError(null);
                  actSetSetModalVisible(true);
                }}
              />
            </View>
          </View>
        )}
      {fldStrError === null && fldArrCollections !== null && (
        <View style={scrCollectionBrowserStyles.fldObjShortcut}>
          <VwText fldStrVariant="header">
            {fldObjShortcutCopy.fldStrTitle}
          </VwText>
          <View style={scrCollectionBrowserStyles.fldObjGap}>
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
          {fldStrShortcutSaveError !== null && (
            <View style={scrCollectionBrowserStyles.fldObjGap}>
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
      )}
      <VwSetNameModal
        fldBooVisible={fldBooSetModalVisible}
        fldStrTitle={fldObjCopy.fldStrNewSet}
        fldStrValue={fldStrSetName}
        actHandOnChange={fldStrText => {
          actSetSetName(fldStrText);
          actSetSetNameError(undefined);
        }}
        fldStrPlaceholder={fldObjSetShortcutCopy.fldStrNamePlaceholder}
        fldStrError={fldStrSetNameError}
        fldStrSaveLabel={fldObjSetShortcutCopy.fldStrSave}
        fldStrCancelLabel={fldObjSetShortcutCopy.fldStrCancel}
        fldBooSaving={fldBooSetSaving}
        fldStrSaveErrorTitle={fldObjSetShortcutCopy.fldStrSaveErrorTitle}
        fldStrSaveError={fldStrSetSaveError}
        actHandOnSave={fncRunSaveSet}
        actHandOnCancel={() => {
          actSetSetModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const scrCollectionBrowserStyles = StyleSheet.create({
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
  fldObjShortcut: {
    marginTop: fldNumSpacingLg,
  },
  fldObjSets: {
    marginTop: fldNumSpacingLg,
  },
  fldObjSetRow: {
    marginTop: fldNumSpacingMd,
  },
  fldObjSetProduct: {
    marginLeft: fldNumSpacingMd,
  },
});
