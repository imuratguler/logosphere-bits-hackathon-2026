/**
 * Logosphere BITS — demo persona + session state tests (maintained).
 *
 * Renders the real provider with react-test-renderer (no new
 * framework): AsyncStorage is an in-memory mock and the Supabase
 * client is fake, so no network, Auth, or membership API is touched.
 * Persona and workspace rows come from supabase/seed.sql (public,
 * non-secret). The cross-persona sameness checks below are the
 * maintained guard against persona-based filtering and privilege
 * escalation; keep them with the project.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
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

import type { fldObjDemoSessionContextValue } from '../src/contexts/ctxDemoSession';
import {
  VwDemoSessionProvider,
  useDemoSession,
} from '../src/contexts/ctxDemoSession';
import type { fldObjDemoPersona } from '../src/services/srvDemoPersonas';
import {
  srvApiGetDemoWorkspace,
  type fldObjDemoWorkspace,
} from '../src/services/srvDemoWorkspace';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';
import type { fldObjPermissionCell } from '../src/validation/vldAuthorization';
import { vldChgIsDemoPermitted } from '../src/validation/vldAuthorization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fldObjPersonaA: fldObjDemoPersona = {
  fldStrId: '10000000-0000-4000-8000-000000000001',
  fldStrDisplayName: 'Public Library',
  fldNumSortOrder: 0,
};

const fldObjPersonaB: fldObjDemoPersona = {
  fldStrId: '10000000-0000-4000-8000-000000000002',
  fldStrDisplayName: 'High School',
  fldNumSortOrder: 1,
};

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';

let fldObjCaptured: fldObjDemoSessionContextValue | null = null;

function Probe(): null {
  fldObjCaptured = useDemoSession();
  return null;
}

function fncRunCaptured(): fldObjDemoSessionContextValue {
  if (fldObjCaptured === null) {
    throw new Error('Logosphere BITS: probe missed the demo context.');
  }
  return fldObjCaptured;
}

function fncConvFakeClient() {
  const fldObjRpc = jest.fn();
  const fldObjFrom = jest.fn();
  const fldObjAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    linkIdentity: jest.fn(),
  };
  return {
    fldObjClient: {
      rpc: fldObjRpc,
      from: fldObjFrom,
      auth: fldObjAuth,
    } as unknown as SupabaseClient,
    fldObjRpc,
    fldObjFrom,
    fldObjAuth,
  };
}

function fncConvRpcRow(
  fldStrSessionId: string,
  fldNumEndsAtMs: number,
  fldStrPersonaId: string,
) {
  return {
    id: fldStrSessionId,
    persona_id: fldStrPersonaId,
    created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
    expires_at: new Date(fldNumEndsAtMs).toISOString(),
    revoked_at: null,
  };
}

function fncRunServeWorkspace(fldObjFrom: jest.Mock) {
  fldObjFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        error: null,
      }).then(fldObjResolve, fldObjReject),
  });
}

async function fncRunRenderProvider(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(Probe),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

describe('demo persona + session state', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fldObjCaptured = null;
    await AsyncStorage.clear();
  });

  it('reads shared public data before any persona is selected', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeWorkspace(fldObjFake.fldObjFrom);
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    expect(fncRunCaptured().fldObjPersona).toBeNull();
    expect(fncRunCaptured().fldObjSession).toBeNull();
    expect(fncRunCaptured().fldBooSessionReady).toBe(false);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    const fldObjWorkspace: fldObjDemoWorkspace = await srvApiGetDemoWorkspace(
      fldObjFake.fldObjClient,
    );
    expect(fldObjWorkspace).toEqual({
      fldStrId: fldStrSeedWorkspace,
      fldStrName: 'Demo Workspace',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('selects a persona and establishes its RPC session', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fncConvRpcRow('session-a', fldNumEndsAtMs, fldObjPersonaA.fldStrId),
      error: null,
    });
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('start_demo_session', {
      p_persona_id: fldObjPersonaA.fldStrId,
    });
    expect(fncRunCaptured().fldObjPersona).toEqual(fldObjPersonaA);
    expect(fncRunCaptured().fldObjSession).toEqual({
      fldStrSessionId: 'session-a',
      fldNumEndsAtMs,
    });
    expect(fncRunCaptured().fldBooSessionReady).toBe(true);
    expect(fncRunCaptured().fldBooLoggedIn).toBe(true);
    expect(fncRunCaptured().fldStrSessionError).toBeNull();
    await expect(
      srvStorSupabaseAuthStorage.getItem('demo-persona'),
    ).resolves.toBe(JSON.stringify(fldObjPersonaA));

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('never applies the previous persona session on change', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    let fldObjReleaseA: (fldObjValue: unknown) => void = () => undefined;
    fldObjFake.fldObjRpc
      .mockReturnValueOnce(
        new Promise(fldObjResolve => {
          fldObjReleaseA = fldObjResolve;
        }),
      )
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-b',
          fldNumEndsAtMs,
          fldObjPersonaB.fldStrId,
        ),
        error: null,
      });
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    let fldObjSelectA: Promise<void> | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjSelectA = fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaB);
    });
    fldObjReleaseA({
      data: fncConvRpcRow('session-a', fldNumEndsAtMs, fldObjPersonaA.fldStrId),
      error: null,
    });
    await ReactTestRenderer.act(async () => {
      await fldObjSelectA;
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(2);
    expect(fncRunCaptured().fldObjPersona).toEqual(fldObjPersonaB);
    expect(fncRunCaptured().fldObjSession?.fldStrSessionId).toBe('session-b');
    await expect(
      srvStorSupabaseAuthStorage.getItem('demo-persona'),
    ).resolves.toBe(JSON.stringify(fldObjPersonaB));

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps reads alive and offers retry when the session fails', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'demo db down' },
    });
    fncRunServeWorkspace(fldObjFake.fldObjFrom);
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });

    expect(fncRunCaptured().fldObjPersona).toEqual(fldObjPersonaA);
    expect(fncRunCaptured().fldObjSession).toBeNull();
    expect(fncRunCaptured().fldBooSessionReady).toBe(false);
    expect(fncRunCaptured().fldStrSessionError).toContain('retry');

    const fldObjWorkspace = await srvApiGetDemoWorkspace(
      fldObjFake.fldObjClient,
    );
    expect(fldObjWorkspace.fldStrId).toBe(fldStrSeedWorkspace);

    const fldNumEndsAtMs = Date.now() + 3600000;
    fldObjFake.fldObjRpc.mockResolvedValueOnce({
      data: fncConvRpcRow(
        'session-a2',
        fldNumEndsAtMs,
        fldObjPersonaA.fldStrId,
      ),
      error: null,
    });
    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiRefreshSession();
    });

    expect(fncRunCaptured().fldBooSessionReady).toBe(true);
    expect(fncRunCaptured().fldObjSession?.fldStrSessionId).toBe('session-a2');
    expect(fncRunCaptured().fldStrSessionError).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('restores the stored persona and session on reopen', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    await srvStorSupabaseAuthStorage.setItem(
      'demo-persona',
      JSON.stringify(fldObjPersonaA),
    );
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldObjPersonaA.fldStrId}`,
      JSON.stringify({
        fldStrSessionId: 'session-kept',
        fldNumEndsAtMs,
      }),
    );
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    expect(fncRunCaptured().fldObjPersona).toEqual(fldObjPersonaA);
    expect(fncRunCaptured().fldObjSession).toEqual({
      fldStrSessionId: 'session-kept',
      fldNumEndsAtMs,
    });
    expect(fncRunCaptured().fldBooSessionReady).toBe(true);
    expect(fncRunCaptured().fldBooLoggedIn).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('mints a new session when the restored one expired', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      'demo-persona',
      JSON.stringify(fldObjPersonaA),
    );
    await srvStorSupabaseAuthStorage.setItem(
      `demo-session:${fldObjPersonaA.fldStrId}`,
      JSON.stringify({
        fldStrSessionId: 'session-old',
        fldNumEndsAtMs: Date.now() - 1000,
      }),
    );
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fncConvRpcRow(
        'session-fresh',
        fldNumEndsAtMs,
        fldObjPersonaA.fldStrId,
      ),
      error: null,
    });
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fncRunCaptured().fldBooSessionReady).toBe(true);
    expect(fncRunCaptured().fldObjSession?.fldStrSessionId).toBe(
      'session-fresh',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows two personas the same shared data without privilege change', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-a',
          fldNumEndsAtMs,
          fldObjPersonaA.fldStrId,
        ),
        error: null,
      })
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-b',
          fldNumEndsAtMs,
          fldObjPersonaB.fldStrId,
        ),
        error: null,
      });
    fncRunServeWorkspace(fldObjFake.fldObjFrom);
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });
    const fldObjFirst = await srvApiGetDemoWorkspace(fldObjFake.fldObjClient);
    const fldStrFirstCalls = JSON.stringify(fldObjFake.fldObjFrom.mock.calls);
    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaB);
    });
    const fldObjSecond = await srvApiGetDemoWorkspace(fldObjFake.fldObjClient);
    const fldStrSecondCalls = JSON.stringify(
      fldObjFake.fldObjFrom.mock.calls.slice(1),
    );

    expect(fldObjFirst).toEqual(fldObjSecond);
    expect(fldStrSecondCalls).toBe(fldStrFirstCalls);
    expect(fldStrFirstCalls).not.toContain(fldObjPersonaA.fldStrId);
    expect(fldStrFirstCalls).not.toContain(fldObjPersonaB.fldStrId);
    const fldArrCells: fldObjPermissionCell[] = [
      { fldStrAction: 'sell', fldStrScope: 'item' },
    ];
    expect(vldChgIsDemoPermitted(fldArrCells, 'sell', 'item')).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('clears the persona and invalidates late selections', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    let fldObjReleaseSelect: (fldObjValue: unknown) => void = () => undefined;
    fldObjFake.fldObjRpc.mockReturnValueOnce(
      new Promise(fldObjResolve => {
        fldObjReleaseSelect = fldObjResolve;
      }),
    );
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    let fldObjSelect: Promise<void> | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjSelect = fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });
    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiClearPersona();
    });
    expect(fncRunCaptured().fldObjPersona).toBeNull();
    expect(fncRunCaptured().fldBooSessionReady).toBe(false);
    expect(fncRunCaptured().fldBooLoggedIn).toBe(false);
    await expect(
      srvStorSupabaseAuthStorage.getItem('demo-persona'),
    ).resolves.toBeNull();

    fldObjReleaseSelect({
      data: {
        id: 'session-late',
        persona_id: fldObjPersonaA.fldStrId,
        created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
        expires_at: new Date(fldNumEndsAtMs).toISOString(),
        revoked_at: null,
      },
      error: null,
    });
    await ReactTestRenderer.act(async () => {
      await fldObjSelect;
    });
    expect(fncRunCaptured().fldObjPersona).toBeNull();
    expect(fncRunCaptured().fldObjSession).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('touches no Supabase Auth or membership API', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fncConvRpcRow('session-a', fldNumEndsAtMs, fldObjPersonaA.fldStrId),
      error: null,
    });
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });
    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiRefreshSession();
    });

    expect(fldObjFake.fldObjAuth.signUp).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.signInWithPassword).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.signOut).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.linkIdentity).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('switches personas without Auth, deletion, or data reset', async () => {
    const fldNumEndsAtMs = Date.now() + 3600000;
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-a',
          fldNumEndsAtMs,
          fldObjPersonaA.fldStrId,
        ),
        error: null,
      })
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-b',
          fldNumEndsAtMs,
          fldObjPersonaB.fldStrId,
        ),
        error: null,
      });
    const fldObjRenderer = await fncRunRenderProvider(fldObjFake.fldObjClient);
    jest.clearAllMocks();

    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaA);
    });
    await ReactTestRenderer.act(async () => {
      await fncRunCaptured().srvApiSelectPersona(fldObjPersonaB);
    });

    expect(fncRunCaptured().fldObjPersona).toEqual(fldObjPersonaB);
    expect(fncRunCaptured().fldObjSession?.fldStrSessionId).toBe('session-b');
    expect(fldObjFake.fldObjAuth.signUp).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.signInWithPassword).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.signOut).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjAuth.linkIdentity).not.toHaveBeenCalled();
    expect(jest.mocked(AsyncStorage.removeItem)).not.toHaveBeenCalled();
    expect(jest.mocked(AsyncStorage.clear)).not.toHaveBeenCalled();
    await expect(
      srvStorSupabaseAuthStorage.getItem(
        `demo-session:${fldObjPersonaA.fldStrId}`,
      ),
    ).resolves.toBe(
      JSON.stringify({
        fldStrSessionId: 'session-a',
        fldNumEndsAtMs,
      }),
    );
    await expect(
      srvStorSupabaseAuthStorage.getItem(
        `demo-session:${fldObjPersonaB.fldStrId}`,
      ),
    ).resolves.toBe(
      JSON.stringify({
        fldStrSessionId: 'session-b',
        fldNumEndsAtMs,
      }),
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
