/**
 * Logosphere BITS — navigation foundation tests (maintained).
 *
 * Renders the real provider plus navigation tree with
 * react-test-renderer: AsyncStorage is an in-memory mock and the
 * Supabase client is fake, so no network is touched. Both routes
 * render from existing or local components only — importing a
 * not-yet-created screen file would fail these tests at import time.
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
// untouched) stubs the container and stack. The stub renders the first
// declared screen like an initial route, so these tests prove which
// route tree the app selects per loading state — not library internals.
jest.mock('@react-navigation/native', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    NavigationContainer: ({ children }: { children: unknown }) =>
      fldObjReact.createElement(fldObjReact.Fragment, null, children),
  };
});

jest.mock('@react-navigation/stack', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: { children: unknown }) => {
        const fldArrScreens: unknown[] = [];
        fldObjReact.Children.forEach(children, (fldObjChild: unknown) => {
          const fldObjElement = fldObjChild as {
            type?: unknown;
            props?: { children?: unknown };
          } | null;
          if (
            fldObjElement !== null &&
            typeof fldObjElement === 'object' &&
            fldObjElement.type === fldObjReact.Fragment
          ) {
            fldObjReact.Children.forEach(
              fldObjElement.props?.children,
              (fldObjNested: unknown) => {
                fldArrScreens.push(fldObjNested);
              },
            );
          } else {
            fldArrScreens.push(fldObjChild);
          }
        });
        return fldArrScreens[0] ?? null;
      },
      Screen: ({
        component,
        children,
      }: {
        component?: (fldObjProps: object) => unknown;
        children?: (fldObjProps: object) => unknown;
      }) =>
        component !== undefined
          ? fldObjReact.createElement(component)
          : typeof children === 'function'
          ? children({})
          : children ?? null,
    }),
  };
});

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

import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

import { VwDemoSessionProvider } from '../src/contexts/ctxDemoSession';
import { vwSplash } from '../src/components/vwSplash';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { vwApplication } from '../src/navigation/navApplication';
import { scrHome } from '../src/screens/scrHome';
import { scrPersonaSelection } from '../src/screens/scrPersonaSelection';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { vwText } from '../src/components/vwText';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedPersona = '10000000-0000-4000-8000-000000000001';

function fncConvFakeClient() {
  const fldObjRpc = jest.fn();
  const fldObjFrom = jest.fn().mockImplementation((fldStrTable: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data:
          fldStrTable === 'demo_personas'
            ? [
                {
                  id: '10000000-0000-4000-8000-000000000001',
                  display_name: 'Public Library',
                  sort_order: 0,
                },
              ]
            : fldStrTable === 'workspaces'
            ? [
                {
                  id: '11111111-1111-1111-1111-111111111111',
                  name: 'Demo Workspace',
                },
              ]
            : [
                {
                  id: '22222222-2222-2222-2222-222222222222',
                  name: 'Demo Library',
                },
              ],
        error: null,
      }).then(fldObjResolve, fldObjReject),
  }));
  const fldObjClient = {
    rpc: fldObjRpc,
    from: fldObjFrom,
    auth: {},
  } as unknown as SupabaseClient;
  jest.mocked(srvApiGetDemoClient).mockReturnValue(fldObjClient);
  return { fldObjClient, fldObjRpc };
}

async function fncRunRenderNavigation(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(vwApplication, {
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

describe('navigation foundation', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows Splash while restoring, then Home with shared libraries', async () => {
    await srvStorSupabaseAuthStorage.setItem(
      'demo-persona',
      JSON.stringify({
        fldStrId: fldStrSeedPersona,
        fldStrDisplayName: 'Public Library',
        fldNumSortOrder: 0,
      }),
    );
    const fldObjFake = fncConvFakeClient();
    let fldObjReleaseRpc: (fldObjValue: unknown) => void = () => undefined;
    fldObjFake.fldObjRpc.mockReturnValueOnce(
      new Promise(fldObjResolve => {
        fldObjReleaseRpc = fldObjResolve;
      }),
    );
    const fldObjRenderer = await fncRunRenderNavigation(
      fldObjFake.fldObjClient,
    );

    expect(fldObjRenderer.root.findByType(vwSplash).props.fldBooLoading).toBe(
      true,
    );
    expect(fldObjRenderer.root.findAllByType(scrPersonaSelection).length).toBe(
      0,
    );

    const fldNumEndsAtMs = Date.now() + 3600000;
    fldObjReleaseRpc({
      data: {
        id: 'session-nav',
        persona_id: fldStrSeedPersona,
        created_at: new Date(fldNumEndsAtMs - 3600000).toISOString(),
        expires_at: new Date(fldNumEndsAtMs).toISOString(),
        revoked_at: null,
      },
      error: null,
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjRenderer.root.findAllByType(scrHome).length).toBe(1);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Demo Library');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens PersonaSelection directly with no stored persona', async () => {
    const fldObjFake = fncConvFakeClient();
    const fldObjRenderer = await fncRunRenderNavigation(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    expect(fldObjRenderer.root.findAllByType(scrPersonaSelection).length).toBe(
      1,
    );
    expect(fldObjRenderer.root.findAllByType(vwSplash).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
