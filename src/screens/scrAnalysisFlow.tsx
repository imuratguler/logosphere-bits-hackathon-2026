/**
 * Logosphere BITS — analysis flow screen (auto-run with searching modal).
 *
 * Entry from Find Now with the capture draft: the pipeline
 * starts on its own — each photo is prepared through the
 * local normalize service, then the run is created, the
 * normalized photos plus voice notes upload to their
 * deterministic draft paths, and the analysis runs while a
 * modal searching state shows the live status. Success
 * replaces this route with the result screen; failures show
 * an error with a retry (create, upload, and run are all
 * idempotent under one run key, so a retry resumes instead
 * of paying twice). Cancel or Back leaves the route; the
 * server run keeps no client-side hold.
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
import { vwSearchingModal as VwSearchingModal } from '../components/vwSearchingModal';
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
  fldStrCaptureMode,
  fldStrPipelineMode,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
} from '../utils/utlTheme';
import { fncMakeUuid } from '../utils/utlUuid';

type scrAnalysisFlowProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrMode: fldStrCaptureMode;
  fldObjTarget: fldObjDraftTarget;
  fldArrPhotos: fldObjAnalysisPhoto[];
  actHandOnClose: () => void;
};

type fldStrFlowPhase = 'working' | 'error';

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
  const [fldStrPhase, actSetPhase] = React.useState<fldStrFlowPhase>('working');
  const [fldStrStatus, actSetStatus] = React.useState(
    fldObjCopy.fldStrPreparing,
  );
  const [fldStrFlowError, actSetFlowError] = React.useState<string | null>(
    null,
  );
  const [fldNumAttempt, actSetAttempt] = React.useState(0);
  const [fldStrRunKey] = React.useState(() => fncMakeUuid());
  const fldObjUnsubscribe = React.useRef<(() => void) | null>(null);
  const fldObjStartedAttempt = React.useRef(-1);

  React.useEffect(
    () => () => {
      fldObjUnsubscribe.current?.();
      fldObjUnsubscribe.current = null;
    },
    [],
  );

  const fncRunCancel = React.useCallback(() => {
    fldObjUnsubscribe.current?.();
    fldObjUnsubscribe.current = null;
    actHandOnClose();
  }, [actHandOnClose]);

  const fncRunPipeline = React.useCallback(async () => {
    // One chain per attempt: the idempotency key stays fixed
    // across retries so a retry resumes the same server run.
    actSetPhase('working');
    actSetFlowError(null);
    const fldStrSessionId = fldObjSession?.fldStrSessionId ?? '';
    const fldObjNormalized = new Map<string, string>();
    try {
      for (let fldNumAt = 0; fldNumAt < fldArrPhotos.length; fldNumAt += 1) {
        const fldObjPhoto = fldArrPhotos[fldNumAt];
        if (fldObjPhoto === undefined) {
          continue;
        }
        actSetStatus(
          `${fldObjCopy.fldStrPreparing} ${fldNumAt + 1}/${
            fldArrPhotos.length
          }`,
        );
        const fldObjDone = await srvApiNormalizeDraftImage(
          fldObjPhoto.fldStrLocalPath,
          fldObjPhoto.fldNumRotationDegrees,
        );
        fldObjNormalized.set(fldObjPhoto.fldStrId, fldObjDone.fldStrPath);
      }
      actSetStatus(fldObjCopy.fldStrUploading);
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
        const fldStrNormalized = fldObjNormalized.get(fldObjImage.fldStrId);
        if (fldObjPhoto === undefined || fldStrNormalized === undefined) {
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
      actSetStatus(fldObjCopy.fldStrRunning);
      fldObjUnsubscribe.current?.();
      fldObjUnsubscribe.current = srvApiSubscribeAnalysisRun(
        fldObjClient,
        fldObjRun.fldStrRunId,
        fldObjStep => {
          actSetStatus(`${fldObjStep.fldStrStage} · ${fldObjStep.fldStrEvent}`);
        },
      );
      try {
        const fldObjPayload = await srvApiRunAnalysis(
          fldObjClient,
          fldStrSessionId,
          fldObjRun.fldStrRunId,
        );
        fldObjNavigation.replace('AnalysisResult', {
          fldObjAnalysis: fldObjPayload,
          fldArrLocalPhotos: fldArrPhotos.map(fldObjPhoto => ({
            fldStrId: fldObjPhoto.fldStrId,
            fldStrLocalPath:
              fldObjNormalized.get(fldObjPhoto.fldStrId) ??
              fldObjPhoto.fldStrLocalPath,
          })),
          fldObjTarget,
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
  }, [
    fldArrPhotos,
    fldObjClient,
    fldObjCopy,
    fldObjNavigation,
    fldObjSession,
    fldObjTarget,
    fldStrMode,
    fldStrRunKey,
  ]);

  React.useEffect(() => {
    if (fldObjStartedAttempt.current === fldNumAttempt) {
      return;
    }
    fldObjStartedAttempt.current = fldNumAttempt;
    // The pipeline reports through phase state; the catch only
    // settles the intentionally floating promise.
    fncRunPipeline().catch(() => {});
  }, [fldNumAttempt, fncRunPipeline]);

  const fldStrModeLabel =
    fldStrMode === 'single'
      ? fldObjBrowserCopy.fldStrSingleItem
      : fldObjBrowserCopy.fldStrBulkItems;
  const fldBooWorking = fldStrPhase === 'working';

  return (
    <SafeAreaView style={scrAnalysisFlowStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={fldObjCopy.fldStrTitle}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={fncRunCancel}
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
        {!fldBooWorking && fldStrFlowError !== null && (
          <View style={scrAnalysisFlowStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrFlowError}
              fldStrMessage={fldStrFlowError}
            />
          </View>
        )}
        {!fldBooWorking && (
          <View style={scrAnalysisFlowStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrRetry}
              actHandOnPress={() => {
                actSetAttempt(fldNumPrev => fldNumPrev + 1);
              }}
            />
          </View>
        )}
        <View style={scrAnalysisFlowStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
      <VwSearchingModal
        fldBooVisible={fldBooWorking}
        fldStrTitle={fldObjCopy.fldStrSearching}
        fldStrStatus={fldStrStatus}
        fldStrCancelLabel={fldObjCopy.fldStrCancel}
        actHandOnCancel={fncRunCancel}
      />
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
    marginBottom: fldNumSpacingMd,
  },
});
