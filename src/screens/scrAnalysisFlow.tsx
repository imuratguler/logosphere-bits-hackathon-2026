/**
 * Logosphere BITS — analysis flow screen (prepare, upload, run).
 *
 * Entry from Find Now with the capture draft: prepares each
 * photo for real through the local normalize service, then
 * creates the pipeline run, uploads the normalized photos
 * plus voice notes to their deterministic draft paths, and
 * runs the analysis while the live broadcast steps stream
 * into the route list. Success navigates to the result
 * screen with the review payload; failures stay on screen
 * with a retry (create, upload, and run are all idempotent,
 * so a retry resumes instead of paying twice).
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAnalysisFlow); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import { useDemoSession } from '../contexts/ctxDemoSession';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import {
  srvApiCreateAnalysisRun,
  srvApiRunAnalysis,
  srvApiSubscribeAnalysisRun,
  srvApiUploadAnalysisFiles,
} from '../services/srvAnalysis';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiNormalizeDraftImage } from '../services/srvImageNormalize';
import type {
  fldObjAnalysisPhoto,
  fldObjDraftTarget,
  fldObjPipelineStep,
  fldStrCaptureMode,
  fldStrPipelineMode,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { fncMakeUuid } from '../utils/utlUuid';

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

type fldStrFlowPhase = 'idle' | 'uploading' | 'running' | 'done' | 'error';

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

function fncConvPipelineMode(
  fldStrMode: fldStrCaptureMode,
): fldStrPipelineMode {
  return fldStrMode === 'single' ? 'singleProduct' : 'multiProduct';
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
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const fldObjClient = srvApiGetDemoClient();
  const { fldObjSession } = useDemoSession();
  const [fldObjPhotoStates, actSetPhotoStates] = React.useState<
    Record<string, fldObjFlowPhotoState>
  >(() => fncConvBlankPhotoStates(fldArrPhotos));
  const [fldBooPreparing, actSetPreparing] = React.useState(false);
  const [fldStrPrepareError, actSetPrepareError] = React.useState<
    string | null
  >(null);
  const [fldStrPhase, actSetPhase] = React.useState<fldStrFlowPhase>('idle');
  const [fldStrFlowError, actSetFlowError] = React.useState<string | null>(
    null,
  );
  const [fldArrSteps, actSetSteps] = React.useState<fldObjPipelineStep[]>([]);
  const [fldStrRunKey] = React.useState(() => fncMakeUuid());
  const fldObjUnsubscribe = React.useRef<(() => void) | null>(null);

  React.useEffect(
    () => () => {
      fldObjUnsubscribe.current?.();
      fldObjUnsubscribe.current = null;
    },
    [],
  );

  const fldBooAllDone =
    fldArrPhotos.length > 0 &&
    fldArrPhotos.every(
      fldObjPhoto =>
        fldObjPhotoStates[fldObjPhoto.fldStrId]?.fldStrStatus === 'done',
    );
  const fldBooPrepareDisabled =
    fldBooPreparing || fldArrPhotos.length === 0 || fldBooAllDone;
  const fldBooFlowBusy =
    fldStrPhase === 'uploading' || fldStrPhase === 'running';
  const fldBooUploadRunDisabled =
    fldBooFlowBusy || !fldBooAllDone || fldStrPhase === 'done';

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

  const fncRunUploadAndAnalyze = React.useCallback(() => {
    if (fldBooFlowBusy || !fldBooAllDone) {
      return;
    }
    actSetPhase('uploading');
    actSetFlowError(null);
    actSetSteps([]);
    const fldStrSessionId = fldObjSession?.fldStrSessionId ?? '';
    const fncRunPipeline = async () => {
      try {
        const fldObjRun = await srvApiCreateAnalysisRun(fldObjClient, {
          fldStrSessionId,
          fldStrIdempotencyKey: fldStrRunKey,
          fldStrMode: fncConvPipelineMode(fldStrMode),
          fldStrCollectionId: fldObjTarget.fldStrCollectionId,
          fldStrSetId: null,
          fldArrImages: fldArrPhotos.map(fldObjPhoto => ({
            fldStrClientImageId: fldObjPhoto.fldStrId,
            fldNumSortOrder: fldObjPhoto.fldNumSortOrder,
            fldStrMimeType: 'image/jpeg',
            fldNumRotationDegrees: fldObjPhoto.fldNumRotationDegrees,
            fldBooHasVoice:
              fldObjPhoto.fldBooHasVoiceNote &&
              fldObjPhoto.fldStrVoicePath !== null,
          })),
        });
        const fldArrUploads = fldObjRun.fldArrImages.flatMap(fldObjImage => {
          const fldObjPhoto = fldArrPhotos.find(
            fldObjEntry => fldObjEntry.fldStrId === fldObjImage.fldStrId,
          );
          const fldStrNormalized =
            fldObjPhotoStates[fldObjImage.fldStrId]?.fldStrNormalizedPath;
          if (
            fldObjPhoto === undefined ||
            fldStrNormalized === null ||
            fldStrNormalized === undefined
          ) {
            throw new Error(
              'Logosphere BITS: prepared photo is missing for upload.',
            );
          }
          const fldArrEntries = [
            {
              fldStrStoragePath: fldObjImage.fldStrFilePath,
              fldStrLocalPath: fldStrNormalized,
              fldStrMimeType: 'image/jpeg',
            },
          ];
          if (
            fldObjImage.fldStrVoiceFilePath !== null &&
            fldObjPhoto.fldStrVoicePath !== null
          ) {
            fldArrEntries.push({
              fldStrStoragePath: fldObjImage.fldStrVoiceFilePath,
              fldStrLocalPath: fldObjPhoto.fldStrVoicePath,
              fldStrMimeType: 'audio/mp4',
            });
          }
          return fldArrEntries;
        });
        await srvApiUploadAnalysisFiles(fldObjClient, fldArrUploads);
        actSetPhase('running');
        fldObjUnsubscribe.current?.();
        fldObjUnsubscribe.current = srvApiSubscribeAnalysisRun(
          fldObjClient,
          fldObjRun.fldStrRunId,
          fldObjStep => {
            actSetSteps(fldArrPrev => [...fldArrPrev, fldObjStep]);
          },
        );
        try {
          const fldObjPayload = await srvApiRunAnalysis(
            fldObjClient,
            fldStrSessionId,
            fldObjRun.fldStrRunId,
          );
          actSetPhase('done');
          fldObjNavigation.navigate('AnalysisResult', {
            fldObjAnalysis: fldObjPayload,
            fldArrLocalPhotos: fldArrPhotos.map(fldObjPhoto => ({
              fldStrId: fldObjPhoto.fldStrId,
              fldStrLocalPath:
                fldObjPhotoStates[fldObjPhoto.fldStrId]?.fldStrNormalizedPath ??
                fldObjPhoto.fldStrLocalPath,
            })),
          });
        } finally {
          fldObjUnsubscribe.current?.();
          fldObjUnsubscribe.current = null;
        }
      } catch (fldObjError: unknown) {
        fldObjUnsubscribe.current?.();
        fldObjUnsubscribe.current = null;
        actSetPhase('error');
        actSetFlowError((fldObjError as Error).message);
      }
    };
    // The pipeline reports through phase state; the catch only
    // settles the intentionally floating promise.
    fncRunPipeline().catch(() => {});
  }, [
    fldArrPhotos,
    fldBooAllDone,
    fldBooFlowBusy,
    fldObjClient,
    fldObjNavigation,
    fldObjPhotoStates,
    fldObjSession,
    fldObjTarget,
    fldStrMode,
    fldStrRunKey,
  ]);

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
  const fldStrUploadRunLabel =
    fldStrPhase === 'uploading'
      ? fldObjCopy.fldStrUploading
      : fldStrPhase === 'running'
      ? fldObjCopy.fldStrRunning
      : fldObjCopy.fldStrUploadRun;

  return (
    <SafeAreaView style={scrAnalysisFlowStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={fldObjCopy.fldStrTitle}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={actHandOnClose}
      />
      <ScrollView style={scrAnalysisFlowStyles.fldObjScroll}>
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
            fldStrVariant="secondary"
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
          <VwButton
            fldStrLabel={fldStrUploadRunLabel}
            fldBooDisabled={fldBooUploadRunDisabled}
            actHandOnPress={fncRunUploadAndAnalyze}
          />
        </View>
        <View style={scrAnalysisFlowStyles.fldObjGap}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrRouteTitle}</VwText>
          {fldArrSteps.length === 0 ? (
            <>
              <VwText fldStrVariant="body">
                {fldObjCopy.fldStrStagePrepare}
              </VwText>
              <VwText fldStrVariant="body">
                {fldObjCopy.fldStrStageUpload}
              </VwText>
              <VwText fldStrVariant="body">
                {fldObjCopy.fldStrStageRoute}
              </VwText>
              <VwText fldStrVariant="body">
                {fldObjCopy.fldStrStageResult}
              </VwText>
              <VwText fldStrVariant="body">{fldObjCopy.fldStrStageSave}</VwText>
            </>
          ) : (
            fldArrSteps.map(fldObjStep => (
              <VwText
                key={`${fldObjStep.fldStrStage}-${fldObjStep.fldNumSeq}`}
                fldStrVariant="body"
              >
                {`${fldObjStep.fldStrStage} · ${fldObjStep.fldStrEvent}`}
              </VwText>
            ))
          )}
        </View>
        {fldStrFlowError !== null && (
          <View style={scrAnalysisFlowStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrFlowError}
              fldStrMessage={fldStrFlowError}
            />
          </View>
        )}
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
