/**
 * Logosphere BITS - single result card (analysis review).
 *
 * One publication from a single run: photo strip, identity,
 * condition, voice claim, source/confidence, and the USD
 * price bands with an explicit observed/AI basis line. The
 * fixed bottom bar holds one action (Add to Collection);
 * saving navigates to the target folder, errors keep the
 * draft with a retry, and Back creates no rows.
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
  if (fldStrBasis === 'sourced' || fldStrBasis === 'evidence') {
    return fldObjCopy.fldStrBasisObserved;
  }
  return fldObjCopy.fldStrBasisEstimate;
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
  const fldObjBiblio = fldObjItem.fldObjBiblio;
  const fldObjPrice = fldObjItem.fldObjPrice;
  const fldStrPrintLine = [
    fldObjBiblio.fldStrPublisher,
    fldObjBiblio.fldNumPublicationYear === null
      ? null
      : String(fldObjBiblio.fldNumPublicationYear),
    fldObjBiblio.fldStrBinding,
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
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrPhotos}</VwText>
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
        <View style={scrResultSingleStyles.fldObjGap}>
          <VwCard>
            <VwText fldStrVariant="caption">{fldObjCopy.fldStrIdentity}</VwText>
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
                {`${fldObjPerson.fldStrPerson} — ${fldObjPerson.fldStrRole}`}
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
        {fldObjBiblio.fldStrCondition !== null && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="caption">
                {fldObjCopy.fldStrCondition}
              </VwText>
              <VwText fldStrVariant="body">
                {fldObjBiblio.fldStrCondition}
              </VwText>
            </VwCard>
          </View>
        )}
        {fldArrVoices.length > 0 && (
          <View style={scrResultSingleStyles.fldObjGap}>
            <VwCard>
              <VwText fldStrVariant="caption">{fldObjCopy.fldStrVoice}</VwText>
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
            <VwText fldStrVariant="caption">
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
            <VwText fldStrVariant="caption">
              {fldObjCopy.fldStrPriceTitle}
            </VwText>
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
