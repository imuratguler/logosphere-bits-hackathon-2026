/**
 * Logosphere BITS - single result card (analysis review).
 *
 * One publication from a single run: photo strip, review
 * flags, and the shared six-section detail (publication,
 * people, content, physical copy, identifiers, evidence
 * and price). The fixed bottom bar holds one action (Add
 * to Collection); saving navigates to the target folder,
 * errors keep the draft with a retry, and Back creates
 * no rows.
 * Naming follows D6 (scr / fld / vw / fnc roots).
 */

import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwButton as VwButton } from '../components/vwButton';
import { vwCard as VwCard } from '../components/vwCard';
import { vwResultDetail as VwResultDetail } from '../components/vwResultDetail';
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
        <VwResultDetail
          fldObjStrings={fldObjStrings}
          fldObjItem={fldObjItem}
          fldArrSources={fldObjAnalysis.fldArrSources}
        />
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
  fldObjBar: {
    padding: fldNumSpacingMd,
    paddingBottom: fldNumSpacingLg,
    backgroundColor: colBackground,
  },
});
