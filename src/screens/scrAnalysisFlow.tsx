/**
 * Logosphere BITS — analysis flow screen (prepare + route skeleton).
 *
 * Entry from Find Now with the capture draft: shows the photo
 * count, the D10 mode, and the target collection, then prepares
 * each photo for real through the local normalize service
 * (rotation baked into pixels, long edge capped). Voice-note
 * presence rides per photo for the later handoff. The remaining
 * stages (upload, live route, result, confirmed save) render as
 * honest waiting rows: the analysis service is not connected
 * yet, so nothing here pretends to upload, stream, or score.
 * Normalized paths stay in local state for the connecting step.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAnalysisFlow); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiNormalizeDraftImage } from '../services/srvImageNormalize';
import type {
  fldObjAnalysisPhoto,
  fldObjDraftTarget,
  fldStrCaptureMode,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrAnalysisFlowProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrMode: fldStrCaptureMode;
  fldObjTarget: fldObjDraftTarget;
  fldArrPhotos: fldObjAnalysisPhoto[];
  actHandOnClose: () => void;
};

type fldStrFlowPhotoStatus = 'ready' | 'busy' | 'done' | 'error';

type fldObjFlowPhotoState = {
  fldStrStatus: fldStrFlowPhotoStatus;
  fldStrNormalizedPath: string | null;
};

function fncConvBlankPhotoStates(
  fldArrPhotos: fldObjAnalysisPhoto[],
): Record<string, fldObjFlowPhotoState> {
  const fldObjStates: Record<string, fldObjFlowPhotoState> = {};
  for (const fldObjPhoto of fldArrPhotos) {
    fldObjStates[fldObjPhoto.fldStrId] = {
      fldStrStatus: 'ready',
      fldStrNormalizedPath: null,
    };
  }
  return fldObjStates;
}

export function scrAnalysisFlow({
  fldObjStrings,
  fldStrMode,
  fldObjTarget,
  fldArrPhotos,
  actHandOnClose,
}: scrAnalysisFlowProps): React.JSX.Element {
  const fldObjCopy = fldObjStrings.fldObjAnalysisFlow;
  const fldObjBrowserCopy = fldObjStrings.fldObjCollectionBrowser;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const [fldObjPhotoStates, actSetPhotoStates] = React.useState<
    Record<string, fldObjFlowPhotoState>
  >(() => fncConvBlankPhotoStates(fldArrPhotos));
  const [fldBooPreparing, actSetPreparing] = React.useState(false);
  const [fldStrPrepareError, actSetPrepareError] = React.useState<
    string | null
  >(null);

  const fldBooAllDone =
    fldArrPhotos.length > 0 &&
    fldArrPhotos.every(
      fldObjPhoto =>
        fldObjPhotoStates[fldObjPhoto.fldStrId]?.fldStrStatus === 'done',
    );
  const fldBooPrepareDisabled =
    fldBooPreparing || fldArrPhotos.length === 0 || fldBooAllDone;

  const fncRunPrepare = React.useCallback(() => {
    if (fldBooPreparing) {
      return;
    }
    actSetPreparing(true);
    actSetPrepareError(null);
    const fldArrPending = fldArrPhotos.filter(
      fldObjPhoto =>
        fldObjPhotoStates[fldObjPhoto.fldStrId]?.fldStrStatus !== 'done',
    );
    let fldObjChain = Promise.resolve();
    for (const fldObjPhoto of fldArrPending) {
      fldObjChain = fldObjChain.then(() => {
        actSetPhotoStates(fldObjPrev => ({
          ...fldObjPrev,
          [fldObjPhoto.fldStrId]: {
            fldStrStatus: 'busy',
            fldStrNormalizedPath: null,
          },
        }));
        return srvApiNormalizeDraftImage(
          fldObjPhoto.fldStrLocalPath,
          fldObjPhoto.fldNumRotationDegrees,
        ).then(
          fldObjDone => {
            actSetPhotoStates(fldObjPrev => ({
              ...fldObjPrev,
              [fldObjPhoto.fldStrId]: {
                fldStrStatus: 'done',
                fldStrNormalizedPath: fldObjDone.fldStrPath,
              },
            }));
          },
          (fldObjError: unknown) => {
            actSetPhotoStates(fldObjPrev => ({
              ...fldObjPrev,
              [fldObjPhoto.fldStrId]: {
                fldStrStatus: 'error',
                fldStrNormalizedPath: null,
              },
            }));
            actSetPrepareError((fldObjError as Error).message);
          },
        );
      });
    }
    fldObjChain.then(() => {
      actSetPreparing(false);
    });
  }, [fldArrPhotos, fldBooPreparing, fldObjPhotoStates]);

  const fncConvPhotoStatusText = (
    fldStrStatus: fldStrFlowPhotoStatus,
  ): string => {
    if (fldStrStatus === 'done') {
      return fldObjCopy.fldStrPrepared;
    }
    if (fldStrStatus === 'busy') {
      return fldObjCopy.fldStrPreparing;
    }
    if (fldStrStatus === 'error') {
      return fldObjCopy.fldStrPrepareError;
    }
    return fldObjCopy.fldStrStagePrepare;
  };

  const fldStrModeLabel =
    fldStrMode === 'single'
      ? fldObjBrowserCopy.fldStrSingleItem
      : fldObjBrowserCopy.fldStrBulkItems;
  const fldArrServerStages = [
    fldObjCopy.fldStrStageUpload,
    fldObjCopy.fldStrStageRoute,
    fldObjCopy.fldStrStageResult,
    fldObjCopy.fldStrStageSave,
  ];

  return (
    <SafeAreaView style={scrAnalysisFlowStyles.fldObjContainer}>
      <ScrollView style={scrAnalysisFlowStyles.fldObjScroll}>
        <VwBrandHeader
          fldStrName={fldObjBrandCopy.fldStrName}
          fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
        />
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        </View>
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwText fldStrVariant="body">
            {`${fldArrPhotos.length} ${fldObjCopy.fldStrPhotosReady}`}
          </VwText>
          <VwText fldStrVariant="caption">
            {`${fldStrModeLabel} · ${fldObjTarget.fldStrCollectionName}`}
          </VwText>
        </View>
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwButton
            fldStrLabel={
              fldBooPreparing
                ? fldObjCopy.fldStrPreparing
                : fldObjCopy.fldStrPrepare
            }
            fldBooDisabled={fldBooPrepareDisabled}
            actHandOnPress={fncRunPrepare}
          />
        </View>
        {fldArrPhotos.map((fldObjPhoto, fldNumIndex) => {
          const fldObjState = fldObjPhotoStates[fldObjPhoto.fldStrId] ?? {
            fldStrStatus: 'ready',
            fldStrNormalizedPath: null,
          };
          return (
            <View
              key={fldObjPhoto.fldStrId}
              style={scrAnalysisFlowStyles.fldObjGap}
            >
              <VwText fldStrVariant="body">
                {`${fldObjCopy.fldStrPhotoLabel} ${fldNumIndex + 1} · ${
                  fldObjPhoto.fldNumRotationDegrees
                }° · ${fncConvPhotoStatusText(fldObjState.fldStrStatus)}`}
              </VwText>
              {fldObjPhoto.fldBooHasVoiceNote && (
                <VwText fldStrVariant="caption">
                  {fldObjCopy.fldStrVoiceAttached}
                </VwText>
              )}
            </View>
          );
        })}
        {fldStrPrepareError !== null && (
          <View style={scrAnalysisFlowStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrPrepareError}
              fldStrMessage={fldStrPrepareError}
            />
          </View>
        )}
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrRouteTitle}</VwText>
          <VwText fldStrVariant="body">{fldObjCopy.fldStrStagePrepare}</VwText>
          {fldArrServerStages.map(fldStrStage => (
            <View key={fldStrStage}>
              <VwText fldStrVariant="body">{fldStrStage}</VwText>
              <VwText fldStrVariant="caption">
                {fldObjCopy.fldStrServerNote}
              </VwText>
            </View>
          ))}
        </View>
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={actHandOnClose}
          />
        </View>
        <View style={scrAnalysisFlowStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAnalysisFlowStyles = StyleSheet.create({
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
