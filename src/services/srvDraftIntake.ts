/**
 * Logosphere BITS — draft intake (capture + gallery to local files).
 *
 * Takes VisionCamera captures and system-gallery picks into draft
 * entries. A captured photo is single-consumption on native:
 * the preview converts it exactly once (`toImageAsync`) and
 * disposes it immediately; the draft file is then saved from
 * the display image (`saveToTemporaryFileAsync('jpg', 100)`).
 * Saving the photo to a file first and loading the preview
 * back from disk was tried and dropped: the file lands valid
 * on device but the file-loaded image renders black, so the
 * order is fixed here and nowhere else. Gallery assets copy
 * into the app-local draft folder through the blob-util file
 * layer (content:// sources ride the native ContentResolver
 * copy, file:// URLs unwrap to plain paths first). Gallery
 * cancel yields an empty list, never an error; gallery errors
 * throw with the picker message. This module never touches
 * camera permission state: gallery intake works with the
 * camera denied or blocked. Naming follows D6 (fld / srv /
 * fnc roots).
 */

import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { Image } from 'react-native-nitro-image';
import type { Photo } from 'react-native-vision-camera';

import type { fldObjDraftImage } from '../types/typModels';

const fldStrDraftDirName = 'bits-draft';

function fncRunDraftDir(): string {
  return `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fldStrDraftDirName}`;
}

function fncConvSafeFileName(
  fldStrRaw: string | undefined,
  fldNumIndex: number,
): string {
  const fldStrBase = (fldStrRaw ?? '').split('/').pop() ?? '';
  const fldStrClean = fldStrBase
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^\.+/, '');
  if (fldStrClean.length > 0) {
    return fldStrClean;
  }
  return `gallery-${Date.now()}-${fldNumIndex}.jpg`;
}

function fncConvSourcePath(fldStrUri: string): string {
  if (fldStrUri.startsWith('content://')) {
    return fldStrUri;
  }
  return fldStrUri.replace(/^file:\/\//, '');
}

function fncMakeDraftId(fldStrPrefix: string): string {
  return `${fldStrPrefix}-${Date.now()}`;
}

async function fncRunFreeDestPath(
  fldStrDir: string,
  fldStrName: string,
): Promise<string> {
  const fldNumDot = fldStrName.lastIndexOf('.');
  const fldStrStem =
    fldNumDot > 0 ? fldStrName.slice(0, fldNumDot) : fldStrName;
  const fldStrExt = fldNumDot > 0 ? fldStrName.slice(fldNumDot) : '';
  let fldStrCandidate = `${fldStrDir}/${fldStrName}`;
  let fldNumTry = 0;
  while (await ReactNativeBlobUtil.fs.exists(fldStrCandidate)) {
    fldNumTry += 1;
    if (fldNumTry > 99) {
      throw new Error('Logosphere BITS: draft file name collision.');
    }
    fldStrCandidate = `${fldStrDir}/${fldStrStem}-${fldNumTry}${fldStrExt}`;
  }
  return fldStrCandidate;
}

export async function srvApiPrepareCapturePreview(
  fldObjPhoto: Photo,
): Promise<Image> {
  try {
    return await fldObjPhoto.toImageAsync();
  } finally {
    fldObjPhoto.dispose();
  }
}

export async function srvApiSaveCaptureImageToDraftFile(
  fldObjImage: Image,
  fldNumSortOrder: number,
): Promise<fldObjDraftImage> {
  const fldStrPath = await fldObjImage.saveToTemporaryFileAsync('jpg', 100);
  if (typeof fldStrPath !== 'string' || fldStrPath.length === 0) {
    throw new Error('Logosphere BITS: capture produced no file.');
  }
  const fldBooExists = await ReactNativeBlobUtil.fs.exists(fldStrPath);
  if (!fldBooExists) {
    throw new Error('Logosphere BITS: capture file is missing.');
  }
  return {
    fldStrId: fncMakeDraftId('capture'),
    fldNumSortOrder,
    fldStrLocalPath: fldStrPath,
    fldNumRotationDegrees: 0,
    fldObjVoiceNote: null,
  };
}

export async function srvApiPickGalleryImages(): Promise<Asset[]> {
  const fldObjResponse = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 0,
  });
  if (fldObjResponse.didCancel === true) {
    return [];
  }
  if (fldObjResponse.errorCode !== undefined) {
    throw new Error(fldObjResponse.errorMessage ?? fldObjResponse.errorCode);
  }
  return fldObjResponse.assets ?? [];
}

export async function srvApiSaveGalleryAssetsToDraft(
  fldArrAssets: Asset[],
  fldNumStartOrder: number,
): Promise<fldObjDraftImage[]> {
  const fldStrDir = fncRunDraftDir();
  const fldBooIsDir = await ReactNativeBlobUtil.fs.isDir(fldStrDir);
  if (!fldBooIsDir) {
    await ReactNativeBlobUtil.fs.mkdir(fldStrDir);
  }
  const fldArrDraft: fldObjDraftImage[] = [];
  let fldNumIndex = 0;
  for (const fldObjAsset of fldArrAssets) {
    fldNumIndex += 1;
    if (typeof fldObjAsset.uri !== 'string' || fldObjAsset.uri.length === 0) {
      continue;
    }
    const fldStrDest = await fncRunFreeDestPath(
      fldStrDir,
      fncConvSafeFileName(fldObjAsset.fileName, fldNumIndex),
    );
    await ReactNativeBlobUtil.fs.cp(
      fncConvSourcePath(fldObjAsset.uri),
      fldStrDest,
    );
    const fldBooCopied = await ReactNativeBlobUtil.fs.exists(fldStrDest);
    if (!fldBooCopied) {
      throw new Error('Logosphere BITS: gallery copy is missing.');
    }
    fldArrDraft.push({
      fldStrId: `${fncMakeDraftId('gallery')}-${fldNumIndex}`,
      fldNumSortOrder: fldNumStartOrder + fldArrDraft.length,
      fldStrLocalPath: fldStrDest,
      fldNumRotationDegrees: 0,
      fldObjVoiceNote: null,
    });
  }
  return fldArrDraft;
}
