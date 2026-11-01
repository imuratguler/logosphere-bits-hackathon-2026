/**
 * Logosphere BITS — market price screen (estimates + observations).
 *
 * Shows one saved product's price picture from real saved rows:
 * the latest estimate (replacement plus the used-market band,
 * median, and recommendation in its stored currency, with the
 * estimate/evidence basis), then the grounded observations,
 * newest first. Empty tables render honest empty notes, never
 * zeroes. The research button stays visibly disabled with its
 * note: AI price research arrives with the analysis service,
 * and no currency chips are offered without conversion.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrMarketPrice); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiGetDemoProductDetails } from '../services/srvDemoProductDetails';
import type { fldObjPricing, fldObjProductDetails } from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';

type scrMarketPriceProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrProductId: string;
  actHandOnClose: () => void;
};

type fldObjPriceStat = {
  fldStrKey: string;
  fldStrLabel: string;
  fldStrValue: string;
};

type fldObjPriceStatLabels = {
  fldStrReplacementNew: string;
  fldStrMarketLow: string;
  fldStrMarketMedian: string;
  fldStrMarketHigh: string;
  fldStrRecommended: string;
};

function fncConvPriceStats(
  fldObjPricing: fldObjPricing | null,
  fldObjLabels: fldObjPriceStatLabels,
): fldObjPriceStat[] {
  if (fldObjPricing === null) {
    return [];
  }
  const fldStrCurrency = fldObjPricing.fldStrCurrency;
  const fldArrCandidates: {
    fldStrKey: string;
    fldStrLabel: string;
    fldNumAmount: number | null;
  }[] = [
    {
      fldStrKey: 'replacementNew',
      fldStrLabel: fldObjLabels.fldStrReplacementNew,
      fldNumAmount: fldObjPricing.fldNumReplacementNew,
    },
    {
      fldStrKey: 'marketLow',
      fldStrLabel: fldObjLabels.fldStrMarketLow,
      fldNumAmount: fldObjPricing.fldNumMarketMin,
    },
    {
      fldStrKey: 'marketMedian',
      fldStrLabel: fldObjLabels.fldStrMarketMedian,
      fldNumAmount: fldObjPricing.fldNumMarketMedian,
    },
    {
      fldStrKey: 'marketHigh',
      fldStrLabel: fldObjLabels.fldStrMarketHigh,
      fldNumAmount: fldObjPricing.fldNumMarketMax,
    },
    {
      fldStrKey: 'recommended',
      fldStrLabel: fldObjLabels.fldStrRecommended,
      fldNumAmount: fldObjPricing.fldNumMarketRecommended,
    },
  ];
  return fldArrCandidates
    .filter(
      (
        fldObjStat,
      ): fldObjStat is {
        fldStrKey: string;
        fldStrLabel: string;
        fldNumAmount: number;
      } => fldObjStat.fldNumAmount !== null,
    )
    .map(fldObjStat => ({
      fldStrKey: fldObjStat.fldStrKey,
      fldStrLabel: fldObjStat.fldStrLabel,
      fldStrValue:
        utlNumFormatMinorPrice(fldObjStat.fldNumAmount, fldStrCurrency) ?? '',
    }));
}

export function scrMarketPrice({
  fldObjStrings,
  fldStrProductId,
  actHandOnClose,
}: scrMarketPriceProps): React.JSX.Element {
  const fldObjCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjClient = srvApiGetDemoClient();
  const [fldObjDetails, actSetDetails] =
    React.useState<fldObjProductDetails | null>(null);
  const [fldBooLoading, actSetLoading] = React.useState(true);
  const [fldStrLoadError, actSetLoadError] = React.useState<string | null>(
    null,
  );

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
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
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
  const fldArrStats: fldObjPriceStat[] = fncConvPriceStats(
    fldObjPricing,
    fldObjCopy,
  );
  const fldStrBasis =
    fldObjPricing?.fldStrPriceBasis === null ||
    fldObjPricing?.fldStrPriceBasis === undefined
      ? null
      : fldObjPricing.fldStrPriceBasis === 'evidence'
      ? fldObjCopy.fldStrBasisEvidence
      : fldObjCopy.fldStrBasisEstimate;

  return (
    <SafeAreaView style={scrMarketPriceStyles.fldObjContainer}>
      <ScrollView style={scrMarketPriceStyles.fldObjScroll}>
        <VwBrandHeader
          fldStrName={fldObjBrandCopy.fldStrName}
          fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
        />
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="body">{fldObjProduct.fldStrName}</VwText>
        </View>
        <View style={scrMarketPriceStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrResearch}
            fldBooDisabled
            actHandOnPress={() => {}}
          />
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrResearchNote}
          </VwText>
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
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
          />
        </View>
        <View style={scrMarketPriceStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
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
