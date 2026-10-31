/**
 * Logosphere BITS — hidden account message screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: list, send, and read calls
 * run against a fake client, so no network is touched. Covers
 * the list, the empty box, load retry, compose validation, send
 * with reload, mark-read, and failure with content kept.
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
import { scrAccountMessages } from '../src/screens/scrAccountMessages';

function fncConvMessageRow() {
  return {
    id: 'msg-1',
    sender_profile_id: 'user-real-1',
    recipient_profile_id: 'user-real-2',
    recipient_organization_id: null,
    body: 'Hello',
    is_read: false,
  };
}

function fncConvFakeClient(fldObjScript: {
  rows?: unknown;
  rowsError?: { message: string } | null;
  sent?: unknown;
  sentError?: { message: string } | null;
  rpcError?: { message: string } | null;
}) {
  const fldObjInsertBuilder = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: fldObjScript.sent ?? fncConvMessageRow(),
      error: fldObjScript.sentError ?? null,
    }),
  };
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnValue(fldObjInsertBuilder),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.rows ?? [fncConvMessageRow()],
        error: fldObjScript.rowsError ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: null,
    error: fldObjScript.rpcError ?? null,
  });
  const fldObjGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: 'user-real-1' } },
    error: null,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
      auth: { getUser: fldObjGetUser },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
    fldObjRpc,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountMessages, {
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

describe('hidden account message screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages with recipients and read state', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_messages');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Hello');
    expect(fldArrTexts).toContain('user-real-2');
    expect(fldArrTexts).toContain('Unread');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the empty box without messages', async () => {
    const fldObjFake = fncConvFakeClient({ rows: [] });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'No messages yet',
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
      'Could not load messages',
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

  it('blocks send without exactly one recipient', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Message', 'Hello');
    fncRunPress(fldObjRenderer, 'Send');

    expect(fldObjFake.fldObjBuilder.insert).not.toHaveBeenCalled();
    const fldObjInput = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .find(
        fldObjNode =>
          fldObjNode.props.fldStrPlaceholder === 'Recipient profile id',
      );
    expect(fldObjInput?.props.fldStrError).toBe('Enter exactly one recipient.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('sends a message and reloads the list', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);
    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;

    fncRunFill(fldObjRenderer, 'Recipient profile id', 'user-real-2');
    fncRunFill(fldObjRenderer, 'Message', 'Hello again');
    fncRunPress(fldObjRenderer, 'Send');
    await fncRunFlush();

    expect(fldObjFake.fldObjBuilder.insert).toHaveBeenCalledWith({
      sender_profile_id: 'user-real-1',
      recipient_profile_id: 'user-real-2',
      recipient_organization_id: null,
      body: 'Hello again',
    });
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('marks a message read through the account RPC', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunPress(fldObjRenderer, 'Mark read');
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_mark_message_read',
      { p_message_id: 'msg-1' },
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps content and shows send failure', async () => {
    const fldObjFake = fncConvFakeClient({
      sentError: { message: 'not a member' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Recipient profile id', 'user-real-2');
    fncRunFill(fldObjRenderer, 'Message', 'Hello again');
    fncRunPress(fldObjRenderer, 'Send');
    await fncRunFlush();

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not complete the action');
    expect(fldObjError.props.fldStrMessage).toContain('not a member');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Hello');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
