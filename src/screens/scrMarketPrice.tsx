/**
 * Logosphere BITS — market price screen (estimates + observations).
 *
 * Shows one saved product's price picture from real saved rows:
 * the latest estimate (replacement plus the used-market band,
 * median, and recommendation in its stored currency, with the
 * estimate/evidence basis), then the grounded observations,
 * newest first. Empty tables render honest empty notes, never
 * zeroes. The research button appends a fresh model-knowledge
 * estimate (estimate basis, no web access) and reloads; no
 * currency chips are offered without conversion.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrMarketPrice); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwSaleModal as VwSaleModal } from '../components/vwSaleModal';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import { useDemoSession } from '../contexts/ctxDemoSession';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiResearchProductPrices } from '../services/srvAnalysis';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiExportAndShare } from '../services/srvDemoExport';
import { srvApiGetDemoProductDetails } from '../services/srvDemoProductDetails';
import { srvApiApplySale } from '../services/srvDemoSales';
import type { fldObjPricing, fldObjProductDetails } from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import {
  utlArrPriceStats,
  utlNumFormatMinorPrice,
  utlNumParseMajorPrice,
  type fldObjPriceStat,
} from '../utils/utlPrice';

type scrMarketPriceProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrProductId: string;
  actHandOnClose: () => void;
};

export function scrMarketPrice({
  fldObjStrings,
  fldStrProductId,
  actHandOnClose,
}: scrMarketPriceProps): React.JSX.Element {
  const fldObjCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjClient = srvApiGetDemoClient();
  const [fldObjDetails, actSetDetails] =
    React.useState<fldObjProductDetails | null>(null);
  const [fldBooLoading, actSetLoading] = React.useState(true);
  const [fldStrLoadError, actSetLoadError] = React.useState<string | null>(
    null,
  );
  const [fldBooResearching, actSetResearching] = React.useState(false);
  const [fldStrResearchError, actSetResearchError] = React.useState<
    string | null
  >(null);
  const [fldBooSaleOpen, actSetSaleOpen] = React.useState(false);
  const [fldStrTagValue, actSetTagValue] = React.useState('');
  const [fldStrTagError, actSetTagError] = React.useState<string | null>(null);
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
    actSetLoading(true);
    actSetLoadError(null);
    srvApiGetDemoProductDetails(fldObjClient, fldStrProductId).then(
      fldObjDone => {
        actSetDetails(fldObjDone);
        actSetLoading(false);
      },
      (fldObjError: unknown) => {
        actSetLoading(false);
        actSetLoadError((fldObjError as Error).message);
      },
    );
  }, [fldObjClient, fldStrProductId]);

  React.useEffect(() => {
    fncRunLoad();
  }, [fncRunLoad]);

  const fncRunResearch = React.useCallback(() => {
    if (fldBooResearching) {
      return;
    }
    actSetResearching(true);
    actSetResearchError(null);
    srvApiResearchProductPrices(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrProductId,
    ).then(
      () => {
        actSetResearching(false);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetResearching(false);
        actSetResearchError((fldObjError as Error).message);
      },
    );
  }, [
    fldBooResearching,
    fldObjClient,
    fldObjSession,
    fldStrProductId,
    fncRunLoad,
  ]);

  const fldObjSaleCopy = fldObjStrings.fldObjSale;
  const fldObjExportCopy = fldObjStrings.fldObjExport;
  const fldObjListing = fldObjDetails?.fldObjProduct.fldObjSaleStatus ?? null;
  const fldObjLoadedPricing =
    fldObjDetails?.fldObjProduct.fldObjPricing ?? null;
  const fldNumRecommended =
    fldObjLoadedPricing?.fldStrCurrency === 'USD'
      ? fldObjLoadedPricing.fldNumMarketRecommended ?? null
      : null;

  const fncRunOpenSale = React.useCallback(() => {
    const fldNumPrefill =
      fldNumRecommended !== null && fldNumRecommended > 0
        ? fldNumRecommended
        : fldObjListing?.fldNumTagPrice ?? null;
    actSetTagValue(
      fldNumPrefill === null ? '' : (fldNumPrefill / 100).toFixed(2),
    );
    actSetTagError(null);
    actSetSaleError(null);
    actSetSaleDone(null);
    actSetSaleOpen(true);
  }, [fldNumRecommended, fldObjListing]);

  const fncRunApplySale = React.useCallback(
    (fldBooActive: boolean) => {
      if (fldBooSaleSaving) {
        return;
      }
      let fldNumTag: number | null = null;
      if (fldBooActive) {
        fldNumTag = utlNumParseMajorPrice(fldStrTagValue);
        if (fldNumTag === null) {
          actSetTagError(fldObjSaleCopy.fldStrTagInvalid);
          return;
        }
      }
      actSetTagError(null);
      actSetSaleSaving(true);
      actSetSaleError(null);
      srvApiApplySale(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        'product',
        fldStrProductId,
        {
          fldNumTagMinor: fldNumTag,
          fldBooActive,
          fldNumExpectedTagMinor: fldObjListing?.fldNumTagPrice ?? null,
          fldBooExpectedActive: fldObjListing?.fldBooIsActive ?? undefined,
          fldBooCheckExpected: true,
        },
      ).then(
        fldObjDone => {
          actSetSaleSaving(false);
          actSetSaleOpen(false);
          const fldStrTag =
            fldObjDone.fldNumTagMinor === null
              ? null
              : utlNumFormatMinorPrice(fldObjDone.fldNumTagMinor, 'USD');
          actSetSaleDone(
            fldBooActive && fldStrTag !== null
              ? `${fldObjSaleCopy.fldStrListedAt} ${fldStrTag}`
              : fldObjSaleCopy.fldStrDeactivatedKept,
          );
          fncRunLoad();
        },
        (fldObjError: unknown) => {
          actSetSaleSaving(false);
          const fldStrMessage = (fldObjError as Error).message;
          actSetSaleError(
            fldStrMessage.includes('sale changed')
              ? fldObjSaleCopy.fldStrChangedError
              : fldStrMessage,
          );
        },
      );
    },
    [
      fldBooSaleSaving,
      fldObjClient,
      fldObjListing,
      fldObjSaleCopy,
      fldObjSession,
      fldStrProductId,
      fldStrTagValue,
      fncRunLoad,
    ],
  );

  const fncRunExport = React.useCallback(() => {
    if (fldBooExporting) {
      return;
    }
    actSetExporting(true);
    actSetExportError(null);
    actSetExportDone(null);
    srvApiExportAndShare(fldObjClient, 'product', fldStrProductId).then(
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
  }, [fldBooExporting, fldObjClient, fldObjExportCopy, fldStrProductId]);

  if (fldBooLoading) {
    return (
      <SafeAreaView style={scrMarketPriceStyles.fldObjContainer}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrTitle} />
        <View style={scrMarketPriceStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrLoadError !== null || fldObjDetails === null) {
    return (
      <SafeAreaView style={scrMarketPriceStyles.fldObjContainer}>
        <VwTopBar
          fldStrTitle={fldObjCopy.fldStrTitle}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={actHandOnClose}
        />
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrLoadError}
          fldStrMessage={fldStrLoadError ?? undefined}
        />
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
        <View style={scrMarketPriceStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  const fldObjProduct = fldObjDetails.fldObjProduct;
  const fldObjPricing: fldObjPricing | null = fldObjProduct.fldObjPricing;
  const fldStrCurrentTag =
    fldObjListing?.fldNumTagPrice === null ||
    fldObjListing?.fldNumTagPrice === undefined
      ? null
      : utlNumFormatMinorPrice(fldObjListing.fldNumTagPrice, 'USD');
  const fldArrStats: fldObjPriceStat[] = utlArrPriceStats(
    fldObjPricing,
    fldObjCopy,
  );
  const fldStrBasis =
    fldObjPricing?.fldStrPriceBasis === null ||
    fldObjPricing?.fldStrPriceBasis === undefined
      ? null
      : fldObjPricing.fldStrPriceBasis === 'ai-estimate'
      ? fldObjCopy.fldStrBasisAiEstimate
      : fldObjPricing.fldStrPriceBasis === 'evidence' ||
        fldObjPricing.fldStrPriceBasis === 'sourced'
      ? fldObjCopy.fldStrBasisEvidence
      : fldObjCopy.fldStrBasisEstimate;

  return (
    <SafeAreaView style={scrMarketPriceStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={fldObjCopy.fldStrTitle}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={actHandOnClose}
      />
      <ScrollView style={scrMarketPriceStyles.fldObjScroll}>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="body">{fldObjProduct.fldStrName}</VwText>
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwButton
            fldStrLabel={
              fldBooResearching
                ? fldObjCopy.fldStrResearching
                : fldObjCopy.fldStrResearch
            }
            fldBooDisabled={fldBooResearching}
            actHandOnPress={fncRunResearch}
          />
          {fldStrResearchError !== null && (
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrResearchError}
              fldStrMessage={fldStrResearchError}
            />
          )}
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="header">
            {fldObjCopy.fldStrEstimatesTitle}
          </VwText>
          {fldObjPricing === null || fldArrStats.length === 0 ? (
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoEstimates} />
          ) : (
            fldArrStats.map(fldObjStat => (
              <View key={fldObjStat.fldStrKey}>
                <VwText fldStrVariant="caption">
                  {fldObjStat.fldStrLabel}
                </VwText>
                <VwText fldStrVariant="body">{fldObjStat.fldStrValue}</VwText>
              </View>
            ))
          )}
          {fldStrBasis !== null && (
            <VwText fldStrVariant="caption">
              {`${fldObjCopy.fldStrBasis}: ${fldStrBasis}`}
            </VwText>
          )}
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="header">
            {`${fldObjCopy.fldStrObservationsTitle} (${fldObjDetails.fldArrObservations.length})`}
          </VwText>
          {fldObjDetails.fldArrObservations.length === 0 ? (
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoObservations} />
          ) : (
            fldObjDetails.fldArrObservations.map(fldObjObservation => (
              <View key={fldObjObservation.fldStrId}>
                <VwText fldStrVariant="body">
                  {utlNumFormatMinorPrice(
                    fldObjObservation.fldNumAmount,
                    fldObjObservation.fldStrCurrency,
                  )}
                </VwText>
                {fldObjObservation.fldStrUrl !== null && (
                  <VwText fldStrVariant="caption">
                    {fldObjObservation.fldStrUrl}
                  </VwText>
                )}
              </View>
            ))
          )}
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjSaleCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="body" fldNumLines={2} fldStrEllipsize="tail">
            {fldObjListing?.fldBooIsActive === true
              ? `${fldObjSaleCopy.fldStrListedAt} ${fldStrCurrentTag ?? ''}`
              : fldObjSaleCopy.fldStrNotListed}
          </VwText>
          {fldStrSaleDone !== null && (
            <VwText
              fldStrVariant="caption"
              fldNumLines={2}
              fldStrEllipsize="tail"
            >
              {fldStrSaleDone}
            </VwText>
          )}
          <VwButton
            fldStrLabel={fldObjSaleCopy.fldStrSaleButton}
            actHandOnPress={fncRunOpenSale}
          />
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjExportCopy.fldStrTitle}</VwText>
          {fldStrExportDone !== null && (
            <VwText
              fldStrVariant="caption"
              fldNumLines={2}
              fldStrEllipsize="tail"
            >
              {fldStrExportDone}
            </VwText>
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
        <View style={scrMarketPriceStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
      <VwSaleModal
        fldBooVisible={fldBooSaleOpen}
        fldStrTitle={fldObjSaleCopy.fldStrTitle}
        fldArrScopeLines={
          fldStrCurrentTag === null
            ? []
            : [`${fldObjSaleCopy.fldStrTagLabel}: ${fldStrCurrentTag}`]
        }
        fldBooTagInput={true}
        fldStrTagLabel={fldObjSaleCopy.fldStrTagLabel}
        fldStrTagValue={fldStrTagValue}
        actHandOnTagChange={actSetTagValue}
        fldStrTagPlaceholder={fldObjSaleCopy.fldStrTagPlaceholder}
        fldStrTagError={fldStrTagError ?? undefined}
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
          actSetTagError(null);
          actSetSaleError(null);
        }}
      />
    </SafeAreaView>
  );
}

const scrMarketPriceStyles = StyleSheet.create({
  fldObjContainer: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
    paddingHorizontal: fldNumSpacingMd,
  },
  fldObjFoot: {
    marginTop: fldNumSpacingLg,
    marginBottom: fldNumSpacingSm,
  },
});
