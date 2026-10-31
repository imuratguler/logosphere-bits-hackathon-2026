/**
 * Logosphere BITS — live camera capture screen tests (hermetic).
 *
 * The native camera kit and the permission service are mocked: the
 * suite drives every capture state — preparing, permission denied
 * and blocked, no device, viewfinder with active session, shutter
 * success and failure, retake, and close — and proves disposal of
 * native photo memory plus the fail-closed invalid-mode gate.
 * Rendering follows the repo's react-test-renderer suites.
 */

import React from 'react';
import { AppState } from 'react-native';
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

const fldObjFakePreviewImage = { id: 'img-1' };

type fldObjTestRenderer = ReturnType<typeof ReactTestRenderer.create>;

const fldObjFakeDevice = { id: 'back-0' };

async function fncRunRenderCamera(
  fldStrMode: string,
  actHandOnClose: () => void = () => undefined,
): Promise<fldObjTestRenderer> {
  let fldObjRenderer: fldObjTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrCameraCapture, {
        fldObjStrings: fldObjStringsEn,
        fldStrMode,
        actHandOnClose,
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
    fldObjVoiceNote: null,
  };
}

async function fncRunCapturePhoto(
  fldObjRenderer: fldObjTestRenderer,
): Promise<void> {
  await ReactTestRenderer.act(async () => {
    fncRunPressButton(
      fldObjRenderer,
      fldObjStringsEn.fldObjCameraCapture.fldStrShutter,
    )();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  fncRunSetFocused(true);
  (AppState as { currentState: string }).currentState = 'active';
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

  it('captures into the large preview and stops the session', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjPhoto = fncMakeFakePhoto();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fldObjPhoto);
    fncUsePreviewBundle();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fldObjPhotoOutput.capturePhoto).toHaveBeenCalledTimes(1);
    expect(
      fldObjDraftIntakeMock.srvApiPrepareCapturePreview,
    ).toHaveBeenCalledWith(fldObjPhoto);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(1);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(0);
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

  it('reports preview preparation failures without a preview', async () => {
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
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('retakes by disposing the photo and reopening the viewfinder', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjPhoto = fncMakeFakePhoto();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fldObjPhoto);
    fncUsePreviewBundle();
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrRetake,
      )();
    });
    expect(fldObjPhoto.dispose).toHaveBeenCalled();
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('closes from the preview after disposing the photo', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    const fldObjPhoto = fncMakeFakePhoto();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fldObjPhoto);
    fncUsePreviewBundle();
    const fncHandClose = jest.fn();
    const fldObjRenderer = await fncRunRenderCamera('bulk', fncHandClose);
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrClose,
      )();
    });
    expect(fldObjPhoto.dispose).toHaveBeenCalled();
    expect(fncHandClose).toHaveBeenCalledTimes(1);
    fncRunUnmount(fldObjRenderer);
  });

  it('takes the preview photo into the draft and resumes', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fncMakeFakePhoto());
    fncUsePreviewBundle();
    const fldObjEntry = fncMakeFakeEntry('d1', 'cap123.jpg');
    fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile.mockResolvedValue(
      fldObjEntry,
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(1);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrUsePhoto,
      )();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile,
    ).toHaveBeenCalledWith(fldObjFakePreviewImage, 0);
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(0);
    expect(fncRunCameraHosts(fldObjRenderer)).toHaveLength(1);
    expect(fncRunTextContents(fldObjRenderer)).toContain('cap123.jpg');
    fncRunUnmount(fldObjRenderer);
  });

  it('keeps the preview when capture intake fails', async () => {
    const { fldObjPhotoOutput } = fncUseGrantedCamera();
    fldObjPhotoOutput.capturePhoto.mockResolvedValue(fncMakeFakePhoto());
    fncUsePreviewBundle();
    fldObjDraftIntakeMock.srvApiSaveCaptureImageToDraftFile.mockRejectedValue(
      new Error('disk gone'),
    );
    const fldObjRenderer = await fncRunRenderCamera('single');
    await fncRunCapturePhoto(fldObjRenderer);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrUsePhoto,
      )();
    });
    expect(fncRunEmptyTitles(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrIntakeError,
    );
    expect(fncRunPreviewHosts(fldObjRenderer)).toHaveLength(1);
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
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
      )();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).toHaveBeenCalledWith(fldArrAssets, 0);
    const fldArrTexts = fncRunTextContents(fldObjRenderer);
    expect(fldArrTexts).toContain('rose.jpg');
    expect(fldArrTexts).toContain('codex.jpg');
    fncRunUnmount(fldObjRenderer);
  });

  it('treats gallery cancel as silent with no intake call', async () => {
    fncUseGrantedCamera();
    fldObjDraftIntakeMock.srvApiPickGalleryImages.mockResolvedValue([]);
    const fldObjRenderer = await fncRunRenderCamera('single');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
      )();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).not.toHaveBeenCalled();
    expect(fncRunEmptyTitles(fldObjRenderer)).toHaveLength(0);
    expect(fncRunTextContents(fldObjRenderer)).toContain(
      fldObjStringsEn.fldObjCameraCapture.fldStrDraftEmpty,
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
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
      )();
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
      fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
      )();
    });
    expect(
      fldObjDraftIntakeMock.srvApiSaveGalleryAssetsToDraft,
    ).toHaveBeenCalledTimes(1);
    expect(fncRunTextContents(fldObjRenderer)).toContain('rose.jpg');
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
      const fncPressGallery = fncRunPressButton(
        fldObjRenderer,
        fldObjStringsEn.fldObjCameraCapture.fldStrChooseGallery,
      );
      fncPressGallery();
      fncPressGallery();
      fncResolvePick([]);
    });
    expect(fldObjDraftIntakeMock.srvApiPickGalleryImages).toHaveBeenCalledTimes(
      1,
    );
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
});
