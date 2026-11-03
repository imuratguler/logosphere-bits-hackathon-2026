/**
 * Logosphere BITS — set detail (publications inside one set).
 *
 * Top strip carries the set name with a back arrow to the parent
 * collection; below it every member publication renders as a row
 * with its real photo count. Tapping a row opens the read-only
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
import { vwSaleModal as VwSaleModal } from '../components/vwSaleModal';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import { useDemoSession } from '../contexts/ctxDemoSession';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiExportAndShare } from '../services/srvDemoExport';
import type { fldObjSalePreview } from '../services/srvDemoSales';
import { srvApiApplySale, srvApiPreviewSale } from '../services/srvDemoSales';
import type { fldObjDemoSetProduct } from '../services/srvDemoSets';
import {
  srvApiGetDemoProductPhotoCounts,
  srvApiGetDemoSetProducts,
} from '../services/srvDemoSets';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';
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
  const [fldObjPhotoCounts, actSetPhotoCounts] = React.useState<Record<
    string,
    number
  > | null>(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldBooSaleOpen, actSetSaleOpen] = React.useState(false);
  const [fldBooSaleLoading, actSetSaleLoading] = React.useState(false);
  const [fldObjSalePreview, actSetSalePreview] =
    React.useState<fldObjSalePreview | null>(null);
  const [fldStrSaleLoadError, actSetSaleLoadError] = React.useState<
    string | null
  >(null);
  const [fldBooSaleSaving, actSetSaleSaving] = React.useState(false);
  const [fldStrSaleError, actSetSaleError] = React.useState<string | null>(
    null,
  );
  const [fldStrSaleDone, actSetSaleDone] = React.useState<string | null>(null);
  const [fldBooExporting, actSetExporting] = React.useState(false);
  const [fldStrExportError, actSetExportError] = React.useState<string | null>(
    null,
  );
  const [fldStrExportDone, actSetExportDone] = React.useState<string | null>(
    null,
  );
  const { fldObjSession } = useDemoSession();

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
        srvApiGetDemoProductPhotoCounts(
          fldObjClient,
          fldArrFiltered.map(fldObjRow => fldObjRow.fldStrId),
        ).then(
          fldObjCounts => {
            if (!fldBooCancelled) {
              actSetPhotoCounts(fldObjCounts);
            }
          },
          () => {
            if (!fldBooCancelled) {
              actSetPhotoCounts({});
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
  const fldObjSaleCopy = fldObjStrings.fldObjSale;
  const fldObjExportCopy = fldObjStrings.fldObjExport;

  const fncRunExport = React.useCallback(() => {
    if (fldBooExporting) {
      return;
    }
    actSetExporting(true);
    actSetExportError(null);
    actSetExportDone(null);
    srvApiExportAndShare(fldObjClient, 'set', fldStrSetId).then(
      fldStrOutcome => {
        actSetExporting(false);
        actSetExportDone(
          fldStrOutcome === 'shared'
            ? fldObjExportCopy.fldStrDone
            : fldObjExportCopy.fldStrEmpty,
        );
      },
      (fldObjError: unknown) => {
        actSetExporting(false);
        actSetExportError((fldObjError as Error).message);
      },
    );
  }, [fldBooExporting, fldObjClient, fldObjExportCopy, fldStrSetId]);

  const fncRunOpenSale = React.useCallback(() => {
    if (fldBooSaleLoading) {
      return;
    }
    actSetSaleLoading(true);
    actSetSaleLoadError(null);
    actSetSaleDone(null);
    srvApiPreviewSale(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      'set',
      fldStrSetId,
    ).then(
      fldObjPreview => {
        actSetSaleLoading(false);
        actSetSalePreview(fldObjPreview);
        actSetSaleError(null);
        actSetSaleOpen(true);
      },
      (fldObjError: unknown) => {
        actSetSaleLoading(false);
        actSetSaleLoadError((fldObjError as Error).message);
      },
    );
  }, [fldBooSaleLoading, fldObjClient, fldObjSession, fldStrSetId]);

  const fncRunApplySale = React.useCallback(
    (fldBooActive: boolean) => {
      if (fldBooSaleSaving) {
        return;
      }
      actSetSaleSaving(true);
      actSetSaleError(null);
      srvApiApplySale(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        'set',
        fldStrSetId,
        { fldNumTagMinor: null, fldBooActive },
      ).then(
        fldObjDone => {
          actSetSaleSaving(false);
          actSetSaleOpen(false);
          actSetSaleDone(
            `${fldObjSaleCopy.fldStrDoneApplied}: ${fldObjDone.fldNumApplied}, ` +
              `${fldObjDone.fldNumSkipped} ${fldObjSaleCopy.fldStrDoneSkipped}`,
          );
          fncRunLoad();
        },
        (fldObjError: unknown) => {
          actSetSaleSaving(false);
          actSetSaleError((fldObjError as Error).message);
        },
      );
    },
    [
      fldBooSaleSaving,
      fldObjClient,
      fldObjSaleCopy,
      fldObjSession,
      fldStrSetId,
      fncRunLoad,
    ],
  );

  const fldArrScopeLines: string[] =
    fldObjSalePreview === null
      ? []
      : [
          fldObjSaleCopy.fldStrScopeIntro,
          `${fldObjSaleCopy.fldStrScopeTitle}: ${fldStrSetName}`,
          `${fldObjSalePreview.fldNumSets} ${fldObjSaleCopy.fldStrUnitSets} · ` +
            `${fldObjSalePreview.fldNumProducts} ${fldObjSaleCopy.fldStrUnitProducts}`,
          `${fldObjSaleCopy.fldStrScopeTotal}: ${utlNumFormatMinorPrice(
            fldObjSalePreview.fldNumTotalMinor,
            fldObjSalePreview.fldStrCurrency,
          )}`,
          ...(fldObjSalePreview.fldNumMissing + fldObjSalePreview.fldNumNonUsd >
          0
            ? [
                `${
                  fldObjSalePreview.fldNumMissing +
                  fldObjSalePreview.fldNumNonUsd
                } ${fldObjSaleCopy.fldStrMissingNote}`,
              ]
            : []),
        ];

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
              fldStrSubtitle={
                fldObjPhotoCounts === null
                  ? null
                  : `${fldObjCopy.fldStrPhotosLabel}: ${
                      fldObjPhotoCounts[fldObjProduct.fldStrId] ?? 0
                    }`
              }
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
        <View style={scrSetDetailStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjSaleCopy.fldStrTitle}</VwText>
          {fldStrSaleDone !== null && (
            <VwText fldStrVariant="caption">{fldStrSaleDone}</VwText>
          )}
          {fldStrSaleLoadError !== null && (
            <VwEmptyState
              fldStrTitle={fldObjSaleCopy.fldStrTitle}
              fldStrMessage={fldStrSaleLoadError}
            />
          )}
          <VwButton
            fldStrLabel={fldObjSaleCopy.fldStrSaleButton}
            fldStrVariant="secondary"
            fldBooLoading={fldBooSaleLoading}
            actHandOnPress={fncRunOpenSale}
          />
        </View>
        <View style={scrSetDetailStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjExportCopy.fldStrTitle}</VwText>
          {fldStrExportDone !== null && (
            <VwText fldStrVariant="caption">{fldStrExportDone}</VwText>
          )}
          {fldStrExportError !== null && (
            <VwEmptyState
              fldStrTitle={fldObjExportCopy.fldStrFailTitle}
              fldStrMessage={fldStrExportError}
            />
          )}
          <VwButton
            fldStrLabel={
              fldBooExporting
                ? fldObjExportCopy.fldStrWorking
                : fldObjExportCopy.fldStrButton
            }
            fldStrVariant="secondary"
            fldBooLoading={fldBooExporting}
            actHandOnPress={fncRunExport}
          />
        </View>
      </ScrollView>
      <VwSaleModal
        fldBooVisible={fldBooSaleOpen}
        fldStrTitle={fldObjSaleCopy.fldStrTitle}
        fldArrScopeLines={fldArrScopeLines}
        fldBooTagInput={false}
        fldStrTagLabel={fldObjSaleCopy.fldStrTagLabel}
        fldStrTagValue=""
        actHandOnTagChange={() => {}}
        fldStrTagPlaceholder={fldObjSaleCopy.fldStrTagPlaceholder}
        fldStrActivateLabel={fldObjSaleCopy.fldStrActivate}
        fldStrDeactivateLabel={fldObjSaleCopy.fldStrDeactivate}
        fldStrCancelLabel={fldObjSaleCopy.fldStrCancel}
        fldBooSaving={fldBooSaleSaving}
        fldStrSaveErrorTitle={fldObjSaleCopy.fldStrTitle}
        fldStrSaveError={fldStrSaleError}
        actHandOnActivate={() => {
          fncRunApplySale(true);
        }}
        actHandOnDeactivate={() => {
          fncRunApplySale(false);
        }}
        actHandOnCancel={() => {
          actSetSaleOpen(false);
          actSetSaleError(null);
        }}
      />
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
