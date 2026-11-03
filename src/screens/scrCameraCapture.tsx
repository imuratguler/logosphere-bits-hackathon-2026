/**
 * Logosphere BITS — live camera capture screen (demo plane).
 *
 * Rear camera with a v5 photo output, viewfinder, and shutter:
 * the leaf Single/Bulk entries open this same screen with the
 * D10 mode and its target, validated once at entry (fail-closed
 * error state, never re-asked). The shutter adds the capture
 * straight into the draft (no interim screen). Every settled
 * branch also offers gallery multi-select — gallery works with
 * the camera denied or blocked, cancel is silent, and one
 * in-flight guard blocks double-tap concurrency.
 *
 * Layout follows Expected 020-026 exactly: an empty draft shows
 * only the full-bleed viewfinder with a round gallery clip and a
 * large round shutter overlaid at its foot; a filled draft adds
 * the black counter panel with a red Clear, overlay corner
 * actions per thumbnail (top-left delete, bottom-left rotate,
 * bottom-right voice; top-right stays empty), a single pill
 * Find Now over the viewfinder, and the added-photos counter
 * above the shutter bar. Draft state lives in the draft hook
 * (mode + target fixed at open, stable UUIDs per image):
 * tap-to-open fits the image aspect-correct in the large draft
 * preview (Expected 027) with an equal-width action bar —
 * back, rotate, mic/speaker, delete-audio (noted only), and a
 * red delete. The preview rotation reads the same stored
 * degrees the analysis step will bake into pixels, so the two
 * can never disagree. Find Now is hidden while the draft is
 * empty, disabled unless the camera is ready and idle, and its
 * press hands the draft photos to the analysis flow. The
 * session runs only while focused, foregrounded, granted, and
 * without any open draft preview; permission states ride on the
 * project camera permission flow (react-native-permissions),
 * never on the camera kit's own permission hook. The shutter
 * reads orientation from the physical device posture.
 *
 * Each draft image holds at most one voice note (F6): the
 * thumbnail voice corner and the preview mic open record/play
 * sheets (the mark switches to a speaker once a note exists,
 * back to a mic once it is deleted) with their own microphone
 * flow. Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCameraCapture); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import {
  AppState,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { vwButton as VwButton } from '../components/vwButton';
import { vwDeleteConfirmModal as VwDeleteConfirmModal } from '../components/vwDeleteConfirmModal';
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
  srvApiSeekVoicePlayback,
  srvApiSetVoicePlaybackEndHandler,
  srvApiSetVoicePlaybackProgressHandler,
  srvApiStartVoicePlayback,
  srvApiStartVoiceRecording,
  srvApiStopVoicePlayback,
  srvApiStopVoiceRecording,
} from '../services/srvVoiceNote';
import {
  colAccentBlue,
  colBackground,
  colDanger,
  colDelete,
  colDeleteSoft,
  colScrim,
  colScrimLight,
  colSurface,
  colTextPrimary,
  colTextSecondary,
  fldNumRadiusLg,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUiMedium,
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

type fldObjVoiceModalState = {
  fldStrKind: 'record' | 'play';
  fldStrId: string;
};

type fldObjDeleteConfirmState = {
  fldStrKind: 'image' | 'audio';
};

function fncRunVoidModalBack(): void {
  return undefined;
}

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
  const [fldStrDraftPreviewId, actSetDraftPreviewId] = React.useState<
    string | null
  >(null);
  const [fldObjVoiceModal, actSetVoiceModal] =
    React.useState<fldObjVoiceModalState | null>(null);
  const [fldObjDeleteConfirm, actSetDeleteConfirm] =
    React.useState<fldObjDeleteConfirmState | null>(null);
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
  const [fldNumRecordStartMs, actSetRecordStartMs] = React.useState<
    number | null
  >(null);
  const [fldNumRecordTick, actSetRecordTick] = React.useState(0);
  const [fldStrMicPermission, actSetMicPermission] =
    React.useState<fldStrMicPermissionStatus | null>(null);
  const [fldBooMicRequesting, actSetMicRequesting] = React.useState(false);
  const [fldStrRecordingId, actSetRecordingId] = React.useState<string | null>(
    null,
  );
  const [fldStrPlayingId, actSetPlayingId] = React.useState<string | null>(
    null,
  );
  const [fldNumPlayheadSec, actSetPlayheadSec] = React.useState(0);
  const [fldNumPlayDurationSec, actSetPlayDurationSec] = React.useState<
    number | null
  >(null);
  const fldNumPlayheadRef = React.useRef(0);
  const fldNumPlayTotalRef = React.useRef(0);
  const fldNumPlayBarWidthRef = React.useRef(0);
  const [fldBooVoiceBusy, actSetVoiceBusy] = React.useState(false);
  const [fldStrVoiceError, actSetVoiceError] = React.useState<string | null>(
    null,
  );
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

  // The record sheet shows a live elapsed clock while the
  // recorder runs; the tick only advances an already-open sheet.
  React.useEffect(() => {
    if (
      fldObjVoiceModal?.fldStrKind !== 'record' ||
      fldStrRecordingId === null
    ) {
      return undefined;
    }
    const fldNumTimer = setInterval(() => {
      actSetRecordTick(fldNumTick => fldNumTick + 1);
    }, 500);
    return () => {
      clearInterval(fldNumTimer);
    };
  }, [fldObjVoiceModal, fldStrRecordingId]);

  React.useEffect(() => {
    srvApiSetVoicePlaybackEndHandler(() => {
      fldStrPlayingIdRef.current = null;
      actSetPlayingId(null);
      actSetPlayheadSec(0);
    });
    srvApiSetVoicePlaybackProgressHandler(
      (fldNumSec: number, fldNumDurationSec: number | null) => {
        actSetPlayheadSec(fldNumSec);
        if (fldNumDurationSec !== null) {
          actSetPlayDurationSec(fldNumDurationSec);
        }
      },
    );
    return () => {
      srvApiSetVoicePlaybackEndHandler(null);
      srvApiSetVoicePlaybackProgressHandler(null);
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
            actSetRecordStartMs(Date.now());
            actSetRecordTick(0);
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
          actSetRecordStartMs(null);
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
          actSetVoiceModal(null);
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
      if (fldObjItem === null || fldStrRecordingIdRef.current !== null) {
        return;
      }
      if (fldObjItem.fldObjVoiceNote !== null) {
        actSetVoiceError(null);
        actSetVoiceModal({ fldStrKind: 'play', fldStrId });
        return;
      }
      actSetVoiceError(null);
      actSetVoiceModal({ fldStrKind: 'record', fldStrId });
      if (
        fldStrMicPermission === 'granted' ||
        fldStrMicPermission === 'limited'
      ) {
        fncRunRecord(fldStrId);
      }
    },
    [fldArrImages, fldStrMicPermission, fncRunRecord],
  );

  const fncRunModalMicRequest = React.useCallback(
    (fldStrId: string) => {
      if (fldBooMicRequesting) {
        return;
      }
      actSetMicRequesting(true);
      srvApiRequestMicPermission().then(
        fldStrStatus => {
          actSetMicRequesting(false);
          actSetMicPermission(fldStrStatus);
          if (fldStrStatus === 'granted' || fldStrStatus === 'limited') {
            fncRunRecord(fldStrId);
          }
        },
        () => {
          actSetMicRequesting(false);
          actSetMicPermission('unavailable');
        },
      );
    },
    [fldBooMicRequesting, fncRunRecord],
  );

  const fncRunCancelRecord = React.useCallback(
    (fldStrId: string) => {
      if (fldBooVoiceBusy || fldStrRecordingIdRef.current !== fldStrId) {
        return;
      }
      actSetVoiceError(null);
      actSetVoiceBusy(true);
      srvApiStopVoiceRecording().then(
        fldObjDone => {
          fldStrRecordingIdRef.current = null;
          actSetRecordingId(null);
          actSetRecordStartMs(null);
          actSetVoiceBusy(false);
          srvApiDeleteVoiceFile(fldObjDone.fldStrPath).catch(() => undefined);
          actSetVoiceModal(null);
        },
        (fldObjError: unknown) => {
          fldStrRecordingIdRef.current = null;
          actSetRecordingId(null);
          actSetRecordStartMs(null);
          actSetVoiceBusy(false);
          actSetVoiceError((fldObjError as Error).message);
        },
      );
    },
    [fldBooVoiceBusy],
  );

  const fncRunSeekPlay = React.useCallback((fldNumLocationX: number) => {
    const fldNumWidth = fldNumPlayBarWidthRef.current;
    const fldNumTotal = fldNumPlayTotalRef.current;
    if (fldNumWidth <= 0 || fldNumTotal <= 0) {
      return;
    }
    const fldNumRatio = Math.min(1, Math.max(0, fldNumLocationX / fldNumWidth));
    const fldNumSec = fldNumRatio * fldNumTotal;
    fldNumPlayheadRef.current = fldNumSec;
    actSetPlayheadSec(fldNumSec);
    srvApiSeekVoicePlayback(fldNumSec).catch(() => undefined);
  }, []);

  const fldObjPlaySeekPan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: fldObjEvent => {
        fncRunSeekPlay(fldObjEvent.nativeEvent.locationX);
      },
      onPanResponderMove: fldObjEvent => {
        fncRunSeekPlay(fldObjEvent.nativeEvent.locationX);
      },
    }),
  ).current;

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
      srvApiStartVoicePlayback(fldStrPath, fldNumPlayheadRef.current).then(
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
    actSetPlayheadSec(0);
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

  const fncRunFinishIntake = React.useCallback(() => {
    fldBooIntakingRef.current = false;
    actSetIntaking(false);
  }, []);

  const fncRunShutter = React.useCallback(() => {
    if (
      fldBooCapturing ||
      fldBooIntakingRef.current ||
      fldObjPreviewItem !== null
    ) {
      return;
    }
    actSetCaptureError(null);
    actSetIntakeError(null);
    actSetCapturing(true);
    fldObjPhotoOutput
      .capturePhoto({}, {})
      .then(async fldObjPhoto => {
        try {
          const fldObjImage = await srvApiPrepareCapturePreview(fldObjPhoto);
          try {
            const fldObjEntry = await srvApiSaveCaptureImageToDraftFile(
              fldObjImage,
              fldArrImages.length,
            );
            actAddImages([fldObjEntry]);
          } catch (fldObjError) {
            actSetIntakeError((fldObjError as Error).message);
          } finally {
            fldObjPhoto.dispose();
          }
        } catch (fldObjError) {
          actSetCaptureError((fldObjError as Error).message);
        } finally {
          actSetCapturing(false);
        }
      })
      .catch((fldObjError: unknown) => {
        actSetCapturing(false);
        actSetCaptureError((fldObjError as Error).message);
      });
  }, [
    actAddImages,
    fldArrImages.length,
    fldBooCapturing,
    fldObjPhotoOutput,
    fldObjPreviewItem,
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
      actSetVoiceModal(null);
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
    actSetVoiceModal(null);
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

  const fncRunClosePlay = React.useCallback(() => {
    fncRunStopListen();
    actSetVoiceModal(null);
  }, [fncRunStopListen]);

  const fldBooUsablePermission =
    fldStrPermission === 'granted' || fldStrPermission === 'limited';
  const fldBooCameraReady =
    fldBooUsablePermission && fldObjDevice !== undefined;
  const fldBooSessionActive =
    fldBooFocused &&
    fldBooForeground &&
    fldBooUsablePermission &&
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
            const fldStrVoiceGlyph =
              fldObjImage.fldObjVoiceNote !== null ? '🔊' : '🎙';
            const fldStrVoiceLabel =
              fldObjImage.fldObjVoiceNote !== null
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
                    <VwText
                      fldStrVariant="body"
                      fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
                    >
                      ✕
                    </VwText>
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
                    <VwText
                      fldStrVariant="body"
                      fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
                    >
                      ⟳
                    </VwText>
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
                    <VwText
                      fldStrVariant="body"
                      fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
                    >
                      {fldStrVoiceGlyph}
                    </VwText>
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
  const fldObjModalItem =
    fldObjVoiceModal === null
      ? null
      : fldArrImages.find(
          fldObjImage => fldObjImage.fldStrId === fldObjVoiceModal.fldStrId,
        ) ?? null;
  const fldStrRecordElapsed = React.useMemo(() => {
    if (fldNumRecordStartMs === null) {
      return '0:00';
    }
    return fncConvVoiceDuration(
      Math.max(0, Math.floor((Date.now() - fldNumRecordStartMs) / 1000)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fldNumRecordStartMs, fldNumRecordTick]);
  const fldStrPlayDuration =
    fldObjModalItem?.fldObjVoiceNote?.fldNumDurationSec === null ||
    fldObjModalItem?.fldObjVoiceNote?.fldNumDurationSec === undefined
      ? ''
      : ` · ${fncConvVoiceDuration(
          fldObjModalItem.fldObjVoiceNote.fldNumDurationSec,
        )}`;
  const fldNumPlayTotalSec =
    fldObjModalItem?.fldObjVoiceNote?.fldNumDurationSec ??
    fldNumPlayDurationSec ??
    0;
  const fldNumPlayPct =
    fldNumPlayTotalSec > 0
      ? Math.min(
          100,
          Math.max(0, (fldNumPlayheadSec / fldNumPlayTotalSec) * 100),
        )
      : 0;
  const fldStrPlayElapsed = `${fncConvVoiceDuration(
    Math.floor(fldNumPlayheadSec),
  )} / ${fncConvVoiceDuration(fldNumPlayTotalSec)}`;
  React.useEffect(() => {
    fldNumPlayTotalRef.current = fldNumPlayTotalSec;
  }, [fldNumPlayTotalSec]);
  React.useEffect(() => {
    fldNumPlayheadRef.current = fldNumPlayheadSec;
  }, [fldNumPlayheadSec]);

  const fldObjRecordModal =
    fldObjVoiceModal?.fldStrKind !== 'record' ||
    fldObjModalItem === null ? null : (
      <Modal
        transparent={true}
        animationType="fade"
        visible={true}
        onRequestClose={fncRunVoidModalBack}
      >
        <View
          testID="voice-record-modal"
          style={scrCameraCaptureStyles.fldObjModalOverlay}
        >
          <View style={scrCameraCaptureStyles.fldObjModalCard}>
            {fldBooMicUsable &&
            fldStrRecordingId === fldObjModalItem.fldStrId ? (
              <View>
                <View style={scrCameraCaptureStyles.fldObjRecordHead}>
                  <View style={scrCameraCaptureStyles.fldObjRecordDot} />
                  <VwText fldStrVariant="rowTitle">
                    {`${fldObjVoiceCopy.fldStrRecording} ${fldStrRecordElapsed}`}
                  </VwText>
                </View>
                <VwButton
                  fldStrLabel={fldObjVoiceCopy.fldStrStop}
                  fldStrVariant="secondary"
                  fldStrTestId="voice-modal-stop"
                  fldBooDisabled={fldBooVoiceBusy}
                  actHandOnPress={() => {
                    fncRunStopRecord(
                      fldObjModalItem.fldStrId,
                      fldObjModalItem.fldObjVoiceNote,
                    );
                  }}
                />
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrCancel}
                  fldStrVariant="text"
                  fldStrTestId="voice-modal-cancel"
                  actHandOnPress={() => {
                    fncRunCancelRecord(fldObjModalItem.fldStrId);
                  }}
                />
              </View>
            ) : (
              <View>
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
                {fldStrMicPermission === 'denied' && (
                  <VwButton
                    fldStrLabel={fldObjVoiceCopy.fldStrMicRequest}
                    fldStrVariant="secondary"
                    fldStrTestId="voice-mic-request"
                    fldBooDisabled={fldBooMicRequesting}
                    actHandOnPress={() => {
                      fncRunModalMicRequest(fldObjModalItem.fldStrId);
                    }}
                  />
                )}
                {fldStrMicPermission === 'blocked' && (
                  <VwButton
                    fldStrLabel={fldObjVoiceCopy.fldStrMicOpenSettings}
                    fldStrVariant="secondary"
                    fldStrTestId="voice-mic-settings"
                    actHandOnPress={fncRunMicOpenSettings}
                  />
                )}
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrCancel}
                  fldStrVariant="text"
                  fldStrTestId="voice-modal-cancel"
                  actHandOnPress={() => {
                    actSetVoiceModal(null);
                  }}
                />
              </View>
            )}
            {fldStrVoiceError !== null && (
              <VwEmptyState
                fldStrTitle={fldObjVoiceCopy.fldStrVoiceError}
                fldStrMessage={fldStrVoiceError}
              />
            )}
          </View>
        </View>
      </Modal>
    );

  const fldObjPlayModal =
    fldObjVoiceModal?.fldStrKind !== 'play' ||
    fldObjModalItem?.fldObjVoiceNote === null ||
    fldObjModalItem?.fldObjVoiceNote === undefined ? null : (
      <Modal
        transparent={true}
        animationType="fade"
        visible={true}
        onRequestClose={fncRunVoidModalBack}
      >
        <View
          testID="voice-play-modal"
          style={scrCameraCaptureStyles.fldObjModalOverlay}
        >
          <View style={scrCameraCaptureStyles.fldObjModalCard}>
            <VwText fldStrVariant="rowTitle">
              {`♪ ${fldObjVoiceCopy.fldStrHasNote}${fldStrPlayDuration}`}
            </VwText>
            <View style={scrCameraCaptureStyles.fldObjPlayProgressWrap}>
              <View
                testID="voice-play-progress"
                style={scrCameraCaptureStyles.fldObjPlayTouchZone}
                onLayout={fldObjEvent => {
                  fldNumPlayBarWidthRef.current =
                    fldObjEvent.nativeEvent.layout.width;
                }}
                {...fldObjPlaySeekPan.panHandlers}
              >
                <View style={scrCameraCaptureStyles.fldObjPlayProgressTrack}>
                  <View
                    style={[
                      scrCameraCaptureStyles.fldObjPlayProgressFill,
                      { width: `${fldNumPlayPct}%` },
                    ]}
                  />
                </View>
                <View
                  style={[
                    scrCameraCaptureStyles.fldObjPlayKnob,
                    { left: `${fldNumPlayPct}%` },
                  ]}
                />
              </View>
              <View testID="voice-play-elapsed">
                <VwText
                  fldStrVariant="caption"
                  fldObjStyle={scrCameraCaptureStyles.fldObjPlayElapsed}
                >
                  {fldStrPlayElapsed}
                </VwText>
              </View>
            </View>
            {fldStrPlayingId === fldObjModalItem.fldStrId ? (
              <VwButton
                fldStrLabel={fldObjVoiceCopy.fldStrStop}
                fldStrVariant="secondary"
                fldStrTestId="voice-modal-stop-play"
                actHandOnPress={fncRunStopListen}
              />
            ) : (
              <VwButton
                fldStrLabel={fldObjVoiceCopy.fldStrListen}
                fldStrVariant="secondary"
                fldStrTestId="voice-modal-listen"
                fldBooDisabled={fldBooVoiceBusy}
                actHandOnPress={() => {
                  const fldObjNote = fldObjModalItem.fldObjVoiceNote;
                  if (fldObjNote !== null && fldObjNote !== undefined) {
                    fncRunListen(
                      fldObjModalItem.fldStrId,
                      fldObjNote.fldStrFilePath,
                    );
                  }
                }}
              />
            )}
            <VwButton
              fldStrLabel={fldObjCopy.fldStrClose}
              fldStrVariant="text"
              fldStrTestId="voice-modal-close"
              actHandOnPress={fncRunClosePlay}
            />
          </View>
        </View>
      </Modal>
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
        <VwText fldStrVariant="body">
          {fldArrImages.length === 1
            ? `1 ${fldObjCopy.fldStrPhotoAdded}`
            : `${fldArrImages.length} ${fldObjCopy.fldStrPhotosAdded}`}
        </VwText>
      )}
      <View style={scrCameraCaptureStyles.fldObjBottomRow}>
        <View style={scrCameraCaptureStyles.fldObjBottomCell}>
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
        </View>
        <View style={scrCameraCaptureStyles.fldObjBottomCell}>
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
            <Text style={scrCameraCaptureStyles.fldObjShutterLabel}>📷</Text>
          </Pressable>
        </View>
        <View style={scrCameraCaptureStyles.fldObjBottomCell} />
      </View>
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

  if (fldObjPreviewItem !== null) {
    // The draft preview reads the same stored rotation degrees
    // the analysis step will bake into pixels — preview and
    // analysis orientation are one value, never two. The image
    // fits with contain (no crop, no stretch): contain lays out
    // before the transform runs, so quarter turns lay out in a
    // swapped box (measured once per container) that lands
    // exactly inside the frame after rotation.
    const fldObjDraftPreview = fldObjPreviewItem;
    const fldBooDraftHasNote = fldObjDraftPreview.fldObjVoiceNote !== null;
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
      <SafeAreaView style={scrCameraCaptureStyles.fldObjBareScreen}>
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
        <View style={scrCameraCaptureStyles.fldObjPreviewBar}>
          <Pressable
            testID="preview-back"
            accessibilityRole="button"
            accessibilityLabel={fldObjCopy.fldStrBack}
            style={scrCameraCaptureStyles.fldObjPreviewBackButton}
            onPress={fncRunLeavePreview}
          >
            <VwText
              fldStrVariant="body"
              fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
            >
              ◀
            </VwText>
          </Pressable>
          <Pressable
            testID="preview-rotate"
            accessibilityRole="button"
            accessibilityLabel={fldObjCopy.fldStrRotate}
            style={scrCameraCaptureStyles.fldObjPreviewDarkButton}
            onPress={() => {
              actRotateImage(fldObjDraftPreview.fldStrId);
            }}
          >
            <VwText
              fldStrVariant="body"
              fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
            >
              ⟳
            </VwText>
          </Pressable>
          <Pressable
            testID="preview-mic"
            accessibilityRole="button"
            accessibilityLabel={
              fldBooDraftHasNote
                ? fldObjVoiceCopy.fldStrHasNote
                : fldObjVoiceCopy.fldStrRecord
            }
            style={scrCameraCaptureStyles.fldObjPreviewDarkButton}
            onPress={() => {
              fncRunThumbVoice(fldObjDraftPreview.fldStrId);
            }}
          >
            <VwText
              fldStrVariant="body"
              fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
            >
              {fldBooDraftHasNote ? '🔊' : '🎙'}
            </VwText>
          </Pressable>
          {fldBooDraftHasNote && (
            <Pressable
              testID="preview-delete-audio"
              accessibilityRole="button"
              accessibilityLabel={fldObjVoiceCopy.fldStrDeleteAudio}
              style={scrCameraCaptureStyles.fldObjPreviewSoftButton}
              onPress={() => {
                actSetDeleteConfirm({ fldStrKind: 'audio' });
              }}
            >
              <VwText
                fldStrVariant="body"
                fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
              >
                🔇
              </VwText>
            </Pressable>
          )}
          <Pressable
            testID="preview-delete"
            accessibilityRole="button"
            accessibilityLabel={fldObjCopy.fldStrDelete}
            style={scrCameraCaptureStyles.fldObjPreviewDeleteButton}
            onPress={() => {
              actSetDeleteConfirm({ fldStrKind: 'image' });
            }}
          >
            <VwText
              fldStrVariant="body"
              fldObjStyle={scrCameraCaptureStyles.fldObjCornerGlyph}
            >
              🗑️
            </VwText>
          </Pressable>
        </View>
        {fldObjVoiceErrorSlot}
        {fldObjRecordModal}
        {fldObjPlayModal}
        {fldObjDeleteConfirm !== null && (
          <VwDeleteConfirmModal
            fldBooVisible={true}
            fldStrTitle={
              fldObjDeleteConfirm.fldStrKind === 'image'
                ? fldObjCopy.fldStrDeletePhotoTitle
                : fldObjVoiceCopy.fldStrDeleteAudioTitle
            }
            fldStrSummary={
              fldObjDeleteConfirm.fldStrKind === 'image'
                ? fldObjCopy.fldStrDeletePhotoSummary
                : fldObjVoiceCopy.fldStrDeleteAudioSummary
            }
            fldStrBlockedReason={null}
            fldBooLoading={false}
            fldStrLoading=""
            fldStrLoadErrorTitle=""
            fldStrLoadError={null}
            fldStrRetry=""
            actHandOnRetry={() => undefined}
            fldStrConfirmLabel={
              fldObjDeleteConfirm.fldStrKind === 'image'
                ? fldObjCopy.fldStrDelete
                : fldObjVoiceCopy.fldStrDeleteAudio
            }
            fldBooConfirmDisabled={false}
            fldBooWorking={false}
            fldStrErrorTitle=""
            fldStrError={null}
            actHandOnConfirm={() => {
              if (fldObjDeleteConfirm.fldStrKind === 'image') {
                fncRunRemoveImage(fldObjDraftPreview.fldStrId);
              } else {
                const fldObjNote = fldObjDraftPreview.fldObjVoiceNote;
                if (fldObjNote !== null) {
                  fncRunDeleteNote(fldObjDraftPreview.fldStrId, fldObjNote);
                }
              }
              actSetDeleteConfirm(null);
            }}
            fldStrCancelLabel={fldObjCopy.fldStrCancel}
            actHandOnCancel={() => actSetDeleteConfirm(null)}
          />
        )}
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
          {fldObjBottomBar}
        </View>
      </View>
      {fldObjIntakeErrorSlot}
      {fldObjRecordModal}
      {fldObjPlayModal}
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
    fontFamily: fldStrFontFamilyUiMedium,
    fontSize: 20,
    lineHeight: 28,
    color: colDanger,
  },
  fldObjCornerGlyph: {
    fontSize: 22,
    lineHeight: 28,
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
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 3,
  },
  fldObjCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 3,
  },
  fldObjCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 3,
  },
  fldObjPreviewBar: {
    flexDirection: 'row',
    padding: fldNumSpacingMd,
  },
  fldObjPreviewBackButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colTextSecondary,
    borderRadius: fldNumRadiusMd,
    marginRight: fldNumSpacingSm,
    paddingHorizontal: fldNumSpacingSm,
  },
  fldObjPreviewDarkButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colSurface,
    borderRadius: fldNumRadiusMd,
    marginRight: fldNumSpacingSm,
  },
  fldObjPreviewSoftButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colDeleteSoft,
    borderRadius: fldNumRadiusMd,
    marginRight: fldNumSpacingSm,
    paddingHorizontal: fldNumSpacingSm,
  },
  fldObjPreviewDeleteButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colDelete,
    borderRadius: fldNumRadiusMd,
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: fldNumSpacingMd,
    alignItems: 'center',
  },
  fldObjBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: fldNumSpacingSm,
  },
  fldObjBottomCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjClipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colScrimLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  fldObjDimmed: {
    opacity: 0.5,
  },
  fldObjModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colScrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: fldNumSpacingMd,
  },
  fldObjPlayProgressWrap: {
    marginVertical: fldNumSpacingSm,
  },
  fldObjPlayTouchZone: {
    height: 40,
    justifyContent: 'center',
  },
  fldObjPlayProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colScrimLight,
    overflow: 'hidden',
  },
  fldObjPlayProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colAccentBlue,
  },
  fldObjPlayKnob: {
    position: 'absolute',
    top: 13,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: colTextPrimary,
  },
  fldObjPlayElapsed: {
    color: colTextPrimary,
    textAlign: 'center',
    marginTop: fldNumSpacingSm,
  },
  fldObjModalCard: {
    alignSelf: 'stretch',
    backgroundColor: colSurface,
    borderRadius: fldNumRadiusLg,
    padding: fldNumSpacingMd,
  },
  fldObjRecordHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: fldNumSpacingSm,
  },
  fldObjRecordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colDelete,
    marginRight: fldNumSpacingSm,
  },
});
