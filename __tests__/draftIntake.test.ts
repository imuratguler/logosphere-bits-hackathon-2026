/**
 * Logosphere BITS — draft intake service tests (hermetic).
 *
 * The VisionCamera photo, the gallery picker, and the blob-util
 * file layer are mocked: the suite proves capture conversion
 * through the official file API, gallery cancel/error mapping,
 * safe content/file URI preparation with collision-free draft
 * names, and the camera-permission independence contract (the
 * service never names camera permission state).
 */

import type { Asset } from 'react-native-image-picker';
import type { Photo } from 'react-native-vision-camera';

// Minimal node shapes (hiddenBoundary precedent): the project
// tsconfig carries only jest globals, so the scan shapes the two
// modules it needs instead of widening globals for mobile code.
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

const fldStrRoot = fldObjPath.resolve(__dirname, '..');

import {
  srvApiPickGalleryImages,
  srvApiSaveCaptureToDraftFile,
  srvApiSaveGalleryAssetsToDraft,
} from '../src/services/srvDraftIntake';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache', DocumentDir: '/docs' },
      exists: jest.fn(),
      isDir: jest.fn(),
      mkdir: jest.fn(),
      cp: jest.fn(),
    },
  },
}));

const fldObjPickerMock = jest.requireMock<{
  launchImageLibrary: jest.Mock;
}>('react-native-image-picker');

const fldObjBlobFsMock = jest.requireMock<{
  default: {
    fs: {
      dirs: { CacheDir: string; DocumentDir: string };
      exists: jest.Mock;
      isDir: jest.Mock;
      mkdir: jest.Mock;
      cp: jest.Mock;
    };
  };
}>('react-native-blob-util').default.fs;

function fncMakeFakePhoto(fldStrPath: string): Photo {
  return {
    saveToTemporaryFileAsync: jest.fn().mockResolvedValue(fldStrPath),
  } as unknown as Photo;
}

function fncUseDraftDir(fldBooExists: boolean): void {
  fldObjBlobFsMock.isDir.mockResolvedValue(fldBooExists);
  fldObjBlobFsMock.mkdir.mockResolvedValue(undefined);
  fldObjBlobFsMock.cp.mockResolvedValue(true);
  // Odd exists() calls are collision probes (free), even calls are
  // post-copy verifications (landed): one asset costs two calls.
  let fldNumExistsCalls = 0;
  fldObjBlobFsMock.exists.mockImplementation(async () => {
    fldNumExistsCalls += 1;
    return fldNumExistsCalls % 2 === 0;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('capture to draft file', () => {
  it('converts the photo through the official file API', async () => {
    fldObjBlobFsMock.exists.mockResolvedValue(true);
    const fldObjEntry = await srvApiSaveCaptureToDraftFile(
      fncMakeFakePhoto('/tmp/cap123.jpg'),
      0,
    );
    expect(fldObjEntry.fldStrLocalPath).toBe('/tmp/cap123.jpg');
    expect(fldObjEntry.fldNumSortOrder).toBe(0);
    expect(fldObjEntry.fldNumRotationDegrees).toBe(0);
    expect(fldObjEntry.fldObjVoiceNote).toBeNull();
    expect(fldObjEntry.fldStrId).toMatch(/^capture-\d+$/);
    expect(fldObjBlobFsMock.exists).toHaveBeenCalledWith('/tmp/cap123.jpg');
  });

  it('rejects a capture that produced no file', async () => {
    await expect(
      srvApiSaveCaptureToDraftFile(fncMakeFakePhoto(''), 0),
    ).rejects.toThrow('capture produced no file');
    expect(fldObjBlobFsMock.exists).not.toHaveBeenCalled();
  });

  it('rejects a missing capture file', async () => {
    fldObjBlobFsMock.exists.mockResolvedValue(false);
    await expect(
      srvApiSaveCaptureToDraftFile(fncMakeFakePhoto('/tmp/gone.jpg'), 0),
    ).rejects.toThrow('capture file is missing');
  });

  it('propagates converter failures', async () => {
    const fldObjPhoto = {
      saveToTemporaryFileAsync: jest
        .fn()
        .mockRejectedValue(new Error('no memory')),
    } as unknown as Photo;
    await expect(srvApiSaveCaptureToDraftFile(fldObjPhoto, 2)).rejects.toThrow(
      'no memory',
    );
  });
});

describe('gallery picking', () => {
  it('requests photos with unlimited multi-select', async () => {
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({ assets: [] });
    await srvApiPickGalleryImages();
    expect(fldObjPickerMock.launchImageLibrary).toHaveBeenCalledWith({
      mediaType: 'photo',
      selectionLimit: 0,
    });
  });

  it('maps cancel to an empty list without an error', async () => {
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({ didCancel: true });
    await expect(srvApiPickGalleryImages()).resolves.toEqual([]);
  });

  it('throws picker errors with their message', async () => {
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({
      errorCode: 'permission',
      errorMessage: 'denied by user',
    });
    await expect(srvApiPickGalleryImages()).rejects.toThrow('denied by user');
  });

  it('falls back to the error code without a message', async () => {
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({
      errorCode: 'others',
    });
    await expect(srvApiPickGalleryImages()).rejects.toThrow('others');
  });

  it('returns picked assets and tolerates a missing list', async () => {
    const fldArrAssets: Asset[] = [{ uri: 'content://a/1' }];
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({
      assets: fldArrAssets,
    });
    await expect(srvApiPickGalleryImages()).resolves.toEqual(fldArrAssets);
    fldObjPickerMock.launchImageLibrary.mockResolvedValue({});
    await expect(srvApiPickGalleryImages()).resolves.toEqual([]);
  });
});

describe('gallery assets to draft files', () => {
  it('creates the draft folder only when missing', async () => {
    fncUseDraftDir(false);
    await srvApiSaveGalleryAssetsToDraft([{ uri: 'content://a/1' }], 0);
    expect(fldObjBlobFsMock.mkdir).toHaveBeenCalledWith('/cache/bits-draft');

    jest.clearAllMocks();
    fncUseDraftDir(true);
    await srvApiSaveGalleryAssetsToDraft([{ uri: 'content://a/1' }], 0);
    expect(fldObjBlobFsMock.mkdir).not.toHaveBeenCalled();
  });

  it('copies content URIs through the resolver path untouched', async () => {
    fncUseDraftDir(true);
    const fldArrDraft = await srvApiSaveGalleryAssetsToDraft(
      [{ uri: 'content://media/44', fileName: 'rose.jpg' }],
      5,
    );
    expect(fldObjBlobFsMock.cp).toHaveBeenCalledWith(
      'content://media/44',
      '/cache/bits-draft/rose.jpg',
    );
    expect(fldArrDraft).toHaveLength(1);
    expect(fldArrDraft[0].fldStrLocalPath).toBe('/cache/bits-draft/rose.jpg');
    expect(fldArrDraft[0].fldNumSortOrder).toBe(5);
    expect(fldArrDraft[0].fldNumRotationDegrees).toBe(0);
    expect(fldArrDraft[0].fldObjVoiceNote).toBeNull();
    expect(fldArrDraft[0].fldStrId).toMatch(/^gallery-\d+-1$/);
  });

  it('sequences batch orders from the start order', async () => {
    fncUseDraftDir(true);
    const fldArrDraft = await srvApiSaveGalleryAssetsToDraft(
      [
        { uri: 'content://a/1', fileName: 'one.jpg' },
        { uri: '', fileName: 'skipped.jpg' },
        { uri: 'content://a/2', fileName: 'two.jpg' },
      ],
      3,
    );
    expect(fldArrDraft).toHaveLength(2);
    expect(fldArrDraft[0].fldNumSortOrder).toBe(3);
    expect(fldArrDraft[1].fldNumSortOrder).toBe(4);
  });

  it('unwraps file URLs to plain paths', async () => {
    fncUseDraftDir(true);
    await srvApiSaveGalleryAssetsToDraft(
      [{ uri: 'file:///sdcard/pic.png', fileName: 'pic.png' }],
      0,
    );
    expect(fldObjBlobFsMock.cp).toHaveBeenCalledWith(
      '/sdcard/pic.png',
      '/cache/bits-draft/pic.png',
    );
  });

  it('skips assets without a usable URI', async () => {
    fncUseDraftDir(true);
    const fldArrDraft = await srvApiSaveGalleryAssetsToDraft(
      [
        { fileName: 'ghost.jpg' },
        { uri: '', fileName: 'empty.jpg' },
        { uri: 'content://media/9', fileName: 'kept.jpg' },
      ],
      0,
    );
    expect(fldArrDraft).toHaveLength(1);
    expect(fldArrDraft[0].fldStrLocalPath).toBe('/cache/bits-draft/kept.jpg');
    expect(fldObjBlobFsMock.cp).toHaveBeenCalledTimes(1);
  });

  it('sanitizes hostile file names and falls back when empty', async () => {
    fncUseDraftDir(true);
    const fldArrDraft = await srvApiSaveGalleryAssetsToDraft(
      [
        { uri: 'content://a/1', fileName: '../../etc/shadow' },
        { uri: 'content://a/2' },
      ],
      0,
    );
    expect(fldArrDraft[0].fldStrLocalPath).toBe('/cache/bits-draft/shadow');
    expect(fldArrDraft[1].fldStrLocalPath).toMatch(
      /^\/cache\/bits-draft\/gallery-\d+-2\.jpg$/,
    );
  });

  it('suffixes colliding draft names', async () => {
    fncUseDraftDir(true);
    fldObjBlobFsMock.exists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const fldArrDraft = await srvApiSaveGalleryAssetsToDraft(
      [{ uri: 'content://a/1', fileName: 'rose.jpg' }],
      0,
    );
    expect(fldObjBlobFsMock.cp).toHaveBeenCalledWith(
      'content://a/1',
      '/cache/bits-draft/rose-1.jpg',
    );
    expect(fldArrDraft[0].fldStrLocalPath).toBe('/cache/bits-draft/rose-1.jpg');
  });

  it('rejects a copy that never landed', async () => {
    fncUseDraftDir(true);
    fldObjBlobFsMock.exists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    await expect(
      srvApiSaveGalleryAssetsToDraft(
        [{ uri: 'content://a/1', fileName: 'rose.jpg' }],
        0,
      ),
    ).rejects.toThrow('gallery copy is missing');
  });

  it('propagates copy failures', async () => {
    fncUseDraftDir(true);
    fldObjBlobFsMock.exists.mockResolvedValue(false);
    fldObjBlobFsMock.cp.mockRejectedValue(new Error('io gone'));
    await expect(
      srvApiSaveGalleryAssetsToDraft(
        [{ uri: 'content://a/1', fileName: 'rose.jpg' }],
        0,
      ),
    ).rejects.toThrow('io gone');
  });

  it('never names camera permission state', () => {
    const fldStrSource = fldObjFs.readFileSync(
      fldObjPath.join(fldStrRoot, 'src/services/srvDraftIntake.ts'),
      'utf8',
    );
    expect(fldStrSource).not.toMatch(/srvCameraPermission/);
    expect(fldStrSource).not.toMatch(/react-native-permissions/);
    expect(fldStrSource).not.toMatch(/PERMISSIONS/);
    expect(fldStrSource).not.toMatch(/CAMERA/);
  });
});
