/**
 * Logosphere BITS — hidden account role screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: role, matrix, member, and
 * identity calls run against a fake client, so no network is
 * touched. Covers the role list, the grant grid, manager-only
 * toggles, member assignment, failure with content kept, and
 * load retry. Roles come only from server rows — never personas.
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
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAccountRoles } from '../src/screens/scrAccountRoles';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function fncConvRoles() {
  return [
    { code: 'account_manager', description: 'Account manager' },
    { code: 'authorized', description: 'Authorized member' },
  ];
}

function fncConvMatrix() {
  return [{ role_code: 'account_manager', action: 'view', scope: 'item' }];
}

function fncConvMembers() {
  return [
    { profile_id: 'user-real-1', role: 'account_manager' },
    { profile_id: 'user-real-2', role: 'authorized' },
  ];
}

function fncConvProfiles() {
  return [
    { id: 'user-real-1', display_name: 'Owner' },
    { id: 'user-real-2', display_name: null },
  ];
}

function fncConvBuilder(fldObjData: unknown, fldObjError: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({ data: fldObjData, error: fldObjError }).then(
        fldObjResolve,
        fldObjReject,
      ),
  };
}

function fncConvFakeClient(fldObjScript: {
  rolesError?: { message: string } | null;
  userId?: string | null;
  rpcError?: { message: string } | null;
}) {
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    if (fldStrTable === 'roles') {
      return fncConvBuilder(fncConvRoles(), fldObjScript.rolesError ?? null);
    }
    if (fldStrTable === 'role_permissions') {
      return fncConvBuilder(fncConvMatrix(), null);
    }
    if (fldStrTable === 'organization_memberships') {
      return fncConvBuilder(fncConvMembers(), null);
    }
    return fncConvBuilder(fncConvProfiles(), null);
  });
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: null,
    error: fldObjScript.rpcError ?? null,
  });
  const fldObjGetUser = jest.fn().mockResolvedValue({
    data: {
      user:
        fldObjScript.userId === null || fldObjScript.userId === undefined
          ? null
          : { id: fldObjScript.userId },
    },
    error: null,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
      auth: { getUser: fldObjGetUser },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountRoles, {
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

describe('hidden account role screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders roles, matrix states, and members', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('account_manager');
    expect(fldArrTexts).toContain('Account manager');
    expect(fldArrTexts).toContain('Owner');
    expect(fldArrTexts).toContain('Unnamed member');
    expect(fldArrTexts).toContain('Role: authorized');
    const fldArrButtons = fldObjRenderer.root.findAllByType(vwButton);
    expect(fldArrButtons[0].props.fldStrLabel).toBe('item — Granted');
    expect(fldArrButtons[1].props.fldStrLabel).toBe('collection — Revoked');
    expect(fldArrTexts).not.toContain(
      'Only account managers can change roles.',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('toggles a granted cell off through the matrix RPC', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);
    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findAllByType(vwButton)[0].props.actHandOnPress();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_set_matrix_cell',
      {
        p_role: 'account_manager',
        p_action: 'view',
        p_scope: 'item',
        p_grant: false,
      },
    );
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('toggles a revoked cell on through the matrix RPC', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findAllByType(vwButton)[1].props.actHandOnPress();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_set_matrix_cell',
      {
        p_role: 'account_manager',
        p_action: 'view',
        p_scope: 'collection',
        p_grant: true,
      },
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('locks toggles and assignment visibly for non-managers', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-2' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Only account managers can change roles.');
    const fldArrButtons = fldObjRenderer.root.findAllByType(vwButton);
    expect(fldArrButtons.length).toBeGreaterThan(0);
    for (const fldObjButton of fldArrButtons) {
      expect(fldObjButton.props.fldBooDisabled).toBe(true);
    }

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findAllByType(vwButton)[0].props.actHandOnPress();
    });
    await fncRunFlush();
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('assigns a member role through the account RPC', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldObjButton = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(
        fldObjNode =>
          fldObjNode.props.fldStrLabel === 'account_manager' &&
          fldObjNode.props.fldBooDisabled !== true,
      );
    if (fldObjButton === undefined) {
      throw new Error('Logosphere BITS: assign button is missing.');
    }
    ReactTestRenderer.act(() => {
      fldObjButton.props.actHandOnPress();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('account_assign_role', {
      p_organization_id: fldStrSeedOrg,
      p_profile_id: 'user-real-2',
      p_role: 'account_manager',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('disables the button naming the current role', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldArrAssignButtons = fldObjRenderer.root
      .findAllByType(vwButton)
      .filter(
        fldObjNode =>
          fldObjNode.props.fldStrLabel === 'account_manager' ||
          fldObjNode.props.fldStrLabel === 'authorized',
      );
    expect(fldArrAssignButtons.length).toBe(4);
    const fldArrDisabled = fldArrAssignButtons.map(
      fldObjNode => fldObjNode.props.fldBooDisabled,
    );
    expect(
      fldArrDisabled.filter(fldBooFlag => fldBooFlag === true).length,
    ).toBe(2);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps content and shows refusal on failure', async () => {
    const fldObjFake = fncConvFakeClient({
      userId: 'user-real-1',
      rpcError: { message: 'account manager required' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findAllByType(vwButton)[0].props.actHandOnPress();
    });
    await fncRunFlush();

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not save the change');
    expect(fldObjError.props.fldStrMessage).toContain(
      'account manager required',
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('account_manager');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows load errors with retry', async () => {
    const fldObjFake = fncConvFakeClient({
      userId: 'user-real-1',
      rolesError: { message: 'db down' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not load roles');
    expect(fldObjError.props.fldStrMessage).toContain('db down');

    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await fncRunFlush();
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('derives assignment only from server rows, never personas', async () => {
    const fldObjFake = fncConvFakeClient({ userId: 'user-real-1' });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldArrAssignButtons = fldObjRenderer.root
      .findAllByType(vwButton)
      .filter(
        fldObjNode =>
          fldObjNode.props.fldStrLabel === 'account_manager' ||
          fldObjNode.props.fldStrLabel === 'authorized',
      );
    expect(fldArrAssignButtons.length).toBe(2 * 2);
    const fldArrShown = [
      ...fldObjRenderer.root
        .findAllByType(vwText)
        .map(fldObjNode => fldObjNode.props.children),
      ...fldObjRenderer.root
        .findAllByType(vwButton)
        .map(fldObjNode => fldObjNode.props.fldStrLabel),
    ];
    for (const fldStrShown of fldArrShown) {
      expect(String(fldStrShown).toLowerCase()).not.toContain('persona');
    }

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
