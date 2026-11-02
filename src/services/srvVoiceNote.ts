/**
 * Logosphere BITS — draft voice-note audio (record + play + delete).
 *
 * Wraps expo-audio 58.0.11 (SDK 58 line, React Native 0.88)
 * without its hooks: one recorder plus one player at a time,
 * built through AudioModule and createAudioPlayer. Recording
 * writes an AAC-in-MPEG4 file under the SDK cache audio dir
 * with a UUID basename; playback reads a note path back; and
 * delete removes the file through the blob-util layer. Stop
 * reports the file uri plus the measured milliseconds, which
 * leave here as whole seconds. Overlaps fail loudly — a
 * second recording, playback while recording, or recording
 * while playing rejects instead of interleaving — and
 * subscriptions plus shared objects are always released on
 * stop so nothing outlives its session. Microphone
 * permission stays in srvMicPermission (the kit permission
 * helpers are never used); this service never names
 * permission state.
 * Naming follows D6 (fld / srv / fnc roots).
 */

import { AudioModule, createAudioPlayer } from 'expo-audio';
import type {
  AudioPlayer,
  AudioRecorder,
  AudioStatus,
  RecordingOptions,
} from 'expo-audio';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { fncMakeUuid } from '../utils/utlUuid';

export type fldObjVoiceRecording = {
  fldStrPath: string;
  fldNumDurationSec: number | null;
};

type fldHandPlaybackEnd = () => void;

type fldObjPlaybackSubscription = {
  remove: () => void;
};

const fldStrFilePrefix = 'file://';

let fldObjRecorder: AudioRecorder | null = null;
let fldNumRecordStartMs: number | null = null;
let fldObjPlayer: AudioPlayer | null = null;
let fldObjPlaySubscription: fldObjPlaybackSubscription | null = null;
let fldHandEndHandler: fldHandPlaybackEnd | null = null;

function fncConvStrippedPath(fldStrUri: string): string {
  if (fldStrUri.startsWith(fldStrFilePrefix)) {
    return fldStrUri.slice(fldStrFilePrefix.length);
  }
  return fldStrUri;
}

function fncConvMsToSec(fldNumMs: number | null): number | null {
  if (fldNumMs === null || fldNumMs <= 0) {
    return null;
  }
  return Math.floor(fldNumMs / 1000);
}

function fncRunReleasePlayer(): void {
  const fldObjSubscription = fldObjPlaySubscription;
  fldObjPlaySubscription = null;
  const fldObjGone = fldObjPlayer;
  fldObjPlayer = null;
  fldObjSubscription?.remove();
  fldObjGone?.remove();
}

export function srvApiSetVoicePlaybackEndHandler(
  fldHandHandler: fldHandPlaybackEnd | null,
): void {
  fldHandEndHandler = fldHandHandler;
}

export async function srvApiStartVoiceRecording(): Promise<void> {
  if (fldObjRecorder !== null) {
    throw new Error('Logosphere BITS: voice recording already running.');
  }
  if (fldObjPlayer !== null) {
    throw new Error('Logosphere BITS: stop voice playback before recording.');
  }
  // Flattened platform options, mirroring the kit's own
  // createRecordingOptions for Android: the constructor type
  // keeps the nested RecordingOptions shape, but the native
  // Record reads these top-level fields (verified in kit
  // sources on both sides).
  const fldObjNext = new AudioModule.AudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
    isMeteringEnabled: false,
    directory: 'cache',
    fileName: fncMakeUuid(),
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  } as Partial<RecordingOptions>);
  try {
    await fldObjNext.prepareToRecordAsync();
    fldObjNext.record();
  } catch (fldObjError) {
    fldObjNext.release();
    throw fldObjError;
  }
  fldNumRecordStartMs = Date.now();
  fldObjRecorder = fldObjNext;
}

export async function srvApiStopVoiceRecording(): Promise<fldObjVoiceRecording> {
  const fldObjActive = fldObjRecorder;
  if (fldObjActive === null) {
    throw new Error('Logosphere BITS: no voice recording to stop.');
  }
  // The recorder is a native SharedObject: uri and status must be
  // captured after stop but before release, since every access
  // after release throws (verified live on device).
  try {
    await fldObjActive.stop();
    const fldStrUri = fldObjActive.uri;
    let fldNumStoppedMs: number | null = null;
    try {
      fldNumStoppedMs = fldObjActive.getStatus().durationMillis;
    } catch {
      fldNumStoppedMs = null;
    }
    if (fldStrUri === null) {
      throw new Error('Logosphere BITS: voice file missing after recording.');
    }
    const fldStrPath = fncConvStrippedPath(fldStrUri);
    const fldBooExists = await ReactNativeBlobUtil.fs.exists(fldStrPath);
    if (!fldBooExists) {
      throw new Error('Logosphere BITS: voice file missing after recording.');
    }
    // The native status read is unreliable after stop on device
    // (it came back empty on a 7s note); the recorder start stamp
    // is the fallback so the duration label keeps working.
    const fldNumWallMs =
      fldNumRecordStartMs === null ? null : Date.now() - fldNumRecordStartMs;
    const fldNumBestMs =
      fldNumStoppedMs !== null && fldNumStoppedMs > 0
        ? fldNumStoppedMs
        : fldNumWallMs;
    return { fldStrPath, fldNumDurationSec: fncConvMsToSec(fldNumBestMs) };
  } finally {
    fldObjRecorder = null;
    fldNumRecordStartMs = null;
    fldObjActive.release();
  }
}

export async function srvApiStartVoicePlayback(
  fldStrPath: string,
): Promise<void> {
  if (fldObjRecorder !== null) {
    throw new Error('Logosphere BITS: stop voice recording before playback.');
  }
  if (fldObjPlayer !== null) {
    throw new Error('Logosphere BITS: voice playback already running.');
  }
  const fldObjNext = createAudioPlayer({
    uri: `${fldStrFilePrefix}${fldStrPath}`,
  });
  fldObjPlaySubscription = fldObjNext.addListener(
    'playbackStatusUpdate',
    (fldObjStatus: AudioStatus) => {
      if (fldObjStatus.didJustFinish) {
        fncRunReleasePlayer();
        const fldHandHandler = fldHandEndHandler;
        if (fldHandHandler !== null) {
          fldHandHandler();
        }
      }
    },
  );
  try {
    fldObjNext.play();
  } catch (fldObjError) {
    fncRunReleasePlayer();
    throw fldObjError;
  }
  fldObjPlayer = fldObjNext;
}

export async function srvApiStopVoicePlayback(): Promise<void> {
  const fldObjActive = fldObjPlayer;
  if (fldObjActive === null) {
    return;
  }
  try {
    fldObjActive.pause();
  } finally {
    fncRunReleasePlayer();
  }
}

export async function srvApiDeleteVoiceFile(fldStrPath: string): Promise<void> {
  const fldBooExists = await ReactNativeBlobUtil.fs.exists(fldStrPath);
  if (!fldBooExists) {
    return;
  }
  await ReactNativeBlobUtil.fs.unlink(fldStrPath);
}
