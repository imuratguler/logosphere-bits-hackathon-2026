/**
 * Logosphere BITS — hidden account invitation screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: list, role, invite, and
 * decision calls run against a fake client, so no network is
 * touched. Covers the list, the empty org, load retry, invite
 * validation with the issued token shown, accept/decline, and
 * failure with content kept.
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
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAccountInvitations } from '../src/screens/scrAccountInvitations';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function fncConvInvitationRow() {
  return {
    id: 'inv-1',
    organization_id: fldStrSeedOrg,
    email: 'guest@example.com',
    role: 'authorized',
    status: 'pending',
    organizations: { name: 'Acme' },
  };
}

function fncConvFakeClient(fldObjScript: {
  rows?: unknown;
  rowsError?: { message: string } | null;
  issued?: unknown;
  rpcError?: { message: string } | null;
}) {
  const fldObjListBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.rows ?? [fncConvInvitationRow()],
        error: fldObjScript.rowsError ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjRoleBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: [
          { code: 'account_manager', description: 'Account manager' },
          { code: 'authorized', description: 'Authorized member' },
        ],
        error: null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn((fldStrTable: string) =>
    fldStrTable === 'roles' ? fldObjRoleBuilder : fldObjListBuilder,
  );
  const fldObjRpc = jest.fn((fldStrName: string) => {
    if (fldStrName === 'account_invite_member') {
      return Promise.resolve({
        data: fldObjScript.issued ?? {
          id: 'inv-2',
          token: 'tok-issued-1',
          expires_at: '2026-11-07T00:00:00Z',
        },
        error: fldObjScript.rpcError ?? null,
      });
    }
    if (fldStrName === 'account_accept_invitation') {
      return Promise.resolve({
        data: fldStrSeedOrg,
        error: fldObjScript.rpcError ?? null,
      });
    }
    return Promise.resolve({
      data: null,
      error: fldObjScript.rpcError ?? null,
    });
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountInvitations, {
        fldObjStrings: fldObjStringsEn,
        fldObjClient,
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrOrganizationName: 'Acme',
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
  return fldObjRenderer;
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
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

describe('hidden account invitation screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders invitations with org, role, and status', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_invitations');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('guest@example.com');
    expect(fldArrTexts).toContain('Acme — authorized — pending');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the empty org without invitations', async () => {
    const fldObjFake = fncConvFakeClient({ rows: [] });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'No invitations yet',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows load errors with retry', async () => {
    const fldObjFake = fncConvFakeClient({
      rowsError: { message: 'db down' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'Could not load invitations',
    );
    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;
    fncRunPress(fldObjRenderer, 'Retry');
    await fncRunFlush();
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('blocks invite without a valid email', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Email address', 'guest@example');
    fncRunPress(fldObjRenderer, 'authorized');
    fncRunPress(fldObjRenderer, 'Invite');

    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalledWith(
      'account_invite_member',
      expect.anything(),
    );
    const fldObjInput = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .find(
        fldObjNode => fldObjNode.props.fldStrPlaceholder === 'Email address',
      );
    expect(fldObjInput?.props.fldStrError).toBe('Enter a valid email address.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('invites a member and shows the issued token', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Email address', 'guest@example.com');
    fncRunPress(fldObjRenderer, 'authorized');
    fncRunPress(fldObjRenderer, 'Invite');
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('account_invite_member', {
      p_organization_id: fldStrSeedOrg,
      p_email: 'guest@example.com',
      p_role: 'authorized',
    });
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('tok-issued-1');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('accepts an invitation by token and reloads', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);
    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;

    fncRunFill(fldObjRenderer, 'Invitation token', 'tok-abc');
    fncRunPress(fldObjRenderer, 'Accept');
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_accept_invitation',
      { p_token: 'tok-abc' },
    );
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('declines an invitation by token', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Invitation token', 'tok-abc');
    fncRunPress(fldObjRenderer, 'Decline');
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_decline_invitation',
      { p_token: 'tok-abc' },
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps content and shows refusal on failure', async () => {
    const fldObjFake = fncConvFakeClient({
      rpcError: { message: 'invitation expired' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Invitation token', 'tok-abc');
    fncRunPress(fldObjRenderer, 'Accept');
    await fncRunFlush();

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not complete the action');
    expect(fldObjError.props.fldStrMessage).toContain('invitation expired');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('guest@example.com');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
