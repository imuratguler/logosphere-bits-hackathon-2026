/**
 * Logosphere BITS — image normalization service tests (hermetic).
 *
 * The nitro loader and the blob-util file layer are mocked:
 * the suite proves EXIF+user rotation bakes into real pixels,
 * mirroring, the 1280 px long-edge cap at JPEG 75%, fresh
 * output paths that never touch the source, head-file cleanup,
 * and the URI/size/error contract.
 */

/* eslint-disable no-bitwise -- crafted JPEG fixtures pack multi-byte lengths. */

import { srvApiNormalizeDraftImage } from '../src/services/srvImageNormalize';

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache' },
      isDir: jest.fn(),
      mkdir: jest.fn(),
      stat: jest.fn(),
      slice: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn(),
    },
  },
}));

jest.mock('react-native-nitro-image', () => ({
  loadImage: jest.fn(),
}));

const fldObjBlobFsMock = jest.requireMock<{
  default: {
    fs: {
      dirs: { CacheDir: string };
      isDir: jest.Mock;
      mkdir: jest.Mock;
      stat: jest.Mock;
      slice: jest.Mock;
      readFile: jest.Mock;
      unlink: jest.Mock;
    };
  };
}>('react-native-blob-util').default.fs;

const fldObjNitroMock = jest.requireMock<{ loadImage: jest.Mock }>(
  'react-native-nitro-image',
);

type fldObjFakeImage = {
  width: number;
  height: number;
  rotateAsync: jest.Mock;
  mirrorHorizontallyAsync: jest.Mock;
  resizeAsync: jest.Mock;
  saveToFileAsync: jest.Mock;
};

function fncMakeImage(
  fldNumWidth: number,
  fldNumHeight: number,
): fldObjFakeImage {
  return {
    width: fldNumWidth,
    height: fldNumHeight,
    rotateAsync: jest.fn(),
    mirrorHorizontallyAsync: jest.fn(),
    resizeAsync: jest.fn(),
    saveToFileAsync: jest.fn(),
  };
}

function fncMakeLittleEndianJpeg(fldNumOrientation: number): Uint8Array {
  const fldArrExif = [
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    fldNumOrientation,
    0x00,
    0x00,
    0x00,
  ];
  const fldNumLength = fldArrExif.length + 2;
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    fldNumLength >> 8,
    fldNumLength & 0xff,
    ...fldArrExif,
    0xff,
    0xd9,
  ]);
}

// Minimal node shape (draftIntake precedent): the project
// tsconfig carries only jest globals, so the suite shapes the
// buffer module it needs instead of widening globals.
type fldObjBufferShape = {
  from: (fldArrBytes: Uint8Array) => {
    toString: (fldStrEnc: string) => string;
  };
};

const fldObjBufferLib = require('buffer') as { Buffer: fldObjBufferShape };

function fncBase64(fldArrBytes: Uint8Array): string {
  return fldObjBufferLib.Buffer.from(fldArrBytes).toString('base64');
}

const fldStrSource = '/docs/draft-1.jpg';

function fncMockSourceOk(): void {
  fldObjBlobFsMock.isDir.mockResolvedValue(false);
  fldObjBlobFsMock.mkdir.mockResolvedValue(undefined);
  fldObjBlobFsMock.stat.mockImplementation((fldStrPath: string) =>
    Promise.resolve({
      path: fldStrPath,
      size: fldStrPath === fldStrSource ? '529000' : '88000',
    }),
  );
}

function fncMockExif(fldNumOrientation: number): void {
  fldObjBlobFsMock.slice.mockResolvedValue(fldStrSource);
  fldObjBlobFsMock.readFile.mockResolvedValue(
    fncBase64(fncMakeLittleEndianJpeg(fldNumOrientation)),
  );
  fldObjBlobFsMock.unlink.mockResolvedValue(undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('srvApiNormalizeDraftImage', () => {
  it('writes a fresh JPEG 75 without touching a small identity source', async () => {
    fncMockSourceOk();
    fncMockExif(1);
    const fldObjImage = fncMakeImage(800, 600);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjImage);

    const fldObjResult = await srvApiNormalizeDraftImage(fldStrSource, 0);

    expect(fldObjNitroMock.loadImage).toHaveBeenCalledWith({
      filePath: fldStrSource,
    });
    expect(fldObjImage.rotateAsync).not.toHaveBeenCalled();
    expect(fldObjImage.mirrorHorizontallyAsync).not.toHaveBeenCalled();
    expect(fldObjImage.resizeAsync).not.toHaveBeenCalled();
    expect(fldObjImage.saveToFileAsync).toHaveBeenCalledTimes(1);
    const fldStrDest = fldObjImage.saveToFileAsync.mock.calls[0][0] as string;
    expect(fldStrDest).toMatch(/^\/cache\/bits-normalized\/.+\.jpg$/);
    expect(fldStrDest).not.toBe(fldStrSource);
    expect(fldObjImage.saveToFileAsync).toHaveBeenCalledWith(
      fldStrDest,
      'jpg',
      75,
    );
    expect(fldObjBlobFsMock.mkdir).toHaveBeenCalledWith(
      '/cache/bits-normalized',
    );
    expect(fldObjResult).toEqual({
      fldStrPath: fldStrDest,
      fldStrUri: `file://${fldStrDest}`,
      fldNumWidth: 800,
      fldNumHeight: 600,
      fldNumSize: 88000,
    });
    // The head file is cleaned; the source is never unlinked.
    expect(fldObjBlobFsMock.unlink).toHaveBeenCalledTimes(1);
    const fldStrHead = fldObjBlobFsMock.unlink.mock.calls[0][0] as string;
    expect(fldStrHead).toMatch(/\.exif-/);
    expect(fldStrHead).not.toBe(fldStrSource);
  });

  it('adds EXIF 90 to user 90 as a physical 180 rotation', async () => {
    fncMockSourceOk();
    fncMockExif(6);
    const fldObjSource = fncMakeImage(800, 600);
    const fldObjRotated = fncMakeImage(800, 600);
    fldObjSource.rotateAsync.mockResolvedValue(fldObjRotated);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjSource);

    await srvApiNormalizeDraftImage(fldStrSource, 90);

    expect(fldObjSource.rotateAsync).toHaveBeenCalledWith(180, false);
    expect(fldObjSource.mirrorHorizontallyAsync).not.toHaveBeenCalled();
    expect(fldObjRotated.saveToFileAsync).toHaveBeenCalledTimes(1);
  });

  it('mirrors EXIF 2 without rotating', async () => {
    fncMockSourceOk();
    fncMockExif(2);
    const fldObjSource = fncMakeImage(800, 600);
    const fldObjMirrored = fncMakeImage(800, 600);
    fldObjSource.mirrorHorizontallyAsync.mockResolvedValue(fldObjMirrored);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjSource);

    await srvApiNormalizeDraftImage(fldStrSource, 0);

    expect(fldObjSource.rotateAsync).not.toHaveBeenCalled();
    expect(fldObjSource.mirrorHorizontallyAsync).toHaveBeenCalledTimes(1);
    expect(fldObjMirrored.saveToFileAsync).toHaveBeenCalledTimes(1);
  });

  it('caps a 4000x3000 frame at 1280x960', async () => {
    fncMockSourceOk();
    fncMockExif(1);
    const fldObjSource = fncMakeImage(4000, 3000);
    const fldObjResized = fncMakeImage(1280, 960);
    fldObjSource.resizeAsync.mockResolvedValue(fldObjResized);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjSource);

    const fldObjResult = await srvApiNormalizeDraftImage(fldStrSource, 0);

    expect(fldObjSource.resizeAsync).toHaveBeenCalledWith(1280, 960);
    expect(fldObjResult.fldNumWidth).toBe(1280);
    expect(fldObjResult.fldNumHeight).toBe(960);
  });

  it('leaves a 1280 px long edge untouched', async () => {
    fncMockSourceOk();
    fncMockExif(1);
    const fldObjImage = fncMakeImage(1280, 800);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjImage);

    await srvApiNormalizeDraftImage(fldStrSource, 0);

    expect(fldObjImage.resizeAsync).not.toHaveBeenCalled();
  });

  it('skips EXIF for non-JPEG and rotates by user degrees only', async () => {
    const fldStrPng = '/docs/draft-1.png';
    fldObjBlobFsMock.isDir.mockResolvedValue(true);
    fldObjBlobFsMock.stat.mockImplementation((fldStrPath: string) =>
      Promise.resolve({ path: fldStrPath, size: '1000' }),
    );
    const fldObjSource = fncMakeImage(800, 600);
    const fldObjRotated = fncMakeImage(600, 800);
    fldObjSource.rotateAsync.mockResolvedValue(fldObjRotated);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjSource);

    await srvApiNormalizeDraftImage(fldStrPng, 270);

    expect(fldObjBlobFsMock.slice).not.toHaveBeenCalled();
    expect(fldObjBlobFsMock.readFile).not.toHaveBeenCalled();
    expect(fldObjBlobFsMock.mkdir).not.toHaveBeenCalled();
    expect(fldObjSource.rotateAsync).toHaveBeenCalledWith(270, false);
  });

  it('proceeds with identity when the EXIF head cannot be read', async () => {
    fncMockSourceOk();
    fldObjBlobFsMock.slice.mockRejectedValue(new Error('slice failed'));
    fldObjBlobFsMock.unlink.mockResolvedValue(undefined);
    const fldObjImage = fncMakeImage(800, 600);
    fldObjNitroMock.loadImage.mockResolvedValue(fldObjImage);

    await srvApiNormalizeDraftImage(fldStrSource, 0);

    expect(fldObjNitroMock.loadImage).toHaveBeenCalledWith({
      filePath: fldStrSource,
    });
    expect(fldObjImage.rotateAsync).not.toHaveBeenCalled();
    expect(fldObjImage.saveToFileAsync).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing source before loading anything', async () => {
    fldObjBlobFsMock.stat.mockRejectedValue(new Error('ENOENT'));

    await expect(srvApiNormalizeDraftImage(fldStrSource, 0)).rejects.toThrow(
      /missing file/,
    );
    expect(fldObjNitroMock.loadImage).not.toHaveBeenCalled();
  });

  it('rejects empty sources and empty output', async () => {
    fldObjBlobFsMock.stat.mockResolvedValue({
      path: fldStrSource,
      size: '0',
    });
    await expect(srvApiNormalizeDraftImage(fldStrSource, 0)).rejects.toThrow(
      /empty file/,
    );
    expect(fldObjNitroMock.loadImage).not.toHaveBeenCalled();

    jest.clearAllMocks();
    fncMockSourceOk();
    fncMockExif(1);
    fldObjBlobFsMock.stat.mockImplementation((fldStrPath: string) =>
      Promise.resolve({
        path: fldStrPath,
        size: fldStrPath === fldStrSource ? '529000' : '0',
      }),
    );
    fldObjNitroMock.loadImage.mockResolvedValue(fncMakeImage(800, 600));
    await expect(srvApiNormalizeDraftImage(fldStrSource, 0)).rejects.toThrow(
      /no bytes/,
    );
  });

  it('propagates save failures and mints a fresh path per call', async () => {
    fncMockSourceOk();
    fncMockExif(1);
    const fldObjFailing = fncMakeImage(800, 600);
    fldObjFailing.saveToFileAsync.mockRejectedValue(new Error('disk is full'));
    fldObjNitroMock.loadImage.mockResolvedValueOnce(fldObjFailing);

    await expect(srvApiNormalizeDraftImage(fldStrSource, 0)).rejects.toThrow(
      /disk is full/,
    );

    const fldObjFirst = fncMakeImage(800, 600);
    const fldObjSecond = fncMakeImage(800, 600);
    fldObjNitroMock.loadImage
      .mockResolvedValueOnce(fldObjFirst)
      .mockResolvedValueOnce(fldObjSecond);
    await srvApiNormalizeDraftImage(fldStrSource, 0);
    await srvApiNormalizeDraftImage(fldStrSource, 0);
    const fldStrFirst = fldObjFirst.saveToFileAsync.mock.calls[0][0] as string;
    const fldStrSecond = fldObjSecond.saveToFileAsync.mock
      .calls[0][0] as string;
    expect(fldStrFirst).not.toBe(fldStrSecond);
  });
});
