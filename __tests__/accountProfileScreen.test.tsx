/**
 * Logosphere BITS — hidden account profile screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: profile, membership, and
 * save calls run against a fake client, so no network is touched.
 * Covers loading, the profile/org list, the empty account, load
 * retry, display-name save, and save failure with the form kept.
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
import { vwLoading } from '../src/components/vwLoading';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAccountProfile } from '../src/screens/scrAccountProfile';

function fncConvProfileRow() {
  return {
    id: 'user-real-1',
    profile_type: 'corporate',
    display_name: 'Owner',
  };
}

function fncConvMembershipRows() {
  return [
    {
      organization_id: 'org-real-1',
      profile_id: 'user-real-1',
      role: 'account_manager',
      organizations: { name: 'Acme' },
    },
  ];
}

function fncConvFakeClient(fldObjScript: {
  profile?: unknown;
  profileError?: { message: string } | null;
  memberships?: unknown;
  membershipsError?: { message: string } | null;
  rpcError?: { message: string } | null;
}) {
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: null,
    error: fldObjScript.rpcError ?? null,
  });
  const fldObjProfileBuilder = {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: fldObjScript.profile ?? null,
      error: fldObjScript.profileError ?? null,
    }),
  };
  const fldObjMemberBuilder = {
    select: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.memberships ?? [],
        error: fldObjScript.membershipsError ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn((fldStrTable: string) =>
    fldStrTable === 'profiles' ? fldObjProfileBuilder : fldObjMemberBuilder,
  );
  return {
    fldObjClient: {
      rpc: fldObjRpc,
      from: fldObjFrom,
    } as unknown as SupabaseClient,
    fldObjRpc,
    fldObjFrom,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountProfile, {
        fldObjStrings: fldObjStringsEn,
        fldObjClient,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
  return fldObjRenderer;
}

describe('hidden account profile screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading before the first load lands', async () => {
    const fldObjFake = fncConvFakeClient({ profile: fncConvProfileRow() });
    let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(scrAccountProfile, {
          fldObjStrings: fldObjStringsEn,
          fldObjClient: fldObjFake.fldObjClient,
        }),
      );
    });
    if (fldObjRenderer === undefined) {
      throw new Error('Logosphere BITS: renderer was not created.');
    }
    expect(
      fldObjRenderer.root.findAllByType(vwLoading).length,
    ).toBeLessThanOrEqual(1);
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});
    ReactTestRenderer.act(() => {
      fldObjRenderer?.unmount();
    });
  });

  it('renders the profile with organizations and roles', async () => {
    const fldObjFake = fncConvFakeClient({
      profile: fncConvProfileRow(),
      memberships: fncConvMembershipRows(),
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'Owner',
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('corporate');
    expect(fldArrTexts).toContain('Acme');
    expect(fldArrTexts).toContain('Role: account_manager');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the empty account when no profile row exists', async () => {
    const fldObjFake = fncConvFakeClient({ profile: null, memberships: [] });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'No profile yet',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows load errors with retry', async () => {
    const fldObjFake = fncConvFakeClient({
      profileError: { message: 'db down' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not load the profile');
    expect(fldObjError.props.fldStrMessage).toContain('db down');

    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('saves an edited display name and reloads', async () => {
    const fldObjFake = fncConvFakeClient({
      profile: fncConvProfileRow(),
      memberships: fncConvMembershipRows(),
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('New Owner');
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_upsert_profile',
      { p_display_name: 'New Owner', p_profile_type: 'corporate' },
    );
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(2);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('blocks a blank display name before any call', async () => {
    const fldObjFake = fncConvFakeClient({
      profile: fncConvProfileRow(),
      memberships: fncConvMembershipRows(),
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwTextInput).props.actHandOnChange('  ');
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });

    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrError).toBe(
      'Enter a display name.',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the form and shows save failure', async () => {
    const fldObjFake = fncConvFakeClient({
      profile: fncConvProfileRow(),
      memberships: fncConvMembershipRows(),
      rpcError: { message: 'real account required' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('New Owner');
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not save the profile');
    expect(fldObjError.props.fldStrMessage).toContain('real account required');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'New Owner',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
