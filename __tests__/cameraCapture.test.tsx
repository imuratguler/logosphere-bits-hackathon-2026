/**
 * Logosphere BITS — live camera capture screen tests (hermetic).
 *
 * The native camera kit and the permission service are mocked: the
 * suite drives every capture state — preparing, permission denied
 * and blocked, no device, viewfinder with active session, shutter
 * success and failure, retake, and close — and proves disposal of
 * native photo memory plus the fail-closed invalid-mode gate. It
 * also covers the draft hook wiring: the top thumbnail strip with
 * per-image rotate/delete, the large aspect-fit draft preview
 * with back/rotate/delete and its microphone reserve, preview
 * rotation equality with the stored analysis rotation, stable
 * survivor identity on delete, Find Now readiness/visibility, and
 * the Find Now analysis handoff payload.
 * Layout coverage adds the counter header with confirmed Clear,
 * the device-posture shutter orientation, the bottom-bar
 * counter, and the overlaid Find Now; voice coverage adds the
 * microphone permission flow plus per-image record/stop,
 * listen/stop, re-record replacement, and note delete with
 * file cleanup. Rendering follows the repo's
 * react-test-renderer suites.
 */

import React from 'react';
import { AppState, PanResponder } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwEmptyState } from '../src/components/vwEmptyState';
import { vwLoading } from '../src/components/vwLoading';
import { vwText } from '../src/components/vwText';
import type { fldStrCameraPermissionStatus } from '../src/services/srvCameraPermission';
import { fldObjStringsEn, fldObjStringsTr } from '../src/i18n/intTranslations';
import { scrCameraCapture } from '../src/screens/scrCameraCapture';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: (): boolean =>
    (
      globalThis as unknown as {
        __BITS_CAMERA_FOCUSED__?: boolean;
      }
    ).__BITS_CAMERA_FOCUSED__ ?? true,
}));

jest.mock('../src/services/srvCameraPermission', () => ({
  srvApiCheckCameraPermission: jest.fn(),
  srvApiOpenCameraAppSettings: jest.fn(),
  srvApiRequestCameraPermission: jest.fn(),
}));

jest.mock('../src/services/srvDraftIntake', () => ({
  srvApiPickGalleryImages: jest.fn(),
  srvApiPrepareCapturePreview: jest.fn(),
  srvApiSaveCaptureImageToDraftFile: jest.fn(),
  srvApiSaveGalleryAssetsToDraft: jest.fn(),
}));

jest.mock('../src/services/srvMicPermission', () => ({
  srvApiCheckMicPermission: jest.fn(),
  srvApiOpenMicAppSettings: jest.fn(),
  srvApiRequestMicPermission: jest.fn(),
}));

jest.mock('../src/services/srvVoiceNote', () => ({
  srvApiDeleteVoiceFile: jest.fn(),
  srvApiSeekVoicePlayback: jest.fn(),
  srvApiSetVoicePlaybackEndHandler: jest.fn(),
  srvApiSetVoicePlaybackProgressHandler: jest.fn(),
  srvApiStartVoicePlayback: jest.fn(),
  srvApiStartVoiceRecording: jest.fn(),
  srvApiStopVoicePlayback: jest.fn(),
  srvApiStopVoiceRecording: jest.fn(),
}));

jest.mock('react-native-vision-camera', () => {
  const ReactLib = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const Camera = jest.fn(
    (fldObjProps: { testID?: string; [fldStrKey: string]: unknown }) =>
      ReactLib.createElement(View, { ...fldObjProps, testID: 'camera-view' }),
  );
  const useCameraDevice = jest.fn();
  const usePhotoOutput = jest.fn();
  return { Camera, useCameraDevice, usePhotoOutput };
});

jest.mock('react-native-nitro-image', () => {
  const ReactLib = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const NitroImage = jest.fn((fldObjProps: { [fldStrKey: string]: unknown }) =>
    ReactLib.createElement(View, { ...fldObjProps, testID: 'photo-preview' }),
  );
  return { NitroImage };
});

const fldObjPermissionServiceMock = jest.requireMock<{
  srvApiCheckCameraPermission: jest.Mock;
  srvApiOpenCameraAppSettings: jest.Mock;
  srvApiRequestCameraPermission: jest.Mock;
}>('../src/services/srvCameraPermission');

const fldObjVisionCameraMock = jest.requireMock<{
  Camera: jest.Mock;
  useCameraDevice: jest.Mock;
  usePhotoOutput: jest.Mock;
}>('react-native-vision-camera');

const fldObjDraftIntakeMock = jest.requireMock<{
  srvApiPickGalleryImages: jest.Mock;
  srvApiPrepareCapturePreview: jest.Mock;
  srvApiSaveCaptureImageToDraftFile: jest.Mock;
  srvApiSaveGalleryAssetsToDraft: jest.Mock;
}>('../src/services/srvDraftIntake');

const fldObjNitroImageMock = jest.requireMock<{
  NitroImage: jest.Mock;
}>('react-native-nitro-image');

const fldObjMicServiceMock = jest.requireMock<{
  srvApiCheckMicPermission: jest.Mock;
  srvApiOpenMicAppSettings: jest.Mock;
  srvApiRequestMicPermission: jest.Mock;
}>('../src/services/srvMicPermission');

const fldObjVoiceServiceMock = jest.requireMock<{
  srvApiDeleteVoiceFile: jest.Mock;
  srvApiSeekVoicePlayback: jest.Mock;
  srvApiSetVoicePlaybackEndHandler: jest.Mock;
  srvApiSetVoicePlaybackProgressHandler: jest.Mock;
  srvApiStartVoicePlayback: jest.Mock;
  srvApiStartVoiceRecording: jest.Mock;
  srvApiStopVoicePlayback: jest.Mock;
  srvApiStopVoiceRecording: jest.Mock;
}>('../src/services/srvVoiceNote');

const fldObjFakePreviewImage = { id: 'img-1' };

type fldObjTestRenderer = ReturnType<typeof ReactTestRenderer.create>;

const fldObjFakeDevice = { id: 'back-0' };

const fldObjFakeTarget = {
  fldStrLibraryId: 'lib-1',
  fldStrLibraryName: 'Demo Library',
  fldStrCollectionId: 'col-9',
  fldStrCollectionName: 'Rare Books',
};

async function fncRunRenderCamera(
  fldStrMode: string,
  actHandOnClose: () => void = () => undefined,
  actHandOnAnalysis: (fldArrPhotos: unknown[]) => void = () => undefined,
): Promise<fldObjTestRenderer> {
  let fldObjRenderer: fldObjTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrCameraCapture, {
        fldObjStrings: fldObjStringsEn,
        fldStrMode,
        fldObjTarget: fldObjFakeTarget,
        actHandOnClose,
        actHandOnAnalysis,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunUnmount(fldObjRenderer: fldObjTestRenderer): void {
  ReactTestRenderer.act(() => {
    fldObjRenderer.unmount();
  });
}

function fncRunPressButton(
  fldObjRenderer: fldObjTestRenderer,
  fldStrLabel: string,
): () => void {
  const fldObjButton = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
  if (fldObjButton === undefined) {
    throw new Error(`Logosphere BITS: button "${fldStrLabel}" not found.`);
  }
  return fldObjButton.props.actHandOnPress as () => void;
}

function fncRunEmptyTitles(fldObjRenderer: fldObjTestRenderer): string[] {
  return fldObjRenderer.root
    .findAllByType(vwEmptyState)
    .map(fldObjNode => fldObjNode.props.fldStrTitle as string);
}

function fncRunCameraHosts(fldObjRenderer: fldObjTestRenderer) {
  return fldObjRenderer.root.findAllByType(
    fldObjVisionCameraMock.Camera as unknown as React.ElementType,
  );
}

function fncRunPreviewHosts(fldObjRenderer: fldObjTestRenderer) {
  return fldObjRenderer.root.findAllByType(
    fldObjNitroImageMock.NitroImage as unknown as React.ElementType,
  );
}

function fncUseGrantedCamera(): {
  fldObjPhotoOutput: { capturePhoto: jest.Mock };
} {
  fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
    'granted' satisfies fldStrCameraPermissionStatus,
  );
  fldObjVisionCameraMock.useCameraDevice.mockReturnValue(fldObjFakeDevice);
  const fldObjPhotoOutput = { capturePhoto: jest.fn() };
  fldObjVisionCameraMock.usePhotoOutput.mockReturnValue(fldObjPhotoOutput);
  return { fldObjPhotoOutput };
}

type fldObjFakePhoto = {
  dispose: jest.Mock;
};

function fncMakeFakePhoto(): { id: string } & fldObjFakePhoto {
  return { id: 'photo-1', dispose: jest.fn() };
}

function fncUsePreviewBundle(): void {
  fldObjDraftIntakeMock.srvApiPrepareCapturePreview.mockResolvedValue(
    fldObjFakePreviewImage,
  );
}

function fncRunSetFocused(fldBooFocused: boolean): void {
  (
    globalThis as unknown as {
      __BITS_CAMERA_FOCUSED__?: boolean;
    }
  ).__BITS_CAMERA_FOCUSED__ = fldBooFocused;
}

function fncRunTextContents(fldObjRenderer: fldObjTestRenderer): unknown[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
}

function fncMakeFakeEntry(
  fldStrId: string,
  fldStrName: string,
  fldNumSortOrder = 0,
) {
  return {
    fldStrId,
    fldNumSortOrder,
    fldStrLocalPath: `/cache/bits-draft/${fldStrName}`,
    fldNumRotationDegrees: 0,
    fldStrNormalizedPath: null,
    fldObjVoiceNote: null,
  };
}

function fncRunThumbIds(fldObjRenderer: fldObjTestRenderer): string[] {
  // React Native forwards testID to both the composite and the
  // host node, so matches arrive doubled; dedupe by identity.
  const fldArrIds = fldObjRenderer.root
    .findAll(
      fldObjNode =>
        typeof fldObjNode.props.testID === 'string' &&
        (fldObjNode.props.testID as string).startsWith('thumb-image-'),
    )
    .map(fldObjNode =>
      (fldObjNode.props.testID as string).replace('thumb-image-', ''),
    );
  return [...new Set(fldArrIds)];
}

function fncRunNodeByTestId(
  fldObjRenderer: fldObjTestRenderer,
  fldStrTestId: string,
) {
  const fldArrNodes = fldObjRenderer.root.findAllByProps({
    testID: fldStrTestId,
  });
  const fldObjNode =
    fldArrNodes.find(
      fldObjCandidate => typeof fldObjCandidate.props.onPress === 'function',
    ) ?? fldArrNodes[0];
  if (fldObjNode === undefined) {
    throw new Error(`Logosphere BITS: "${fldStrTestId}" was not rendered.`);
  }
  return fldObjNode;
}

function fncRunPressTestId(
  fldObjRenderer: fldObjTestRenderer,
  fldStrTestId: string,
): () => void {
  const fldObjNode = fncRunNodeByTestId(fldObjRenderer, fldStrTestId);
  if (typeof fldObjNode.props.onPress !== 'function') {
    throw new Error(`Logosphere BITS: "${fldStrTestId}" is not pressable.`);
  }
  return fldObjNode.props.onPress as () => void;
}

function fncRunRotationOf(
  fldObjRenderer: fldObjTestRenderer,
  fldStrTestId: string,
): string {
  const fldObjNode = fncRunNodeByTestId(fldObjRenderer, fldStrTestId);
  const fldObjStyle = fldObjNode.props.style;
  const fldObjFlat = (
    Array.isArray(fldObjStyle) ? Object.assign({}, ...fldObjStyle) : fldObjStyle
  ) as { transform?: Array<{ rotate?: string }> };
  return fldObjFlat.transform?.[0]?.rotate ?? '';
}

function fncRunThumbSourceOf(
  fldObjRenderer: fldObjTestRenderer,
  fldStrTestId: string,
): string {
  const fldObjNode = fncRunNodeByTestId(fldObjRenderer, fldStrTestId);
  return (fldObjNode.props.source as { uri: string }).uri;
}

function fncRunFindNowButton(fldObjRenderer: fldObjTestRenderer) {
  return fldObjRenderer.root
    .findAllByType(vwButton)
    .find(
      fldObjNode =>
        fldObjNode.props.fldStrLabel ===
        fldObjStringsEn.fldObjCameraCapture.fldStrFindNow,
    );
}

async function fncRunAddGalleryEntries(
  fldObjRenderer: fldObjTestRenderer,
  fldArrEntries: Array<ReturnType<typeof fncMakeFakeEntry>>,
): Promise<void> {
  fldObjDraftIntakeMock.srvApiPickGalleryImages.mockResolvedValue(
    fldArrEntries.map((fldObjEntry, fldNumIndex) => ({
      uri: `content://a/${fldNumIndex + 1}`,
    })),
  );
  fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft.mockResolvedValue(
    fldArrEntries,
  );
  await ReactTestRenderer.act(async () => {
    fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
  });
}

async function fncRunCapturePhoto(
  fldObjRenderer: fldObjTestRenderer,
): Promise<void> {
  await ReactTestRenderer.act(async () => {
    fncRunPressTestId(fldObjRenderer, 'camera-shutter')();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  fncRunSetFocused(true);
  (AppState as { currentState: string }).currentState = 'active';
  fldObjMicServiceMock.srvApiCheckMicPermission.mockResolvedValue('granted');
  fldObjVoiceServiceMock.srvApiDeleteVoiceFile.mockResolvedValue(undefined);
  fldObjVoiceServiceMock.srvApiSeekVoicePlayback.mockResolvedValue(undefined);
  fldObjVoiceServiceMock.srvApiStopVoicePlayback.mockResolvedValue(undefined);
});

describe('scrCameraCapture', () => {
  it('shows the preparing state while the permission check runs', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockReturnValue(
      new Promise(() => undefined),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    const fldObjLoading = fldObjRenderer.root.findByType(vwLoading);
    expect(fldObjLoading.props.fldStrMessage).toBe(
      fldObjStringsEn.fldObjCameraCapture.fldStrPreparing,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('fails closed on an unknown capture mode without touching native state', async () => {
    const fldObjRenderer = await fncRunRenderCamera('auto');
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrModeError,
    );
    expect(
      fldObjPermissionServiceMock.srvApiCheckCameraPermission,
    ).not.toHaveBeenCalled();
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('requests permission from the denied state and opens the viewfinder', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'denied' satisfies fldStrCameraPermissionStatus,
    );
    fldObjPermissionServiceMock.srvApiRequestCameraPermission.mockResolvedValue(
      'granted' satisfies fldStrCameraPermissionStatus,
    );
    fldObjVisionCameraMock.useCameraDevice.mockReturnValue(fldObjFakeDevice);
    fldObjVisionCameraMock.usePhotoOutput.mockReturnValue({
      capturePhoto: jest.fn(),
    });
    const fldObjRenderer = await fncRunRenderCamera('bulk');
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrPermissionTitle,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrRequest,
      )();
    });
    expect(
      fldObjPermissionServiceMock.srvApiRequestCameraPermission,
    ).toHaveBeenCalledTimes(1);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('offers the settings shortcut from the blocked state', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'blocked' satisfies fldStrCameraPermissionStatus,
    );
    fldObjPermissionServiceMock.srvApiOpenCameraAppSettings.mockResolvedValue(
      undefined,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrBlockedTitle,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrOpenSettings,
      )();
    });
    expect(
      fldObjPermissionServiceMock.srvApiOpenCameraAppSettings,
    ).toHaveBeenCalledTimes(1);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('shows the no-device state when permission is unavailable', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'unavailable' satisfies fldStrCameraPermissionStatus,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrNoDeviceTitle,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('shows the no-device state when no back camera exists', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'granted' satisfies fldStrCameraPermissionStatus,
    );
    fldObjVisionCameraMock.useCameraDevice.mockReturnValue(undefined);
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrNoDeviceTitle,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('runs an active photo-output session in the viewfinder', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fldObjVisionCameraMock.useCameraDevice).toHaveBeenCalledWith('back');
    const fldArrCameras = fncRunCameraHosts(fldObjRenderer);
    expect(fldArrCameras).toHaveLength(1);
    expect(fldArrCameras[0].props.isActive).toBe(true);
    expect(fldArrCameras[0].props.resizeMode).toBe('cover');
    expect(fldArrCameras[0].props.outputs).toEqual([fldObjPhotoOutput]);
    fncRunUnmount(fldObjRenderer);
  });

  it('pauses the session when backgrounded', async () => {
    (AppState as { currentState: string }).currentState = 'background';
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    const fldArrCameras = fncRunCameraHosts(fldObjRenderer);
    expect(fldArrCameras).toHaveLength(1);
    expect(fldArrCameras[0].props.isActive).toBe(false);
    fncRunUnmount(fldObjRenderer);
  });

  it('pauses the session when focus is lost', async () => {
    fncRunSetFocused(false);
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    const fldArrCameras = fncRunCameraHosts(fldObjRenderer);
    expect(fldArrCameras).toHaveLength(1);
    expect(fldArrCameras[0].props.isActive).toBe(false);
    fncRunUnmount(fldObjRenderer);
  });

  it('adds the capture and keeps the session running', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjPhoto = fncMakeFakePhoto();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fldObjPhoto);
    fncUsePreviewBundle();
    fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile.mockResolvedValue(
      fncMakeFakeEntry('d1', 'cap.jpg'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fldObjPhotoOutput.capturePhoto).toHaveBeenCalledTimes(1);
    expect(
      fldObjDraftIntakeMock.srvApiPrepareCapturePreview,
    ).toHaveBeenCalledWith(fldObjPhoto);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('reports capture failures without leaving the viewfinder', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    fldObjPhotoOutput.capturePhoto.mockRejectedValue(new Error('boom'));
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrCaptureError,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('reports capture preparation failures without a draft entry', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fncMakeFakePhoto());
    fldObjDraftIntakeMock.srvApiPrepareCapturePreview.mockRejectedValue(
      new Error('no file'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrCaptureError,
    );
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('adds the capture straight into the draft', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjPhoto = fncMakeFakePhoto();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fldObjPhoto);
    fncUsePreviewBundle();
    const fldObjEntry = fncMakeFakeEntry('d1', 'cap123.jpg');
    fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile.mockResolvedValue(
      fldObjEntry,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(
      fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile,
    ).toHaveBeenCalledWith(fldObjFakePreviewImage, 0);
    expect(fldObjPhoto.dispose).toHaveBeenCalled();
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    const fldArrThumbIds = fncRunThumbIds(fldObjRenderer);
    expect(fldArrThumbIds).toHaveLength(1);
    expect(
      fncRunThumbSourceOf(
        fldObjRenderer,
        `thumb-image-${fldArrThumbIds[0]}`,
      ).endsWith('cap123.jpg'),
    ).toBe(true);
    expect(fncRunFindNowButton(fldObjRenderer)).not.toBe(undefined);
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      false,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('reports capture intake failures without a draft entry', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fncMakeFakePhoto());
    fncUsePreviewBundle();
    fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile.mockRejectedValue(
      new Error('disk gone'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrIntakeError,
    );
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('disables Find Now while a capture is in flight', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    let fncResolveCapture: (fldObjPhoto: unknown) => void = () => undefined;
    fldObjPhotoOutput.capturePhoto.mockImplementation(
      () =>
        new Promise(fldResolve => {
          fncResolveCapture = fldResolve as unknown as typeof fncResolveCapture;
        }),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      false,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'camera-shutter')();
    });
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      true,
    );
    await ReactTestRenderer.act(async () => {
      fncResolveCapture(fncMakeFakePhoto());
    });
    fncRunUnmount(fldObjRenderer);
  });

  it('adds gallery multi-select results to the draft', async () => {
    fncUseGrantedCamera();
    const fldArrAssets = [{ uri: 'content://a/1' }, { uri: 'content://a/2' }];
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockResolvedValue(
      fldArrAssets,
    );
    fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft.mockResolvedValue([
      fncMakeFakeEntry('d1', 'rose.jpg'),
      fncMakeFakeEntry('d2', 'codex.jpg'),
    ]);
    const fldObjRenderer = await fncRunRenderCamera('bulk');
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).toHaveBeenCalledWith(fldArrAssets, 0);
    const fldArrThumbIds = fncRunThumbIds(fldObjRenderer);
    expect(fldArrThumbIds).toHaveLength(2);
    expect(
      fncRunThumbSourceOf(
        fldObjRenderer,
        `thumb-image-${fldArrThumbIds[0]}`,
      ).endsWith('rose.jpg'),
    ).toBe(true);
    expect(
      fncRunThumbSourceOf(
        fldObjRenderer,
        `thumb-image-${fldArrThumbIds[1]}`,
      ).endsWith('codex.jpg'),
    ).toBe(true);
    fncRunUnmount(fldObjRenderer);
  });

  it('treats gallery cancel as silent with no intake call', async () => {
    fncUseGrantedCamera();
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockResolvedValue([]);
    const fldObjRenderer = await fncRunRenderCamera('single');
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).not.toHaveBeenCalled();
    expect(fncRunEmptyTitles(fldObjRenderer)).toHaveLength(0);
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('reports gallery failures without crashing', async () => {
    fncUseGrantedCamera();
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockRejectedValue(
      new Error('picker gone'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
    });
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrIntakeError,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('runs gallery intake from the denied screen', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'denied' satisfies fldStrCameraPermissionStatus,
    );
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockResolvedValue([
      { uri: 'content://a/1' },
    ]);
    fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft.mockResolvedValue([
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldObjRenderer = await fncRunRenderCamera('single');
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).toHaveBeenCalledTimes(1);
    const fldArrThumbIds = fncRunThumbIds(fldObjRenderer);
    expect(fldArrThumbIds).toHaveLength(1);
    expect(
      fncRunThumbSourceOf(
        fldObjRenderer,
        `thumb-image-${fldArrThumbIds[0]}`,
      ).endsWith('rose.jpg'),
    ).toBe(true);
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrPermissionTitle,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('offers gallery intake from the blocked screen', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'blocked' satisfies fldStrCameraPermissionStatus,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('blocks a second intake while one is in flight', async () => {
    fncUseGrantedCamera();
    let fncResolvePick: (fldArrAssets: unknown[]) => void = () => undefined;
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockReturnValue(
      new Promise<unknown[]>(fldResolve => {
        fncResolvePick = fldResolve;
      }),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await ReactTestRenderer.act(async () => {
      const fncPressGallery = fncRunPressTestId(fldObjRenderer, 'gallery-pick');
      fncPressGallery();
      fncPressGallery();
      fncResolvePick([]);
    });
    expect(fldObjDraftIntakeMock.srvApiPickGalleryImages).toHaveBeenCalledTimes(
      1,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('hides Find Now while the draft is empty', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    expect(fncRunTextContents(fldObjRenderer)).not.toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrTitle,
    );
    expect(fncRunTextContents(fldObjRenderer)).not.toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrDraftEmpty,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'gallery-pick')).not.toBe(
      undefined,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('hands the draft photos to the analysis flow on Find Now', async () => {
    fncUseGrantedCamera();
    const actHandOnAnalysis = jest.fn();
    const fldObjRenderer = await fncRunRenderCamera(
      'single',
      () => undefined,
      actHandOnAnalysis,
    );
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-rotate-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrFindNow,
      )();
    });
    expect(actHandOnAnalysis).toHaveBeenCalledTimes(1);
    expect(actHandOnAnalysis).toHaveBeenCalledWith([
      {
        fldStrId,
        fldNumSortOrder: 0,
        fldStrLocalPath: '/cache/bits-draft/rose.jpg',
        fldNumRotationDegrees: 90,
        fldBooHasVoiceNote: false,
        fldStrVoicePath: null,
      },
    ]);
    fncRunUnmount(fldObjRenderer);
  });

  it('opens the large draft preview from a thumbnail tap', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldArrThumbIds = fncRunThumbIds(fldObjRenderer);
    expect(fldArrThumbIds).toHaveLength(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldArrThumbIds[0]}`)();
    });
    const fldObjPreview = fncRunNodeByTestId(
      fldObjRenderer,
      'draft-preview-image',
    );
    expect(fldObjPreview.props.resizeMode).toBe('contain');
    expect(fncRunRotationOf(fldObjRenderer, 'draft-preview-image')).toBe(
      '0deg',
    );
    expect(
      (fldObjPreview.props.source as { uri: string }).uri.endsWith('rose.jpg'),
    ).toBe(true);
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-back')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-rotate')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-mic')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete')).not.toBe(
      undefined,
    );
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'preview-delete-audio' }),
    ).toHaveLength(0);
    expect(fncRunTextContents(fldObjRenderer)).not.toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrTitle,
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('keeps preview rotation equal to the stored analysis rotation', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-rotate-${fldStrId}`)();
    });
    expect(fncRunRotationOf(fldObjRenderer, `thumb-image-${fldStrId}`)).toBe(
      '90deg',
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    expect(fncRunRotationOf(fldObjRenderer, 'draft-preview-image')).toBe(
      '90deg',
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-rotate')();
    });
    expect(fncRunRotationOf(fldObjRenderer, 'draft-preview-image')).toBe(
      '180deg',
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-back')();
    });
    expect(fncRunRotationOf(fldObjRenderer, `thumb-image-${fldStrId}`)).toBe(
      '180deg',
    );
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('deletes from the strip with stable survivor identity', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('bulk');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
      fncMakeFakeEntry('d2', 'codex.jpg'),
    ]);
    const fldArrBefore = fncRunThumbIds(fldObjRenderer);
    expect(fldArrBefore).toHaveLength(2);
    expect(
      fncRunNodeByTestId(fldObjRenderer, `thumb-rotate-${fldArrBefore[0]}`)
        .props.accessibilityLabel,
    ).toBe(fldObjStringsEn.fldObjCameraCapture.fldStrRotate);
    expect(
      fncRunNodeByTestId(fldObjRenderer, `thumb-delete-${fldArrBefore[0]}`)
        .props.accessibilityLabel,
    ).toBe(fldObjStringsEn.fldObjCameraCapture.fldStrDelete);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-delete-${fldArrBefore[0]}`)();
    });
    expect(fncRunThumbIds(fldObjRenderer)).toEqual([fldArrBefore[1]]);
    expect(fncRunFindNowButton(fldObjRenderer)).not.toBe(undefined);
    fncRunUnmount(fldObjRenderer);
  });

  it('hides Find Now when the last image is deleted', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    expect(fncRunFindNowButton(fldObjRenderer)).not.toBe(undefined);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-delete-${fldStrId}`)();
    });
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('disables Find Now while intake is in flight', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      false,
    );
    let fncResolvePick: (fldArrAssets: unknown[]) => void = () => undefined;
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockReturnValue(
      new Promise<unknown[]>(fldResolve => {
        fncResolvePick = fldResolve;
      }),
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'gallery-pick')();
    });
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      true,
    );
    await ReactTestRenderer.act(async () => {
      fncResolvePick([]);
    });
    expect(fncRunFindNowButton(fldObjRenderer)?.props.fldBooDisabled).toBe(
      false,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('disables Find Now on the denied screen once images exist', async () => {
    fldObjPermissionServiceMock.srvApiCheckCameraPermission.mockResolvedValue(
      'denied' satisfies fldStrCameraPermissionStatus,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldObjFindNow = fncRunFindNowButton(fldObjRenderer);
    expect(fldObjFindNow).not.toBe(undefined);
    expect(fldObjFindNow?.props.fldBooDisabled).toBe(true);
    fncRunUnmount(fldObjRenderer);
  });

  it('deletes from the large preview and lands on an empty draft', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-delete')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'delete-confirm')).not.toBe(
      undefined,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'delete-confirm')();
    });
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('asks before deleting the photo from the preview and cancels', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-delete')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'delete-confirm')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'delete-cancel')).not.toBe(
      undefined,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'delete-cancel')();
    });
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'delete-confirm' }),
    ).toHaveLength(0);
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-back')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('asks before deleting the audio from the preview and cancels', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-delete-audio')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'delete-confirm')).not.toBe(
      undefined,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'delete-cancel')();
    });
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).not.toHaveBeenCalled();
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete-audio')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('shows glyph icons on the preview bar buttons', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    const fldObjBack = fncRunNodeByTestId(fldObjRenderer, 'preview-back');
    expect(fldObjBack.findByType(vwText).props.children as string).toContain(
      '◀',
    );
    const fldObjRotate = fncRunNodeByTestId(fldObjRenderer, 'preview-rotate');
    expect(fldObjRotate.findByType(vwText).props.children as string).toContain(
      '⟳',
    );
    const fldObjSpeaker = fncRunNodeByTestId(fldObjRenderer, 'preview-mic');
    expect(fldObjSpeaker.findByType(vwText).props.children as string).toContain(
      '🔊',
    );
    const fldObjMute = fncRunNodeByTestId(
      fldObjRenderer,
      'preview-delete-audio',
    );
    expect(fldObjMute.findByType(vwText).props.children as string).toContain(
      '🔇',
    );
    const fldObjDelete = fncRunNodeByTestId(fldObjRenderer, 'preview-delete');
    expect(fldObjDelete.findByType(vwText).props.children as string).toContain(
      '🗑️',
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('lays out quarter turns in a swapped box that fits after rotation', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('d1', 'rose.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    const fncFireLayout = () => {
      const fldObjBox = fncRunNodeByTestId(fldObjRenderer, 'draft-preview-box');
      (
        fldObjBox.props.onLayout as (fldObjEvent: {
          nativeEvent: { layout: { width: number; height: number } };
        }) => void
      )({ nativeEvent: { layout: { width: 300, height: 500 } } });
    };
    await ReactTestRenderer.act(async () => {
      fncFireLayout();
    });
    // Identity rotation keeps the plain stretching container and
    // a flex image (centering would collapse it to zero width).
    // Test instances stay live across renders, so the style
    // value is captured eagerly before the rotation update.
    const fldUnknownPlainStyle = fncRunNodeByTestId(
      fldObjRenderer,
      'draft-preview-box',
    ).props.style;
    const fldObjPlainImage = fncRunNodeByTestId(
      fldObjRenderer,
      'draft-preview-image',
    );
    const fldObjPlainFlat = Object.assign(
      {},
      ...fldObjPlainImage.props.style,
    ) as { width?: number; height?: number };
    expect(fldObjPlainFlat.width).toBe(undefined);
    expect(fldObjPlainFlat.height).toBe(undefined);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-rotate')();
    });
    const fldObjSwappedBox = fncRunNodeByTestId(
      fldObjRenderer,
      'draft-preview-box',
    );
    expect(fldObjSwappedBox.props.style).not.toBe(fldUnknownPlainStyle);
    const fldObjImage = fncRunNodeByTestId(
      fldObjRenderer,
      'draft-preview-image',
    );
    const fldObjFlat = Object.assign({}, ...fldObjImage.props.style) as {
      width: number;
      height: number;
      transform: Array<{ rotate?: string }>;
    };
    expect(fldObjFlat.width).toBe(500);
    expect(fldObjFlat.height).toBe(300);
    expect(fldObjFlat.transform[0]?.rotate).toBe('90deg');
    fncRunUnmount(fldObjRenderer);
  });

  it('carries the capture group in both languages without empty strings', () => {
    const fldObjEn = fldObjStringsEn.fldObjCameraCapture;
    const fldObjTr = fldObjStringsTr.fldObjCameraCapture;
    const fldStrKeys = Object.keys(fldObjEn) as Array<keyof typeof fldObjEn>;
    expect(fldStrKeys.length).toBeGreaterThan(0);
    for (const fldStrKey of fldStrKeys) {
      expect(typeof fldObjEn[fldStrKey]).toBe('string');
      expect(fldObjEn[fldStrKey].length).toBeGreaterThan(0);
      expect(fldObjTr[fldStrKey]).toBeDefined();
      expect(typeof fldObjTr[fldStrKey]).toBe('string');
      expect(fldObjTr[fldStrKey].length).toBeGreaterThan(0);
    }
  });

  it('shows the strip counter with confirmed Clear', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
      fncMakeFakeEntry('in-2', 'b.jpg'),
    ]);
    expect(fncRunTextContents(fldObjRenderer)).toContain('Added photos (2)');
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'draft-clear')();
    });
    expect(fncRunTextContents(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrClearTitle,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrClear,
      )();
    });
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunFindNowButton(fldObjRenderer)).toBe(undefined);
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('cancels Clear without touching the draft', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'draft-clear')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrCancel,
      )();
    });
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(1);
    expect(fncRunFindNowButton(fldObjRenderer)).not.toBe(undefined);
    fncRunUnmount(fldObjRenderer);
  });

  it('reads shutter orientation from the device posture', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('bulk');
    const fldArrHosts = fncRunCameraHosts(fldObjRenderer);
    expect(fldArrHosts).toHaveLength(1);
    expect(fldArrHosts[0]?.props.orientationSource).toBe('device');
    fncRunUnmount(fldObjRenderer);
  });

  it('shows the bottom-bar counter with gallery and shutter', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
      fncMakeFakeEntry('in-2', 'b.jpg'),
    ]);
    expect(fncRunTextContents(fldObjRenderer)).toContain('2 photos added');
    fncRunUnmount(fldObjRenderer);
  });

  it('requests the microphone inside the record sheet', async () => {
    fncUseGrantedCamera();
    fldObjMicServiceMock.srvApiCheckMicPermission.mockResolvedValue('denied');
    fldObjMicServiceMock.srvApiRequestMicPermission.mockResolvedValue(
      'granted',
    );
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 4,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-mic-request')();
    });
    expect(
      fldObjMicServiceMock.srvApiRequestMicPermission,
    ).toHaveBeenCalledTimes(1);
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'voice-record-modal' }),
    ).toHaveLength(0);
    const fldObjDone = fncRunNodeByTestId(
      fldObjRenderer,
      `thumb-voice-${fldStrId}`,
    );
    expect(fldObjDone.findByType(vwText).props.children as string).toContain(
      '🔊',
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('cancels the recording from the record sheet', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 9,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-cancel')();
    });
    expect(
      fldObjVoiceServiceMock.srvApiStopVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).toHaveBeenCalledWith(
      '/cache/bits-audio/n.m4a',
    );
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'voice-record-modal' }),
    ).toHaveLength(0);
    const fldObjCorner = fncRunNodeByTestId(
      fldObjRenderer,
      `thumb-voice-${fldStrId}`,
    );
    expect(fldObjCorner.findByType(vwText).props.children as string).toContain(
      '🎙',
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('listens to a note and resets on playback end', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: null,
    });
    fldObjVoiceServiceMock.srvApiStartVoicePlayback.mockResolvedValue(
      undefined,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-play-modal')).not.toBe(
      undefined,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-listen')();
    });
    expect(
      fldObjVoiceServiceMock.srvApiStartVoicePlayback,
    ).toHaveBeenCalledWith('/cache/bits-audio/n.m4a', 0);
    const fldArrEndCalls = fldObjVoiceServiceMock
      .srvApiSetVoicePlaybackEndHandler.mock.calls as unknown[][];
    const fldObjFirstCall = fldArrEndCalls[0];
    if (!Array.isArray(fldObjFirstCall)) {
      throw new Error('Logosphere BITS: end handler was not registered.');
    }
    await ReactTestRenderer.act(async () => {
      (fldObjFirstCall[0] as () => void)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-modal-listen')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('shows playback progress with elapsed seconds', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 29,
    });
    fldObjVoiceServiceMock.srvApiStartVoicePlayback.mockResolvedValue(
      undefined,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-play-modal')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-play-progress')).not.toBe(
      undefined,
    );
    const fldObjElapsed = fncRunNodeByTestId(
      fldObjRenderer,
      'voice-play-elapsed',
    );
    expect(fldObjElapsed.findByType(vwText).props.children as string).toBe(
      '0:00 / 0:29',
    );
    const fldArrProgressCalls = fldObjVoiceServiceMock
      .srvApiSetVoicePlaybackProgressHandler.mock.calls as unknown[][];
    const fldObjFirstCall = fldArrProgressCalls[0];
    if (!Array.isArray(fldObjFirstCall)) {
      throw new Error('Logosphere BITS: progress handler was not registered.');
    }
    await ReactTestRenderer.act(async () => {
      (fldObjFirstCall[0] as (fldNumSec: number) => void)(7.2);
    });
    expect(
      fncRunNodeByTestId(fldObjRenderer, 'voice-play-elapsed').findByType(
        vwText,
      ).props.children as string,
    ).toBe('0:07 / 0:29');
    fncRunUnmount(fldObjRenderer);
  });

  it('seeks playback from the progress bar touch', async () => {
    const fldObjPanSpy = jest.spyOn(PanResponder, 'create');
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 29,
    });
    fldObjVoiceServiceMock.srvApiStartVoicePlayback.mockResolvedValue(
      undefined,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    const fldObjBar = fncRunNodeByTestId(fldObjRenderer, 'voice-play-progress');
    await ReactTestRenderer.act(async () => {
      fldObjBar.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
    });
    const fldArrPanCalls = fldObjPanSpy.mock.calls as unknown[][];
    const fldObjLastPan = fldArrPanCalls[fldArrPanCalls.length - 1];
    if (!Array.isArray(fldObjLastPan)) {
      throw new Error('Logosphere BITS: seek pan was not created.');
    }
    const fldObjPanConfig = fldObjLastPan[0] as {
      onPanResponderGrant: (fldObjEvent: {
        nativeEvent: { locationX: number };
      }) => void;
      onPanResponderMove: (fldObjEvent: {
        nativeEvent: { locationX: number };
      }) => void;
    };
    await ReactTestRenderer.act(async () => {
      fldObjPanConfig.onPanResponderGrant({
        nativeEvent: { locationX: 100 },
      });
    });
    expect(fldObjVoiceServiceMock.srvApiSeekVoicePlayback).toHaveBeenCalledWith(
      14.5,
    );
    expect(
      fncRunNodeByTestId(fldObjRenderer, 'voice-play-elapsed').findByType(
        vwText,
      ).props.children as string,
    ).toBe('0:14 / 0:29');
    await ReactTestRenderer.act(async () => {
      fldObjPanConfig.onPanResponderMove({ nativeEvent: { locationX: 400 } });
    });
    expect(fldObjVoiceServiceMock.srvApiSeekVoicePlayback).toHaveBeenCalledWith(
      29,
    );
    fldObjPanSpy.mockRestore();
    fncRunUnmount(fldObjRenderer);
  });

  it('opens settings from the blocked microphone', async () => {
    fncUseGrantedCamera();
    fldObjMicServiceMock.srvApiCheckMicPermission.mockResolvedValue('blocked');
    fldObjMicServiceMock.srvApiOpenMicAppSettings.mockResolvedValue(undefined);
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjVoiceNote.fldStrMicBlockedTitle,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-mic-settings')();
    });
    expect(fldObjMicServiceMock.srvApiOpenMicAppSettings).toHaveBeenCalledTimes(
      1,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('hides recording without a microphone device', async () => {
    fncUseGrantedCamera();
    fldObjMicServiceMock.srvApiCheckMicPermission.mockResolvedValue(
      'unavailable',
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'voice-modal-stop' }),
    ).toHaveLength(0);
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).not.toHaveBeenCalled();
    fncRunUnmount(fldObjRenderer);
  });

  it('surfaces record failures as voice errors', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockRejectedValue(
      new Error('no mic'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjVoiceNote.fldStrVoiceError,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('deletes the voice file with its image', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 2,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-delete-${fldStrId}`)();
    });
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).toHaveBeenCalledWith(
      '/cache/bits-audio/n.m4a',
    );
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    expect(fncRunNodeByTestId(fldObjRenderer, 'camera-shutter')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('shows the singular counter for one photo', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    expect(fncRunTextContents(fldObjRenderer)).toContain('1 photo added');
    expect(fncRunTextContents(fldObjRenderer)).not.toContain('1 photos added');
    fncRunUnmount(fldObjRenderer);
  });

  it('overlays a single pill Find Now once images exist', async () => {
    fncUseGrantedCamera();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldArrFindNow = fldObjRenderer.root
      .findAllByType(vwButton)
      .filter(
        fldObjNode =>
          fldObjNode.props.fldStrLabel ===
          fldObjStringsEn.fldObjCameraCapture.fldStrFindNow,
      );
    expect(fldArrFindNow).toHaveLength(1);
    expect(fldArrFindNow[0]?.props.fldStrVariant).toBe('pill');
    fncRunUnmount(fldObjRenderer);
  });

  it('records a voice note from the thumbnail voice corner', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    const fldObjCorner = fncRunNodeByTestId(
      fldObjRenderer,
      `thumb-voice-${fldStrId}`,
    );
    expect(fldObjCorner.findByType(vwText).props.children as string).toContain(
      '🎙',
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    expect(
      fldObjVoiceServiceMock.srvApiStopVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'voice-record-modal' }),
    ).toHaveLength(0);
    const fldObjDone = fncRunNodeByTestId(
      fldObjRenderer,
      `thumb-voice-${fldStrId}`,
    );
    expect(fldObjDone.findByType(vwText).props.children as string).toContain(
      '🔊',
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('opens the play sheet from the voice corner when a note exists', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-play-modal')).not.toBe(
      undefined,
    );
    expect(fncRunTextContents(fldObjRenderer)).toContain('♪ Voice note · 0:03');
    fncRunUnmount(fldObjRenderer);
  });

  it('opens the record sheet with settings when the mic is blocked', async () => {
    fncUseGrantedCamera();
    fldObjMicServiceMock.srvApiCheckMicPermission.mockResolvedValue('blocked');
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).not.toHaveBeenCalled();
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjVoiceNote.fldStrMicBlockedTitle,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('lays out five preview buttons once a note exists', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-back')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-rotate')).not.toBe(
      undefined,
    );
    const fldObjMic = fncRunNodeByTestId(fldObjRenderer, 'preview-mic');
    expect(fldObjMic.findByType(vwText).props.children as string).toContain(
      '🔊',
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete-audio')).not.toBe(
      undefined,
    );
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete')).not.toBe(
      undefined,
    );
    fncRunUnmount(fldObjRenderer);
  });

  it('deletes only the note from the preview audio button', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-delete-audio')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'delete-confirm')).not.toBe(
      undefined,
    );
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'delete-confirm')();
    });
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).toHaveBeenCalledWith(
      '/cache/bits-audio/n.m4a',
    );
    const fldObjMic = fncRunNodeByTestId(fldObjRenderer, 'preview-mic');
    expect(fldObjMic.findByType(vwText).props.children as string).toContain(
      '🎙',
    );
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'preview-delete-audio' }),
    ).toHaveLength(0);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-back')();
    });
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('deletes the image with its note from the preview delete', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-voice-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-delete')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'preview-delete')).not.toBe(
      undefined,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'delete-confirm')();
    });
    expect(fldObjVoiceServiceMock.srvApiDeleteVoiceFile).toHaveBeenCalledWith(
      '/cache/bits-audio/n.m4a',
    );
    expect(fncRunThumbIds(fldObjRenderer)).toHaveLength(0);
    fncRunUnmount(fldObjRenderer);
  });

  it('records from the preview mic button', async () => {
    fncUseGrantedCamera();
    fldObjVoiceServiceMock.srvApiStartVoiceRecording.mockResolvedValue(
      '/cache/bits-audio/n.m4a',
    );
    fldObjVoiceServiceMock.srvApiStopVoiceRecording.mockResolvedValue({
      fldStrPath: '/cache/bits-audio/n.m4a',
      fldNumDurationSec: 3,
    });
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunAddGalleryEntries(fldObjRenderer, [
      fncMakeFakeEntry('in-1', 'a.jpg'),
    ]);
    const fldStrId = fncRunThumbIds(fldObjRenderer)[0] ?? '';
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, `thumb-open-${fldStrId}`)();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'preview-mic')();
    });
    expect(fncRunNodeByTestId(fldObjRenderer, 'voice-record-modal')).not.toBe(
      undefined,
    );
    expect(
      fldObjVoiceServiceMock.srvApiStartVoiceRecording,
    ).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressTestId(fldObjRenderer, 'voice-modal-stop')();
    });
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'voice-record-modal' }),
    ).toHaveLength(0);
    const fldObjMic = fncRunNodeByTestId(fldObjRenderer, 'preview-mic');
    expect(fldObjMic.findByType(vwText).props.children as string).toContain(
      '🔊',
    );
    fncRunUnmount(fldObjRenderer);
  });
});
