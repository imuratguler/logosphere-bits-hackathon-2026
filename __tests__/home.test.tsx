/**
 * Logosphere BITS — shared home screen tests (maintained).
 *
 * Renders the real home screen (and, for the change loop, the real
 * navigation tree) with react-test-renderer: AsyncStorage is an
 * in-memory mock and the Supabase client is fake, so no network is
 * touched. Navigation ships untranspiled ESM and is stubbed like the
 * other suites. Seed rows are public, non-secret.
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
// untouched) stubs the container and stack. The stub holds one
// current route (the initial route at mount) and only moves on
// reset — like the real stack — so the persona-change flow below
// proves the phase transitions — not library internals.
const mockObjNavControl: {
  fncRunReset?: (fldStrName: string) => void;
  fncRunGetCurrentRoute?: () => { name: string } | undefined;
} = {};

jest.mock('@react-navigation/native', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    NavigationContainer: fldObjReact.forwardRef(
      (
        fldObjProps: { children: unknown },
        fldObjRef:
          | {
              current: {
                reset: (fldObjState: {
                  index: number;
                  routes: { name: string }[];
                }) => void;
                getCurrentRoute: () => { name: string } | undefined;
              } | null;
            }
          | ((fldObjNav: unknown) => void)
          | null,
      ) => {
        const fldObjFacade = {
          reset: (fldObjState: {
            index: number;
            routes: { name: string }[];
          }) => {
            const fldStrName = fldObjState.routes[fldObjState.index]?.name;
            if (fldStrName !== undefined) {
              mockObjNavControl.fncRunReset?.(fldStrName);
            }
          },
          getCurrentRoute: () => mockObjNavControl.fncRunGetCurrentRoute?.(),
        };
        if (typeof fldObjRef === 'function') {
          fldObjRef(fldObjFacade);
        } else if (fldObjRef !== null && typeof fldObjRef === 'object') {
          fldObjRef.current = fldObjFacade;
        }
        return fldObjReact.createElement(
          fldObjReact.Fragment,
          null,
          fldObjProps.children,
        );
      },
    ),
  };
});

jest.mock('@react-navigation/stack', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    createStackNavigator: () => ({
      Navigator: ({
        children,
        initialRouteName,
      }: {
        children: unknown;
        initialRouteName?: string;
      }) => {
        const fldArrScreens: {
          fldStrName: string;
          fldObjElement: unknown;
        }[] = [];
        const fncCollectScreens = (fldObjNodes: unknown): void => {
          fldObjReact.Children.forEach(fldObjNodes, (fldObjChild: unknown) => {
            const fldObjElement = fldObjChild as {
              type?: unknown;
              props?: { children?: unknown; name?: string };
            } | null;
            if (
              fldObjElement !== null &&
              typeof fldObjElement === 'object' &&
              fldObjElement.type === fldObjReact.Fragment
            ) {
              fncCollectScreens(fldObjElement.props?.children);
            } else if (
              fldObjElement !== null &&
              typeof fldObjElement === 'object'
            ) {
              fldArrScreens.push({
                fldStrName: fldObjElement.props?.name ?? '',
                fldObjElement: fldObjChild,
              });
            }
          });
        };
        fncCollectScreens(children);
        const [fldStrCurrent, fncSetCurrent]: [
          string | null,
          (fldStrName: string) => void,
        ] = fldObjReact.useState(
          () => initialRouteName ?? fldArrScreens[0]?.fldStrName ?? null,
        );
        mockObjNavControl.fncRunReset = fncSetCurrent;
        mockObjNavControl.fncRunGetCurrentRoute = () =>
          fldStrCurrent === null ? undefined : { name: fldStrCurrent };
        const fldObjVisible =
          fldArrScreens.find(
            fldObjScreen => fldObjScreen.fldStrName === fldStrCurrent,
          ) ?? fldArrScreens[0];
        if (fldObjVisible === undefined) {
          return null;
        }
        const fldObjScreenProps = (
          fldObjVisible.fldObjElement as {
            props?: {
              component?: (fldObjProps: object) => unknown;
              children?: (fldObjProps: object) => unknown;
            };
          }
        ).props;
        const fldObjComponent = fldObjScreenProps?.component;
        const fldObjRender = fldObjScreenProps?.children;
        return fldObjComponent !== undefined
          ? fldObjReact.createElement(fldObjComponent)
          : typeof fldObjRender === 'function'
          ? fldObjRender({})
          : fldObjRender ?? null;
      },
      Screen: () => null,
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
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { vwApplication } from '../src/navigation/navApplication';
import { scrHome } from '../src/screens/scrHome';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrPersonaA = '10000000-0000-4000-8000-000000000001';
const fldStrPersonaB = '10000000-0000-4000-8000-000000000002';

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

function fncRunServeTables(
  fldObjFrom: jest.Mock,
  fldObjTables: Record<string, unknown>,
) {
  fldObjFrom.mockImplementation((fldStrTable: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjTables[fldStrTable] ?? [],
        error: null,
      }).then(fldObjResolve, fldObjReject),
  }));
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

async function fncRunPreSeedPersona(fldStrPersonaId: string) {
  await srvStorSupabaseAuthStorage.setItem(
    'demo-persona',
    JSON.stringify({
      fldStrId: fldStrPersonaId,
      fldStrDisplayName:
        fldStrPersonaId === fldStrPersonaA ? 'Public Library' : 'High School',
      fldNumSortOrder: fldStrPersonaId === fldStrPersonaA ? 0 : 1,
    }),
  );
  await srvStorSupabaseAuthStorage.setItem(
    `demo-session:${fldStrPersonaId}`,
    JSON.stringify({
      fldStrSessionId: `session-for-${fldStrPersonaId.slice(-3)}`,
      fldNumEndsAtMs: Date.now() + 3600000,
    }),
  );
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
}

function fncRunPressButton(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
): void {
  const fldObjButton = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
  if (fldObjButton === undefined) {
    throw new Error(
      `Logosphere BITS: button '${fldStrLabel}' was not rendered.`,
    );
  }
  fldObjButton.props.actHandOnPress();
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

describe('shared home screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows the brand header and workspace libraries', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Logosphere BITS');
    expect(fldArrTexts).toContain('Public Library');
    expect(fldArrTexts).toContain('Libraries');
    expect(fldArrTexts).toContain('Demo Library');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels).toContain('Change Demo Profile');
    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON()).toLowerCase();
    expect(fldStrTree).not.toContain('membership');
    expect(fldStrTree).not.toContain('permission');
    expect(fldStrTree).not.toContain('become a member');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('changes persona without deleting data or opening a workspace', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
      demo_personas: [
        {
          id: fldStrPersonaA,
          display_name: 'Public Library',
          sort_order: 0,
        },
        {
          id: fldStrPersonaB,
          display_name: 'High School',
          sort_order: 1,
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fncConvRpcRow('session-b', fldStrPersonaB),
      error: null,
    });
    const fldObjRenderer = await fncRunRenderNavigation(
      fldObjFake.fldObjClient,
    );
    expect(fldObjRenderer.root.findAllByType(scrHome).length).toBe(1);

    const fldObjChange = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(
        fldObjButton =>
          fldObjButton.props.fldStrLabel === 'Change Demo Profile',
      );
    if (fldObjChange === undefined) {
      throw new Error('Logosphere BITS: change action was not rendered.');
    }
    await ReactTestRenderer.act(async () => {
      fldObjChange.props.actHandOnPress();
    });
    await fncRunFlush();
    expect(fldObjRenderer.root.findAllByType(scrHome).length).toBe(0);
    const fldObjPick = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjButton => fldObjButton.props.fldStrLabel === 'High School');
    if (fldObjPick === undefined) {
      throw new Error('Logosphere BITS: persona row was not rendered.');
    }
    await ReactTestRenderer.act(async () => {
      fldObjPick.props.actHandOnPress();
    });
    await fncRunFlush();
    expect(fldObjRenderer.root.findAllByType(scrHome).length).toBe(1);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('High School');
    expect(fldArrTexts).toContain('Demo Library');
    await expect(
      srvStorSupabaseAuthStorage.getItem(`demo-session:${fldStrPersonaA}`),
    ).resolves.not.toBeNull();
    await expect(
      srvStorSupabaseAuthStorage.getItem(`demo-session:${fldStrPersonaB}`),
    ).resolves.not.toBeNull();
    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0] as string,
    );
    expect(
      fldArrTables.every(
        fldStrTable =>
          fldStrTable === 'workspaces' ||
          fldStrTable === 'nodes' ||
          fldStrTable === 'demo_personas',
      ),
    ).toBe(true);
    for (const fldArrCall of fldObjFake.fldObjRpc.mock.calls) {
      expect(fldArrCall[0]).toBe('start_demo_session');
    }

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries libraries after a load failure', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: null,
          error: { message: 'demo db down' },
        }).then(fldObjResolve, fldObjReject),
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);
    const fldObjRetry = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjButton => fldObjButton.props.fldStrLabel === 'Retry');
    if (fldObjRetry === undefined) {
      throw new Error('Logosphere BITS: retry was not rendered.');
    }
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    await ReactTestRenderer.act(async () => {
      fldObjRetry.props.actHandOnPress();
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Demo Library');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows an empty state when no libraries exist', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('No libraries yet');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the shortcut with no type preselected', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    const fldObjInput = fldObjRenderer.root.findByType(vwTextInput);
    expect(fldObjInput.props.fldStrValue).toBe('');
    expect(fldObjInput.props.fldStrPlaceholder).toBe('Library name');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Branch');
    expect(fldArrLabels).toContain('Department');
    expect(fldArrLabels).toContain('Hall');
    expect(fldArrLabels).toContain('Save library');
    expect(
      fldArrLabels.some(fldStrLabel => fldStrLabel.includes('Selected')),
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('requires name and type before saving', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save library');
    });
    await fncRunFlush();

    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrError).toBe(
      'Enter a library name.',
    );
    expect(JSON.stringify(fldObjRenderer.toJSON())).toContain(
      'Choose a library type.',
    );
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('North Branch');
    });
    expect(
      fldObjRenderer.root.findByType(vwTextInput).props.fldStrError,
    ).toBeUndefined();
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Hall');
    });
    expect(JSON.stringify(fldObjRenderer.toJSON())).not.toContain(
      'Choose a library type.',
    );
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Hall — Selected');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('saves through the service, reloads, and clears the form', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: '33333333-3333-3333-3333-333333333333',
      error: null,
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('  North Branch  ');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Hall');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save library');
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('demo_create_library', {
      p_session_id: 'session-for-001',
      p_workspace_id: fldStrSeedWorkspace,
      p_name: 'North Branch',
    });
    const fldNumNodesCalls = fldObjFake.fldObjFrom.mock.calls.filter(
      fldArrCall => (fldArrCall[0] as string) === 'nodes',
    ).length;
    expect(fldNumNodesCalls).toBe(2);
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '',
    );
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Hall');
    expect(
      fldArrLabels.some(fldStrLabel => fldStrLabel.includes('Selected')),
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the form for retry when saving fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Demo Library',
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });
    const fldObjRenderer = await fncRunRenderHome(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('North Branch');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Branch');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save library');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children as string);
    expect(fldArrTexts).toContain('Could not save the library');
    expect(
      fldArrTexts.some(
        fldStrText =>
          typeof fldStrText === 'string' &&
          fldStrText.includes('demo session expired'),
      ),
    ).toBe(true);
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'North Branch',
    );
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Branch — Selected');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
