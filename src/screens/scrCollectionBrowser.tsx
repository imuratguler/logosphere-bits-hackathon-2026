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
 * action opens the library editor; deeper levels stay collections
 * only. All reads delegate to the ready services; nothing is copied
 * here. Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCollectionBrowser); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjDemoCollection } from '../services/srvDemoCollections';
import { srvApiGetDemoCollections } from '../services/srvDemoCollections';
import { srvApiGetDemoWorkspace } from '../services/srvDemoWorkspace';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

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
  const [fldArrCollections, actSetCollections] = React.useState<
    fldObjDemoCollection[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoWorkspace(fldObjClient)
      .then(fldObjWorkspace =>
        srvApiGetDemoCollections(
          fldObjClient,
          fldObjWorkspace.fldStrId,
          fldStrParentId,
        ),
      )
      .then(
        fldArrRows => {
          if (!fldBooCancelled) {
            actSetCollections(fldArrRows);
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
  }, [fldObjClient, fldStrParentId]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjCollectionBrowser;
  const fldBooIsLibraryRoot = fldStrParentId === fldStrLibraryId;

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
        {fldBooIsLibraryRoot && (
          <VwButton
            fldStrLabel={fldObjCopy.fldStrLibrarySettings}
            actHandOnPress={() => {
              fldObjNavigation.navigate('LibrarySettings', {
                fldStrLibraryId,
                fldStrLibraryName,
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
});
