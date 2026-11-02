/**
 * Logosphere BITS — demo account home tests (maintained).
 *
 * Renders the real home screen with react-test-renderer: AsyncStorage
 * is an in-memory mock and the Supabase client is fake, so no network
 * is touched. Navigation ships untranspiled ESM and is stubbed like
 * the other suites. Seed rows are public, non-secret.
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

// Navigation ships untranspiled ESM; jest (CJS, committed config
// untouched) stubs the hook. The stub only records navigation —
// like the other suites — so the tests prove the wiring.
const mockFncNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockFncNavigate }),
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

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VwDemoSessionProvider } from '../src/contexts/ctxDemoSession';
import { vwButton } from '../src/components/vwButton';
import { vwDemoFooter } from '../src/components/vwDemoFooter';
import { vwListRow } from '../src/components/vwListRow';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrHome } from '../src/screens/scrHome';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrPersonaA = '10000000-0000-4000-8000-000000000001';

function fncConvFakeClient() {
  const fldObjRpc = jest.fn();
  const fldObjFrom = jest.fn();
  const fldObjClient = {
    rpc: fldObjRpc,
    from: fldObjFrom,
    auth: {},
  } as unknown as SupabaseClient;
  jest.mocked(srvApiGetDemoClient).mockReturnValue(fldObjClient);
  return { fldObjClient, fldObjRpc, fldObjFrom };
}

async function fncRunPreSeedPersona(
  fldStrDisplayName: string,
  fldNumEndsAtMs: number = Date.now() + 3600000,
) {
  await srvStorSupabaseAuthStorage.setItem(
    'demo-persona',
    JSON.stringify({
      fldStrId: fldStrPersonaA,
      fldStrDisplayName,
      fldNumSortOrder: 0,
    }),
  );
  await srvStorSupabaseAuthStorage.setItem(
    `demo-session:${fldStrPersonaA}`,
    JSON.stringify({
      fldStrSessionId: 'session-home',
      fldNumEndsAtMs,
    }),
  );
}

async function fncRunRenderHome(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrHome, {
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

function fncRunPressableByLabel(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
) {
  const fldObjNode = fldObjRenderer.root
    .findAllByProps({ accessibilityLabel: fldStrLabel })
    .find(
      fldObjCandidate => typeof fldObjCandidate.props.onPress === 'function',
    );
  if (fldObjNode === undefined) {
    throw new Error(`Logosphere BITS: "${fldStrLabel}" is not pressable.`);
  }
  return fldObjNode;
}

describe('demo account home', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows the brand strip with one corporate card', async () => {
    await fncRunPreSeedPersona('CV Meta Hackathon 2026');
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON());
    expect(fldStrTree).toContain('Logosphere');
    expect(fldStrTree).toContain('BITS');
    expect(fldStrTree).toContain('CV Meta Hackathon 2026');
    expect(fldStrTree).toContain('Corporate');
    expect(fldStrTree).toContain('↻');
    const fldObjFooter = fldObjRenderer.root.findByType(vwDemoFooter);
    expect(fldObjFooter.props.fldStrText).toBe('Demo Version © 2026');
    expect(fldObjRenderer.root.findAllByType(vwListRow).length).toBe(0);
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(0);
    expect(fldStrTree).not.toContain('Libraries');
    expect(fldStrTree).not.toContain('New library');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('tags individual personas without splitting data', async () => {
    await fncRunPreSeedPersona('Book Collector');
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON());
    expect(fldStrTree).toContain('Book Collector');
    expect(fldStrTree).toContain('Individual');
    expect(fldStrTree).not.toContain('Corporate');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens the shared library list from the card', async () => {
    await fncRunPreSeedPersona('CV Meta Hackathon 2026');
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      const fldObjCard = fncRunPressableByLabel(
        fldObjRenderer,
        'CV Meta Hackathon 2026',
      );
      (fldObjCard.props.onPress as () => void)();
    });

    expect(mockFncNavigate).toHaveBeenCalledWith('LibraryList', {
      fldStrPersonaName: 'CV Meta Hackathon 2026',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('returns to the entry when the profile changes', async () => {
    await fncRunPreSeedPersona('CV Meta Hackathon 2026');
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      const fldObjSwitch = fldObjRenderer.root
        .findAllByType(vwButton)
        .find(
          fldObjNode => fldObjNode.props.fldStrLabel === 'Change Demo Profile',
        );
      if (fldObjSwitch === undefined) {
        throw new Error('Logosphere BITS: switch was not rendered.');
      }
      fldObjSwitch.props.actHandOnPress();
    });

    await expect(
      srvStorSupabaseAuthStorage.getItem('demo-persona'),
    ).resolves.toBeNull();
    expect(JSON.stringify(fldObjRenderer.toJSON())).not.toContain(
      'CV Meta Hackathon 2026',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('refreshes the demo session from the strip icon', async () => {
    await fncRunPreSeedPersona('CV Meta Hackathon 2026', Date.now() - 1000);
    const fldObjFake = fncConvFakeClient();
    const fldNumEndsAtMs = Date.now() + 3600000;
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        id: 'session-fresh',
        persona_id: fldStrPersonaA,
        created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
        expires_at: new Date(fldNumEndsAtMs).toISOString(),
        revoked_at: null,
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);
    fldObjFake.fldObjRpc.mockClear();

    await ReactTestRenderer.act(async () => {
      const fldObjRefresh = fncRunPressableByLabel(fldObjRenderer, 'Refresh');
      (fldObjRefresh.props.onPress as () => void)();
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('start_demo_session', {
      p_persona_id: fldStrPersonaA,
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the refresh failure without leaving the page', async () => {
    await fncRunPreSeedPersona('CV Meta Hackathon 2026', Date.now() - 1000);
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'home-refresh-down' },
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      const fldObjRefresh = fncRunPressableByLabel(fldObjRenderer, 'Refresh');
      (fldObjRefresh.props.onPress as () => void)();
    });

    expect(JSON.stringify(fldObjRenderer.toJSON())).toContain(
      'home-refresh-down',
    );
    expect(JSON.stringify(fldObjRenderer.toJSON())).toContain(
      'CV Meta Hackathon 2026',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
