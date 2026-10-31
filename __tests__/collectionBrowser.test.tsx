/**
 * Logosphere BITS — collection browser screen tests (maintained).
 *
 * Renders the real browser screen with react-test-renderer:
 * AsyncStorage is an in-memory mock and the Supabase client is fake,
 * so no network is touched. Navigation ships untranspiled ESM and is
 * stubbed like the other suites. Seed rows are public, non-secret.
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

const mockFncNavigate = jest.fn();
const mockFncPush = jest.fn();
const mockFncGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockFncNavigate,
    push: mockFncPush,
    goBack: mockFncGoBack,
  }),
}));

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

import { VwDemoSessionProvider } from '../src/contexts/ctxDemoSession';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrCollectionBrowser } from '../src/screens/scrCollectionBrowser';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrSeedLibraryName = 'Demo Library';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedCollectionName = 'Manuscripts';
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

function fncRunServeTablesAndParent(
  fldObjFrom: jest.Mock,
  fldObjTables: Record<string, unknown>,
  fldObjParentRow: unknown,
) {
  fldObjFrom.mockImplementation((fldStrTable: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(() =>
      Promise.resolve({ data: fldObjParentRow, error: null }),
    ),
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
      fldStrDisplayName: 'Public Library',
      fldNumSortOrder: 0,
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

async function fncRunRenderBrowser(
  fldObjClient: SupabaseClient,
  fldStrParentId: string,
  fldStrTitle: string,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrCollectionBrowser, {
          fldObjStrings: fldObjStringsEn,
          fldStrLibraryId: fldStrSeedLibrary,
          fldStrLibraryName: fldStrSeedLibraryName,
          fldStrParentId,
          fldStrTitle,
        }),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunPressRow(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrName: string,
) {
  const fldObjRowText = fldObjRenderer.root
    .findAllByType(vwText)
    .find(fldObjNode => fldObjNode.props.children === fldStrName);
  if (fldObjRowText === undefined) {
    throw new Error('Logosphere BITS: collection row was not rendered.');
  }
  let fldObjRowPressable = fldObjRowText.parent;
  while (
    fldObjRowPressable !== null &&
    typeof fldObjRowPressable.props.onPress !== 'function'
  ) {
    fldObjRowPressable = fldObjRowPressable.parent;
  }
  if (fldObjRowPressable === null) {
    throw new Error('Logosphere BITS: collection row has no press handler.');
  }
  const fldObjRowOnPress = fldObjRowPressable.props
    .onPress as unknown as () => void;
  return fldObjRowOnPress;
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

describe('collection browser screen', () => {
  beforeEach(() => {
    mockFncNavigate.mockClear();
    mockFncPush.mockClear();
    mockFncGoBack.mockClear();
  });

  it('shows the parent title with its collections at the library root', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain(fldStrSeedLibraryName);
    expect(fldArrTexts).toContain('Collections');
    expect(fldArrTexts).toContain(fldStrSeedCollectionName);
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Back');
    expect(fldArrLabels).toContain('Library settings');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('pushes a sub-collection level when a row is tapped', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    const fldObjRowOnPress = fncRunPressRow(
      fldObjRenderer,
      fldStrSeedCollectionName,
    );
    await ReactTestRenderer.act(async () => {
      fldObjRowOnPress();
    });

    expect(mockFncPush).toHaveBeenCalledWith('CollectionBrowser', {
      fldStrLibraryId: fldStrSeedLibrary,
      fldStrLibraryName: fldStrSeedLibraryName,
      fldStrParentId: fldStrSeedCollection,
      fldStrTitle: fldStrSeedCollectionName,
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('hides library settings below the root level', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'Incunabula' },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain(fldStrSeedCollectionName);
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Back');
    expect(fldArrLabels).not.toContain('Library settings');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens library settings from the root level', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Library settings');
    });

    expect(mockFncNavigate).toHaveBeenCalledWith('LibrarySettings', {
      fldStrLibraryId: fldStrSeedLibrary,
      fldStrLibraryName: fldStrSeedLibraryName,
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('goes back when Back is pressed', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Back');
    });

    expect(mockFncGoBack).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows an empty state when no collections exist', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('No collections yet');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries collections after a load failure', async () => {
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
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Retry');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain(fldStrSeedCollectionName);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the shortcut with no name entered', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('New collection');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Save collection');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('requires a name before saving', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save collection');
    });

    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrError).toBe(
      'Enter a collection name.',
    );
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('saves through the service, reloads, and clears the form', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldObjParentRow = {
      kind: 'library',
      workspace_id: fldStrSeedWorkspace,
    };
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
      },
      fldObjParentRow,
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: '66666666-6666-6666-6666-666666666666',
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('Incunabula');
    });
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [
          { id: fldStrSeedCollection, name: fldStrSeedCollectionName },
          { id: '66666666-6666-6666-6666-666666666666', name: 'Incunabula' },
        ],
      },
      fldObjParentRow,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save collection');
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_create_collection',
      expect.objectContaining({
        p_workspace_id: fldStrSeedWorkspace,
        p_parent_id: fldStrSeedLibrary,
        p_name: 'Incunabula',
      }),
    );
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '',
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Incunabula');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the form for retry when saving fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [{ id: fldStrSeedCollection, name: fldStrSeedCollectionName }],
      },
      { kind: 'library', workspace_id: fldStrSeedWorkspace },
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('Incunabula');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save collection');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not save the collection');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'Incunabula',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
