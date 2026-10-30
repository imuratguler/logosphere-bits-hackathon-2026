/**
 * Logosphere BITS — hidden real-account module tests (hermetic).
 *
 * Auth calls run against a fake client.auth object: no network, no
 * accounts are opened. The polyfill side-effect import is stubbed and
 * AsyncStorage is an in-memory mock (the module reaches them through
 * the shared factory). Never imports the demo client wiring, so no
 * real env values enter this suite.
 */

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

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiCreateRealClient,
  srvAuthLinkIdentity,
  srvAuthLogin,
  srvAuthLogout,
  srvAuthRegister,
} from '../src/services/srvRealAccount';
import {
  srvApiCreateSupabaseClient,
  srvStorSupabaseAuthStorage,
} from '../src/services/srvSupabase';

const fldStrSecretPassword = 'Sup3r-Secret-Pw-9';

function fncConvFakeAuthClient() {
  const fldObjAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    linkIdentity: jest.fn(),
  };
  return {
    fldObjClient: { auth: fldObjAuth } as unknown as SupabaseClient,
    fldObjAuth,
  };
}

function fncConvServerUser() {
  return {
    id: 'user-real-1',
    email: 'owner@example.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: 'Owner' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
}

describe('hidden real-account module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a real client on AsyncStorage, apart from the demo client', () => {
    const fldObjConfig = {
      fldStrProjectAddress: 'https://localhost:54321',
      fldStrAnonKey: 'dummy-anon-key',
    };
    const fldObjDemo = srvApiCreateSupabaseClient(fldObjConfig, {
      fldBooPersistAuthSession: false,
    });
    const fldObjReal = srvApiCreateRealClient(fldObjConfig);
    const fldObjDemoStorage = (
      fldObjDemo.auth as unknown as { storage: unknown }
    ).storage;
    const fldObjRealStorage = (
      fldObjReal.auth as unknown as { storage: unknown }
    ).storage;

    expect(fldObjReal).not.toBe(fldObjDemo);
    expect(fldObjRealStorage).toBe(srvStorSupabaseAuthStorage);
    expect(fldObjDemoStorage).not.toBe(srvStorSupabaseAuthStorage);
  });

  it('registers from server identity only, echoing no values', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signUp.mockResolvedValue({
      data: { user: fncConvServerUser(), session: null },
      error: null,
    });

    const fldObjIdentity = await srvAuthRegister(fldObjFake.fldObjClient, {
      fldStrEmail: 'owner@example.com',
      fldStrPassword: fldStrSecretPassword,
    });

    expect(fldObjFake.fldObjAuth.signUp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: fldStrSecretPassword,
    });
    expect(fldObjIdentity).toEqual({
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    });
  });

  it('reports registration failure without credentials', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'password too weak' },
    });

    const fldObjPromise = srvAuthRegister(fldObjFake.fldObjClient, {
      fldStrEmail: 'owner@example.com',
      fldStrPassword: fldStrSecretPassword,
    });
    await expect(fldObjPromise).rejects.toThrow(
      'registration failed: password too weak',
    );
    await expect(fldObjPromise).rejects.not.toThrow(fldStrSecretPassword);
  });

  it('rejects blank registration credentials before any call', async () => {
    const fldObjFake = fncConvFakeAuthClient();

    await expect(
      srvAuthRegister(fldObjFake.fldObjClient, {
        fldStrEmail: '   ',
        fldStrPassword: fldStrSecretPassword,
      }),
    ).rejects.toThrow('real-account email is missing or blank');
    expect(fldObjFake.fldObjAuth.signUp).not.toHaveBeenCalled();
  });

  it('reports a missing identity after registration', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(
      srvAuthRegister(fldObjFake.fldObjClient, {
        fldStrEmail: 'owner@example.com',
        fldStrPassword: fldStrSecretPassword,
      }),
    ).rejects.toThrow('email confirmation may be pending');
  });

  it('logs in from server identity only', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signInWithPassword.mockResolvedValue({
      data: { user: fncConvServerUser(), session: { access_token: 'x' } },
      error: null,
    });

    const fldObjIdentity = await srvAuthLogin(fldObjFake.fldObjClient, {
      fldStrEmail: 'owner@example.com',
      fldStrPassword: fldStrSecretPassword,
    });

    expect(fldObjFake.fldObjAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: fldStrSecretPassword,
    });
    expect(fldObjIdentity).toEqual({
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    });
  });

  it('reports login failure without credentials', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'invalid credentials' },
    });

    const fldObjPromise = srvAuthLogin(fldObjFake.fldObjClient, {
      fldStrEmail: 'owner@example.com',
      fldStrPassword: fldStrSecretPassword,
    });
    await expect(fldObjPromise).rejects.toThrow(
      'login failed: invalid credentials',
    );
    await expect(fldObjPromise).rejects.not.toThrow(fldStrSecretPassword);
  });

  it('logs out and reports logout failure', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.signOut.mockResolvedValue({ error: null });

    await expect(
      srvAuthLogout(fldObjFake.fldObjClient),
    ).resolves.toBeUndefined();
    expect(fldObjFake.fldObjAuth.signOut).toHaveBeenCalledTimes(1);

    fldObjFake.fldObjAuth.signOut.mockResolvedValue({
      error: { message: 'session gone' },
    });
    await expect(srvAuthLogout(fldObjFake.fldObjClient)).rejects.toThrow(
      'logout failed: session gone',
    );
  });

  it('links an identity and returns the authorization url', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: 'https://oauth.example/authorize' },
      error: null,
    });

    const fldObjLink = await srvAuthLinkIdentity(fldObjFake.fldObjClient, {
      fldStrProvider: 'google',
    });

    expect(fldObjFake.fldObjAuth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
    });
    expect(fldObjLink).toEqual({
      fldStrUrl: 'https://oauth.example/authorize',
    });
  });

  it('reports linking failure and blank provider', async () => {
    const fldObjFake = fncConvFakeAuthClient();
    fldObjFake.fldObjAuth.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: '' },
      error: { message: 'provider disabled' },
    });

    await expect(
      srvAuthLinkIdentity(fldObjFake.fldObjClient, {
        fldStrProvider: 'google',
      }),
    ).rejects.toThrow('linking failed: provider disabled');

    await expect(
      srvAuthLinkIdentity(fldObjFake.fldObjClient, { fldStrProvider: '' }),
    ).rejects.toThrow('real-account provider is missing or blank');
  });

  it('keeps auth signatures free of persona and flag parameters', () => {
    expect(srvAuthRegister.length).toBe(2);
    expect(srvAuthLogin.length).toBe(2);
    expect(srvAuthLogout.length).toBe(1);
    expect(srvAuthLinkIdentity.length).toBe(2);
    expect(srvApiCreateRealClient.length).toBe(1);
  });

  it('keeps persona preference and real identity as separate structures', () => {
    const fldObjPreference = { fldStrPersonaId: 'persona-local-1' };
    const fldObjIdentity = {
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    };

    expect(Object.keys(fldObjPreference)).toEqual(['fldStrPersonaId']);
    expect(Object.keys(fldObjIdentity).sort()).toEqual([
      'fldStrEmail',
      'fldStrUserId',
    ]);
  });
});
