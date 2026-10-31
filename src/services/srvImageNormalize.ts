/**
 * Logosphere BITS — analysis image normalization (nitro pixels).
 *
 * Bakes the EXIF orientation plus the user's rotation into real
 * pixels for analysis: loads the draft file, rotates physically
 * (never flag-only), mirrors when the EXIF value demands it,
 * caps the long edge at 1280 px, and writes a fresh JPEG at
 * 75% quality. The source file is only ever read, never
 * written; output lands in the app-local normalized folder
 * through the blob-util file layer. EXIF read failures fall
 * back to identity so the user's rotation still applies;
 * load/convert/save failures propagate with context.
 * Naming follows D6 (fld / srv / fnc roots).
 */

import ReactNativeBlobUtil from 'react-native-blob-util';
import { loadImage } from 'react-native-nitro-image';

import { fncMakeUuid } from '../utils/utlUuid';
import {
  fncDecodeBase64,
  vldParseExifOrientation,
  type fldObjExifOrientation,
} from '../validation/vldExifOrientation';

export type fldObjNormalizedImage = {
  fldStrPath: string;
  fldStrUri: string;
  fldNumWidth: number;
  fldNumHeight: number;
  fldNumSize: number;
};

const fldNumMaxEdgePx = 1280;
const fldNumJpegQuality = 75;
const fldNumExifHeadBytes = 65536;
const fldStrNormalizedDirName = 'bits-normalized';

function fncRunNormalizedDir(): string {
  return `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fldStrNormalizedDirName}`;
}

async function fncRunEnsureDir(fldStrDir: string): Promise<void> {
  const fldBooIsDir = await ReactNativeBlobUtil.fs.isDir(fldStrDir);
  if (!fldBooIsDir) {
    await ReactNativeBlobUtil.fs.mkdir(fldStrDir);
  }
}

async function fncReadExifOrientation(
  fldStrPath: string,
): Promise<fldObjExifOrientation> {
  const fldObjIdentity = { fldNumDegrees: 0, fldBooMirror: false };
  if (!/\.jpe?g$/i.test(fldStrPath)) {
    return fldObjIdentity;
  }
  const fldStrDir = fncRunNormalizedDir();
  const fldStrHead = `${fldStrDir}/.exif-${fncMakeUuid()}`;
  try {
    await fncRunEnsureDir(fldStrDir);
    await ReactNativeBlobUtil.fs.slice(
      fldStrPath,
      fldStrHead,
      0,
      fldNumExifHeadBytes,
    );
    const fldStrBase64: string = await ReactNativeBlobUtil.fs.readFile(
      fldStrHead,
      'base64',
    );
    return vldParseExifOrientation(fncDecodeBase64(fldStrBase64));
  } catch {
    return fldObjIdentity;
  } finally {
    await ReactNativeBlobUtil.fs.unlink(fldStrHead).catch(() => undefined);
  }
}

export async function srvApiNormalizeDraftImage(
  fldStrPath: string,
  fldNumUserDegrees: number,
): Promise<fldObjNormalizedImage> {
  let fldObjSource;
  try {
    fldObjSource = await ReactNativeBlobUtil.fs.stat(fldStrPath);
  } catch (fldObjError: unknown) {
    throw new Error(
      `Logosphere BITS: cannot normalize missing file (${
        (fldObjError as Error).message
      })`,
    );
  }
  if (Number(fldObjSource.size) <= 0) {
    throw new Error('Logosphere BITS: cannot normalize an empty file.');
  }
  const fldObjExif = await fncReadExifOrientation(fldStrPath);
  let fldObjImage = await loadImage({ filePath: fldStrPath });
  const fldNumTotalDegrees = ((fldObjExif.fldNumDegrees + fldNumUserDegrees) %
    360) as 0 | 90 | 180 | 270;
  if (fldNumTotalDegrees !== 0) {
    fldObjImage = await fldObjImage.rotateAsync(fldNumTotalDegrees, false);
  }
  if (fldObjExif.fldBooMirror) {
    fldObjImage = await fldObjImage.mirrorHorizontallyAsync();
  }
  const fldNumLongEdge = Math.max(fldObjImage.width, fldObjImage.height);
  const fldNumScale = Math.min(1, fldNumMaxEdgePx / fldNumLongEdge);
  if (fldNumScale < 1) {
    fldObjImage = await fldObjImage.resizeAsync(
      Math.floor(fldObjImage.width * fldNumScale),
      Math.floor(fldObjImage.height * fldNumScale),
    );
  }
  const fldStrDir = fncRunNormalizedDir();
  await fncRunEnsureDir(fldStrDir);
  const fldStrDest = `${fldStrDir}/${fncMakeUuid()}.jpg`;
  await fldObjImage.saveToFileAsync(fldStrDest, 'jpg', fldNumJpegQuality);
  const fldObjOutput = await ReactNativeBlobUtil.fs.stat(fldStrDest);
  if (Number(fldObjOutput.size) <= 0) {
    throw new Error('Logosphere BITS: normalization produced no bytes.');
  }
  return {
    fldStrPath: fldStrDest,
    fldStrUri: `file://${fldStrDest}`,
    fldNumWidth: fldObjImage.width,
    fldNumHeight: fldObjImage.height,
    fldNumSize: Number(fldObjOutput.size),
  };
}
