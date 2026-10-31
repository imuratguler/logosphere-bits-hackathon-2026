/**
 * Logosphere BITS — hidden account login screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: the Supabase client is fake,
 * so no network is touched and no account is opened. Covers field
 * validation before any Auth call, loading state, submit failure
 * with the form kept, and success identity delivery.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('../src/config/cfgSupabaseEnv', () => ({
  fldStrSupabaseProjectAddress: 'https://localhost:54321',
  fldStrSupabaseAnonKey: 'dummy-anon-key',
}));

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

import { vwButton } from '../src/components/vwButton';
import { vwEmptyState } from '../src/components/vwEmptyState';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAccountLogin } from '../src/screens/scrAccountLogin';
import type { fldObjRealAccountIdentity } from '../src/services/srvRealAccount';

function fncConvFakeClient() {
  const fldObjSignInWithPassword = jest.fn();
  const fldObjClient = {
    auth: { signInWithPassword: fldObjSignInWithPassword },
  } as unknown as SupabaseClient;
  return { fldObjClient, fldObjSignInWithPassword };
}

async function fncRunRender(
  fldObjClient: SupabaseClient,
  actHandOnLogin: (fldObjIdentity: fldObjRealAccountIdentity) => void,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountLogin, {
        fldObjStrings: fldObjStringsEn,
        fldObjClient,
        actHandOnLogin,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunFillAndSubmit(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrEmail: string,
  fldStrPassword: string,
) {
  const fldArrInputs = fldObjRenderer.root.findAllByType(vwTextInput);
  ReactTestRenderer.act(() => {
    fldArrInputs[0].props.actHandOnChange(fldStrEmail);
    fldArrInputs[1].props.actHandOnChange(fldStrPassword);
  });
  ReactTestRenderer.act(() => {
    fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
  });
}

describe('hidden account login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and masked password fields', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    const fldArrInputs = fldObjRenderer.root.findAllByType(vwTextInput);
    expect(fldArrInputs.length).toBe(2);
    expect(fldArrInputs[0].props.fldStrPlaceholder).toBe('Email address');
    expect(fldArrInputs[0].props.fldBooSecureEntry ?? false).toBe(false);
    expect(fldArrInputs[1].props.fldStrPlaceholder).toBe('Password');
    expect(fldArrInputs[1].props.fldBooSecureEntry).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('blocks blank submit before any Auth call', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });

    expect(fldObjFake.fldObjSignInWithPassword).not.toHaveBeenCalled();
    const fldArrInputs = fldObjRenderer.root.findAllByType(vwTextInput);
    expect(fldArrInputs[0].props.fldStrError).toBe('Enter your email address.');
    expect(fldArrInputs[1].props.fldStrError).toBe('Enter your password.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('flags a malformed email before any Auth call', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunFillAndSubmit(fldObjRenderer, 'owner@example', 'secret-pw-1');

    expect(fldObjFake.fldObjSignInWithPassword).not.toHaveBeenCalled();
    const fldArrInputs = fldObjRenderer.root.findAllByType(vwTextInput);
    expect(fldArrInputs[0].props.fldStrError).toBe(
      'Enter a valid email address.',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows loading while the login request is in flight', async () => {
    const fldObjFake = fncConvFakeClient();
    let fldObjRelease!: (fldObjValue: unknown) => void;
    fldObjFake.fldObjSignInWithPassword.mockReturnValueOnce(
      new Promise(fldObjResolve => {
        fldObjRelease = fldObjResolve;
      }),
    );
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunFillAndSubmit(fldObjRenderer, 'owner@example.com', 'secret-pw-1');

    expect(fldObjRenderer.root.findByType(vwButton).props.fldBooLoading).toBe(
      true,
    );
    const fldArrInputs = fldObjRenderer.root.findAllByType(vwTextInput);
    expect(fldArrInputs[0].props.fldBooDisabled).toBe(true);
    expect(fldArrInputs[1].props.fldBooDisabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      fldObjRelease({
        data: {
          user: { id: 'user-real-1', email: 'owner@example.com' },
          session: { access_token: 'x' },
        },
        error: null,
      });
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('delivers the server identity on success', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-real-1', email: 'owner@example.com' },
        session: { access_token: 'x' },
      },
      error: null,
    });
    const actHandOnLogin = jest.fn();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      actHandOnLogin,
    );

    fncRunFillAndSubmit(fldObjRenderer, 'owner@example.com', 'secret-pw-1');
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjSignInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'secret-pw-1',
    });
    expect(actHandOnLogin).toHaveBeenCalledWith({
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    });
    expect(fldObjRenderer.root.findByType(vwButton).props.fldBooLoading).toBe(
      false,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the form and shows the server error on failure', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'invalid credentials' },
    });
    const actHandOnLogin = jest.fn();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      actHandOnLogin,
    );

    fncRunFillAndSubmit(fldObjRenderer, 'owner@example.com', 'wrong-pw-1');
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(actHandOnLogin).not.toHaveBeenCalled();
    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not log in');
    expect(fldObjError.props.fldStrMessage).toContain('invalid credentials');
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(2);
    expect(fldObjRenderer.root.findByType(vwButton).props.fldBooLoading).toBe(
      false,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('clears the field error once the user edits', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    expect(
      fldObjRenderer.root.findAllByType(vwTextInput)[0].props.fldStrError,
    ).toBe('Enter your email address.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.root
        .findAllByType(vwTextInput)[0]
        .props.actHandOnChange('owner@example.com');
    });
    expect(
      fldObjRenderer.root.findAllByType(vwTextInput)[0].props.fldStrError,
    ).toBeUndefined();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
