/**
 * Logosphere BITS — live camera capture screen (demo plane).
 *
 * Rear camera with a v5 photo output, viewfinder, and shutter:
 * the leaf Single/Bulk entries open this same screen with the
 * D10 mode and its target, validated once at entry (fail-closed
 * error state, never re-asked). Capture stays in memory — the
 * photo shows in a large NitroImage preview with retake/close,
 * and the preview offers Use photo to save the display image
 * into the draft. Every settled branch also offers gallery
 * multi-select — gallery works with the camera denied or
 * blocked, cancel is silent, and one in-flight guard blocks
 * double-tap concurrency.
 *
 * Layout follows Expected 020-025 exactly: an empty draft shows
 * only the full-bleed viewfinder with a round gallery clip and a
 * large round shutter; a filled draft adds the black counter
 * panel with a red Clear, overlay corner actions per thumbnail
 * (top-left delete, bottom-left rotate, bottom-right voice;
 * top-right stays empty), a single pill Find Now over the
 * viewfinder, and the added-photos counter above the bottom
 * bar. Draft state lives in the draft hook (mode + target fixed
 * at open, stable UUIDs per image): tap-to-open fits the image
 * aspect-correct in the large draft preview with
 * back/rotate/delete. The preview rotation reads the same
 * stored degrees the analysis step will bake into pixels, so
 * the two can never disagree. Find Now is hidden while the
 * draft is empty, disabled unless the camera is ready and idle,
 * and its press hands the draft photos to the analysis flow.
 * The session runs only while focused, foregrounded, granted,
 * and without any open preview; permission states ride on the
 * project camera permission flow (react-native-permissions),
 * never on the camera kit's own permission hook. The shutter
 * reads orientation from the physical device posture.
 *
 * Each draft image holds at most one voice note (F6): the
 * thumbnail voice corner records/stops in place (microphone
 * glyph, stop square while recording, speaker mark once a note
 * exists — the mark opens the preview), the large preview keeps
 * its bottom-right corner as the microphone area with
 * listen/confirmed re-record/delete below, and microphone
 * permission rides its own flow. Naming follows D6
 * (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCameraCapture); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { Image as NitroImageValue } from 'react-native-nitro-image';
import { NitroImage } from 'react-native-nitro-image';
import type { Photo } from 'react-native-vision-camera';
import {
  Camera,
  useCameraDevice,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { vwButton as VwButton } from '../components/vwButton';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import { useDraft } from '../hooks/useDraft';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldStrCameraPermissionStatus } from '../services/srvCameraPermission';
import {
  srvApiPickGalleryImages,
  srvApiPrepareCapturePreview,
  srvApiSaveCaptureImageToDraftFile,
  srvApiSaveGalleryAssetsToDraft,
} from '../services/srvDraftIntake';
import {
  srvApiCheckCameraPermission,
  srvApiOpenCameraAppSettings,
  srvApiRequestCameraPermission,
} from '../services/srvCameraPermission';
import type { fldStrMicPermissionStatus } from '../services/srvMicPermission';
import {
  srvApiCheckMicPermission,
  srvApiOpenMicAppSettings,
  srvApiRequestMicPermission,
} from '../services/srvMicPermission';
import {
  srvApiDeleteVoiceFile,
  srvApiSetVoicePlaybackEndHandler,
  srvApiStartVoicePlayback,
  srvApiStartVoiceRecording,
  srvApiStopVoicePlayback,
  srvApiStopVoiceRecording,
} from '../services/srvVoiceNote';
import {
  colBackground,
  colDanger,
  colScrim,
  colTextOnAccent,
  colTextPrimary,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';
import { fncMakeUuid } from '../utils/utlUuid';
import type {
  fldObjAnalysisPhoto,
  fldObjDraftTarget,
  fldObjVoiceNote,
  fldStrCaptureMode,
} from '../types/typModels';
import { vldChgIsCaptureMode } from '../validation/vldCapture';

type scrCameraCaptureProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrMode: string;
  fldObjTarget: fldObjDraftTarget;
  actHandOnClose: () => void;
  actHandOnAnalysis: (fldArrPhotos: fldObjAnalysisPhoto[]) => void;
};

type fldObjCapturedPreview = {
  fldObjImage: NitroImageValue;
  fldObjPhoto: Photo;
};

function fncConvVoiceDuration(fldNumSeconds: number): string {
  const fldNumMinutes = Math.floor(fldNumSeconds / 60);
  const fldNumRemainder = fldNumSeconds % 60;
  return `${fldNumMinutes}:${String(fldNumRemainder).padStart(2, '0')}`;
}

export function scrCameraCapture({
  fldObjStrings,
  fldStrMode,
  fldObjTarget,
  actHandOnClose,
  actHandOnAnalysis,
}: scrCameraCaptureProps): React.JSX.Element {
  const fldBooModeValid = vldChgIsCaptureMode(fldStrMode);
  const fldBooFocused = useIsFocused();
  const fldObjDevice = useCameraDevice('back');
  const fldObjPhotoOutput = usePhotoOutput();
  const {
    fldObjDraft,
    actAddImages,
    actRemoveImage,
    actRotateImage,
    actSetVoiceNote,
    actClearImages,
  } = useDraft(fldStrMode as fldStrCaptureMode, fldObjTarget);
  const [fldStrPermission, actSetPermission] =
    React.useState<fldStrCameraPermissionStatus | null>(null);
  const [fldBooRequesting, actSetRequesting] = React.useState(false);
  const [fldBooForeground, actSetForeground] = React.useState(
    () => AppState.currentState === 'active',
  );
  const [fldObjPreview, actSetPreview] =
    React.useState<fldObjCapturedPreview | null>(null);
  const [fldStrDraftPreviewId, actSetDraftPreviewId] = React.useState<
    string | null
  >(null);
  const [fldObjPreviewBox, actSetPreviewBox] = React.useState<{
    fldNumWidth: number;
    fldNumHeight: number;
  } | null>(null);
  const [fldBooCapturing, actSetCapturing] = React.useState(false);
  const [fldStrCaptureError, actSetCaptureError] = React.useState<
    string | null
  >(null);
  const [fldBooIntaking, actSetIntaking] = React.useState(false);
  const [fldStrIntakeError, actSetIntakeError] = React.useState<string | null>(
    null,
  );
  const [fldBooClearConfirm, actSetClearConfirm] = React.useState(false);
  const [fldBooReRecordConfirm, actSetReRecordConfirm] = React.useState(false);
  const [fldStrMicPermission, actSetMicPermission] =
    React.useState<fldStrMicPermissionStatus | null>(null);
  const [fldBooMicRequesting, actSetMicRequesting] = React.useState(false);
  const [fldStrRecordingId, actSetRecordingId] = React.useState<string | null>(
    null,
  );
  const [fldStrPlayingId, actSetPlayingId] = React.useState<string | null>(
    null,
  );
  const [fldBooVoiceBusy, actSetVoiceBusy] = React.useState(false);
  const [fldStrVoiceError, actSetVoiceError] = React.useState<string | null>(
    null,
  );
  const fldObjPhotoRef = React.useRef<Photo | null>(null);
  const fldBooIntakingRef = React.useRef(false);
  const fldStrRecordingIdRef = React.useRef<string | null>(null);
  const fldStrPlayingIdRef = React.useRef<string | null>(null);

  const fldObjCopy = fldObjStrings.fldObjCameraCapture;
  const fldObjVoiceCopy = fldObjStrings.fldObjVoiceNote;
  const fldArrImages = fldObjDraft.fldArrImages;
  const fldObjPreviewItem =
    fldStrDraftPreviewId === null
      ? null
      : fldArrImages.find(
          fldObjImage => fldObjImage.fldStrId === fldStrDraftPreviewId,
        ) ?? null;

  const fncRunRefreshPermission = React.useCallback(() => {
    let fldBooCancelled = false;
    srvApiCheckCameraPermission().then(
      fldStrStatus => {
        if (!fldBooCancelled) {
          actSetPermission(fldStrStatus);
        }
      },
      () => {
        if (!fldBooCancelled) {
          actSetPermission('unavailable');
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!fldBooModeValid) {
      return undefined;
    }
    return fncRunRefreshPermission();
  }, [fldBooModeValid, fncRunRefreshPermission]);

  React.useEffect(() => {
    const fldObjSubscription = AppState.addEventListener(
      'change',
      fldStrNextState => {
        const fldBooActive = fldStrNextState === 'active';
        actSetForeground(fldBooActive);
        if (fldBooActive && fldBooModeValid) {
          fncRunRefreshPermission();
        }
      },
    );
    return () => {
      fldObjSubscription.remove();
    };
  }, [fldBooModeValid, fncRunRefreshPermission]);

  // The display image aliases the photo's native memory, so the
  // photo stays alive until the preview closes; disposing it
  // earlier blacks the image on device.
  React.useEffect(
    () => () => {
      fldObjPhotoRef.current?.dispose();
      fldObjPhotoRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    srvApiSetVoicePlaybackEndHandler(() => {
      fldStrPlayingIdRef.current = null;
      actSetPlayingId(null);
    });
    return () => {
      srvApiSetVoicePlaybackEndHandler(null);
      if (fldStrPlayingIdRef.current !== null) {
        fldStrPlayingIdRef.current = null;
        srvApiStopVoicePlayback().catch(() => undefined);
      }
      if (fldStrRecordingIdRef.current !== null) {
        fldStrRecordingIdRef.current = null;
        srvApiStopVoiceRecording()
          .then(fldObjLeft => srvApiDeleteVoiceFile(fldObjLeft.fldStrPath))
          .catch(() => undefined);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!fldBooModeValid) {
      return undefined;
    }
    let fldBooCancelled = false;
    actSetMicPermission(null);
    if (fldStrDraftPreviewId !== null) {
      actSetVoiceError(null);
    }
    srvApiCheckMicPermission().then(
      fldStrStatus => {
        if (!fldBooCancelled) {
          actSetMicPermission(fldStrStatus);
        }
      },
      () => {
        if (!fldBooCancelled) {
          actSetMicPermission('unavailable');
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldBooModeValid, fldStrDraftPreviewId]);

  const fncRunDisposePreview = React.useCallback(() => {
    fldObjPhotoRef.current?.dispose();
    fldObjPhotoRef.current = null;
    actSetPreview(null);
  }, []);

  const fncRunRequest = React.useCallback(() => {
    if (fldBooRequesting) {
      return;
    }
    actSetRequesting(true);
    srvApiRequestCameraPermission().then(
      fldStrStatus => {
        actSetRequesting(false);
        actSetPermission(fldStrStatus);
      },
      () => {
        actSetRequesting(false);
        actSetPermission('unavailable');
      },
    );
  }, [fldBooRequesting]);

  const fncRunOpenSettings = React.useCallback(() => {
    srvApiOpenCameraAppSettings().catch(() => undefined);
  }, []);

  const fncRunMicRequest = React.useCallback(() => {
    if (fldBooMicRequesting) {
      return;
    }
    actSetMicRequesting(true);
    srvApiRequestMicPermission().then(
      fldStrStatus => {
        actSetMicRequesting(false);
        actSetMicPermission(fldStrStatus);
      },
      () => {
        actSetMicRequesting(false);
        actSetMicPermission('unavailable');
      },
    );
  }, [fldBooMicRequesting]);

  const fncRunMicOpenSettings = React.useCallback(() => {
    srvApiOpenMicAppSettings().catch(() => undefined);
  }, []);

  const fncRunRecord = React.useCallback(
    (fldStrId: string) => {
      if (
        fldBooVoiceBusy ||
        fldStrRecordingIdRef.current !== null ||
        fldStrPlayingIdRef.current === fldStrId
      ) {
        return;
      }
      actSetVoiceError(null);
      actSetVoiceBusy(true);
      const fncRunStart = () => {
        srvApiStartVoiceRecording().then(
          () => {
            fldStrRecordingIdRef.current = fldStrId;
            actSetRecordingId(fldStrId);
            actSetVoiceBusy(false);
          },
          (fldObjError: unknown) => {
            actSetVoiceBusy(false);
            actSetVoiceError((fldObjError as Error).message);
          },
        );
      };
      if (fldStrPlayingIdRef.current !== null) {
        fldStrPlayingIdRef.current = null;
        actSetPlayingId(null);
        srvApiStopVoicePlayback().then(fncRunStart, fncRunStart);
      } else {
        fncRunStart();
      }
    },
    [fldBooVoiceBusy],
  );

  const fncRunStopRecord = React.useCallback(
    (fldStrId: string, fldObjOldNote: fldObjVoiceNote | null) => {
      if (fldBooVoiceBusy || fldStrRecordingIdRef.current !== fldStrId) {
        return;
      }
      actSetVoiceError(null);
      actSetVoiceBusy(true);
      srvApiStopVoiceRecording().then(
        fldObjDone => {
          fldStrRecordingIdRef.current = null;
          actSetRecordingId(null);
          actSetVoiceBusy(false);
          const fldObjNote: fldObjVoiceNote = {
            fldStrId: fncMakeUuid(),
            fldNumVersion: (fldObjOldNote?.fldNumVersion ?? 0) + 1,
            fldStrFilePath: fldObjDone.fldStrPath,
            fldStrMimeType: 'audio/mp4',
            fldNumDurationSec: fldObjDone.fldNumDurationSec,
            fldStrTranscriptionStatus: 'none',
          };
          if (fldObjOldNote !== null) {
            srvApiDeleteVoiceFile(fldObjOldNote.fldStrFilePath).catch(
              () => undefined,
            );
          }
          actSetVoiceNote(fldStrId, fldObjNote);
        },
        (fldObjError: unknown) => {
          fldStrRecordingIdRef.current = null;
          actSetRecordingId(null);
          actSetVoiceBusy(false);
          actSetVoiceError((fldObjError as Error).message);
        },
      );
    },
    [actSetVoiceNote, fldBooVoiceBusy],
  );

  const fncRunThumbVoice = React.useCallback(
    (fldStrId: string) => {
      const fldObjItem =
        fldArrImages.find(fldObjImage => fldObjImage.fldStrId === fldStrId) ??
        null;
      if (fldObjItem === null) {
        return;
      }
      if (fldStrRecordingIdRef.current === fldStrId) {
        fncRunStopRecord(fldStrId, fldObjItem.fldObjVoiceNote);
        return;
      }
      if (fldObjItem.fldObjVoiceNote !== null) {
        actSetDraftPreviewId(fldStrId);
        return;
      }
      if (
        fldStrMicPermission === 'granted' ||
        fldStrMicPermission === 'limited'
      ) {
        fncRunRecord(fldStrId);
        return;
      }
      if (fldStrMicPermission === 'denied') {
        fncRunMicRequest();
        return;
      }
      actSetDraftPreviewId(fldStrId);
    },
    [
      fldArrImages,
      fldStrMicPermission,
      fncRunMicRequest,
      fncRunRecord,
      fncRunStopRecord,
    ],
  );

  const fncRunListen = React.useCallback(
    (fldStrId: string, fldStrPath: string) => {
      if (
        fldBooVoiceBusy ||
        fldStrRecordingIdRef.current !== null ||
        fldStrPlayingIdRef.current !== null
      ) {
        return;
      }
      actSetVoiceError(null);
      actSetVoiceBusy(true);
      srvApiStartVoicePlayback(fldStrPath).then(
        () => {
          fldStrPlayingIdRef.current = fldStrId;
          actSetPlayingId(fldStrId);
          actSetVoiceBusy(false);
        },
        (fldObjError: unknown) => {
          actSetVoiceBusy(false);
          actSetVoiceError((fldObjError as Error).message);
        },
      );
    },
    [fldBooVoiceBusy],
  );

  const fncRunStopListen = React.useCallback(() => {
    if (fldStrPlayingIdRef.current === null) {
      return;
    }
    fldStrPlayingIdRef.current = null;
    actSetPlayingId(null);
    srvApiStopVoicePlayback().catch(() => undefined);
  }, []);

  const fncRunDiscardRecording = React.useCallback((fldStrId: string) => {
    if (fldStrRecordingIdRef.current !== fldStrId) {
      return;
    }
    fldStrRecordingIdRef.current = null;
    actSetRecordingId(null);
    srvApiStopVoiceRecording()
      .then(fldObjLeft => srvApiDeleteVoiceFile(fldObjLeft.fldStrPath))
      .catch(() => undefined);
  }, []);

  const fncRunDeleteNote = React.useCallback(
    (fldStrId: string, fldObjNote: fldObjVoiceNote) => {
      fncRunStopListen();
      srvApiDeleteVoiceFile(fldObjNote.fldStrFilePath).catch(
        (fldObjError: unknown) => {
          actSetVoiceError((fldObjError as Error).message);
        },
      );
      actSetVoiceNote(fldStrId, null);
    },
    [actSetVoiceNote, fncRunStopListen],
  );

  const fncRunShutter = React.useCallback(() => {
    if (
      fldBooCapturing ||
      fldObjPreview !== null ||
      fldObjPreviewItem !== null
    ) {
      return;
    }
    actSetCaptureError(null);
    actSetCapturing(true);
    fldObjPhotoOutput
      .capturePhoto({}, {})
      .then(async fldObjPhoto => {
        const fldObjImage = await srvApiPrepareCapturePreview(fldObjPhoto);
        fldObjPhotoRef.current?.dispose();
        fldObjPhotoRef.current = fldObjPhoto;
        actSetPreview({ fldObjImage, fldObjPhoto });
        actSetCapturing(false);
      })
      .catch((fldObjError: unknown) => {
        actSetCapturing(false);
        actSetCaptureError((fldObjError as Error).message);
      });
  }, [fldBooCapturing, fldObjPhotoOutput, fldObjPreview, fldObjPreviewItem]);

  const fncRunFinishIntake = React.useCallback(() => {
    fldBooIntakingRef.current = false;
    actSetIntaking(false);
  }, []);

  const fncRunUsePhoto = React.useCallback(() => {
    if (fldBooIntakingRef.current || fldObjPreview === null) {
      return;
    }
    fldBooIntakingRef.current = true;
    actSetIntakeError(null);
    actSetIntaking(true);
    srvApiSaveCaptureImageToDraftFile(
      fldObjPreview.fldObjImage,
      fldArrImages.length,
    ).then(
      fldObjEntry => {
        fncRunFinishIntake();
        actAddImages([fldObjEntry]);
        fncRunDisposePreview();
      },
      (fldObjError: unknown) => {
        fncRunFinishIntake();
        actSetIntakeError((fldObjError as Error).message);
      },
    );
  }, [
    actAddImages,
    fldArrImages.length,
    fldObjPreview,
    fncRunDisposePreview,
    fncRunFinishIntake,
  ]);

  const fncRunChooseGallery = React.useCallback(() => {
    if (fldBooIntakingRef.current) {
      return;
    }
    fldBooIntakingRef.current = true;
    actSetIntakeError(null);
    actSetIntaking(true);
    srvApiPickGalleryImages().then(
      fldArrAssets => {
        if (fldArrAssets.length === 0) {
          fncRunFinishIntake();
          return;
        }
        srvApiSaveGalleryAssetsToDraft(fldArrAssets, fldArrImages.length).then(
          fldArrEntries => {
            fncRunFinishIntake();
            actAddImages(fldArrEntries);
          },
          (fldObjError: unknown) => {
            fncRunFinishIntake();
            actSetIntakeError((fldObjError as Error).message);
          },
        );
      },
      (fldObjError: unknown) => {
        fncRunFinishIntake();
        actSetIntakeError((fldObjError as Error).message);
      },
    );
  }, [actAddImages, fldArrImages.length, fncRunFinishIntake]);

  const fncRunRemoveImage = React.useCallback(
    (fldStrId: string) => {
      fncRunDiscardRecording(fldStrId);
      if (fldStrPlayingIdRef.current === fldStrId) {
        fncRunStopListen();
      }
      const fldObjGone = fldArrImages.find(
        fldObjImage => fldObjImage.fldStrId === fldStrId,
      );
      const fldObjNote = fldObjGone?.fldObjVoiceNote ?? null;
      if (fldObjNote !== null) {
        srvApiDeleteVoiceFile(fldObjNote.fldStrFilePath).catch(() => undefined);
      }
      actRemoveImage(fldStrId);
      if (fldStrId === fldStrDraftPreviewId) {
        actSetDraftPreviewId(null);
      }
    },
    [
      actRemoveImage,
      fldArrImages,
      fldStrDraftPreviewId,
      fncRunDiscardRecording,
      fncRunStopListen,
    ],
  );

  const fncRunClearDraft = React.useCallback(() => {
    for (const fldObjImage of fldArrImages) {
      fncRunDiscardRecording(fldObjImage.fldStrId);
    }
    fncRunStopListen();
    for (const fldObjImage of fldArrImages) {
      if (fldObjImage.fldObjVoiceNote !== null) {
        srvApiDeleteVoiceFile(fldObjImage.fldObjVoiceNote.fldStrFilePath).catch(
          () => undefined,
        );
      }
    }
    actSetDraftPreviewId(null);
    actSetClearConfirm(false);
    actClearImages();
  }, [actClearImages, fldArrImages, fncRunDiscardRecording, fncRunStopListen]);

  const fncRunLeavePreview = React.useCallback(() => {
    if (fldStrDraftPreviewId !== null) {
      fncRunDiscardRecording(fldStrDraftPreviewId);
    }
    fncRunStopListen();
    actSetDraftPreviewId(null);
  }, [fldStrDraftPreviewId, fncRunDiscardRecording, fncRunStopListen]);

  const fncRunFindNow = React.useCallback(() => {
    const fldArrPhotos: fldObjAnalysisPhoto[] = fldArrImages.map(
      fldObjImage => ({
        fldStrId: fldObjImage.fldStrId,
        fldNumSortOrder: fldObjImage.fldNumSortOrder,
        fldStrLocalPath: fldObjImage.fldStrLocalPath,
        fldNumRotationDegrees: fldObjImage.fldNumRotationDegrees,
        fldBooHasVoiceNote: fldObjImage.fldObjVoiceNote !== null,
        fldStrVoicePath: fldObjImage.fldObjVoiceNote?.fldStrFilePath ?? null,
      }),
    );
    actHandOnAnalysis(fldArrPhotos);
  }, [actHandOnAnalysis, fldArrImages]);

  const fncRunClose = React.useCallback(() => {
    fncRunDisposePreview();
    if (fldStrDraftPreviewId !== null) {
      fncRunDiscardRecording(fldStrDraftPreviewId);
    }
    fncRunStopListen();
    actSetDraftPreviewId(null);
    actHandOnClose();
  }, [
    actHandOnClose,
    fldStrDraftPreviewId,
    fncRunDiscardRecording,
    fncRunDisposePreview,
    fncRunStopListen,
  ]);

  const fldBooUsablePermission =
    fldStrPermission === 'granted' || fldStrPermission === 'limited';
  const fldBooCameraReady =
    fldBooUsablePermission && fldObjDevice !== undefined;
  const fldBooSessionActive =
    fldBooFocused &&
    fldBooForeground &&
    fldBooUsablePermission &&
    fldObjPreview === null &&
    fldObjPreviewItem === null;
  const fldBooFindNowDisabled =
    fldBooCapturing ||
    fldBooIntaking ||
    fldBooVoiceBusy ||
    fldStrRecordingId !== null ||
    fldStrPlayingId !== null ||
    !fldBooCameraReady;

  const fldObjIntakeErrorSlot =
    fldStrIntakeError === null ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrIntakeError}
          fldStrMessage={fldStrIntakeError}
        />
      </View>
    );

  const fldObjGalleryButton = (
    <View style={scrCameraCaptureStyles.fldObjGap}>
      <VwButton
        fldStrLabel={
          fldBooIntaking
            ? fldObjCopy.fldStrAdding
            : fldObjCopy.fldStrChooseGallery
        }
        fldStrVariant="secondary"
        fldBooLoading={fldBooIntaking}
        fldStrTestId="gallery-pick"
        actHandOnPress={fncRunChooseGallery}
      />
    </View>
  );

  const fldObjDraftEmptySlot = (
    <View style={scrCameraCaptureStyles.fldObjGap}>
      <VwText fldStrVariant="caption">{fldObjCopy.fldStrDraftTitle}</VwText>
      <VwText fldStrVariant="caption">{fldObjCopy.fldStrDraftEmpty}</VwText>
    </View>
  );

  const fldObjClearRow =
    fldBooClearConfirm && fldArrImages.length > 0 ? (
      <View style={scrCameraCaptureStyles.fldObjClearRow}>
        <VwText fldStrVariant="caption">{fldObjCopy.fldStrClearTitle}</VwText>
        <View style={scrCameraCaptureStyles.fldObjClearButtons}>
          <View style={scrCameraCaptureStyles.fldObjClearButton}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrClear}
              fldStrVariant="secondary"
              actHandOnPress={fncRunClearDraft}
            />
          </View>
          <View style={scrCameraCaptureStyles.fldObjClearButtonLast}>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrCancel}
              fldStrVariant="text"
              actHandOnPress={() => {
                actSetClearConfirm(false);
              }}
            />
          </View>
        </View>
      </View>
    ) : null;

  const fldObjThumbnailStrip =
    fldArrImages.length === 0 ? null : (
      <View style={scrCameraCaptureStyles.fldObjStripPanel}>
        <View style={scrCameraCaptureStyles.fldObjStripHeader}>
          <VwText fldStrVariant="rowTitle">
            {`${fldObjCopy.fldStrDraftTitle} (${fldArrImages.length})`}
          </VwText>
          <Pressable
            testID="draft-clear"
            accessibilityRole="button"
            accessibilityLabel={fldObjCopy.fldStrClear}
            onPress={() => {
              actSetClearConfirm(true);
            }}
          >
            <Text style={scrCameraCaptureStyles.fldObjClearLabel}>
              {fldObjCopy.fldStrClear}
            </Text>
          </Pressable>
        </View>
        {fldObjClearRow}
        <ScrollView
          horizontal
          testID="draft-thumbnail-strip"
          style={scrCameraCaptureStyles.fldObjStrip}
        >
          {fldArrImages.map(fldObjImage => {
            const fldBooThumbRecording =
              fldStrRecordingId === fldObjImage.fldStrId;
            const fldStrVoiceGlyph = fldBooThumbRecording
              ? '■'
              : fldObjImage.fldObjVoiceNote !== null
              ? '🔊'
              : '🎙';
            const fldStrVoiceLabel = fldBooThumbRecording
              ? fldObjVoiceCopy.fldStrStop
              : fldObjImage.fldObjVoiceNote !== null
              ? fldObjVoiceCopy.fldStrHasNote
              : fldObjVoiceCopy.fldStrRecord;
            return (
              <View
                key={fldObjImage.fldStrId}
                testID={`thumb-${fldObjImage.fldStrId}`}
                style={scrCameraCaptureStyles.fldObjThumb}
              >
                <Pressable
                  testID={`thumb-open-${fldObjImage.fldStrId}`}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={fldObjCopy.fldStrPreviewTitle}
                  onPress={() => {
                    actSetDraftPreviewId(fldObjImage.fldStrId);
                  }}
                >
                  <Image
                    testID={`thumb-image-${fldObjImage.fldStrId}`}
                    source={{ uri: `file://${fldObjImage.fldStrLocalPath}` }}
                    style={[
                      scrCameraCaptureStyles.fldObjThumbImage,
                      {
                        transform: [
                          {
                            rotate: `${fldObjImage.fldNumRotationDegrees}deg`,
                          },
                        ],
                      },
                    ]}
                  />
                </Pressable>
                <Pressable
                  testID={`thumb-delete-${fldObjImage.fldStrId}`}
                  accessibilityRole="button"
                  accessibilityLabel={fldObjCopy.fldStrDelete}
                  style={scrCameraCaptureStyles.fldObjCornerTopLeft}
                  onPress={() => {
                    fncRunRemoveImage(fldObjImage.fldStrId);
                  }}
                >
                  <View style={scrCameraCaptureStyles.fldObjCornerDot}>
                    <VwText fldStrVariant="body">✕</VwText>
                  </View>
                </Pressable>
                <Pressable
                  testID={`thumb-rotate-${fldObjImage.fldStrId}`}
                  accessibilityRole="button"
                  accessibilityLabel={fldObjCopy.fldStrRotate}
                  style={scrCameraCaptureStyles.fldObjCornerBottomLeft}
                  onPress={() => {
                    actRotateImage(fldObjImage.fldStrId);
                  }}
                >
                  <View style={scrCameraCaptureStyles.fldObjCornerDot}>
                    <VwText fldStrVariant="body">⟳</VwText>
                  </View>
                </Pressable>
                <Pressable
                  testID={`thumb-voice-${fldObjImage.fldStrId}`}
                  accessibilityRole="button"
                  accessibilityLabel={fldStrVoiceLabel}
                  style={scrCameraCaptureStyles.fldObjCornerBottomRight}
                  onPress={() => {
                    fncRunThumbVoice(fldObjImage.fldStrId);
                  }}
                >
                  <View style={scrCameraCaptureStyles.fldObjCornerDot}>
                    <VwText fldStrVariant="body">{fldStrVoiceGlyph}</VwText>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );

  const fldObjFindNowButton =
    fldArrImages.length === 0 ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrFindNow}
          fldStrVariant="secondary"
          fldBooDisabled={fldBooFindNowDisabled}
          actHandOnPress={fncRunFindNow}
        />
      </View>
    );

  const fldBooMicUsable =
    fldStrMicPermission === 'granted' || fldStrMicPermission === 'limited';
  const fldBooPreviewRecording =
    fldObjPreviewItem !== null &&
    fldStrRecordingId === fldObjPreviewItem.fldStrId;
  const fldBooPreviewPlaying =
    fldObjPreviewItem !== null &&
    fldStrPlayingId === fldObjPreviewItem.fldStrId;

  const fldObjMicToggle =
    fldObjPreviewItem === null ? null : (
      <View style={scrCameraCaptureStyles.fldObjMicColumn}>
        {fldStrMicPermission === null && (
          <VwText fldStrVariant="caption">…</VwText>
        )}
        {fldStrMicPermission === 'denied' && (
          <Pressable
            testID="voice-mic-request"
            accessibilityRole="button"
            accessibilityLabel={fldObjVoiceCopy.fldStrMicRequest}
            disabled={fldBooMicRequesting}
            onPress={fncRunMicRequest}
          >
            <VwText fldStrVariant="caption">
              {fldObjVoiceCopy.fldStrMicRequest}
            </VwText>
          </Pressable>
        )}
        {fldStrMicPermission === 'blocked' && (
          <Pressable
            testID="voice-mic-settings"
            accessibilityRole="button"
            accessibilityLabel={fldObjVoiceCopy.fldStrMicOpenSettings}
            onPress={fncRunMicOpenSettings}
          >
            <VwText fldStrVariant="caption">
              {fldObjVoiceCopy.fldStrMicOpenSettings}
            </VwText>
          </Pressable>
        )}
        {fldStrMicPermission === 'unavailable' && (
          <VwText fldStrVariant="caption">
            {fldObjVoiceCopy.fldStrMicTitle}
          </VwText>
        )}
        {fldBooMicUsable &&
          (fldBooPreviewRecording ? (
            <View>
              <VwText fldStrVariant="caption">
                {fldObjVoiceCopy.fldStrRecording}
              </VwText>
              <Pressable
                testID="voice-stop"
                accessibilityRole="button"
                accessibilityLabel={fldObjVoiceCopy.fldStrStop}
                disabled={fldBooVoiceBusy}
                onPress={() => {
                  if (fldObjPreviewItem !== null) {
                    fncRunStopRecord(
                      fldObjPreviewItem.fldStrId,
                      fldObjPreviewItem.fldObjVoiceNote,
                    );
                  }
                }}
              >
                <VwText fldStrVariant="caption">
                  {fldObjVoiceCopy.fldStrStop}
                </VwText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID="voice-record"
              accessibilityRole="button"
              accessibilityLabel={fldObjVoiceCopy.fldStrRecord}
              disabled={fldBooVoiceBusy}
              onPress={() => {
                if (fldObjPreviewItem !== null) {
                  fncRunRecord(fldObjPreviewItem.fldStrId);
                }
              }}
            >
              <VwText fldStrVariant="caption">
                {fldObjVoiceCopy.fldStrRecord}
              </VwText>
            </Pressable>
          ))}
      </View>
    );

  const fldObjVoiceNote = fldObjPreviewItem?.fldObjVoiceNote ?? null;
  const fldStrNoteDuration =
    fldObjVoiceNote?.fldNumDurationSec === null ||
    fldObjVoiceNote?.fldNumDurationSec === undefined
      ? ''
      : ` · ${fncConvVoiceDuration(fldObjVoiceNote.fldNumDurationSec)}`;
  const fldObjVoiceRows =
    fldObjPreviewItem === null || fldObjVoiceNote === null ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwText fldStrVariant="caption">
          {`♪ ${fldObjVoiceCopy.fldStrHasNote}${fldStrNoteDuration}`}
        </VwText>
        <View style={scrCameraCaptureStyles.fldObjVoiceButtons}>
          {fldBooPreviewPlaying ? (
            <VwButton
              fldStrLabel={fldObjVoiceCopy.fldStrStop}
              fldStrVariant="secondary"
              actHandOnPress={fncRunStopListen}
            />
          ) : (
            <VwButton
              fldStrLabel={fldObjVoiceCopy.fldStrListen}
              fldStrVariant="secondary"
              fldBooDisabled={fldBooVoiceBusy}
              actHandOnPress={() => {
                if (fldObjPreviewItem !== null) {
                  fncRunListen(
                    fldObjPreviewItem.fldStrId,
                    fldObjVoiceNote.fldStrFilePath,
                  );
                }
              }}
            />
          )}
        </View>
        {fldBooReRecordConfirm && !fldBooPreviewPlaying ? (
          <View style={scrCameraCaptureStyles.fldObjClearRow}>
            <VwText fldStrVariant="caption">
              {fldObjVoiceCopy.fldStrReRecordTitle}
            </VwText>
            <View style={scrCameraCaptureStyles.fldObjClearButtons}>
              <View style={scrCameraCaptureStyles.fldObjClearButton}>
                <VwButton
                  fldStrLabel={fldObjVoiceCopy.fldStrReRecord}
                  fldStrVariant="secondary"
                  fldBooDisabled={fldBooVoiceBusy}
                  fldStrTestId="voice-rerecord-confirm"
                  actHandOnPress={() => {
                    if (fldObjPreviewItem !== null) {
                      actSetReRecordConfirm(false);
                      fncRunRecord(fldObjPreviewItem.fldStrId);
                    }
                  }}
                />
              </View>
              <View style={scrCameraCaptureStyles.fldObjClearButtonLast}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrCancel}
                  fldStrVariant="text"
                  fldStrTestId="voice-rerecord-cancel"
                  actHandOnPress={() => {
                    actSetReRecordConfirm(false);
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={scrCameraCaptureStyles.fldObjVoiceRow}>
            <View style={scrCameraCaptureStyles.fldObjVoiceHalf}>
              <VwButton
                fldStrLabel={fldObjVoiceCopy.fldStrReRecord}
                fldStrVariant="secondary"
                fldBooDisabled={fldBooVoiceBusy}
                actHandOnPress={() => {
                  actSetReRecordConfirm(true);
                }}
              />
            </View>
            <View style={scrCameraCaptureStyles.fldObjVoiceHalfLast}>
              <VwButton
                fldStrLabel={fldObjVoiceCopy.fldStrDeleteNote}
                fldStrVariant="secondary"
                actHandOnPress={() => {
                  if (fldObjPreviewItem !== null) {
                    fncRunDeleteNote(
                      fldObjPreviewItem.fldStrId,
                      fldObjVoiceNote,
                    );
                  }
                }}
              />
            </View>
          </View>
        )}
      </View>
    );

  const fldObjVoiceErrorSlot =
    fldStrVoiceError === null ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwEmptyState
          fldStrTitle={fldObjVoiceCopy.fldStrVoiceError}
          fldStrMessage={fldStrVoiceError}
        />
      </View>
    );

  const fldObjFindNowOverlay =
    fldArrImages.length === 0 ? null : (
      <View style={scrCameraCaptureStyles.fldObjFindNowOverlay}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrFindNow}
          fldStrVariant="pill"
          fldBooDisabled={fldBooFindNowDisabled}
          actHandOnPress={fncRunFindNow}
        />
      </View>
    );

  const fldBooBottomBusy = fldBooCapturing || fldBooIntaking;
  const fldObjBottomBar = (
    <View style={scrCameraCaptureStyles.fldObjBottomBar}>
      {fldArrImages.length > 0 && (
        <VwText fldStrVariant="caption">
          {fldArrImages.length === 1
            ? `1 ${fldObjCopy.fldStrPhotoAdded}`
            : `${fldArrImages.length} ${fldObjCopy.fldStrPhotosAdded}`}
        </VwText>
      )}
      <View style={scrCameraCaptureStyles.fldObjBottomRow}>
        <Pressable
          testID="gallery-pick"
          accessibilityRole="button"
          accessibilityLabel={fldObjCopy.fldStrChooseGallery}
          disabled={fldBooBottomBusy}
          style={[
            scrCameraCaptureStyles.fldObjClipButton,
            fldBooBottomBusy && scrCameraCaptureStyles.fldObjDimmed,
          ]}
          onPress={fncRunChooseGallery}
        >
          <VwText fldStrVariant="rowTitle">📎</VwText>
        </Pressable>
        <Pressable
          testID="camera-shutter"
          accessibilityRole="button"
          accessibilityLabel={fldObjCopy.fldStrShutter}
          disabled={fldBooBottomBusy}
          style={[
            scrCameraCaptureStyles.fldObjShutterButton,
            fldBooBottomBusy && scrCameraCaptureStyles.fldObjDimmed,
          ]}
          onPress={fncRunShutter}
        >
          <Text style={scrCameraCaptureStyles.fldObjShutterLabel}>
            {fldObjCopy.fldStrShutterShort}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const fldObjMicNotice =
    fldObjPreviewItem === null ||
    fldStrMicPermission === null ||
    fldBooMicUsable ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwEmptyState
          fldStrTitle={
            fldStrMicPermission === 'blocked'
              ? fldObjVoiceCopy.fldStrMicBlockedTitle
              : fldObjVoiceCopy.fldStrMicTitle
          }
          fldStrMessage={
            fldStrMicPermission === 'blocked'
              ? fldObjVoiceCopy.fldStrMicBlockedMessage
              : fldObjVoiceCopy.fldStrMicMessage
          }
        />
      </View>
    );

  if (!fldBooModeValid) {
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrModeError} />
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrClose}
            fldStrVariant="text"
            actHandOnPress={actHandOnClose}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrPermission === null) {
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrPreparing} />
      </SafeAreaView>
    );
  }

  if (fldStrPermission === 'denied') {
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrPermissionTitle}
          fldStrMessage={fldObjCopy.fldStrPermissionMessage}
        />
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRequest}
            fldBooLoading={fldBooRequesting}
            actHandOnPress={fncRunRequest}
          />
        </View>
        {fldObjIntakeErrorSlot}
        {fldObjGalleryButton}
        {fldArrImages.length === 0 && fldObjDraftEmptySlot}
        {fldObjThumbnailStrip}
        {fldObjFindNowButton}
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
          fldStrVariant="text"
          actHandOnPress={actHandOnClose}
        />
      </SafeAreaView>
    );
  }

  if (fldStrPermission === 'blocked') {
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrBlockedTitle}
          fldStrMessage={fldObjCopy.fldStrBlockedMessage}
        />
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrOpenSettings}
            actHandOnPress={fncRunOpenSettings}
          />
        </View>
        {fldObjIntakeErrorSlot}
        {fldObjGalleryButton}
        {fldArrImages.length === 0 && fldObjDraftEmptySlot}
        {fldObjThumbnailStrip}
        {fldObjFindNowButton}
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
          fldStrVariant="text"
          actHandOnPress={actHandOnClose}
        />
      </SafeAreaView>
    );
  }

  if (fldStrPermission === 'unavailable' || fldObjDevice === undefined) {
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoDeviceTitle} />
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrClose}
            fldStrVariant="text"
            actHandOnPress={actHandOnClose}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldObjPreview !== null) {
    // nitro-image 0.15.2 forwards the documented style/resizeMode
    // props to the native view (README uses them; the JS wrapper
    // spreads all extra props) but its NitroImageProps helper drops
    // them from the declared type, so they travel through a spread
    // object instead of inline attributes. Revisit on upgrade.
    const fldObjPreviewImageProps = {
      image: fldObjPreview.fldObjImage,
      resizeMode: 'cover' as const,
      style: scrCameraCaptureStyles.fldObjMedia,
    };
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <View style={scrCameraCaptureStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        </View>
        <View style={scrCameraCaptureStyles.fldObjPreview}>
          <NitroImage {...fldObjPreviewImageProps} />
        </View>
        {fldObjIntakeErrorSlot}
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={
              fldBooIntaking
                ? fldObjCopy.fldStrAdding
                : fldObjCopy.fldStrUsePhoto
            }
            fldBooLoading={fldBooIntaking}
            actHandOnPress={fncRunUsePhoto}
          />
        </View>
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetake}
            fldStrVariant="secondary"
            actHandOnPress={fncRunDisposePreview}
          />
        </View>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
          fldStrVariant="text"
          actHandOnPress={fncRunClose}
        />
      </SafeAreaView>
    );
  }

  if (fldObjPreviewItem !== null) {
    // The draft preview reads the same stored rotation degrees
    // the analysis step will bake into pixels — preview and
    // analysis orientation are one value, never two. The image
    // fits with contain (no crop, no stretch): contain lays out
    // before the transform runs, so quarter turns lay out in a
    // swapped box (measured once per container) that lands
    // exactly inside the frame after rotation. The bottom-right
    // corner stays empty for the future microphone.
    const fldObjDraftPreview = fldObjPreviewItem;
    const fldBooQuarterTurn =
      fldObjDraftPreview.fldNumRotationDegrees % 180 !== 0;
    // The swapped box needs centering (explicit size larger than
    // the frame on one axis); the plain flex image needs the
    // default stretch instead — centering would collapse it.
    const fldObjMeasuredBox = fldBooQuarterTurn ? fldObjPreviewBox : null;
    const fldObjDraftImageStyle =
      fldObjMeasuredBox !== null
        ? {
            width: fldObjMeasuredBox.fldNumHeight,
            height: fldObjMeasuredBox.fldNumWidth,
          }
        : scrCameraCaptureStyles.fldObjMedia;
    const fldObjDraftBoxStyle =
      fldObjMeasuredBox !== null
        ? scrCameraCaptureStyles.fldObjDraftPreviewBox
        : scrCameraCaptureStyles.fldObjPreview;
    return (
      <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
        <View style={scrCameraCaptureStyles.fldObjHeader}>
          <VwText fldStrVariant="header">
            {fldObjCopy.fldStrPreviewTitle}
          </VwText>
        </View>
        <View
          testID="draft-preview-box"
          style={fldObjDraftBoxStyle}
          onLayout={fldObjEvent => {
            actSetPreviewBox({
              fldNumWidth: fldObjEvent.nativeEvent.layout.width,
              fldNumHeight: fldObjEvent.nativeEvent.layout.height,
            });
          }}
        >
          <Image
            testID="draft-preview-image"
            source={{ uri: `file://${fldObjDraftPreview.fldStrLocalPath}` }}
            resizeMode="contain"
            style={[
              fldObjDraftImageStyle,
              {
                transform: [
                  { rotate: `${fldObjDraftPreview.fldNumRotationDegrees}deg` },
                ],
              },
            ]}
          />
        </View>
        <View style={scrCameraCaptureStyles.fldObjPreviewActions}>
          <View style={scrCameraCaptureStyles.fldObjPreviewButtons}>
            <View style={scrCameraCaptureStyles.fldObjPreviewButtonRow}>
              <View style={scrCameraCaptureStyles.fldObjPreviewButton}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrBack}
                  fldStrVariant="text"
                  actHandOnPress={fncRunLeavePreview}
                />
              </View>
              <View style={scrCameraCaptureStyles.fldObjPreviewButtonLast}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrRotate}
                  fldStrVariant="secondary"
                  actHandOnPress={() => {
                    actRotateImage(fldObjDraftPreview.fldStrId);
                  }}
                />
              </View>
            </View>
            <View style={scrCameraCaptureStyles.fldObjPreviewDeleteRow}>
              <VwButton
                fldStrLabel={fldObjCopy.fldStrDelete}
                fldStrVariant="secondary"
                actHandOnPress={() => {
                  fncRunRemoveImage(fldObjDraftPreview.fldStrId);
                }}
              />
            </View>
          </View>
          <View
            testID="mic-reserve"
            accessibilityLabel="microphone area"
            style={scrCameraCaptureStyles.fldObjMicReserve}
          >
            {fldObjMicToggle}
          </View>
        </View>
        {fldObjMicNotice}
        {fldObjVoiceErrorSlot}
        {fldObjVoiceRows}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrCameraCaptureStyles.fldObjBareScreen}>
      {fldStrCaptureError !== null && (
        <View style={scrCameraCaptureStyles.fldObjGap}>
          <VwEmptyState
            fldStrTitle={fldObjCopy.fldStrCaptureError}
            fldStrMessage={fldStrCaptureError}
          />
        </View>
      )}
      {fldObjThumbnailStrip}
      <View style={scrCameraCaptureStyles.fldObjPreview}>
        <View style={scrCameraCaptureStyles.fldObjCameraFrame}>
          <Camera
            style={scrCameraCaptureStyles.fldObjMedia}
            device={fldObjDevice}
            outputs={[fldObjPhotoOutput]}
            isActive={fldBooSessionActive}
            resizeMode="cover"
            orientationSource="device"
          />
          {fldObjFindNowOverlay}
        </View>
      </View>
      {fldObjBottomBar}
      {fldObjIntakeErrorSlot}
    </SafeAreaView>
  );
}

const scrCameraCaptureStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjBareScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fldObjHeader: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
    marginBottom: fldNumSpacingSm,
  },
  fldObjPreview: {
    flex: 1,
    marginBottom: fldNumSpacingMd,
  },
  fldObjDraftPreviewBox: {
    flex: 1,
    marginBottom: fldNumSpacingMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjMedia: {
    flex: 1,
  },
  fldObjStripPanel: {
    backgroundColor: '#000000',
    padding: fldNumSpacingMd,
  },
  fldObjClearLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colDanger,
  },
  fldObjStrip: {
    flexDirection: 'row',
  },
  fldObjThumb: {
    width: 112,
    height: 104,
    marginRight: fldNumSpacingSm,
    position: 'relative',
  },
  fldObjThumbImage: {
    width: 112,
    height: 104,
    borderRadius: 8,
  },
  fldObjCornerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjPreviewActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: fldNumSpacingSm,
  },
  fldObjPreviewButtons: {
    flex: 1,
  },
  fldObjPreviewButtonRow: {
    flexDirection: 'row',
    marginBottom: fldNumSpacingSm,
  },
  fldObjPreviewButton: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
  fldObjPreviewButtonLast: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
  fldObjPreviewDeleteRow: {
    marginRight: fldNumSpacingSm,
  },
  fldObjMicReserve: {
    width: 88,
    minHeight: 88,
  },
  fldObjMicColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fldObjStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: fldNumSpacingSm,
  },
  fldObjClearRow: {
    marginBottom: fldNumSpacingSm,
  },
  fldObjClearButtons: {
    flexDirection: 'row',
    marginTop: fldNumSpacingSm,
  },
  fldObjClearButton: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
  fldObjClearButtonLast: {
    flex: 1,
  },
  fldObjCameraFrame: {
    flex: 1,
    position: 'relative',
  },
  fldObjFindNowOverlay: {
    position: 'absolute',
    top: fldNumSpacingSm,
    right: fldNumSpacingSm,
    minWidth: 118,
  },
  fldObjBottomBar: {
    alignItems: 'center',
    marginBottom: fldNumSpacingMd,
  },
  fldObjBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: fldNumSpacingSm,
  },
  fldObjClipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colScrim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: fldNumSpacingMd,
  },
  fldObjShutterButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colTextPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjShutterLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'bold',
    color: colTextOnAccent,
  },
  fldObjDimmed: {
    opacity: 0.5,
  },
  fldObjVoiceButtons: {
    marginTop: fldNumSpacingSm,
  },
  fldObjVoiceRow: {
    flexDirection: 'row',
    marginTop: fldNumSpacingSm,
  },
  fldObjVoiceHalf: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
  fldObjVoiceHalfLast: {
    flex: 1,
  },
});
