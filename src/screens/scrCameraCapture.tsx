/**
 * Logosphere BITS — live camera capture screen (demo plane).
 *
 * Rear camera with a v5 photo output, viewfinder, and shutter:
 * the leaf Single/Bulk entries open this same screen with the
 * D10 mode, validated once at entry (fail-closed error state,
 * never re-asked). Capture stays in memory — the photo shows in
 * a large NitroImage preview with retake/close, and nothing is
 * persisted: draft transfer arrives in its own step, and no
 * gallery picking, audio, or AI is wired. The session runs only
 * while focused, foregrounded, granted, and without an open
 * preview; permission states ride on the project camera
 * permission flow (react-native-permissions), never on the
 * camera kit's own permission hook. Native photo memory is
 * disposed on retake, close, and unmount.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCameraCapture); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { Image } from 'react-native-nitro-image';
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
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldStrCameraPermissionStatus } from '../services/srvCameraPermission';
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
import { vldChgIsCaptureMode } from '../validation/vldCapture';

type scrCameraCaptureProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrMode: string;
  actHandOnClose: () => void;
};

type fldObjCapturedPreview = {
  fldObjImage: Image;
  fldObjPhoto: Photo;
};

export function scrCameraCapture({
  fldObjStrings,
  fldStrMode,
  actHandOnClose,
}: scrCameraCaptureProps): React.JSX.Element {
  const fldBooModeValid = vldChgIsCaptureMode(fldStrMode);
  const fldBooFocused = useIsFocused();
  const fldObjDevice = useCameraDevice('back');
  const fldObjPhotoOutput = usePhotoOutput();
  const [fldStrPermission, actSetPermission] =
    React.useState<fldStrCameraPermissionStatus | null>(null);
  const [fldBooRequesting, actSetRequesting] = React.useState(false);
  const [fldBooForeground, actSetForeground] = React.useState(
    () => AppState.currentState === 'active',
  );
  const [fldObjPreview, actSetPreview] =
    React.useState<fldObjCapturedPreview | null>(null);
  const [fldBooCapturing, actSetCapturing] = React.useState(false);
  const [fldStrCaptureError, actSetCaptureError] = React.useState<
    string | null
  >(null);
  const fldObjPhotoRef = React.useRef<Photo | null>(null);

  const fldObjCopy = fldObjStrings.fldObjCameraCapture;

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
    if (fldBooCapturing || fldObjPreview !== null) {
      return;
    }
    actSetCaptureError(null);
    actSetCapturing(true);
    fldObjPhotoOutput
      .capturePhoto({}, {})
      .then(async fldObjPhoto => {
        const fldObjImage = await fldObjPhoto.toImageAsync();
        fldObjPhotoRef.current?.dispose();
        fldObjPhotoRef.current = fldObjPhoto;
        actSetPreview({ fldObjImage, fldObjPhoto });
        actSetCapturing(false);
      })
      .catch((fldObjError: unknown) => {
        actSetCapturing(false);
        actSetCaptureError((fldObjError as Error).message);
      });
  }, [fldBooCapturing, fldObjPhotoOutput, fldObjPreview]);

  const fncRunClose = React.useCallback(() => {
    fncRunDisposePreview();
    actHandOnClose();
  }, [actHandOnClose, fncRunDisposePreview]);

  const fldBooUsablePermission =
    fldStrPermission === 'granted' || fldStrPermission === 'limited';
  const fldBooSessionActive =
    fldBooFocused &&
    fldBooForeground &&
    fldBooUsablePermission &&
    fldObjPreview === null;

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
  fldObjMedia: {
    flex: 1,
  },
});
