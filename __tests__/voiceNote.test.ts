/**
 * Logosphere BITS — voice-note audio service tests (hermetic).
 *
 * The expo-audio shared objects and the blob-util file layer are
 * mocked: the suite proves recording setup (UUID basename,
 * AAC-in-MPEG4 voice options), stop mapping (uri strip, null
 * uri rejection, exists verification, ms-to-seconds duration),
 * playback start/stop with didJustFinish end callbacks, loud
 * overlap rejections, release discipline, and idempotent file
 * delete.
 */

jest.mock('expo-audio', () => ({
  AudioModule: { AudioRecorder: jest.fn() },
  createAudioPlayer: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache', DocumentDir: '/docs' },
      exists: jest.fn(),
      unlink: jest.fn(),
    },
  },
}));

import {
  srvApiDeleteVoiceFile,
  srvApiSeekVoicePlayback,
  srvApiSetVoicePlaybackEndHandler,
  srvApiSetVoicePlaybackProgressHandler,
  srvApiStartVoicePlayback,
  srvApiStartVoiceRecording,
  srvApiStopVoicePlayback,
  srvApiStopVoiceRecording,
} from '../src/services/srvVoiceNote';

const fldObjAudioMock = jest.requireMock<{
  AudioModule: { AudioRecorder: jest.Mock };
  createAudioPlayer: jest.Mock;
}>('expo-audio');

const fldObjBlobFsMock = jest.requireMock<{
  default: {
    fs: {
      dirs: { CacheDir: string; DocumentDir: string };
      exists: jest.Mock;
      unlink: jest.Mock;
    };
  };
}>('react-native-blob-util').default.fs;

type fldObjFakeRecorder = {
  prepareToRecordAsync: jest.Mock;
  record: jest.Mock;
  stop: jest.Mock;
  getStatus: jest.Mock;
  release: jest.Mock;
  uri: string | null;
};

type fldObjFakePlayer = {
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
  addListener: jest.Mock;
};

function fncMakeFakeRecorder(): fldObjFakeRecorder {
  return {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockReturnValue({ durationMillis: 4450 }),
    release: jest.fn(),
    uri: 'file:///cache/Audio/note.m4a',
  };
}

function fncMakeFakePlayer(): fldObjFakePlayer {
  return {
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  };
}

function fncRunStatusCallback(
  fldObjPlayer: fldObjFakePlayer,
): (fldObjStatus: {
  didJustFinish: boolean;
  currentTime?: number;
  duration?: number;
}) => void {
  const fldArrCalls: unknown[][] = fldObjPlayer.addListener.mock.calls;
  const fldObjCall = fldArrCalls[0];
  if (!Array.isArray(fldObjCall)) {
    throw new Error('Logosphere BITS: status listener was not attached.');
  }
  return fldObjCall[1] as (fldObjStatus: {
    didJustFinish: boolean;
    currentTime?: number;
    duration?: number;
  }) => void;
}

async function fncRunStopQuietly(
  fldObjRecorder: fldObjFakeRecorder,
): Promise<void> {
  fldObjBlobFsMock.exists.mockResolvedValue(true);
  await srvApiStopVoiceRecording();
  expect(fldObjRecorder.release).toHaveBeenCalled();
}

describe('voice-note audio service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    srvApiSetVoicePlaybackEndHandler(null);
  });

  it('starts recording with voice options and a UUID basename', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );

    await srvApiStartVoiceRecording();

    expect(fldObjAudioMock.AudioModule.AudioRecorder).toHaveBeenCalledTimes(1);
    const fldObjOptions = fldObjAudioMock.AudioModule.AudioRecorder.mock
      .calls[0]?.[0] as Record<string, unknown>;
    expect(fldObjOptions.extension).toBe('.m4a');
    expect(fldObjOptions.outputFormat).toBe('mpeg4');
    expect(fldObjOptions.audioEncoder).toBe('aac');
    expect(fldObjOptions.directory).toBe('cache');
    expect(fldObjOptions.fileName).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(fldObjRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(fldObjRecorder.record).toHaveBeenCalledTimes(1);

    await fncRunStopQuietly(fldObjRecorder);
  });

  it('releases the recorder when prepare fails', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjRecorder.prepareToRecordAsync.mockRejectedValue(new Error('no mic'));
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );

    await expect(srvApiStartVoiceRecording()).rejects.toThrow('no mic');
    expect(fldObjRecorder.release).toHaveBeenCalledTimes(1);
    expect(fldObjRecorder.record).not.toHaveBeenCalled();

    const fldObjRetry = fncMakeFakeRecorder();
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRetry,
    );
    await srvApiStartVoiceRecording();
    await fncRunStopQuietly(fldObjRetry);
  });

  it('stops with the stripped path and measured seconds', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );
    await srvApiStartVoiceRecording();
    fldObjBlobFsMock.exists.mockResolvedValue(true);

    const fldObjDone = await srvApiStopVoiceRecording();

    expect(fldObjDone.fldStrPath).toBe('/cache/Audio/note.m4a');
    expect(fldObjDone.fldNumDurationSec).toBe(4);
    expect(fldObjRecorder.release).toHaveBeenCalledTimes(1);
  });

  it('falls back to wall-clock seconds when the status read fails', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjRecorder.getStatus.mockImplementation(() => {
      throw new Error('gone');
    });
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );
    const fldObjNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(8000);
    await srvApiStartVoiceRecording();
    fldObjBlobFsMock.exists.mockResolvedValue(true);

    const fldObjDone = await srvApiStopVoiceRecording();
    fldObjNowSpy.mockRestore();

    expect(fldObjDone.fldNumDurationSec).toBe(7);
  });

  it('reads uri and status before release', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    let fldBooReleased = false;
    fldObjRecorder.release.mockImplementation(() => {
      fldBooReleased = true;
    });
    fldObjRecorder.getStatus.mockImplementation(() => {
      if (fldBooReleased) {
        throw new Error('Cannot use shared object that was already released');
      }
      return { durationMillis: 4450 };
    });
    Object.defineProperty(fldObjRecorder, 'uri', {
      get: () => {
        if (fldBooReleased) {
          throw new Error('Cannot use shared object that was already released');
        }
        return 'file:///cache/Audio/note.m4a';
      },
    });
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );
    await srvApiStartVoiceRecording();
    fldObjBlobFsMock.exists.mockResolvedValue(true);

    const fldObjDone = await srvApiStopVoiceRecording();

    expect(fldObjDone.fldStrPath).toBe('/cache/Audio/note.m4a');
    expect(fldObjDone.fldNumDurationSec).toBe(4);
    expect(fldObjRecorder.release).toHaveBeenCalledTimes(1);
  });

  it('rejects stop when the uri or file is missing', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjRecorder.uri = null;
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );
    await srvApiStartVoiceRecording();

    await expect(srvApiStopVoiceRecording()).rejects.toThrow(
      'voice file missing',
    );

    const fldObjRetry = fncMakeFakeRecorder();
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRetry,
    );
    await srvApiStartVoiceRecording();
    fldObjBlobFsMock.exists.mockResolvedValue(false);
    await expect(srvApiStopVoiceRecording()).rejects.toThrow(
      'voice file missing',
    );
  });

  it('rejects stop without a recording', async () => {
    await expect(srvApiStopVoiceRecording()).rejects.toThrow(
      'no voice recording to stop',
    );
    expect(fldObjAudioMock.AudioModule.AudioRecorder).not.toHaveBeenCalled();
  });

  it('rejects overlaps loudly', async () => {
    const fldObjRecorder = fncMakeFakeRecorder();
    fldObjAudioMock.AudioModule.AudioRecorder.mockImplementation(
      () => fldObjRecorder,
    );
    await srvApiStartVoiceRecording();

    await expect(srvApiStartVoiceRecording()).rejects.toThrow(
      'already running',
    );
    await expect(srvApiStartVoicePlayback('/cache/n.m4a')).rejects.toThrow(
      'stop voice recording before playback',
    );
    await fncRunStopQuietly(fldObjRecorder);

    const fldObjPlayer = fncMakeFakePlayer();
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjPlayer);
    await srvApiStartVoicePlayback('/cache/n.m4a');
    await expect(srvApiStartVoicePlayback('/cache/n.m4a')).rejects.toThrow(
      'already running',
    );
    await expect(srvApiStartVoiceRecording()).rejects.toThrow(
      'stop voice playback before recording',
    );
    await srvApiStopVoicePlayback();
  });

  it('fires the end handler when playback finishes', async () => {
    const fldHandEnd = jest.fn();
    srvApiSetVoicePlaybackEndHandler(fldHandEnd);
    const fldObjPlayer = fncMakeFakePlayer();
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjPlayer);

    await srvApiStartVoicePlayback('/cache/Audio/note.m4a');

    expect(fldObjAudioMock.createAudioPlayer).toHaveBeenCalledWith({
      uri: 'file:///cache/Audio/note.m4a',
    });
    expect(fldObjPlayer.play).toHaveBeenCalledTimes(1);
    const fldHandStatus = fncRunStatusCallback(fldObjPlayer);
    fldHandStatus({ didJustFinish: false });
    expect(fldHandEnd).not.toHaveBeenCalled();
    fldHandStatus({ didJustFinish: true });
    expect(fldHandEnd).toHaveBeenCalledTimes(1);
    expect(fldObjPlayer.remove).toHaveBeenCalledTimes(1);

    const fldObjSecond = fncMakeFakePlayer();
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjSecond);
    await srvApiStartVoicePlayback('/cache/Audio/note.m4a');
    await srvApiStopVoicePlayback();
  });

  it('fires the progress handler with seconds and duration', async () => {
    const fldHandProgress = jest.fn();
    srvApiSetVoicePlaybackProgressHandler(fldHandProgress);
    const fldObjPlayer = fncMakeFakePlayer();
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjPlayer);

    await srvApiStartVoicePlayback('/cache/Audio/note.m4a');

    const fldHandStatus = fncRunStatusCallback(fldObjPlayer);
    fldHandStatus({ didJustFinish: false, currentTime: 7.2, duration: 29 });
    expect(fldHandProgress).toHaveBeenCalledWith(7.2, 29);
    fldHandStatus({ didJustFinish: false, currentTime: 3, duration: 0 });
    expect(fldHandProgress).toHaveBeenCalledWith(3, null);
    fldHandStatus({ didJustFinish: true, currentTime: 29, duration: 29 });
    expect(fldHandProgress).toHaveBeenCalledTimes(2);

    await srvApiStopVoicePlayback();
    srvApiSetVoicePlaybackProgressHandler(null);
  });

  it('starts playback from a seek offset and seeks the player', async () => {
    const fldObjPlayer = fncMakeFakePlayer();
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjPlayer);

    await srvApiStartVoicePlayback('/cache/Audio/note.m4a', 14.5);

    expect(fldObjPlayer.play).toHaveBeenCalledTimes(1);
    expect(fldObjPlayer.seekTo).toHaveBeenCalledWith(14.5);

    await srvApiSeekVoicePlayback(29);
    expect(fldObjPlayer.seekTo).toHaveBeenCalledWith(29);
    await srvApiSeekVoicePlayback(-4);
    expect(fldObjPlayer.seekTo).toHaveBeenCalledWith(0);

    await srvApiStopVoicePlayback();
    await srvApiSeekVoicePlayback(7);
  });

  it('stops playback by pausing and removing the player', async () => {
    const fldObjPlayer = fncMakeFakePlayer();
    const fldObjSubscription = { remove: jest.fn() };
    fldObjPlayer.addListener.mockReturnValue(fldObjSubscription);
    fldObjAudioMock.createAudioPlayer.mockReturnValue(fldObjPlayer);

    await srvApiStartVoicePlayback('/cache/Audio/note.m4a');
    await srvApiStopVoicePlayback();

    expect(fldObjPlayer.pause).toHaveBeenCalledTimes(1);
    expect(fldObjSubscription.remove).toHaveBeenCalledTimes(1);
    expect(fldObjPlayer.remove).toHaveBeenCalledTimes(1);

    await srvApiStopVoicePlayback();
  });

  it('deletes existing files and ignores missing ones', async () => {
    fldObjBlobFsMock.exists.mockResolvedValue(true);
    fldObjBlobFsMock.unlink.mockResolvedValue(undefined);

    await srvApiDeleteVoiceFile('/cache/Audio/note.m4a');

    expect(fldObjBlobFsMock.unlink).toHaveBeenCalledWith(
      '/cache/Audio/note.m4a',
    );

    jest.clearAllMocks();
    fldObjBlobFsMock.exists.mockResolvedValue(false);

    await srvApiDeleteVoiceFile('/cache/Audio/gone.m4a');

    expect(fldObjBlobFsMock.unlink).not.toHaveBeenCalled();
  });
});
