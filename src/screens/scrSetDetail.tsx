/**
 * Logosphere BITS — set detail (publications inside one set).
 *
 * Top strip carries the set name with a back arrow to the parent
 * collection; below it every member publication renders as a
 * single-line row with its cover thumbnail when one exists.
 * Tapping a row opens the read-only
 * result view for that product. No brand strip, no settings icon,
 * no create actions: sets gain members through the collection
 * capture flows. All reads delegate to the ready services;
 * nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrSetDetail); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwListRow as VwListRow } from '../components/vwListRow';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjDemoSetProduct } from '../services/srvDemoSets';
import {
  srvApiGetDemoProductCovers,
  srvApiGetDemoSetProducts,
} from '../services/srvDemoSets';
import { colBackground, fldNumSpacingMd } from '../utils/utlTheme';

type scrSetDetailProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrCollectionId: string;
  fldStrSetId: string;
  fldStrSetName: string;
};

export function scrSetDetail({
  fldObjStrings,
  fldStrCollectionId,
  fldStrSetId,
  fldStrSetName,
}: scrSetDetailProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const [fldArrMembers, actSetMembers] = React.useState<
    fldObjDemoSetProduct[] | null
  >(null);
  const [fldObjCovers, actSetCovers] = React.useState<Record<
    string,
    string
  > | null>(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoSetProducts(fldObjClient, fldStrCollectionId).then(
      fldArrRows => {
        if (fldBooCancelled) {
          return;
        }
        const fldArrFiltered = fldArrRows.filter(
          fldObjRow => fldObjRow.fldStrSetId === fldStrSetId,
        );
        actSetMembers(fldArrFiltered);
        srvApiGetDemoProductCovers(
          fldObjClient,
          fldArrFiltered.map(fldObjRow => fldObjRow.fldStrId),
        ).then(
          fldObjLoadedCovers => {
            if (!fldBooCancelled) {
              actSetCovers(fldObjLoadedCovers);
            }
          },
          () => {
            if (!fldBooCancelled) {
              actSetCovers({});
            }
          },
        );
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
  }, [fldObjClient, fldStrCollectionId, fldStrSetId]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjSetDetail;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrSetDetailStyles.fldObjScreen}>
        <VwTopBar
          fldStrTitle={fldStrSetName}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={() => {
            fldObjNavigation.goBack();
          }}
        />
        <View style={scrSetDetailStyles.fldObjBody}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrErrorTitle}
            fldStrMessage={fldStrError}
          />
          <View style={scrSetDetailStyles.fldObjGap}>
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

  if (fldArrMembers === null) {
    return (
      <SafeAreaView style={scrSetDetailStyles.fldObjScreen}>
        <VwTopBar
          fldStrTitle={fldStrSetName}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={() => {
            fldObjNavigation.goBack();
          }}
        />
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrSetDetailStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrSetDetailStyles.fldObjScreen}>
      <VwTopBar
        fldStrTitle={fldStrSetName}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={() => {
          fldObjNavigation.goBack();
        }}
      />
      <ScrollView
        style={scrSetDetailStyles.fldObjScroll}
        contentContainerStyle={scrSetDetailStyles.fldObjScrollContent}
      >
        {fldArrMembers.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrMembers.map(fldObjProduct => (
            <VwListRow
              key={fldObjProduct.fldStrId}
              fldStrTitle={fldObjProduct.fldStrName}
              fldStrIcon="📕"
              fldStrThumbnailUri={
                fldObjCovers === null
                  ? null
                  : fldObjCovers[fldObjProduct.fldStrId] ?? null
              }
              fldBooSlim
              fldBooTight
              fldBooChecked={null}
              fldBooChevron
              actHandOnPress={() => {
                fldObjNavigation.navigate('AnalysisResult', {
                  fldStrProductId: fldObjProduct.fldStrId,
                });
              }}
            />
          ))
        )}
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
    </SafeAreaView>
  );
}

const scrSetDetailStyles = StyleSheet.create({
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
  fldObjGap: {
    marginBottom: fldNumSpacingMd,
  },
});
