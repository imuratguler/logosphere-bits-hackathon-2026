/**
 * Logosphere BITS — shared library list tests (maintained).
 *
 * Renders the real library list screen with react-test-renderer:
 * AsyncStorage is an in-memory mock and the Supabase client is
 * fake, so no network is touched. Navigation ships untranspiled
 * ESM and is stubbed like the other suites. Seed rows are public,
 * non-secret.
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
const mockFncGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockFncNavigate, goBack: mockFncGoBack }),
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
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrLibraryList } from '../src/screens/scrLibraryList';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
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

async function fncRunRenderList(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrLibraryList, {
          fldObjStrings: fldObjStringsEn,
          fldStrPersonaName: 'Public Library',
        }),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

describe('shared library list', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows the persona-titled list with shared libraries', async () => {
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
    expect(fldObjBar.props.fldStrTitle).toBe('Public Library');
    expect(fldObjBar.props.fldStrBackLabel).toBe('Back');
    expect(fldObjBar.props.actHandOnAction ?? null).toBeNull();
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Demo Library');
    const fldObjFooter = fldObjRenderer.root.findByType(vwDemoFooter);
    expect(fldObjFooter.props.fldStrText).toBe('Demo Version © 2026');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels).toContain('+ Add Library');
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(0);
    expect(fldArrLabels).not.toContain('Create library');
    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON()).toLowerCase();
    expect(fldStrTree).not.toContain('membership');
    expect(fldStrTree).not.toContain('permission');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('goes back to the account home from the strip', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
    });
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(mockFncGoBack).toHaveBeenCalledTimes(1);

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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('No libraries yet');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens the collection browser when a library row is tapped', async () => {
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    const fldObjRowText = fldObjRenderer.root
      .findAllByType(vwText)
      .find(fldObjNode => fldObjNode.props.children === 'Demo Library');
    if (fldObjRowText === undefined) {
      throw new Error('Logosphere BITS: library row was not rendered.');
    }
    let fldObjRowPressable = fldObjRowText.parent;
    while (
      fldObjRowPressable !== null &&
      typeof fldObjRowPressable.props.onPress !== 'function'
    ) {
      fldObjRowPressable = fldObjRowPressable.parent;
    }
    if (fldObjRowPressable === null) {
      throw new Error('Logosphere BITS: library row has no press handler.');
    }
    const fldObjRowOnPress = fldObjRowPressable.props
      .onPress as unknown as () => void;
    await ReactTestRenderer.act(async () => {
      fldObjRowOnPress();
    });

    expect(mockFncNavigate).toHaveBeenCalledWith('CollectionBrowser', {
      fldStrLibraryId: '22222222-2222-2222-2222-222222222222',
      fldStrLibraryName: 'Demo Library',
      fldStrParentId: '22222222-2222-2222-2222-222222222222',
      fldStrTitle: 'Demo Library',
    });

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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, '+ Add Library');
    });
    const fldObjInput = fldObjRenderer.root.findByType(vwTextInput);
    expect(fldObjInput.props.fldStrValue).toBe('');
    expect(fldObjInput.props.fldStrPlaceholder).toBe('Library name');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Branch');
    expect(fldArrLabels).toContain('Department');
    expect(fldArrLabels).toContain('Hall');
    expect(fldArrLabels).toContain('Create library');
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, '+ Add Library');
    });
    const fncRunFindCreate = () =>
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(
          fldObjButton => fldObjButton.props.fldStrLabel === 'Create library',
        );
    expect(fncRunFindCreate()?.props.fldBooDisabled).toBe(true);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Create library');
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
    expect(fncRunFindCreate()?.props.fldBooDisabled).toBe(false);
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, '+ Add Library');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('  North Branch  ');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Hall');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Create library');
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
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(0);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, '+ Add Library');
    });
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
    const fldObjRenderer = await fncRunRenderList(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, '+ Add Library');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('North Branch');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Branch');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Create library');
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
