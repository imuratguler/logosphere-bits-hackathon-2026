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
 * Draft state lives in the draft hook (mode + target fixed at
 * open, stable UUIDs per image): added files list in a top
 * horizontal thumbnail strip with per-image rotate/delete and
 * tap-to-open, and a draft large preview fits the image
 * aspect-correct with back/rotate/delete. The preview rotation
 * reads the same stored degrees the analysis step will bake
 * into pixels, so the two can never disagree. Find Now is
 * readiness/visibility only for now: hidden while the draft is
 * empty, disabled unless the camera is ready and idle, and its
 * press starts nothing until the analysis step wires the
 * launch. The session runs only while focused, foregrounded,
 * granted, and without any open preview; permission states ride
 * on the project camera permission flow
 * (react-native-permissions), never on the camera kit's own
 * permission hook. The large preview keeps its bottom-right
 * corner empty as the future microphone area.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCameraCapture); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import type { fldObjDraftTarget, fldStrCaptureMode } from '../types/typModels';
import { vldChgIsCaptureMode } from '../validation/vldCapture';

type scrCameraCaptureProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrMode: string;
  fldObjTarget: fldObjDraftTarget;
  actHandOnClose: () => void;
};

type fldObjCapturedPreview = {
  fldObjImage: NitroImageValue;
  fldObjPhoto: Photo;
};

export function scrCameraCapture({
  fldObjStrings,
  fldStrMode,
  fldObjTarget,
  actHandOnClose,
}: scrCameraCaptureProps): React.JSX.Element {
  const fldBooModeValid = vldChgIsCaptureMode(fldStrMode);
  const fldBooFocused = useIsFocused();
  const fldObjDevice = useCameraDevice('back');
  const fldObjPhotoOutput = usePhotoOutput();
  const { fldObjDraft, actAddImages, actRemoveImage, actRotateImage } =
    useDraft(fldStrMode as fldStrCaptureMode, fldObjTarget);
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
  const fldObjPhotoRef = React.useRef<Photo | null>(null);
  const fldBooIntakingRef = React.useRef(false);

  const fldObjCopy = fldObjStrings.fldObjCameraCapture;
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
      actRemoveImage(fldStrId);
      if (fldStrId === fldStrDraftPreviewId) {
        actSetDraftPreviewId(null);
      }
    },
    [actRemoveImage, fldStrDraftPreviewId],
  );

  const fncRunFindNow = React.useCallback(() => {
    // Readiness and visibility only: the button already encodes
    // the guard (hidden while the draft is empty, disabled unless
    // the camera is ready and idle), and the analysis launch
    // itself arrives in its own step — this press intentionally
    // starts nothing yet.
  }, []);

  const fncRunClose = React.useCallback(() => {
    fncRunDisposePreview();
    actSetDraftPreviewId(null);
    actHandOnClose();
  }, [actHandOnClose, fncRunDisposePreview]);

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
    fldBooCapturing || fldBooIntaking || !fldBooCameraReady;

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
        fldBooLoading={fldBooIntaking}
        actHandOnPress={fncRunChooseGallery}
      />
    </View>
  );

  const fldObjThumbnailStrip =
    fldArrImages.length === 0 ? (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwText fldStrVariant="caption">{fldObjCopy.fldStrDraftTitle}</VwText>
        <VwText fldStrVariant="caption">{fldObjCopy.fldStrDraftEmpty}</VwText>
      </View>
    ) : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwText fldStrVariant="caption">{fldObjCopy.fldStrDraftTitle}</VwText>
        <ScrollView
          horizontal
          testID="draft-thumbnail-strip"
          style={scrCameraCaptureStyles.fldObjStrip}
        >
          {fldArrImages.map(fldObjImage => (
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
              <View style={scrCameraCaptureStyles.fldObjThumbActions}>
                <Pressable
                  testID={`thumb-rotate-${fldObjImage.fldStrId}`}
                  accessibilityRole="button"
                  accessibilityLabel={fldObjCopy.fldStrRotate}
                  onPress={() => {
                    actRotateImage(fldObjImage.fldStrId);
                  }}
                >
                  <VwText fldStrVariant="body">⟳</VwText>
                </Pressable>
                <Pressable
                  testID={`thumb-delete-${fldObjImage.fldStrId}`}
                  accessibilityRole="button"
                  accessibilityLabel={fldObjCopy.fldStrDelete}
                  onPress={() => {
                    fncRunRemoveImage(fldObjImage.fldStrId);
                  }}
                >
                  <VwText fldStrVariant="body">✕</VwText>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );

  const fldObjFindNowButton =
    fldArrImages.length === 0 ? null : (
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrFindNow}
          fldBooDisabled={fldBooFindNowDisabled}
          actHandOnPress={fncRunFindNow}
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
        {fldObjThumbnailStrip}
        {fldObjFindNowButton}
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
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
        {fldObjThumbnailStrip}
        {fldObjFindNowButton}
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
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
            actHandOnPress={fncRunDisposePreview}
          />
        </View>
        <VwButton
          fldStrLabel={fldObjCopy.fldStrClose}
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
                  actHandOnPress={() => {
                    actSetDraftPreviewId(null);
                  }}
                />
              </View>
              <View style={scrCameraCaptureStyles.fldObjPreviewButtonLast}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrRotate}
                  actHandOnPress={() => {
                    actRotateImage(fldObjDraftPreview.fldStrId);
                  }}
                />
              </View>
            </View>
            <View style={scrCameraCaptureStyles.fldObjPreviewDeleteRow}>
              <VwButton
                fldStrLabel={fldObjCopy.fldStrDelete}
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
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrCameraCaptureStyles.fldObjScreen}>
      <View style={scrCameraCaptureStyles.fldObjHeader}>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
      </View>
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
        <Camera
          style={scrCameraCaptureStyles.fldObjMedia}
          device={fldObjDevice}
          outputs={[fldObjPhotoOutput]}
          isActive={fldBooSessionActive}
          resizeMode="cover"
        />
      </View>
      <View style={scrCameraCaptureStyles.fldObjGap}>
        <VwButton
          fldStrLabel={
            fldBooCapturing
              ? fldObjCopy.fldStrConverting
              : fldObjCopy.fldStrShutter
          }
          fldBooLoading={fldBooCapturing}
          actHandOnPress={fncRunShutter}
        />
      </View>
      {fldObjIntakeErrorSlot}
      {fldObjGalleryButton}
      {fldObjFindNowButton}
      <VwButton
        fldStrLabel={fldObjCopy.fldStrClose}
        actHandOnPress={fncRunClose}
      />
    </SafeAreaView>
  );
}

const scrCameraCaptureStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
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
  fldObjStrip: {
    flexDirection: 'row',
  },
  fldObjThumb: {
    marginRight: fldNumSpacingSm,
    alignItems: 'center',
  },
  fldObjThumbImage: {
    width: 72,
    height: 72,
  },
  fldObjThumbActions: {
    flexDirection: 'row',
    marginTop: 4,
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
});
