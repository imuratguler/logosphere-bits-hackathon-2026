/**
 * Logosphere BITS — analysis draft upload tests (hermetic).
 *
 * Draft replaces run delete-then-insert with upsert off: live
 * acceptance proved the storage upsert path unusable for the
 * private voice bucket while plain inserts pass. The blob file
 * layer and the storage client are fake; no network is touched.
 * Seed values are public, non-secret.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const mockFncReadFile = jest.fn();

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      readFile: (...fldArrArgs: unknown[]) => mockFncReadFile(...fldArrArgs),
    },
  },
}));

import { srvApiUploadAnalysisFiles } from '../src/services/srvAnalysis';

function fncConvFakeStorage(fldObjOutcome: { error: unknown }) {
  const fldObjRemove = jest.fn().mockResolvedValue({ data: [], error: null });
  const fldObjUpload = jest.fn().mockResolvedValue({
    data: { path: 'draft/x' },
    error: fldObjOutcome.error,
  });
  const fldObjFrom = jest.fn().mockReturnValue({
    remove: fldObjRemove,
    upload: fldObjUpload,
  });
  return {
    fldObjClient: {
      storage: { from: fldObjFrom },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjRemove,
    fldObjUpload,
  };
}

describe('analysis draft upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFncReadFile.mockResolvedValue('aGk=');
  });

  it('clears the stale object then inserts without upsert', async () => {
    const fldObjFake = fncConvFakeStorage({ error: null });

    await srvApiUploadAnalysisFiles(fldObjFake.fldObjClient, [
      {
        fldStrStoragePath: 'voice-notes/draft/run-1/img-1.m4a',
        fldStrLocalPath: '/local/voice.m4a',
        fldStrMimeType: 'audio/mp4',
      },
    ]);

    expect(mockFncReadFile).toHaveBeenCalledWith('/local/voice.m4a', 'base64');
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('voice-notes');
    expect(fldObjFake.fldObjRemove).toHaveBeenCalledWith([
      'draft/run-1/img-1.m4a',
    ]);
    expect(fldObjFake.fldObjUpload).toHaveBeenCalledWith(
      'draft/run-1/img-1.m4a',
      new Uint8Array([104, 105]),
      { contentType: 'audio/mp4', upsert: false },
    );
    expect(
      fldObjFake.fldObjRemove.mock.invocationCallOrder[0] ?? 0,
    ).toBeLessThan(fldObjFake.fldObjUpload.mock.invocationCallOrder[0] ?? 1);
  });

  it('uploads every file in order', async () => {
    const fldObjFake = fncConvFakeStorage({ error: null });

    await srvApiUploadAnalysisFiles(fldObjFake.fldObjClient, [
      {
        fldStrStoragePath: 'product-photos/draft/run-1/img-1.jpg',
        fldStrLocalPath: '/local/photo.jpg',
        fldStrMimeType: 'image/jpeg',
      },
      {
        fldStrStoragePath: 'voice-notes/draft/run-1/img-1.m4a',
        fldStrLocalPath: '/local/voice.m4a',
        fldStrMimeType: 'audio/mp4',
      },
    ]);

    expect(fldObjFake.fldObjUpload).toHaveBeenCalledTimes(2);
    expect(fldObjFake.fldObjRemove).toHaveBeenCalledTimes(2);
  });

  it('ignores a stale-clear failure and still uploads', async () => {
    const fldObjFake = fncConvFakeStorage({ error: null });
    fldObjFake.fldObjRemove.mockRejectedValue(new Error('locked'));

    await srvApiUploadAnalysisFiles(fldObjFake.fldObjClient, [
      {
        fldStrStoragePath: 'voice-notes/draft/run-1/img-1.m4a',
        fldStrLocalPath: '/local/voice.m4a',
        fldStrMimeType: 'audio/mp4',
      },
    ]);

    expect(fldObjFake.fldObjUpload).toHaveBeenCalledTimes(1);
  });

  it('reports an unreadable local file', async () => {
    const fldObjFake = fncConvFakeStorage({ error: null });
    mockFncReadFile.mockRejectedValue(new Error('gone'));

    await expect(
      srvApiUploadAnalysisFiles(fldObjFake.fldObjClient, [
        {
          fldStrStoragePath: 'voice-notes/draft/run-1/img-1.m4a',
          fldStrLocalPath: '/local/voice.m4a',
          fldStrMimeType: 'audio/mp4',
        },
      ]),
    ).rejects.toThrow('draft file is unreadable');
    expect(fldObjFake.fldObjUpload).not.toHaveBeenCalled();
  });

  it('wraps a failed insert', async () => {
    const fldObjFake = fncConvFakeStorage({
      error: { message: 'denied' },
    });

    await expect(
      srvApiUploadAnalysisFiles(fldObjFake.fldObjClient, [
        {
          fldStrStoragePath: 'voice-notes/draft/run-1/img-1.m4a',
          fldStrLocalPath: '/local/voice.m4a',
          fldStrMimeType: 'audio/mp4',
        },
      ]),
    ).rejects.toThrow('draft upload failed (denied)');
  });
});
