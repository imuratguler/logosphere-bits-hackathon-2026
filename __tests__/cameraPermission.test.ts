/**
 * Logosphere BITS — camera permission flow tests (hermetic).
 *
 * react-native-permissions is fully mocked: no native bridge, no
 * dialog. Covers result mapping for check and request, unknown
 * result rejection, settings delegation, and the CAMERA-only
 * contract (gallery independence, no microphone, no account or
 * demo imports on this path).
 */

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      MICROPHONE: 'android.permission.RECORD_AUDIO',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
  check: jest.fn(),
  request: jest.fn(),
  openSettings: jest.fn(),
}));

import { check, openSettings, request } from 'react-native-permissions';

import {
  srvApiCheckCameraPermission,
  srvApiOpenCameraAppSettings,
  srvApiRequestCameraPermission,
} from '../src/services/srvCameraPermission';

declare const __dirname: string;

type fldObjFsShape = {
  readFileSync: (fldStrPath: string, fldStrEncoding: string) => string;
};

type fldObjPathShape = {
  resolve: (...fldArrParts: string[]) => string;
  join: (...fldArrParts: string[]) => string;
};

const fldObjFs = require('fs') as fldObjFsShape;
const fldObjPath = require('path') as fldObjPathShape;

const fldObjCheck = check as unknown as jest.Mock;
const fldObjRequest = request as unknown as jest.Mock;
const fldObjOpenSettings = openSettings as unknown as jest.Mock;

describe('camera permission flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([['unavailable'], ['denied'], ['limited'], ['granted'], ['blocked']])(
    'checks the camera state (%s)',
    async fldStrStatus => {
      fldObjCheck.mockResolvedValue(fldStrStatus);

      await expect(srvApiCheckCameraPermission()).resolves.toBe(fldStrStatus);
      expect(fldObjCheck).toHaveBeenCalledWith('android.permission.CAMERA');
      expect(fldObjCheck).toHaveBeenCalledTimes(1);
    },
  );

  it.each([['unavailable'], ['denied'], ['limited'], ['granted'], ['blocked']])(
    'requests the camera state (%s)',
    async fldStrStatus => {
      fldObjRequest.mockResolvedValue(fldStrStatus);

      await expect(srvApiRequestCameraPermission()).resolves.toBe(fldStrStatus);
      expect(fldObjRequest).toHaveBeenCalledWith('android.permission.CAMERA');
      expect(fldObjRequest).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects unknown check results', async () => {
    fldObjCheck.mockResolvedValue('maybe');

    await expect(srvApiCheckCameraPermission()).rejects.toThrow(
      'unknown camera permission result',
    );
  });

  it('rejects unknown request results', async () => {
    fldObjRequest.mockResolvedValue('maybe');

    await expect(srvApiRequestCameraPermission()).rejects.toThrow(
      'unknown camera permission result',
    );
  });

  it('opens the app settings for blocked users', async () => {
    fldObjOpenSettings.mockResolvedValue(undefined);

    await srvApiOpenCameraAppSettings();

    expect(fldObjOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('names only the camera permission on this path', () => {
    const fldStrSource = fldObjFs.readFileSync(
      fldObjPath.join(
        fldObjPath.resolve(__dirname, '..'),
        'src/services/srvCameraPermission.ts',
      ),
      'utf8',
    );
    expect(fldStrSource).toMatch(/PERMISSIONS\.ANDROID\.CAMERA/);
    expect(fldStrSource).not.toMatch(/MICROPHONE/);
    expect(fldStrSource).not.toMatch(/READ_MEDIA|PHOTO_LIBRARY|MEDIA_LIBRARY/);
    expect(fldStrSource).not.toMatch(/image-picker|vision-camera|nitro/i);
    expect(fldStrSource).not.toMatch(
      /srvAuth|srvRealAccount|useDemoSession|DemoSession|srvDemo/,
    );
  });
});
