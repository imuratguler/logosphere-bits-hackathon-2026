/**
 * Logosphere BITS — hidden account relation screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: list, add, and remove calls
 * run against a fake client, so no network is touched. Covers the
 * list, the empty book, load retry, add validation, add with
 * reload, removal, and failure with content kept.
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
import { scrAccountRelations } from '../src/screens/scrAccountRelations';

function fncConvRelationRow() {
  return {
    id: 'rel-1',
    peer_profile_id: 'user-real-2',
    peer_organization_id: null,
    relation: 'contact',
  };
}

function fncConvFakeClient(fldObjScript: {
  rows?: unknown;
  rowsError?: { message: string } | null;
  added?: unknown;
  addedError?: { message: string } | null;
}) {
  const fldObjInsertBuilder = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: fldObjScript.added ?? fncConvRelationRow(),
      error: fldObjScript.addedError ?? null,
    }),
  };
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnValue(fldObjInsertBuilder),
    delete: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.rows ?? [fncConvRelationRow()],
        error: fldObjScript.rowsError ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  const fldObjGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: 'user-real-1' } },
    error: null,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      auth: { getUser: fldObjGetUser },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountRelations, {
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

describe('hidden account relation screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders relations with peers and marks', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_relations');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('user-real-2');
    expect(fldArrTexts).toContain('contact');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the empty book without relations', async () => {
    const fldObjFake = fncConvFakeClient({ rows: [] });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'No relations yet',
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
      'Could not load relations',
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

  it('blocks add without exactly one peer', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunPress(fldObjRenderer, 'Add relation');

    expect(fldObjFake.fldObjBuilder.insert).not.toHaveBeenCalled();
    const fldObjInput = fldObjRenderer.root
      .findAllByType(vwTextInput)
      .find(
        fldObjNode => fldObjNode.props.fldStrPlaceholder === 'Peer profile id',
      );
    expect(fldObjInput?.props.fldStrError).toBe('Enter exactly one peer.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('adds a relation with the chosen mark and reloads', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);
    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;

    fncRunFill(fldObjRenderer, 'Peer profile id', 'user-real-9');
    fncRunPress(fldObjRenderer, 'partner');
    fncRunPress(fldObjRenderer, 'Add relation');
    await fncRunFlush();

    expect(fldObjFake.fldObjBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-real-1',
      peer_profile_id: 'user-real-9',
      peer_organization_id: null,
      relation: 'partner',
    });
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('removes a relation and reloads', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunPress(fldObjRenderer, 'Remove');
    await fncRunFlush();

    expect(fldObjFake.fldObjBuilder.delete).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith('id', 'rel-1');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps content and shows add failure', async () => {
    const fldObjFake = fncConvFakeClient({
      addedError: { message: 'db down' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    fncRunFill(fldObjRenderer, 'Peer profile id', 'user-real-9');
    fncRunPress(fldObjRenderer, 'Add relation');
    await fncRunFlush();

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not complete the action');
    expect(fldObjError.props.fldStrMessage).toContain('db down');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('user-real-2');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
