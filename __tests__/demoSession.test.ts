/**
 * Logosphere BITS â€” demo session service tests (hermetic).
 *
 * AsyncStorage is an in-memory mock and the Supabase client is a fake
 * `{ rpc }` object: no network, no native modules, no real env values.
 * The polyfill side-effect import is stubbed (it ships untranspiled ESM
 * and the committed jest config stays untouched). Persona IDs come from
 * supabase/seed.sql (public, non-secret).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const fldObjStore = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((fldStrKey: string) =>
        Promise.resolve(fldObjStore.get(fldStrKey) ?? null),
      ),
      setItem: jest.fn((fldStrKey: string, fldStrValue: string) => {
        fldObjStore.set(fldStrKey, fldStrValue);
        return Promise.resolve();
      }),
      removeItem: jest.fn((fldStrKey: string) => {
        fldObjStore.delete(fldStrKey);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        fldObjStore.clear();
        return Promise.resolve();
      }),
    },
  };
});

import {
  srvApiClearDemoSession,
  srvApiGetDemoSession,
  srvApiRefreshDemoSession,
} from '../src/services/srvDemoSession';
import {
  srvApiCreateSupabaseClient,
  srvStorSupabaseAuthStorage,
} from '../src/services/srvSupabase';

const fldStrSeedPersonaPublicLibrary = '10000000-0000-4000-8000-000000000001';
const fldStrSeedPersonaHighSchool = '10000000-0000-4000-8000-000000000002';

function fncConvDemoSessionRpcRow(
  fldStrSessionId: string,
  fldNumEndsAtMs: number,
) {
  return {
    id: fldStrSessionId,
    persona_id: fldStrSeedPersonaPublicLibrary,
    created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
    expires_at: new Date(fldNumEndsAtMs).toISOString(),
    revoked_at: null,
  };
}

describe('demo session service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('mints and stores a session for the seed persona', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: fncConvDemoSessionRpcRow('session-first', fldNumEndsAtMs),
      error: null,
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjRpc).toHaveBeenCalledWith('start_demo_session', {
      p_persona_id: fldStrSeedPersonaPublicLibrary,
    });
    expect(fldObjSession).toEqual({
      fldStrSessionId: 'session-first',
      fldNumEndsAtMs,
    });
    const fldStrStored = await srvStorSupabaseAuthStorage.getItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
    );
    expect(JSON.parse(fldStrStored ?? '')).toEqual({
      fldStrSessionId: 'session-first',
      fldNumEndsAtMs,
    });
  });

  it('accepts a single-row array RPC response', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: [fncConvDemoSessionRpcRow('session-array', fldNumEndsAtMs)],
      error: null,
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjSession.fldStrSessionId).toBe('session-array');
    expect(fldObjSession.fldNumEndsAtMs).toBe(fldNumEndsAtMs);
  });

  it('reuses a stored unexpired session without RPC', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      JSON.stringify({ fldStrSessionId: 'session-stored', fldNumEndsAtMs }),
    );
    const fldObjRpc = jest.fn();
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjSession).toEqual({
      fldStrSessionId: 'session-stored',
      fldNumEndsAtMs,
    });
    expect(fldObjRpc).not.toHaveBeenCalled();
  });

  it('mints a new session when the stored one expired', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      JSON.stringify({
        fldStrSessionId: 'session-old',
        fldNumEndsAtMs: Date.now() - 1000,
      }),
    );
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: fncConvDemoSessionRpcRow('session-fresh', fldNumEndsAtMs),
      error: null,
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjSession.fldStrSessionId).toBe('session-fresh');
  });

  it('mints a new session when the stored row is corrupt', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      'not-json{',
    );
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: fncConvDemoSessionRpcRow('session-recovered', fldNumEndsAtMs),
      error: null,
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjSession.fldStrSessionId).toBe('session-recovered');
  });

  it('shares one creation request across concurrent calls', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockReturnValueOnce(
      new Promise(fldObjResolve => {
        setTimeout(
          () =>
            fldObjResolve({
              data: fncConvDemoSessionRpcRow('session-shared', fldNumEndsAtMs),
              error: null,
            }),
          10,
        );
      }),
    );
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldArrSessions = await Promise.all([
      srvApiGetDemoSession(fldObjClient, fldStrSeedPersonaPublicLibrary),
      srvApiGetDemoSession(fldObjClient, fldStrSeedPersonaPublicLibrary),
      srvApiGetDemoSession(fldObjClient, fldStrSeedPersonaPublicLibrary),
    ]);

    expect(fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldArrSessions).toEqual([
      { fldStrSessionId: 'session-shared', fldNumEndsAtMs },
      { fldStrSessionId: 'session-shared', fldNumEndsAtMs },
      { fldStrSessionId: 'session-shared', fldNumEndsAtMs },
    ]);
  });

  it('refresh clears and mints exactly once', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      JSON.stringify({
        fldStrSessionId: 'session-revoked',
        fldNumEndsAtMs: Date.now() + 3600000,
      }),
    );
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: fncConvDemoSessionRpcRow('session-renewed', fldNumEndsAtMs),
      error: null,
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjSession = await srvApiRefreshDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjSession.fldStrSessionId).toBe('session-renewed');
    const fldStrStored = await srvStorSupabaseAuthStorage.getItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
    );
    expect(JSON.parse(fldStrStored ?? '').fldStrSessionId).toBe(
      'session-renewed',
    );
  });

  it('clear removes the stored session', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      JSON.stringify({
        fldStrSessionId: 'session-gone',
        fldNumEndsAtMs: Date.now() + 3600000,
      }),
    );

    await srvApiClearDemoSession(fldStrSeedPersonaPublicLibrary);

    await expect(
      srvStorSupabaseAuthStorage.getItem(
        `demo-session:${fldStrSeedPersonaPublicLibrary}`,
      ),
    ).resolves.toBeNull();
  });

  it('reports RPC failure clearly, keeps reads working, allows retry', async () => {
    const fldObjRpc = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'demo db down' } });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoSession(fldObjClient, fldStrSeedPersonaPublicLibrary),
    ).rejects.toThrow(
      `demo session unavailable for persona '${fldStrSeedPersonaPublicLibrary}' ` +
        '(start_demo_session failed: demo db down)',
    );
    await expect(
      srvApiGetDemoSession(fldObjClient, fldStrSeedPersonaPublicLibrary),
    ).rejects.toThrow('Public reads still work; call again to retry');

    const fldObjReader = srvApiCreateSupabaseClient(
      {
        fldStrProjectAddress: 'https://localhost:54321',
        fldStrAnonKey: 'dummy-anon-key',
      },
      { fldBooPersistAuthSession: false },
    );
    expect(typeof fldObjReader.from).toBe('function');
    expect(fldObjRpc).toHaveBeenCalledTimes(2);
  });

  it('surfaces an unknown persona from the database', async () => {
    const fldObjRpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'unknown demo persona' },
    });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoSession(
        fldObjClient,
        '00000000-0000-0000-0000-000000000000',
      ),
    ).rejects.toThrow('unknown demo persona');
  });

  it('isolates sessions per persona', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjRpc = jest
      .fn()
      .mockResolvedValueOnce({
        data: fncConvDemoSessionRpcRow('session-persona-a', fldNumEndsAtMs),
        error: null,
      })
      .mockResolvedValueOnce({
        data: fncConvDemoSessionRpcRow('session-persona-b', fldNumEndsAtMs),
        error: null,
      });
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    const fldObjFirst = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );
    const fldObjSecond = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaHighSchool,
    );
    const fldObjFirstAgain = await srvApiGetDemoSession(
      fldObjClient,
      fldStrSeedPersonaPublicLibrary,
    );

    expect(fldObjRpc).toHaveBeenCalledTimes(2);
    expect(fldObjFirst.fldStrSessionId).toBe('session-persona-a');
    expect(fldObjSecond.fldStrSessionId).toBe('session-persona-b');
    expect(fldObjFirstAgain.fldStrSessionId).toBe('session-persona-a');
  });

  it('rejects a blank persona id', async () => {
    const fldObjRpc = jest.fn();
    const fldObjClient = { rpc: fldObjRpc } as unknown as SupabaseClient;

    await expect(srvApiGetDemoSession(fldObjClient, '   ')).rejects.toThrow(
      'demo persona ID is missing or blank',
    );
    expect(fldObjRpc).not.toHaveBeenCalled();
  });

  it('demo client option never touches AsyncStorage auth', async () => {
    srvApiCreateSupabaseClient(
      {
        fldStrProjectAddress: 'https://localhost:54321',
        fldStrAnonKey: 'dummy-anon-key',
      },
      { fldBooPersistAuthSession: false },
    );
    await new Promise(fldObjResolve => {
      setTimeout(() => fldObjResolve(undefined), 20);
    });

    expect(jest.mocked(AsyncStorage.getItem)).not.toHaveBeenCalled();
    expect(jest.mocked(AsyncStorage.setItem)).not.toHaveBeenCalled();
    expect(jest.mocked(AsyncStorage.removeItem)).not.toHaveBeenCalled();
  });
});
