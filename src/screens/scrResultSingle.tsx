/**
 * Logosphere BITS - single result card (analysis review).
 *
 * One publication from a single run: photo strip, review
 * flags, identity, condition, voice claim,
 * source/confidence, and the USD price bands with an
 * explicit observed/AI basis line. Observed prices show
 * their sightings plus the AI estimate kept in a separate
 * card; the review card lists catalog, voice, duplicate,
 * and merge doubts. The fixed bottom bar holds one action
 * (Add to Collection); saving navigates to the target
 * folder, errors keep the draft with a retry, and Back
 * creates no rows.
 * Naming follows D6 (scr / fld / vw / fnc roots).
 */

import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwButton as VwButton } from '../components/vwButton';
import { vwCard as VwCard } from '../components/vwCard';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type {
  fldObjAnalysisItem,
  fldObjAnalysisPayload,
} from '../types/typModels';
import {
  colBackground,
  colSurface,
  fldNumRadiusMd,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';
import { utlStrCodeLabel } from '../utils/utlCodeLabels';

export type scrResultSingleProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjAnalysis: fldObjAnalysisPayload;
  fldObjItem: fldObjAnalysisItem;
  fldArrStripPhotos: { fldStrId: string; fldStrUri: string }[];
  fldBooSaving: boolean;
  fldStrSaveError: string | null;
  actHandOnBack: () => void;
  actHandOnSave: () => void;
};

function fncConvBasisLabel(
  fldObjCopy: fldObjAppStrings['fldObjAnalysisResult'],
  fldStrBasis: string,
): string {
  if (fldStrBasis === 'ai-estimate') {
    return fldObjCopy.fldStrBasisAi;
  }
  if (
    fldStrBasis === 'observed' ||
    fldStrBasis === 'sourced' ||
    fldStrBasis === 'evidence'
  ) {
    return fldObjCopy.fldStrBasisObserved;
  }
  return fldObjCopy.fldStrBasisEstimate;
}

function fncConvReviewLabel(
  fldObjCopy: fldObjAppStrings['fldObjAnalysisResult'],
  fldStrReason: string,
): string {
  if (fldStrReason === 'no-catalog-source') {
    return fldObjCopy.fldStrReviewNoSource;
  }
  if (fldStrReason === 'voice-failed') {
    return fldObjCopy.fldStrReviewVoiceFailed;
  }
  if (fldStrReason.startsWith('duplicate-split:')) {
    return fldObjCopy.fldStrReviewDuplicateSplit;
  }
  if (fldStrReason === 'uncertain-duplicate') {
    return fldObjCopy.fldStrReviewUncertain;
  }
  if (fldStrReason === 'multi-subject-photo') {
    return fldObjCopy.fldStrReviewMultiSubject;
  }
  return fldStrReason;
}

function fncConvPriceLine(
  fldNumValue: number | null,
  fldStrCurrency: string,
  fldStrEmpty: string,
): string {
  if (fldNumValue === null) {
    return fldStrEmpty;
  }
  return utlNumFormatMinorPrice(fldNumValue, fldStrCurrency) ?? fldStrEmpty;
}

export function scrResultSingle(
  fldObjProps: scrResultSingleProps,
): React.JSX.Element {
  const {
    fldObjStrings,
    fldObjAnalysis,
    fldObjItem,
    fldArrStripPhotos,
    fldBooSaving,
    fldStrSaveError,
    actHandOnBack,
    actHandOnSave,
  } = fldObjProps;
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const fldObjMarketCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjCodeLabels = fldObjStrings.fldObjCodeLabels;
  const fldObjBiblio = fldObjItem.fldObjBiblio;
  const fldObjPrice = fldObjItem.fldObjPrice;
  const fldStrPrintLine = [
    fldObjBiblio.fldStrPublisher,
    fldObjBiblio.fldNumPublicationYear === null
      ? null
      : String(fldObjBiblio.fldNumPublicationYear),
    utlStrCodeLabel(
      fldObjCodeLabels.fldArrCover,
      fldObjBiblio.fldNumCoverCode,
      fldObjBiblio.fldStrBinding,
    ),
  ]
    .filter(
      (fldObjPart): fldObjPart is string =>
        fldObjPart !== null && fldObjPart !== '',
    )
    .join(' · ');
  const fldArrVoices = fldObjItem.fldArrEvidence
    .map(fldObjRow => fldObjRow.fldStrVoiceText)
    .filter(
      (fldObjText): fldObjText is string =>
        fldObjText !== null && fldObjText !== '',
    );
  const fldStrConfidence =
    fldObjBiblio.fldNumConfidence === null
      ? null
      : `${Math.round(fldObjBiblio.fldNumConfidence * 100)}%`;
  const fldArrPriceRows: [string, number | null][] = [
    [fldObjMarketCopy.fldStrReplacementNew, fldObjPrice.fldNumReplacementNew],
    [fldObjMarketCopy.fldStrMarketLow, fldObjPrice.fldNumMarketMin],
    [fldObjMarketCopy.fldStrMarketMedian, fldObjPrice.fldNumMarketMedian],
    [fldObjMarketCopy.fldStrMarketHigh, fldObjPrice.fldNumMarketMax],
    [fldObjMarketCopy.fldStrRecommended, fldObjPrice.fldNumMarketRecommended],
  ];
  const fldObjAi = fldObjPrice.fldObjAiEstimate;
  const fldArrAiRows: [string, number | null][] = [
    [fldObjMarketCopy.fldStrReplacementNew, fldObjAi.fldNumReplacementNew],
    [fldObjMarketCopy.fldStrMarketLow, fldObjAi.fldNumMarketMin],
    [fldObjMarketCopy.fldStrMarketMedian, fldObjAi.fldNumMarketMedian],
    [fldObjMarketCopy.fldStrMarketHigh, fldObjAi.fldNumMarketMax],
    [fldObjMarketCopy.fldStrRecommended, fldObjAi.fldNumMarketRecommended],
  ];
  const fldBooAiKnown = fldArrAiRows.some(
    ([, fldNumValue]) => fldNumValue !== null,
  );
  const fldBooObserved = fldObjPrice.fldStrBasis === 'observed';
  return (
    <SafeAreaView style={scrResultSingleStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={fldObjCopy.fldStrSingleTitle}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={actHandOnBack}
      />
      <ScrollView
        style={scrResultSingleStyles.fldObjScroll}
        contentContainerStyle={scrResultSingleStyles.fldObjContent}
      >
        <VwCard>
          <VwText fldStrVariant="label">{fldObjCopy.fldStrPhotos}</VwText>
          {fldArrStripPhotos.length === 0 ? (
            <VwText fldStrVariant="body">{fldObjCopy.fldStrNoPhotos}</VwText>
          ) : (
            <FlatList
              horizontal
              data={fldArrStripPhotos}
              keyExtractor={fldObjPhoto => fldObjPhoto.fldStrId}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: fldObjPhoto }) => (
                <Image
                  source={{ uri: fldObjPhoto.fldStrUri }}
                  style={scrResultSingleStyles.fldObjThumb}
                />
              )}
            />
          )}
        </VwCard>
        {fldObjItem.fldArrNeedsReview.length > 0 && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="label">
                {fldObjCopy.fldStrNeedsReview}
              </VwText>
              {fldObjItem.fldArrNeedsReview.map((fldStrReason, fldNumAt) => (
                <VwText key={`review-${fldNumAt}`} fldStrVariant="body">
                  {`• ${fncConvReviewLabel(fldObjCopy, fldStrReason)}`}
                </VwText>
              ))}
            </VwCard>
          </View>
        )}
        <View style={scrResultSingleStyles.fldObjGap}>
          <VwCard>
            <VwText fldStrVariant="label">{fldObjCopy.fldStrIdentity}</VwText>
            <VwText
              fldStrVariant="header"
              fldNumLines={2}
              fldStrEllipsize="tail"
            >
              {fldObjBiblio.fldStrTitle ?? fldObjCopy.fldStrNotAvailable}
            </VwText>
            {fldStrPrintLine !== '' && (
              <VwText
                fldStrVariant="body"
                fldNumLines={2}
                fldStrEllipsize="tail"
              >
                {fldStrPrintLine}
              </VwText>
            )}
            {fldObjBiblio.fldArrContributors.map((fldObjPerson, fldNumAt) => (
              <VwText
                key={`${fldObjPerson.fldStrPerson}-${fldNumAt}`}
                fldStrVariant="body"
                fldNumLines={1}
                fldStrEllipsize="tail"
              >
                {`${fldObjPerson.fldStrPerson} — ${
                  utlStrCodeLabel(
                    fldObjCodeLabels.fldArrPersonRole,
                    fldObjPerson.fldNumRoleCode,
                    fldObjPerson.fldStrRole === ''
                      ? null
                      : fldObjPerson.fldStrRole,
                  ) ?? fldObjPerson.fldStrRole
                }`}
              </VwText>
            ))}
            {fldObjBiblio.fldStrIsbn13 !== null && (
              <VwText
                fldStrVariant="body"
                fldNumLines={1}
                fldStrEllipsize="tail"
              >
                {`ISBN-13 ${fldObjBiblio.fldStrIsbn13}`}
              </VwText>
            )}
          </VwCard>
        </View>
        {(fldObjBiblio.fldStrCondition !== null ||
          fldObjBiblio.fldNumConditionCode !== null) && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="label">
                {fldObjCopy.fldStrCondition}
              </VwText>
              <VwText fldStrVariant="body">
                {utlStrCodeLabel(
                  fldObjCodeLabels.fldArrCondition,
                  fldObjBiblio.fldNumConditionCode,
                  fldObjBiblio.fldStrCondition,
                )}
              </VwText>
            </VwCard>
          </View>
        )}
        {fldArrVoices.length > 0 && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="label">{fldObjCopy.fldStrVoice}</VwText>
              {fldArrVoices.map((fldStrVoice, fldNumAt) => (
                <VwText key={`voice-${fldNumAt}`} fldStrVariant="body">
                  {`"${fldStrVoice}" (${fldObjCopy.fldStrVoiceClaim})`}
                </VwText>
              ))}
            </VwCard>
          </View>
        )}
        <View style={scrResultSingleStyles.fldObjGap}>
          <VwCard>
            <VwText fldStrVariant="label">
              {fldObjCopy.fldStrSourceTitle}
            </VwText>
            <VwText fldStrVariant="body" fldNumLines={3} fldStrEllipsize="tail">
              {[
                fldStrConfidence,
                fldObjBiblio.fldStrRationale,
                fldObjAnalysis.fldArrSources
                  .map(fldObjSource => fldObjSource.fldStrSource)
                  .join(' · '),
              ]
                .filter(
                  (fldObjPart): fldObjPart is string =>
                    fldObjPart !== null && fldObjPart !== '',
                )
                .join(' — ')}
            </VwText>
          </VwCard>
        </View>
        <View style={scrResultSingleStyles.fldObjGap}>
          <VwCard>
            <VwText fldStrVariant="label">{fldObjCopy.fldStrPriceTitle}</VwText>
            {fldArrPriceRows.map(([fldStrLabel, fldNumValue]) => (
              <View
                key={fldStrLabel}
                style={scrResultSingleStyles.fldObjPriceRow}
              >
                <VwText fldStrVariant="body">{fldStrLabel}</VwText>
                <VwText
                  fldStrVariant="body"
                  fldNumLines={1}
                  fldStrEllipsize="tail"
                >
                  {fncConvPriceLine(
                    fldNumValue,
                    fldObjPrice.fldStrCurrency,
                    fldObjCopy.fldStrNotAvailable,
                  )}
                </VwText>
              </View>
            ))}
            <VwText
              fldStrVariant="caption"
              fldNumLines={2}
              fldStrEllipsize="tail"
            >
              {`${fldObjMarketCopy.fldStrBasis}: ${fncConvBasisLabel(
                fldObjCopy,
                fldObjPrice.fldStrBasis,
              )}`}
            </VwText>
          </VwCard>
        </View>
        {fldObjPrice.fldArrObservations.length > 0 && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="label">
                {`${fldObjCopy.fldStrObservationsTitle} (${fldObjPrice.fldArrObservations.length})`}
              </VwText>
              {fldObjPrice.fldArrObservations.map((fldObjOb, fldNumAt) => {
                const fldStrSeen =
                  utlNumFormatMinorPrice(
                    fldObjOb.fldNumAmountMinor,
                    fldObjOb.fldStrCurrency,
                  ) ?? fldObjCopy.fldStrNotAvailable;
                const fldStrUsd =
                  fldObjOb.fldStrCurrency === 'USD' ||
                  fldObjOb.fldNumUsdMinor === null
                    ? null
                    : utlNumFormatMinorPrice(fldObjOb.fldNumUsdMinor, 'USD');
                const fldStrMarket =
                  fldObjOb.fldStrMarket === 'new'
                    ? fldObjCopy.fldStrMarketNew
                    : fldObjOb.fldStrMarket === 'used'
                    ? fldObjCopy.fldStrMarketUsed
                    : null;
                const fldStrWhen = fldObjOb.fldStrObservedAt.slice(0, 10);
                return (
                  <View
                    key={`${fldObjOb.fldStrSource}-${fldNumAt}`}
                    style={scrResultSingleStyles.fldObjPriceRow}
                  >
                    <VwText fldStrVariant="body">{fldStrSeen}</VwText>
                    <VwText
                      fldStrVariant="caption"
                      fldNumLines={2}
                      fldStrEllipsize="tail"
                    >
                      {[
                        fldObjOb.fldStrSource,
                        fldStrMarket,
                        fldStrUsd === null ? null : `→ ${fldStrUsd}`,
                        `${fldObjCopy.fldStrObservedOn} ${fldStrWhen}`,
                      ]
                        .filter(
                          (fldObjPart): fldObjPart is string =>
                            fldObjPart !== null,
                        )
                        .join(' · ')}
                    </VwText>
                  </View>
                );
              })}
            </VwCard>
          </View>
        )}
        {fldBooObserved && fldBooAiKnown && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="label">
                {fldObjCopy.fldStrAiEstimateTitle}
              </VwText>
              {fldArrAiRows.map(([fldStrLabel, fldNumValue]) => (
                <View
                  key={fldStrLabel}
                  style={scrResultSingleStyles.fldObjPriceRow}
                >
                  <VwText fldStrVariant="body">{fldStrLabel}</VwText>
                  <VwText
                    fldStrVariant="body"
                    fldNumLines={1}
                    fldStrEllipsize="tail"
                  >
                    {fncConvPriceLine(
                      fldNumValue,
                      fldObjAi.fldStrCurrency,
                      fldObjCopy.fldStrNotAvailable,
                    )}
                  </VwText>
                </View>
              ))}
            </VwCard>
          </View>
        )}
      </ScrollView>
      <View style={scrResultSingleStyles.fldObjBar}>
        {fldStrSaveError !== null && (
          <VwText
            fldStrVariant="caption"
            fldNumLines={2}
            fldStrEllipsize="tail"
          >
            {fldStrSaveError}
          </VwText>
        )}
        <VwButton
          fldStrLabel={
            fldBooSaving
              ? fldObjCopy.fldStrSaving
              : fldObjCopy.fldStrAddToCollection
          }
          fldBooDisabled={fldBooSaving}
          actHandOnPress={actHandOnSave}
        />
      </View>
    </SafeAreaView>
  );
}

const scrResultSingleStyles = StyleSheet.create({
  fldObjContainer: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjContent: {
    padding: fldNumSpacingMd,
    paddingBottom: 120,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
  },
  fldObjThumb: {
    width: 120,
    height: 120,
    marginRight: fldNumSpacingSm,
    marginTop: fldNumSpacingSm,
    borderRadius: fldNumRadiusMd,
    backgroundColor: colSurface,
  },
  fldObjPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: fldNumSpacingSm,
  },
  fldObjBar: {
    padding: fldNumSpacingMd,
    paddingBottom: fldNumSpacingLg,
    backgroundColor: colBackground,
  },
});
