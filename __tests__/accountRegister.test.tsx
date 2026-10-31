/**
 * Logosphere BITS — hidden account registration screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through demo startup or
 * persona selection) with react-test-renderer: Auth, rpc, and table
 * calls run against a fake client, so no network is touched, no
 * account is opened, and the demo seed stays unread. Covers the
 * individual/corporate switch, validation before any call, the
 * sequenced individual and corporate flows, and failure with the
 * form kept.
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
import { scrAccountRegister } from '../src/screens/scrAccountRegister';
import type { fldObjRealAccountIdentity } from '../src/services/srvRealAccount';

function fncConvFakeClient() {
  const fldObjSignUp = jest.fn();
  const fldObjRpc = jest.fn();
  const fldObjFrom = jest.fn();
  const fldObjClient = {
    auth: { signUp: fldObjSignUp },
    rpc: fldObjRpc,
    from: fldObjFrom,
  } as unknown as SupabaseClient;
  return { fldObjClient, fldObjSignUp, fldObjRpc, fldObjFrom };
}

async function fncRunRender(
  fldObjClient: SupabaseClient,
  actHandOnRegistered: (fldObjIdentity: fldObjRealAccountIdentity) => void,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountRegister, {
        fldObjStrings: fldObjStringsEn,
        fldObjClient,
        actHandOnRegistered,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunPress(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
) {
  const fldObjButton = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
  if (fldObjButton === undefined) {
    throw new Error(`Logosphere BITS: button ${fldStrLabel} is missing.`);
  }
  ReactTestRenderer.act(() => {
    fldObjButton.props.actHandOnPress();
  });
}

function fncRunFill(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrPlaceholder: string,
  fldStrValue: string,
) {
  const fldObjInput = fldObjRenderer.root
    .findAllByType(vwTextInput)
    .find(
      fldObjNode => fldObjNode.props.fldStrPlaceholder === fldStrPlaceholder,
    );
  if (fldObjInput === undefined) {
    throw new Error(`Logosphere BITS: input ${fldStrPlaceholder} is missing.`);
  }
  ReactTestRenderer.act(() => {
    fldObjInput.props.actHandOnChange(fldStrValue);
  });
}

describe('hidden account registration screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts on the individual form without an organization field', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    const fldArrPlaceholders = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .map(fldObjNode => fldObjNode.props.fldStrPlaceholder);
    expect(fldArrPlaceholders).toEqual([
      'Display name',
      'Email address',
      'Password (min 8 characters)',
    ]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('switches between individual and corporate forms', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunPress(fldObjRenderer, 'Corporate');
    expect(
      fldObjRenderer.root
        .findAllByType(vwTextInput)
        .map(fldObjNode => fldObjNode.props.fldStrPlaceholder),
    ).toContain('Organization name');

    fncRunPress(fldObjRenderer, 'Individual');
    expect(
      fldObjRenderer.root
        .findAllByType(vwTextInput)
        .map(fldObjNode => fldObjNode.props.fldStrPlaceholder),
    ).not.toContain('Organization name');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('blocks blank submit before any call', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunPress(fldObjRenderer, 'Register');

    expect(fldObjFake.fldObjSignUp).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    const fldArrErrors = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .map(fldObjNode => fldObjNode.props.fldStrError);
    expect(fldArrErrors).toEqual([
      'Enter a display name.',
      'Enter your email address.',
      'Enter a password.',
    ]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('registers an individual without an organization call', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-real-1', email: 'owner@example.com' },
        session: null,
      },
      error: null,
    });
    fldObjFake.fldObjRpc.mockResolvedValue({ data: null, error: null });
    const actHandOnRegistered = jest.fn();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      actHandOnRegistered,
    );

    fncRunFill(fldObjRenderer, 'Display name', 'Owner');
    fncRunFill(fldObjRenderer, 'Email address', 'owner@example.com');
    fncRunFill(fldObjRenderer, 'Password (min 8 characters)', 'secret-pw-1');
    fncRunPress(fldObjRenderer, 'Register');
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjSignUp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'secret-pw-1',
    });
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_upsert_profile',
      { p_display_name: 'Owner', p_profile_type: 'individual' },
    );
    expect(actHandOnRegistered).toHaveBeenCalledWith({
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('registers a corporation with its organization', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-real-1', email: 'owner@example.com' },
        session: null,
      },
      error: null,
    });
    fldObjFake.fldObjRpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: 'org-real-1', error: null });
    const actHandOnRegistered = jest.fn();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      actHandOnRegistered,
    );

    fncRunPress(fldObjRenderer, 'Corporate');
    fncRunFill(fldObjRenderer, 'Display name', 'Owner');
    fncRunFill(fldObjRenderer, 'Email address', 'owner@example.com');
    fncRunFill(fldObjRenderer, 'Password (min 8 characters)', 'secret-pw-1');
    fncRunFill(fldObjRenderer, 'Organization name', 'Acme');
    fncRunPress(fldObjRenderer, 'Register');
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(2);
    expect(fldObjFake.fldObjRpc).toHaveBeenNthCalledWith(
      1,
      'account_upsert_profile',
      { p_display_name: 'Owner', p_profile_type: 'corporate' },
    );
    expect(fldObjFake.fldObjRpc).toHaveBeenNthCalledWith(
      2,
      'account_create_organization',
      { p_name: 'Acme' },
    );
    expect(actHandOnRegistered).toHaveBeenCalledWith({
      fldStrUserId: 'user-real-1',
      fldStrEmail: 'owner@example.com',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('requires the organization name for corporations', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunPress(fldObjRenderer, 'Corporate');
    fncRunFill(fldObjRenderer, 'Display name', 'Owner');
    fncRunFill(fldObjRenderer, 'Email address', 'owner@example.com');
    fncRunFill(fldObjRenderer, 'Password (min 8 characters)', 'secret-pw-1');
    fncRunPress(fldObjRenderer, 'Register');

    expect(fldObjFake.fldObjSignUp).not.toHaveBeenCalled();
    const fldObjOrg = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .find(
        fldObjNode =>
          fldObjNode.props.fldStrPlaceholder === 'Organization name',
      );
    expect(fldObjOrg?.props.fldStrError).toBe('Enter the organization name.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the form and shows the server error on failure', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'email taken' },
    });
    const actHandOnRegistered = jest.fn();
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      actHandOnRegistered,
    );

    fncRunFill(fldObjRenderer, 'Display name', 'Owner');
    fncRunFill(fldObjRenderer, 'Email address', 'owner@example.com');
    fncRunFill(fldObjRenderer, 'Password (min 8 characters)', 'secret-pw-1');
    fncRunPress(fldObjRenderer, 'Register');
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(actHandOnRegistered).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not register');
    expect(fldObjError.props.fldStrMessage).toContain('email taken');
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(3);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('never touches the demo seed during registration', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-real-1', email: 'owner@example.com' },
        session: null,
      },
      error: null,
    });
    fldObjFake.fldObjRpc.mockResolvedValue({ data: null, error: null });
    const fldObjRenderer = await fncRunRender(
      fldObjFake.fldObjClient,
      () => undefined,
    );

    fncRunFill(fldObjRenderer, 'Display name', 'Owner');
    fncRunFill(fldObjRenderer, 'Email address', 'owner@example.com');
    fncRunFill(fldObjRenderer, 'Password (min 8 characters)', 'secret-pw-1');
    fncRunPress(fldObjRenderer, 'Register');
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
    const fldArrRpcs = fldObjFake.fldObjRpc.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    for (const fldStrName of fldArrRpcs) {
      expect(String(fldStrName)).not.toMatch(/demo_personas|demo_sessions/);
    }

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
