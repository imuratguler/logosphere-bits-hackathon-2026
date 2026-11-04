/**
 * Logosphere BITS - multi result list (analysis review).
 *
 * Every candidate renders through the shared product card,
 * exactly as it will look in the collection, with the
 * suggested USD price below and the duplicate rationale on
 * merged rows. The fixed bottom bar holds Add (each
 * candidate its own product) and Add as Set (asks the set
 * name first). Saving navigates to the target folder,
 * errors keep the draft with a retry, and Back creates no
 * rows. Naming follows D6 (scr / fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrResultMulti); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwButton as VwButton } from '../components/vwButton';
import { vwProductCard as VwProductCard } from '../components/vwProductCard';
import { vwSetNameModal as VwSetNameModal } from '../components/vwSetNameModal';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type {
  fldObjAnalysisBiblio,
  fldObjAnalysisItem,
  fldObjAnalysisPayload,
  fldObjBibliographicData,
  fldObjProduct,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';

export type scrResultMultiProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjAnalysis: fldObjAnalysisPayload;
  fldArrLocalPhotos: { fldStrId: string; fldStrLocalPath: string }[];
  fldBooSaving: boolean;
  fldStrSaveError: string | null;
  actHandOnBack: () => void;
  actHandOnSave: (fldStrSetName: string | null) => void;
};

function fncConvCardProduct(
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
    fldStrId: `draft-${fldNumIndex}`,
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
      fldStrPriceBasis:
        fldObjItem.fldObjPrice.fldStrBasis === 'observed'
          ? 'evidence'
          : fldObjItem.fldObjPrice.fldStrBasis === 'ai-estimate'
          ? 'ai-estimate'
          : 'estimate',
    },
    fldObjSaleStatus: null,
  };
}

function fncConvCoverUri(
  fldObjItem: fldObjAnalysisItem,
  fldArrLocalPhotos: scrResultMultiProps['fldArrLocalPhotos'],
): string | null {
  const fldStrFirst = fldObjItem.fldArrPhotoIds[0];
  if (fldStrFirst === undefined) {
    return null;
  }
  const fldObjFound = fldArrLocalPhotos.find(
    fldObjPhoto => fldObjPhoto.fldStrId === fldStrFirst,
  );
  if (fldObjFound === undefined) {
    return null;
  }
  return `file://${fldObjFound.fldStrLocalPath}`;
}

export function scrResultMulti(
  fldObjProps: scrResultMultiProps,
): React.JSX.Element {
  const {
    fldObjStrings,
    fldObjAnalysis,
    fldArrLocalPhotos,
    fldBooSaving,
    fldStrSaveError,
    actHandOnBack,
    actHandOnSave,
  } = fldObjProps;
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const [fldBooSetOpen, actSetSetOpen] = React.useState(false);
  const [fldStrSetName, actSetSetName] = React.useState('');
  const [fldStrNameError, actSetNameError] = React.useState<string | null>(
    null,
  );
  return (
    <SafeAreaView style={scrResultMultiStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={`${fldObjCopy.fldStrMultiTitle} (${fldObjAnalysis.fldArrResults.length})`}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={actHandOnBack}
      />
      <ScrollView
        style={scrResultMultiStyles.fldObjScroll}
        contentContainerStyle={scrResultMultiStyles.fldObjContent}
      >
        {fldObjAnalysis.fldArrResults.map((fldObjItem, fldNumIndex) => (
          <View
            key={`result-${fldNumIndex}`}
            style={scrResultMultiStyles.fldObjRow}
          >
            <VwProductCard
              fldObjProduct={fncConvCardProduct(
                fldObjItem,
                fldNumIndex,
                fldObjCopy.fldStrResultLabel,
              )}
              fldStrCoverUri={fncConvCoverUri(fldObjItem, fldArrLocalPhotos)}
              fldStrNoCoverTitle={fldObjCopy.fldStrNoPhotos}
              fldStrNoCoverMessage=""
              fldObjPriceSlot={
                <VwText
                  fldStrVariant="body"
                  fldNumLines={1}
                  fldStrEllipsize="tail"
                >
                  {fldObjItem.fldObjPrice.fldNumMarketRecommended === null
                    ? fldObjCopy.fldStrNotAvailable
                    : utlNumFormatMinorPrice(
                        fldObjItem.fldObjPrice.fldNumMarketRecommended,
                        fldObjItem.fldObjPrice.fldStrCurrency,
                      ) ?? fldObjCopy.fldStrNotAvailable}
                </VwText>
              }
              fldObjSaleSlot={
                fldObjItem.fldObjDuplicate === null &&
                fldObjItem.fldArrNeedsReview.length === 0 ? undefined : (
                  <VwText
                    fldStrVariant="caption"
                    fldNumLines={4}
                    fldStrEllipsize="tail"
                  >
                    {[
                      fldObjItem.fldObjDuplicate === null
                        ? null
                        : `${fldObjCopy.fldStrMergedDuplicate}: ${
                            fldObjItem.fldObjDuplicate.fldStrReason ??
                            fldObjCopy.fldStrNotAvailable
                          } (${fldObjItem.fldArrPhotoIds.length} ${
                            fldObjCopy.fldStrMergedPhotos
                          })`,
                      fldObjItem.fldArrNeedsReview.length === 0
                        ? null
                        : `${
                            fldObjCopy.fldStrNeedsReview
                          }: ${fldObjItem.fldArrNeedsReview.join(' · ')}`,
                    ]
                      .filter(
                        (fldObjPart): fldObjPart is string =>
                          fldObjPart !== null,
                      )
                      .join('\n')}
                  </VwText>
                )
              }
            />
          </View>
        ))}
      </ScrollView>
      <View style={scrResultMultiStyles.fldObjBar}>
        {fldStrSaveError !== null && !fldBooSetOpen && (
          <VwText
            fldStrVariant="caption"
            fldNumLines={2}
            fldStrEllipsize="tail"
          >
            {fldStrSaveError}
          </VwText>
        )}
        <View style={scrResultMultiStyles.fldObjBarRow}>
          <View style={scrResultMultiStyles.fldObjBarHalf}>
            <VwButton
              fldStrVariant="outline"
              fldStrLabel={
                fldBooSaving ? fldObjCopy.fldStrSaving : fldObjCopy.fldStrAdd
              }
              fldBooDisabled={fldBooSaving}
              actHandOnPress={() => {
                actHandOnSave(null);
              }}
            />
          </View>
          <View style={scrResultMultiStyles.fldObjBarHalf}>
            <VwButton
              fldStrLabel={
                fldBooSaving
                  ? fldObjCopy.fldStrSaving
                  : fldObjCopy.fldStrAddAsSet
              }
              fldBooDisabled={fldBooSaving}
              actHandOnPress={() => {
                actSetNameError(null);
                actSetSetOpen(true);
              }}
            />
          </View>
        </View>
      </View>
      <VwSetNameModal
        fldBooVisible={fldBooSetOpen}
        fldStrTitle={fldObjCopy.fldStrSetTitle}
        fldStrValue={fldStrSetName}
        actHandOnChange={actSetSetName}
        fldStrPlaceholder={fldObjCopy.fldStrSetPlaceholder}
        fldStrError={fldStrNameError ?? undefined}
        fldStrSaveLabel={fldObjCopy.fldStrSetSave}
        fldStrCancelLabel={fldObjCopy.fldStrSetCancel}
        fldBooSaving={fldBooSaving}
        fldStrSaveErrorTitle={fldObjCopy.fldStrSetError}
        fldStrSaveError={fldStrSaveError}
        actHandOnSave={() => {
          if (fldStrSetName.trim() === '') {
            actSetNameError(fldObjCopy.fldStrSetBlank);
            return;
          }
          actSetNameError(null);
          actHandOnSave(fldStrSetName.trim());
        }}
        actHandOnCancel={() => {
          actSetSetOpen(false);
          actSetNameError(null);
        }}
      />
    </SafeAreaView>
  );
}

const scrResultMultiStyles = StyleSheet.create({
  fldObjContainer: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjContent: {
    padding: fldNumSpacingMd,
    paddingBottom: 160,
  },
  fldObjRow: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjBar: {
    padding: fldNumSpacingMd,
    paddingBottom: fldNumSpacingLg,
    backgroundColor: colBackground,
  },
  fldObjBarRow: {
    flexDirection: 'row',
    marginTop: fldNumSpacingSm,
  },
  fldObjBarHalf: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
});
