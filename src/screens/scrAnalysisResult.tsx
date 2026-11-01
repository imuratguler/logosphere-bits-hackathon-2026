/**
 * Logosphere BITS — analysis result screen (review + saved view).
 *
 * Two modes share the layout. Analysis mode reviews one
 * finished run: result chips for multi sets (hidden for the
 * single product), the analyzed local photos, the shared
 * bibliographic detail, confidence plus rationale, the
 * estimate rows, the honest pipeline sources, and the
 * working save bar — saving records the approval and offers
 * the first saved product. View mode renders one saved
 * product read-only without the save bar. Exactly one of the
 * analysis payload or the product id must arrive.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAnalysisResult); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwProductDetails as VwProductDetails } from '../components/vwProductDetails';
import { vwText as VwText } from '../components/vwText';
import { useDemoSession } from '../contexts/ctxDemoSession';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiSaveAnalysisRun } from '../services/srvAnalysis';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiGetDemoProductDetails } from '../services/srvDemoProductDetails';
import {
  fldStrDefaultCurrency,
  type fldObjAnalysisBiblio,
  type fldObjAnalysisItem,
  type fldObjAnalysisPayload,
  type fldObjBibliographicData,
  type fldObjProduct,
  type fldObjProductDetails,
  type fldObjSourceEvidence,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { utlArrPriceStats, utlNumFormatMinorPrice } from '../utils/utlPrice';

type scrAnalysisResultProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrProductId?: string;
  fldObjAnalysis?: fldObjAnalysisPayload;
  fldArrLocalPhotos?: { fldStrId: string; fldStrLocalPath: string }[];
  actHandOnClose: () => void;
};

function fncConvAnalysisProduct(
  fldObjItem: fldObjAnalysisItem,
  fldNumIndex: number,
  fldStrResultLabel: string,
): fldObjProduct {
  const fldObjBiblio: fldObjAnalysisBiblio = fldObjItem.fldObjBiblio;
  const fldBooHasDescription =
    fldObjBiblio.fldStrDescription !== null ||
    fldObjBiblio.fldStrDescriptionTr !== null ||
    fldObjBiblio.fldStrDescriptionEn !== null;
  const fldObjData: fldObjBibliographicData = {
    fldStrTitle: fldObjBiblio.fldStrTitle,
    fldStrSubtitle: fldObjBiblio.fldStrSubtitle,
    fldStrIsbn10: fldObjBiblio.fldStrIsbn10,
    fldStrIsbn13: fldObjBiblio.fldStrIsbn13,
    fldStrPublisher: fldObjBiblio.fldStrPublisher,
    fldStrPublicationLanguage: fldObjBiblio.fldStrPublicationLanguage,
    fldStrEdition: fldObjBiblio.fldStrEdition,
    fldStrPrinting: fldObjBiblio.fldStrPrinting,
    fldNumPublicationYear: fldObjBiblio.fldNumPublicationYear,
    fldArrContributors:
      fldObjBiblio.fldArrContributors.length === 0
        ? null
        : fldObjBiblio.fldArrContributors,
    fldNumOriginalPublicationYear: fldObjBiblio.fldNumOriginalPublicationYear,
    fldNumPageCount: fldObjBiblio.fldNumPageCount,
    fldStrPublicationType: fldObjBiblio.fldStrPublicationType,
    fldObjDescription: fldBooHasDescription
      ? {
          fldStrText: fldObjBiblio.fldStrDescription ?? '',
          fldStrOriginalLanguage: '',
          fldStrTextTr: fldObjBiblio.fldStrDescriptionTr,
          fldStrTextEn: fldObjBiblio.fldStrDescriptionEn,
        }
      : null,
    fldStrBinding: fldObjBiblio.fldStrBinding,
    fldStrDustJacket: fldObjBiblio.fldStrDustJacket,
    fldStrPaper: fldObjBiblio.fldStrPaper,
    fldStrDimensions: fldObjBiblio.fldStrDimensions,
    fldStrCondition: fldObjBiblio.fldStrCondition,
    fldStrSignature: fldObjBiblio.fldStrSignature,
    fldStrDedication: fldObjBiblio.fldStrDedication,
  };
  return {
    fldStrId: '',
    fldStrName:
      fldObjBiblio.fldStrTitle ?? `${fldStrResultLabel} ${fldNumIndex + 1}`,
    fldDatCreatedAt: '',
    fldDatUpdatedAt: '',
    fldStrCollectionId: '',
    fldStrSetId: null,
    fldObjBibliographicData: fldObjData,
    fldObjPricing: {
      fldNumReplacementNew: fldObjItem.fldObjPrice.fldNumReplacementNew,
      fldNumMarketMin: fldObjItem.fldObjPrice.fldNumMarketMin,
      fldNumMarketMax: fldObjItem.fldObjPrice.fldNumMarketMax,
      fldNumMarketRecommended: fldObjItem.fldObjPrice.fldNumMarketRecommended,
      fldNumMarketMedian: fldObjItem.fldObjPrice.fldNumMarketMedian,
      fldStrCurrency: fldObjItem.fldObjPrice.fldStrCurrency,
      fldNumSourcePrice: null,
      fldStrSourceCurrency: null,
      fldDatRateDate: null,
      fldStrPriceBasis: 'estimate',
    },
    fldObjSaleStatus: null,
  };
}

function fncConvAnalysisSources(
  fldObjAnalysis: fldObjAnalysisPayload,
): fldObjSourceEvidence[] {
  return fldObjAnalysis.fldArrSources.map(fldObjSource => ({
    fldStrName: fldObjSource.fldStrSource,
    fldStrUrl: null,
    fldDatAccessedAt: null,
    fldStrField: fldObjSource.fldStrDetail,
  }));
}

export function scrAnalysisResult({
  fldObjStrings,
  fldStrProductId,
  fldObjAnalysis,
  fldArrLocalPhotos,
  actHandOnClose,
}: scrAnalysisResultProps): React.JSX.Element {
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const fldObjPriceCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjDetailCopy = fldObjStrings.fldObjProductDetails;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const fldObjClient = srvApiGetDemoClient();
  const { fldObjSession } = useDemoSession();
  const [fldObjDetails, actSetDetails] =
    React.useState<fldObjProductDetails | null>(null);
  const [fldBooLoading, actSetLoading] = React.useState(
    fldObjAnalysis === undefined,
  );
  const [fldStrLoadError, actSetLoadError] = React.useState<string | null>(
    null,
  );
  const [fldNumSelected, actSetSelected] = React.useState(0);
  const [fldBooSaving, actSetSaving] = React.useState(false);
  const [fldStrSaveError, actSetSaveError] = React.useState<string | null>(
    null,
  );
  const [fldArrSavedIds, actSetSavedIds] = React.useState<string[]>([]);

  const fncRunLoad = React.useCallback(() => {
    if (fldStrProductId === undefined) {
      return;
    }
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

  const fncRunSave = React.useCallback(() => {
    if (fldObjAnalysis === undefined || fldBooSaving) {
      return;
    }
    actSetSaving(true);
    actSetSaveError(null);
    srvApiSaveAnalysisRun(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldObjAnalysis.fldStrRunId,
    ).then(
      fldArrIds => {
        actSetSaving(false);
        actSetSavedIds(fldArrIds);
      },
      (fldObjError: unknown) => {
        actSetSaving(false);
        actSetSaveError((fldObjError as Error).message);
      },
    );
  }, [fldObjAnalysis, fldBooSaving, fldObjClient, fldObjSession]);

  if (fldObjAnalysis === undefined && fldStrProductId === undefined) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrLoadError} />
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldObjAnalysis !== undefined) {
    const fldObjFirst = fldObjAnalysis.fldArrResults[0];
    if (fldObjFirst === undefined) {
      return (
        <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrLoadError} />
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrBack}
              actHandOnPress={actHandOnClose}
            />
          </View>
          <View style={scrAnalysisResultStyles.fldObjFoot}>
            <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
          </View>
        </SafeAreaView>
      );
    }
    const fldObjItem =
      fldObjAnalysis.fldArrResults[fldNumSelected] ?? fldObjFirst;
    const fldObjProduct = fncConvAnalysisProduct(
      fldObjItem,
      fldNumSelected,
      fldObjCopy.fldStrResultLabel,
    );
    const fldArrStripPhotos = (fldArrLocalPhotos ?? []).filter(fldObjPhoto =>
      fldObjItem.fldArrPhotoIds.includes(fldObjPhoto.fldStrId),
    );
    const fldArrStats = utlArrPriceStats(
      fldObjProduct.fldObjPricing,
      fldObjPriceCopy,
    );
    const fldStrConfidence =
      fldObjItem.fldObjBiblio.fldNumConfidence === null
        ? null
        : `${Math.round(fldObjItem.fldObjBiblio.fldNumConfidence * 100)}%`;
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <ScrollView style={scrAnalysisResultStyles.fldObjScroll}>
          <VwBrandHeader
            fldStrName={fldObjBrandCopy.fldStrName}
            fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
          />
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
            <VwText fldStrVariant="body">{fldObjProduct.fldStrName}</VwText>
          </View>
          {fldObjAnalysis.fldArrResults.length > 1 && (
            <ScrollView
              horizontal
              style={scrAnalysisResultStyles.fldObjGap}
              showsHorizontalScrollIndicator={false}
            >
              {fldObjAnalysis.fldArrResults.map((fldObjEntry, fldNumIndex) => (
                <View
                  key={`${fldObjEntry.fldArrPhotoIds.join('-')}-${fldNumIndex}`}
                  style={scrAnalysisResultStyles.fldObjChip}
                >
                  <VwButton
                    fldStrLabel={`${fldObjCopy.fldStrResultLabel} ${
                      fldNumIndex + 1
                    }`}
                    fldBooDisabled={fldNumIndex === fldNumSelected}
                    actHandOnPress={() => {
                      actSetSelected(fldNumIndex);
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          )}
          {fldArrStripPhotos.length === 0 ? (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoPhotos} />
            </View>
          ) : (
            <ScrollView
              horizontal
              style={scrAnalysisResultStyles.fldObjGap}
              showsHorizontalScrollIndicator={false}
            >
              {fldArrStripPhotos.map(fldObjPhoto => (
                <Image
                  key={fldObjPhoto.fldStrId}
                  source={{ uri: `file://${fldObjPhoto.fldStrLocalPath}` }}
                  style={scrAnalysisResultStyles.fldObjThumb}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwProductDetails
              fldObjProduct={fldObjProduct}
              fldArrSources={fncConvAnalysisSources(fldObjAnalysis)}
              fldObjStrings={fldObjDetailCopy}
            />
          </View>
          {fldStrConfidence !== null && (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwText fldStrVariant="caption">
                {fldObjCopy.fldStrConfidence}
              </VwText>
              <VwText fldStrVariant="body">{fldStrConfidence}</VwText>
            </View>
          )}
          {fldObjItem.fldObjBiblio.fldStrRationale !== null && (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwText fldStrVariant="caption">
                {fldObjCopy.fldStrRationale}
              </VwText>
              <VwText fldStrVariant="body">
                {fldObjItem.fldObjBiblio.fldStrRationale}
              </VwText>
            </View>
          )}
          {fldArrStats.length > 0 && (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              {fldArrStats.map(fldObjStat => (
                <View key={fldObjStat.fldStrKey}>
                  <VwText fldStrVariant="caption">
                    {fldObjStat.fldStrLabel}
                  </VwText>
                  <VwText fldStrVariant="body">{fldObjStat.fldStrValue}</VwText>
                </View>
              ))}
              <VwText fldStrVariant="caption">
                {`${fldObjPriceCopy.fldStrBasis}: ${fldObjPriceCopy.fldStrBasisEstimate}`}
              </VwText>
            </View>
          )}
          {fldArrSavedIds.length === 0 ? (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwButton
                fldStrLabel={
                  fldBooSaving
                    ? fldObjCopy.fldStrSaving
                    : fldObjCopy.fldStrSaveAll
                }
                fldBooDisabled={fldBooSaving}
                actHandOnPress={fncRunSave}
              />
            </View>
          ) : (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwText fldStrVariant="body">
                {`${fldArrSavedIds.length} ${fldObjCopy.fldStrSavedProducts}`}
              </VwText>
              <VwButton
                fldStrLabel={fldObjCopy.fldStrOpenSaved}
                actHandOnPress={() => {
                  const fldStrFirst = fldArrSavedIds[0];
                  if (fldStrFirst !== undefined) {
                    fldObjNavigation.replace('AnalysisResult', {
                      fldStrProductId: fldStrFirst,
                    });
                  }
                }}
              />
            </View>
          )}
          {fldStrSaveError !== null && (
            <View style={scrAnalysisResultStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldObjCopy.fldStrSaveError}
                fldStrMessage={fldStrSaveError}
              />
            </View>
          )}
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrBack}
              actHandOnPress={actHandOnClose}
            />
          </View>
          <View style={scrAnalysisResultStyles.fldObjFoot}>
            <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (fldBooLoading) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrTitle} />
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrLoadError !== null || fldObjDetails === null) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrLoadError}
          fldStrMessage={fldStrLoadError ?? undefined}
        />
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  const fldObjProduct = fldObjDetails.fldObjProduct;
  const fldObjSale = fldObjProduct.fldObjSaleStatus;
  // Tag prices carry no currency column; they render in the
  // estimate currency when one exists, else the pricing
  // default (USD). Currency rules stay an open SCOPE item.
  const fldStrTagPrice =
    fldObjSale?.fldNumTagPrice === null ||
    fldObjSale?.fldNumTagPrice === undefined
      ? null
      : utlNumFormatMinorPrice(
          fldObjSale.fldNumTagPrice,
          fldObjProduct.fldObjPricing?.fldStrCurrency ?? fldStrDefaultCurrency,
        );

  return (
    <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
      <ScrollView style={scrAnalysisResultStyles.fldObjScroll}>
        <VwBrandHeader
          fldStrName={fldObjBrandCopy.fldStrName}
          fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
        />
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="body">{fldObjProduct.fldStrName}</VwText>
        </View>
        {fldObjDetails.fldArrImages.length === 0 ? (
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoPhotos} />
          </View>
        ) : (
          <ScrollView
            horizontal
            style={scrAnalysisResultStyles.fldObjGap}
            showsHorizontalScrollIndicator={false}
          >
            {fldObjDetails.fldArrImages.map(fldObjImage => (
              <Image
                key={fldObjImage.fldStrId}
                source={{ uri: fldObjImage.fldStrUrl }}
                style={[
                  scrAnalysisResultStyles.fldObjThumb,
                  {
                    transform: [
                      { rotate: `${fldObjImage.fldNumRotationDegrees}deg` },
                    ],
                  },
                ]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwProductDetails
            fldObjProduct={fldObjProduct}
            fldArrSources={[]}
            fldObjStrings={fldObjDetailCopy}
          />
        </View>
        {fldObjSale !== null && (
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwText fldStrVariant="caption">
              {fldObjSale.fldBooIsActive
                ? fldObjCopy.fldStrListed
                : fldObjCopy.fldStrNotListed}
            </VwText>
            {fldStrTagPrice !== null && (
              <VwText fldStrVariant="body">
                {`${fldObjCopy.fldStrTagPrice}: ${fldStrTagPrice}`}
              </VwText>
            )}
          </View>
        )}
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrPriceButton}
            actHandOnPress={() => {
              fldObjNavigation.navigate('MarketPrice', {
                fldStrProductId: fldObjProduct.fldStrId,
              });
            }}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAnalysisResultStyles = StyleSheet.create({
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
  fldObjChip: {
    marginRight: fldNumSpacingSm,
  },
  fldObjThumb: {
    width: 120,
    height: 120,
    marginRight: fldNumSpacingSm,
  },
  fldObjFoot: {
    marginTop: fldNumSpacingLg,
    marginBottom: fldNumSpacingSm,
  },
});
