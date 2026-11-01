/**
 * Logosphere BITS — demo persona selection screen tests (maintained).
 *
 * Renders the real screen inside the demo provider with
 * react-test-renderer: AsyncStorage is an in-memory mock and the
 * Supabase client is fake, so no network is touched. Persona rows
 * carry the exact seed names and order (public, non-secret). The
 * same-data and no-login-shape checks below stay with the project.
 */

import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

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

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VwDemoSessionProvider } from '../src/contexts/ctxDemoSession';
import { vwBrandHeader } from '../src/components/vwBrandHeader';
import { vwButton } from '../src/components/vwButton';
import { vwDemoFooter } from '../src/components/vwDemoFooter';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrPersonaSelection } from '../src/screens/scrPersonaSelection';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvApiGetDemoWorkspace } from '../src/services/srvDemoWorkspace';

const fldArrSeedNames = [
  'Public Library',
  'High School',
  'University College',
  'Bookstore Company',
  'Second-hand Bookshop',
  'Auction House',
  'Book Collector',
  'Senior Citizen',
  'Any Student',
  'CV Meta Hackathon 2026',
];

function fncConvSeedRows() {
  return fldArrSeedNames.map((fldStrName, fldNumIndex) => ({
    id: `10000000-0000-4000-8000-0000000000${String(fldNumIndex + 1).padStart(
      2,
      '0',
    )}`,
    display_name: fldStrName,
    sort_order: fldNumIndex,
  }));
}

function fncConvFakeClient() {
  const fldObjRpc = jest.fn();
  const fldObjFrom = jest.fn();
  const fldObjClient = {
    rpc: fldObjRpc,
    from: fldObjFrom,
    auth: {},
  } as unknown as SupabaseClient;
  jest.mocked(srvApiGetDemoClient).mockReturnValueOnce(fldObjClient);
  return { fldObjClient, fldObjRpc, fldObjFrom };
}

function fncRunServeRows(fldObjFrom: jest.Mock, fldArrRows: unknown[]) {
  fldObjFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({ data: fldArrRows, error: null }).then(
        fldObjResolve,
        fldObjReject,
      ),
  });
}

function fncConvRpcRow(fldStrSessionId: string, fldStrPersonaId: string) {
  const fldNumEndsAtMs = Date.now() + 3600000;
  return {
    id: fldStrSessionId,
    persona_id: fldStrPersonaId,
    created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
    expires_at: new Date(fldNumEndsAtMs).toISOString(),
    revoked_at: null,
  };
}

async function fncRunRenderScreen(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrPersonaSelection, {
          fldObjStrings: fldObjStringsEn,
        }),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
}

function fncRunPressContinue(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
): () => void {
  const fldObjContinue = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(
      fldObjButton =>
        fldObjButton.props.fldStrLabel ===
        fldObjStringsEn.fldObjPersonaSelection.fldStrContinue,
    );
  if (fldObjContinue === undefined) {
    throw new Error('Logosphere BITS: continue was not rendered.');
  }
  return fldObjContinue.props.actHandOnPress as () => void;
}

function fncRunPressRow(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
): () => void {
  const fldObjRow = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjButton => fldObjButton.props.fldStrLabel === fldStrLabel);
  if (fldObjRow === undefined) {
    throw new Error(`Logosphere BITS: "${fldStrLabel}" was not rendered.`);
  }
  return fldObjRow.props.actHandOnPress as () => void;
}

describe('demo persona selection screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows the ten seed personas in English order', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows());
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels.slice(0, 10)).toEqual([
      ...fldArrSeedNames.slice(0, 9),
      'CV Meta Hackathon 2026 — Selected',
    ]);
    expect(fldArrLabels[10]).toBe(
      fldObjStringsEn.fldObjPersonaSelection.fldStrContinue,
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Choose a demo persona');
    const fldObjBrand = fldObjRenderer.root.findByType(vwBrandHeader);
    expect(fldObjBrand.props.fldStrName).toBe('Logosphere');
    expect(fldObjBrand.props.fldStrSuffix).toBe('BITS');
    const fldObjFooter = fldObjRenderer.root.findByType(vwDemoFooter);
    expect(fldObjFooter.props.fldStrText).toBe('Demo Version © 2026');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('falls back to the first row when the default persona is missing', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows().slice(0, 9));
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels[0]).toBe('Public Library — Selected');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('selects without any login shape', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows());
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fncConvRpcRow(
        'session-pick',
        '10000000-0000-4000-8000-000000000001',
      ),
      error: null,
    });
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Public Library')();
    });
    await fncRunFlush();
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => {
      fncRunPressContinue(fldObjRenderer)();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('start_demo_session', {
      p_persona_id: '10000000-0000-4000-8000-000000000001',
    });
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels).toContain('Public Library — Selected');
    expect(fldObjRenderer.root.findAllByType(TextInput).length).toBe(0);
    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON()).toLowerCase();
    expect(fldStrTree).not.toContain('password');
    expect(fldStrTree).not.toContain('sign in');
    expect(fldStrTree).not.toContain('member');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('leads every persona to the same shared data', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows());
    fldObjFake.fldObjRpc
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-a',
          '10000000-0000-4000-8000-000000000001',
        ),
        error: null,
      })
      .mockResolvedValueOnce({
        data: fncConvRpcRow(
          'session-b',
          '10000000-0000-4000-8000-000000000002',
        ),
        error: null,
      });
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Public Library')();
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fncRunPressContinue(fldObjRenderer)();
    });
    await fncRunFlush();
    const fldArrTablesDuringSelect = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    fncRunServeRows(fldObjFake.fldObjFrom, [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Demo Workspace' },
    ]);
    const fldObjFirstData = await srvApiGetDemoWorkspace(
      fldObjFake.fldObjClient,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'High School')();
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fncRunPressContinue(fldObjRenderer)();
    });
    await fncRunFlush();
    const fldObjSecondData = await srvApiGetDemoWorkspace(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFirstData).toEqual(fldObjSecondData);
    expect(fldArrTablesDuringSelect).toEqual(['demo_personas']);
    for (const fldArrCall of fldObjFake.fldObjRpc.mock.calls) {
      expect(fldArrCall[0]).toBe('start_demo_session');
    }

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries the list after a load failure', async () => {
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: null,
          error: { message: 'demo db down' },
        }).then(fldObjResolve, fldObjReject),
    });
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    const fldObjRetry = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjButton => fldObjButton.props.fldStrLabel === 'Retry');
    if (fldObjRetry === undefined) {
      throw new Error('Logosphere BITS: retry was not rendered.');
    }
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows());
    await ReactTestRenderer.act(async () => {
      fldObjRetry.props.actHandOnPress();
    });
    await fncRunFlush();

    expect(fldObjRenderer.root.findAllByType(vwButton).length).toBeGreaterThan(
      1,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries the session after a selection failure', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, fncConvSeedRows());
    fldObjFake.fldObjRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'demo db down' },
    });
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Public Library')();
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fncRunPressContinue(fldObjRenderer)();
    });
    await fncRunFlush();
    expect(fldObjRenderer.root.findAllByType(vwButton).length).toBeGreaterThan(
      10,
    );

    fldObjFake.fldObjRpc.mockResolvedValueOnce({
      data: fncConvRpcRow(
        'session-retry',
        '10000000-0000-4000-8000-000000000001',
      ),
      error: null,
    });
    const fldObjRetry = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjButton => fldObjButton.props.fldStrLabel === 'Retry');
    if (fldObjRetry === undefined) {
      throw new Error('Logosphere BITS: session retry was not rendered.');
    }
    await ReactTestRenderer.act(async () => {
      fldObjRetry.props.actHandOnPress();
    });
    await fncRunFlush();

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels).toContain('Public Library — Selected');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows an empty state when no personas exist', async () => {
    const fldObjFake = fncConvFakeClient();
    fncRunServeRows(fldObjFake.fldObjFrom, []);
    const fldObjRenderer = await fncRunRenderScreen(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('No demo personas yet');
    expect(fldObjRenderer.root.findAllByType(vwButton).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
