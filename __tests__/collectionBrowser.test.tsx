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
import { vwCheckBox } from '../src/components/vwCheckBox';
import { vwDeleteConfirmModal } from '../src/components/vwDeleteConfirmModal';
import { vwMergeCollectionsModal } from '../src/components/vwMergeCollectionsModal';
import { vwMoveDestinationModal } from '../src/components/vwMoveDestinationModal';
import { vwSetBatchModal } from '../src/components/vwSetBatchModal';
import { vwSetNameModal } from '../src/components/vwSetNameModal';
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
  const fldObjStorageRemove = jest.fn(
    async (
      fldArrNames: string[],
    ): Promise<{
      data: { name: string }[] | null;
      error: { message: string } | null;
    }> => ({
      data: fldArrNames.map(fldStrName => ({ name: fldStrName })),
      error: null,
    }),
  );
  const fldObjStorageList = jest.fn(async () => ({ data: [], error: null }));
  const fldObjStorageFrom = jest.fn(() => ({
    remove: fldObjStorageRemove,
    list: fldObjStorageList,
  }));
  const fldObjClient = {
    rpc: fldObjRpc,
    from: fldObjFrom,
    auth: {},
    storage: { from: fldObjStorageFrom },
  } as unknown as SupabaseClient;
  jest.mocked(srvApiGetDemoClient).mockReturnValue(fldObjClient);
  return {
    fldObjClient,
    fldObjRpc,
    fldObjFrom,
    fldObjStorageRemove,
    fldObjStorageList,
  };
}

function fncRunServeTables(
  fldObjFrom: jest.Mock,
  fldObjTables: Record<string, unknown>,
) {
  fldObjFrom.mockImplementation((fldStrTable: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
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
    in: jest.fn().mockReturnThis(),
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

function fncRunLongPressRow(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrName: string,
) {
  const fldObjRowText = fldObjRenderer.root
    .findAllByType(vwText)
    .find(fldObjNode => fldObjNode.props.children === fldStrName);
  if (fldObjRowText === undefined) {
    throw new Error('Logosphere BITS: selectable row was not rendered.');
  }
  let fldObjRowPressable = fldObjRowText.parent;
  while (
    fldObjRowPressable !== null &&
    typeof fldObjRowPressable.props.onLongPress !== 'function'
  ) {
    fldObjRowPressable = fldObjRowPressable.parent;
  }
  if (fldObjRowPressable === null) {
    throw new Error('Logosphere BITS: row has no long-press handler.');
  }
  const fldObjRowOnLongPress = fldObjRowPressable.props
    .onLongPress as unknown as () => void;
  return fldObjRowOnLongPress;
}

async function fncRunLongPressGesture(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrName: string,
) {
  await ReactTestRenderer.act(async () => {
    fncRunLongPressRow(fldObjRenderer, fldStrName)();
  });
  await ReactTestRenderer.act(async () => {
    fncRunPressRow(fldObjRenderer, fldStrName)();
  });
}

function fncRunRowHandler(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrName: string,
) {
  const fldObjRowText = fldObjRenderer.root
    .findAllByType(vwText)
    .find(fldObjNode => fldObjNode.props.children === fldStrName);
  if (fldObjRowText === undefined) {
    throw new Error('Logosphere BITS: row was not rendered.');
  }
  let fldObjRowPressable = fldObjRowText.parent;
  while (
    fldObjRowPressable !== null &&
    typeof fldObjRowPressable.props.onPress !== 'function' &&
    typeof fldObjRowPressable.props.onLongPress !== 'function'
  ) {
    fldObjRowPressable = fldObjRowPressable.parent;
  }
  return fldObjRowPressable;
}

function fncRunCheckedBoxes(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
) {
  return fldObjRenderer.root
    .findAllByType(vwCheckBox)
    .map(fldObjNode => fldObjNode.props.fldBooChecked);
}

function fncRunButtonDisabled(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
) {
  const fldObjButton = fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
  if (fldObjButton === undefined) {
    throw new Error(
      `Logosphere BITS: button '${fldStrLabel}' was not rendered.`,
    );
  }
  return fldObjButton.props.fldBooDisabled === true;
}

function fncRunSetNameInput(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
) {
  const fldObjInput = fldObjRenderer.root
    .findAllByType(vwTextInput)
    .find(fldObjNode => fldObjNode.props.fldStrPlaceholder === 'Set name');
  if (fldObjInput === undefined) {
    throw new Error('Logosphere BITS: set name input was not rendered.');
  }
  return fldObjInput;
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

  it('opens the same camera with one mode from a leaf collection', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Single Item');
    expect(fldArrLabels).toContain('Bulk Items');
    expect(fncRunButtonDisabled(fldObjRenderer, 'Single Item')).toBe(false);
    expect(fncRunButtonDisabled(fldObjRenderer, 'Bulk Items')).toBe(false);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Single Item');
    });
    expect(mockFncNavigate).toHaveBeenCalledWith('CameraCapture', {
      fldStrMode: 'single',
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Bulk Items');
    });
    expect(mockFncNavigate).toHaveBeenCalledWith('CameraCapture', {
      fldStrMode: 'bulk',
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('hides capture entries in a branch collection', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [{ id: 'child-1', name: 'Child' }],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).not.toContain('Single Item');
    expect(fldArrLabels).not.toContain('Bulk Items');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('hides capture entries at the library root', async () => {
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

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).not.toContain('Single Item');
    expect(fldArrLabels).not.toContain('Bulk Items');

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

  it('shows collection settings below the root level', async () => {
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
    expect(fldArrLabels).toContain('Collection settings');
    expect(fldArrLabels).not.toContain('Library settings');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens collection settings for the current parent', async () => {
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

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Collection settings');
    });

    expect(mockFncNavigate).toHaveBeenCalledWith('CollectionSettings', {
      fldStrCollectionId: fldStrSeedCollection,
      fldStrCollectionName: fldStrSeedCollectionName,
    });

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

  it('shows sets with member counts and products at a collection level', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'Incunabula' },
      ],
      sets: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'First Editions' },
      ],
      products: [
        {
          id: '55555555-5555-5555-5555-555555555501',
          name: 'The Demo Codex',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
        {
          id: '55555555-5555-5555-5555-555555555502',
          name: 'Atlas of Examples',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
        {
          id: '55555555-5555-5555-5555-555555555503',
          name: 'Loose Leaf Poems',
          set_id: null,
        },
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
    expect(fldArrTexts).toContain('Sets');
    expect(fldArrTexts).toContain('First Editions');
    expect(fldArrTexts).toContain('Members: 2');
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('Atlas of Examples');
    expect(fldArrTexts).not.toContain('Loose Leaf Poems');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows no sets section at the library root', async () => {
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
    expect(fldArrTexts).not.toContain('Sets');
    expect(fldArrTexts).not.toContain('No sets yet');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).not.toContain('New set');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows an empty sets note when the collection has no sets', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Sets');
    expect(fldArrTexts).toContain('No sets yet');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('New set');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('creates a set with the visible collection link', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldObjParentRow = {
      kind: 'collection',
      workspace_id: fldStrSeedWorkspace,
    };
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [],
        sets: [],
        products: [],
      },
      fldObjParentRow,
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: '77777777-7777-7777-7777-777777777777',
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'New set');
    });
    expect(
      fldObjRenderer.root.findByType(vwSetNameModal).props.fldBooVisible,
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      fncRunSetNameInput(fldObjRenderer).props.actHandOnChange('Signed Copies');
    });
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [],
        sets: [
          {
            id: '77777777-7777-7777-7777-777777777777',
            name: 'Signed Copies',
          },
        ],
        products: [],
      },
      fldObjParentRow,
    );
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save set');
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_create_set',
      expect.objectContaining({
        p_collection_id: fldStrSeedCollection,
        p_name: 'Signed Copies',
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwSetNameModal).props.fldBooVisible,
    ).toBe(false);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Signed Copies');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('rejects a blank set name', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'New set');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save set');
    });

    expect(fncRunSetNameInput(fldObjRenderer).props.fldStrError).toBe(
      'Enter a set name.',
    );
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the modal input when set saving fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [],
        sets: [],
        products: [],
      },
      { kind: 'collection', workspace_id: fldStrSeedWorkspace },
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'New set');
    });
    await ReactTestRenderer.act(async () => {
      fncRunSetNameInput(fldObjRenderer).props.actHandOnChange('Signed Copies');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save set');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not save the set');
    expect(
      fldObjRenderer.root.findByType(vwSetNameModal).props.fldBooVisible,
    ).toBe(true);
    expect(fncRunSetNameInput(fldObjRenderer).props.fldStrValue).toBe(
      'Signed Copies',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens collection selection on long-press with type actions', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        { id: fldStrSeedCollection, name: fldStrSeedCollectionName },
        { id: '44444444-4444-4444-4444-444444444444', name: 'Incunabula' },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels[0]).toBe('Select All');
    expect(fldArrLabels).toContain('Cancel');
    expect(fldArrLabels).toContain('Move');
    expect(fldArrLabels).toContain('Delete');
    expect(fldArrLabels).not.toContain('Merge');
    expect(fncRunButtonDisabled(fldObjRenderer, 'Cancel')).toBe(false);
    expect(fncRunButtonDisabled(fldObjRenderer, 'Move')).toBe(false);
    expect(fncRunButtonDisabled(fldObjRenderer, 'Delete')).toBe(false);
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, false]);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).not.toContain('New collection');
    expect(mockFncPush).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('toggles rows and Select All in collection selection', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        { id: fldStrSeedCollection, name: fldStrSeedCollectionName },
        { id: '44444444-4444-4444-4444-444444444444', name: 'Incunabula' },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, fldStrSeedCollectionName)();
    });
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([false, false]);
    let fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Cancel');
    expect(fldArrLabels).not.toContain('Move');
    expect(fldArrLabels).not.toContain('Delete');

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Select All');
    });
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, true]);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Select All');
    });
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([false, false]);
    expect(mockFncPush).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('restores navigation after Cancel', async () => {
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

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Cancel');
    });

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).not.toContain('Select All');
    expect(fldArrLabels).not.toContain('Cancel');
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('New collection');

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, fldStrSeedCollectionName)();
    });
    expect(mockFncPush).toHaveBeenCalledWith(
      'CollectionBrowser',
      expect.objectContaining({ fldStrParentId: fldStrSeedCollection }),
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('exits selection with Back instead of navigating', async () => {
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

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Back');
    });

    expect(mockFncGoBack).not.toHaveBeenCalled();
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Back');
    });
    expect(mockFncGoBack).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows Merge and Extract for selected sets', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'First Editions' },
        { id: '55555555-5555-5555-5555-555555555555', name: 'Signed Copies' },
      ],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');

    let fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Move');
    expect(fldArrLabels).toContain('Delete');
    expect(fldArrLabels).toContain('Extract');
    expect(fldArrLabels).not.toContain('Merge');
    expect(fldArrLabels).not.toContain('New set');
    expect(fncRunButtonDisabled(fldObjRenderer, 'Extract')).toBe(false);
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, false]);

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Signed Copies')();
    });
    fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Merge');
    expect(fncRunButtonDisabled(fldObjRenderer, 'Merge')).toBe(false);

    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'First Editions')();
    });
    fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).not.toContain('Merge');
    expect(fldArrLabels).toContain('Extract');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens product selection over member products only', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'First Editions' },
      ],
      products: [
        {
          id: '55555555-5555-5555-5555-555555555501',
          name: 'The Demo Codex',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
        {
          id: '55555555-5555-5555-5555-555555555502',
          name: 'Atlas of Examples',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
        {
          id: '55555555-5555-5555-5555-555555555503',
          name: 'Loose Leaf Poems',
          set_id: null,
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'The Demo Codex');

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Select All');
    expect(fldArrLabels).toContain('Move');
    expect(fldArrLabels).toContain('Delete');
    expect(fldArrLabels).toContain('Extract');
    expect(fldArrLabels).not.toContain('Merge');
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, false]);

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Select All');
    });
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, true]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('ignores other row types while selecting', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        { id: '66666666-6666-6666-6666-666666666666', name: 'Incunabula' },
      ],
      sets: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'First Editions' },
      ],
      products: [
        {
          id: '55555555-5555-5555-5555-555555555501',
          name: 'The Demo Codex',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'Incunabula');

    expect(fncRunRowHandler(fldObjRenderer, 'First Editions')).toBeNull();
    expect(fncRunRowHandler(fldObjRenderer, 'The Demo Codex')).toBeNull();
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true]);
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Select All');
    expect(fldArrLabels).not.toContain('Merge');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens the move picker on the current location first', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedCollection,
        },
      ],
      sets: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(
      fldObjModal.props.fldArrRows.map(
        (fldObjRow: {
          fldStrName: string;
          fldBooSelected: boolean;
          fldBooInvalid: boolean;
          fldBooIsCurrent: boolean;
        }) => [
          fldObjRow.fldStrName,
          fldObjRow.fldBooSelected,
          fldObjRow.fldBooInvalid,
          fldObjRow.fldBooIsCurrent,
        ],
      ),
    ).toEqual([
      [fldStrSeedLibraryName, true, false, true],
      [fldStrSeedCollectionName, false, true, false],
      ['Incunabula', false, true, false],
    ]);
    expect(fldObjModal.props.fldBooMoveDisabled).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('moves a collection to a valid target and reloads', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrLibrary2 = '88888888-8888-8888-8888-888888888888';
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [
          {
            id: fldStrSeedLibrary,
            name: fldStrSeedLibraryName,
            kind: 'library',
            parent_id: null,
          },
          {
            id: fldStrLibrary2,
            name: 'Annex Library',
            kind: 'library',
            parent_id: null,
          },
          {
            id: fldStrSeedCollection,
            name: fldStrSeedCollectionName,
            kind: 'collection',
            parent_id: fldStrSeedLibrary,
          },
        ],
        sets: [],
      },
      {
        id: fldStrSeedCollection,
        version: 2,
        kind: 'collection',
        workspace_id: fldStrSeedWorkspace,
      },
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: { id: fldStrSeedCollection, version: 3 },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnSelectTarget(fldStrLibrary2);
    });
    expect(
      fldObjRenderer.root.findByType(vwMoveDestinationModal).props
        .fldBooMoveDisabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnConfirmMove();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_move_collection',
      expect.objectContaining({
        p_collection_id: fldStrSeedCollection,
        p_expected_version: 2,
        p_target_parent_id: fldStrLibrary2,
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwMoveDestinationModal).props
        .fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the picker open when the move fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrLibrary2 = '88888888-8888-8888-8888-888888888888';
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
        nodes: [
          {
            id: fldStrSeedLibrary,
            name: fldStrSeedLibraryName,
            kind: 'library',
            parent_id: null,
          },
          {
            id: fldStrLibrary2,
            name: 'Annex Library',
            kind: 'library',
            parent_id: null,
          },
          {
            id: fldStrSeedCollection,
            name: fldStrSeedCollectionName,
            kind: 'collection',
            parent_id: fldStrSeedLibrary,
          },
        ],
        sets: [],
      },
      {
        id: fldStrSeedCollection,
        version: 2,
        kind: 'collection',
        workspace_id: fldStrSeedWorkspace,
      },
    );
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo version conflict' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnSelectTarget(fldStrLibrary2);
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnConfirmMove();
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrMoveError).toContain(
      'demo_move_collection failed',
    );
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([
      false,
      false,
      true,
      false,
      true,
    ]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('creates a set under the chosen collection and selects it', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    const fldStrNewSet = '55555555-5555-5555-5555-555555555555';
    const fldObjTables = {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
      ],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
        },
      ],
      products: [],
    };
    fncRunServeTablesAndParent(fldObjFake.fldObjFrom, fldObjTables, {
      kind: 'collection',
      workspace_id: fldStrSeedWorkspace,
    });
    fldObjFake.fldObjRpc.mockResolvedValue({ data: fldStrNewSet, error: null });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();
    fncRunServeTablesAndParent(
      fldObjFake.fldObjFrom,
      {
        ...fldObjTables,
        sets: [
          ...fldObjTables.sets,
          {
            id: fldStrNewSet,
            name: 'Signed Copies',
            collection_id: fldStrSeedCollection,
          },
        ],
      },
      { kind: 'collection', workspace_id: fldStrSeedWorkspace },
    );
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnDraftChange('Signed Copies');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMoveDestinationModal)
        .props.actHandOnCreateSet();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_create_set',
      expect.objectContaining({
        p_collection_id: fldStrSeedCollection,
        p_name: 'Signed Copies',
      }),
    );
    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    expect(fldObjModal.props.fldStrDraftName).toBe('');
    const fldObjSelected = fldObjModal.props.fldArrRows.find(
      (fldObjRow: { fldBooSelected: boolean }) => fldObjRow.fldBooSelected,
    );
    expect(fldObjSelected?.fldStrId).toBe(fldStrNewSet);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('offers only collections as set destinations', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
      ],
      sets: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
        },
      ],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    expect(
      fldObjModal.props.fldArrRows.map(
        (fldObjRow: {
          fldStrName: string;
          fldBooSelected: boolean;
          fldBooInvalid: boolean;
          fldBooIsCurrent: boolean;
        }) => [
          fldObjRow.fldStrName,
          fldObjRow.fldBooSelected,
          fldObjRow.fldBooInvalid,
          fldObjRow.fldBooIsCurrent,
        ],
      ),
    ).toEqual([
      [fldStrSeedLibraryName, false, true, false],
      [fldStrSeedCollectionName, true, false, true],
      ['First Editions', false, true, false],
    ]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('limits product set targets to the home collection', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrOther = '77777777-7777-7777-7777-777777777777';
    const fldStrHomeSet = '44444444-4444-4444-4444-444444444444';
    const fldStrAwaySet = '55555555-5555-5555-5555-555555555555';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
        {
          id: fldStrOther,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
      ],
      sets: [
        {
          id: fldStrHomeSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
        },
        { id: fldStrAwaySet, name: 'Away Set', collection_id: fldStrOther },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666601',
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrHomeSet,
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'The Demo Codex');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    const fldObjByName: Record<string, { fldBooInvalid: boolean }> = {};
    for (const fldObjRow of fldObjModal.props.fldArrRows) {
      fldObjByName[fldObjRow.fldStrName] = fldObjRow;
    }
    expect(fldObjByName[fldStrSeedLibraryName]?.fldBooInvalid).toBe(true);
    expect(fldObjByName[fldStrSeedCollectionName]?.fldBooInvalid).toBe(false);
    expect(fldObjByName.Incunabula?.fldBooInvalid).toBe(false);
    expect(fldObjByName['First Editions']?.fldBooInvalid).toBe(false);
    expect(fldObjByName['Away Set']?.fldBooInvalid).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('disables confirm for an unchanged product set assignment', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrHomeSet = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
      ],
      sets: [
        {
          id: fldStrHomeSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
        },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666601',
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrHomeSet,
        },
      ],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'The Demo Codex');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Move');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMoveDestinationModal);
    const fldObjSelected = fldObjModal.props.fldArrRows.find(
      (fldObjRow: { fldBooSelected: boolean }) => fldObjRow.fldBooSelected,
    );
    expect(fldObjSelected?.fldStrId).toBe(fldStrHomeSet);
    expect(fldObjModal.props.fldBooMoveDisabled).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens the merge picker listing collections with the source count', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSourceB = '44444444-4444-4444-4444-444444444444';
    const fldStrChild = '66666666-6666-6666-6666-666666666666';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrSourceB,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 1,
        },
        {
          id: fldStrChild,
          name: 'Child Fragments',
          kind: 'collection',
          parent_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      sets: [
        {
          id: '77777777-7777-7777-7777-777777777777',
          name: 'Loose Set',
          collection_id: fldStrSourceB,
        },
      ],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Incunabula')();
    });
    expect(fncRunButtonDisabled(fldObjRenderer, 'Merge')).toBe(false);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMergeCollectionsModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldNumSources).toBe(2);
    expect(
      fldObjModal.props.fldArrRows.map(
        (fldObjRow: { fldStrName: string; fldBooInvalid: boolean }) => [
          fldObjRow.fldStrName,
          fldObjRow.fldBooInvalid,
        ],
      ),
    ).toEqual([
      [fldStrSeedCollectionName, false],
      ['Child Fragments', true],
      ['Incunabula', true],
    ]);
    expect(fldObjModal.props.fldBooMergeDisabled).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('merges collections into a surviving source and reloads', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSourceB = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrSourceB,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 1,
        },
      ],
      sets: [],
      products: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        target: { id: fldStrSourceB, version: 2 },
        moved: { collections: 0, sets: 0, products: 0 },
        deleted: [fldStrSeedCollection],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Incunabula')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnSelectTarget(fldStrSourceB);
    });
    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooMergeDisabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnConfirmMerge();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_collections',
      expect.objectContaining({
        p_source_ids: [fldStrSeedCollection, fldStrSourceB],
        p_target_collection_id: fldStrSourceB,
        p_new_name: null,
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('merges collections into a newly named collection', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSourceB = '44444444-4444-4444-4444-444444444444';
    const fldStrTarget = '77777777-7777-7777-7777-777777777777';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrSourceB,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 1,
        },
      ],
      sets: [],
      products: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        target: { id: fldStrTarget, version: 1 },
        moved: { collections: 0, sets: 0, products: 0 },
        deleted: [fldStrSeedCollection, fldStrSourceB],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Incunabula')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnDraftChange('Combined');
    });
    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooMergeDisabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnConfirmMerge();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_collections',
      expect.objectContaining({
        p_target_collection_id: null,
        p_new_name: 'Combined',
        p_new_parent_id: fldStrSeedLibrary,
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the selection when the merge is cancelled', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSourceB = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrSourceB,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 1,
        },
      ],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Incunabula')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();
    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooVisible,
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnCancel();
    });

    expect(
      fldObjRenderer.root.findByType(vwMergeCollectionsModal).props
        .fldBooVisible,
    ).toBe(false);
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true, true]);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the merge picker open when the merge fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSourceB = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrSourceB,
          name: 'Incunabula',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 1,
        },
      ],
      sets: [],
      products: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo merge target is not empty' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Incunabula')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnSelectTarget(fldStrSourceB);
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwMergeCollectionsModal)
        .props.actHandOnConfirmMerge();
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwMergeCollectionsModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrMergeError).toContain(
      'demo_merge_collections failed',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('merges selected sets into a newly named set', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSetA = '44444444-4444-4444-4444-444444444444';
    const fldStrSetB = '55555555-5555-5555-5555-555555555555';
    const fldStrNewSet = '77777777-7777-7777-7777-777777777777';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSetA,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 2,
        },
        {
          id: fldStrSetB,
          name: 'Signed Copies',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666661',
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetA,
          version: 1,
        },
        {
          id: '66666666-6666-6666-6666-666666666662',
          name: 'Atlas of Examples',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetA,
          version: 1,
        },
        {
          id: '66666666-6666-6666-6666-666666666663',
          name: 'Loose Leaf Poems',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetB,
          version: 1,
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        set: { id: fldStrNewSet, version: 1 },
        moved: { products: 3 },
        deleted: [fldStrSetA, fldStrSetB],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Signed Copies')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrTitle).toBe('Merge into new set');
    expect(fldObjModal.props.fldStrSummary).toBe('2 sets · 3 products');
    expect(fldObjModal.props.fldBooNameVisible).toBe(true);
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(true);
    await ReactTestRenderer.act(async () => {
      fldObjModal.props.actHandOnDraftChange('Combined');
    });
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props
        .fldBooConfirmDisabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_to_new_set',
      expect.objectContaining({
        p_set_ids: [fldStrSetA, fldStrSetB],
        p_product_ids: [],
        p_new_name: 'Combined',
        p_collection_id: fldStrSeedCollection,
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('merges selected products across their sets', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSetA = '44444444-4444-4444-4444-444444444444';
    const fldStrSetB = '55555555-5555-5555-5555-555555555555';
    const fldStrProductA = '66666666-6666-6666-6666-666666666661';
    const fldStrProductB = '66666666-6666-6666-6666-666666666663';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSetA,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 2,
        },
        {
          id: fldStrSetB,
          name: 'Signed Copies',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: fldStrProductA,
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetA,
          version: 1,
        },
        {
          id: fldStrProductB,
          name: 'Loose Leaf Poems',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetB,
          version: 1,
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        set: { id: '77777777-7777-7777-7777-777777777777', version: 1 },
        moved: { products: 2 },
        deleted: [],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'The Demo Codex');
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Loose Leaf Poems')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrSummary).toBe('2 sets · 2 products');
    await ReactTestRenderer.act(async () => {
      fldObjModal.props.actHandOnDraftChange('Combined');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_to_new_set',
      expect.objectContaining({
        p_set_ids: [],
        p_product_ids: [fldStrProductA, fldStrProductB],
        p_new_name: 'Combined',
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('extracts a set back to loose products', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSetA = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSetA,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 2,
        },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666661',
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSetA,
          version: 1,
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: { freed: { products: 1 }, deleted: [fldStrSetA] },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Extract');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrTitle).toBe('Extract members');
    expect(fldObjModal.props.fldStrSummary).toBe('1 sets · 1 products');
    expect(fldObjModal.props.fldBooNameVisible).toBe(false);
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_extract_from_sets',
      expect.objectContaining({
        p_set_ids: [fldStrSetA],
        p_product_ids: [],
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the selection when the set batch is cancelled', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSetA = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSetA,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 2,
        },
      ],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Extract');
    });
    await fncRunFlush();
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnCancel();
    });

    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(false);
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true]);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the set batch open when the batch fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSetA = '44444444-4444-4444-4444-444444444444';
    const fldStrSetB = '55555555-5555-5555-5555-555555555555';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSetA,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 2,
        },
        {
          id: fldStrSetB,
          name: 'Signed Copies',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo merge crosses collections' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Signed Copies')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Merge');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwSetBatchModal)
        .props.actHandOnDraftChange('Combined');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnConfirm();
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrError).toContain(
      'demo_merge_to_new_set failed',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('converts leaf products into new sets from a branch', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrBranch = '33333333-3333-3333-3333-333333333333';
    const fldStrLeaf = '88888888-8888-8888-8888-888888888888';
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    const fldStrNewSet = '77777777-7777-7777-7777-777777777777';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrBranch,
          name: 'Manuscripts',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
        {
          id: fldStrLeaf,
          name: 'Fragments',
          kind: 'collection',
          parent_id: fldStrBranch,
        },
      ],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrLeaf,
          version: 2,
        },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666661',
          name: 'The Demo Codex',
          collection_id: fldStrLeaf,
          set_id: fldStrSet,
          version: 1,
        },
        {
          id: '66666666-6666-6666-6666-666666666662',
          name: 'Loose Leaf Poems',
          collection_id: fldStrLeaf,
          set_id: null,
          version: 1,
        },
      ],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        sets: [{ id: fldStrNewSet, collection_id: fldStrLeaf, version: 1 }],
        moved: { products: 2 },
        deleted: [fldStrSet],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrBranch,
      'Manuscripts',
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Convert all to set');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrTitle).toBe('Convert all to set');
    expect(fldObjModal.props.fldStrSummary).toBe(
      '1 leaf collections · 2 products',
    );
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(true);
    await ReactTestRenderer.act(async () => {
      fldObjModal.props.actHandOnDraftChange('Gathered');
    });
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props
        .fldBooConfirmDisabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSetBatchModal).props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_convert_leaf_products_to_sets',
      expect.objectContaining({
        p_branch_collection_id: fldStrBranch,
        p_new_name: 'Gathered',
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props.fldBooVisible,
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('locks convert when the leaf scope holds no products', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrBranch = '33333333-3333-3333-3333-333333333333';
    const fldStrLeaf = '88888888-8888-8888-8888-888888888888';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedLibrary,
          name: fldStrSeedLibraryName,
          kind: 'library',
          parent_id: null,
        },
        {
          id: fldStrBranch,
          name: 'Manuscripts',
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
        },
        {
          id: fldStrLeaf,
          name: 'Fragments',
          kind: 'collection',
          parent_id: fldStrBranch,
        },
      ],
      sets: [],
      products: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrBranch,
      'Manuscripts',
    );

    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Convert all to set');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwSetBatchModal);
    expect(fldObjModal.props.fldStrSummary).toBe(
      '1 leaf collections · 0 products',
    );
    await ReactTestRenderer.act(async () => {
      fldObjModal.props.actHandOnDraftChange('Gathered');
    });
    expect(
      fldObjRenderer.root.findByType(vwSetBatchModal).props
        .fldBooConfirmDisabled,
    ).toBe(true);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('deletes a childless collection with its contents', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    const fldStrProduct = '66666666-6666-6666-6666-666666666661';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
      ],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: fldStrProduct,
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 3,
        },
      ],
      product_images: [{ id: 'img-1' }],
      product_voice_notes: [{ id: 'voice-1' }],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        deleted: {
          collections: 1,
          sets: 1,
          products: 1,
          photos: 1,
          voices: 1,
        },
        files: [
          {
            bucket: 'product-photos',
            name: `p/${fldStrProduct}/img.jpg`,
          },
        ],
        prefixes: [],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrSummary).toBe(
      '1 collections · 1 sets · 1 products · 1 photos · 1 voice notes',
    );
    expect(fldObjModal.props.fldStrBlockedReason).toBeNull();
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_delete_collections',
      {
        p_session_id: expect.any(String),
        p_collection_ids: [fldStrSeedCollection],
        p_expected_versions: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSet, version: 1 },
          { id: fldStrProduct, version: 3 },
        ],
      },
    );
    expect(fldObjFake.fldObjStorageRemove).toHaveBeenCalledWith([
      `p/${fldStrProduct}/img.jpg`,
    ]);
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('blocks deleting a collection with sub-collections', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrChild = '88888888-8888-8888-8888-888888888888';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [
        {
          id: fldStrSeedCollection,
          name: fldStrSeedCollectionName,
          kind: 'collection',
          parent_id: fldStrSeedLibrary,
          version: 2,
        },
        {
          id: fldStrChild,
          name: 'Fragments',
          kind: 'collection',
          parent_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      sets: [],
      products: [],
      product_images: [],
      product_voice_notes: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
      fldStrSeedLibraryName,
    );

    await fncRunLongPressGesture(fldObjRenderer, fldStrSeedCollectionName);
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrBlockedReason).toBe(
      'Collections with sub-collections cannot be deleted.',
    );
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(true);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('deletes a set stating its affected content', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: '66666666-6666-6666-6666-666666666661',
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 3,
        },
        {
          id: '66666666-6666-6666-6666-666666666662',
          name: 'Atlas of Examples',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 1,
        },
      ],
      product_images: [{ id: 'img-1' }],
      product_voice_notes: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        deleted: {
          collections: 0,
          sets: 1,
          products: 2,
          photos: 1,
          voices: 0,
        },
        files: [],
        prefixes: [],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldStrSummary).toBe(
      '1 sets · 2 products · 1 photos · 0 voice notes',
    );
    expect(fldObjModal.props.fldBooConfirmDisabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_delete_sets',
      expect.objectContaining({ p_set_ids: [fldStrSet] }),
    );
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('deletes selected products', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    const fldStrProductA = '66666666-6666-6666-6666-666666666661';
    const fldStrProductB = '66666666-6666-6666-6666-666666666662';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: fldStrProductA,
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 3,
        },
        {
          id: fldStrProductB,
          name: 'Atlas of Examples',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 1,
        },
      ],
      product_images: [],
      product_voice_notes: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        deleted: {
          collections: 0,
          sets: 0,
          products: 2,
          photos: 0,
          voices: 0,
        },
        files: [],
        prefixes: [],
      },
      error: null,
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'The Demo Codex');
    await ReactTestRenderer.act(async () => {
      fncRunPressRow(fldObjRenderer, 'Atlas of Examples')();
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldStrSummary).toBe(
      '2 products · 0 photos · 0 voice notes',
    );
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_delete_products',
      expect.objectContaining({
        p_product_ids: [fldStrProductA, fldStrProductB],
      }),
    );
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('changes nothing when the delete is cancelled', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [],
      product_images: [],
      product_voice_notes: [],
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnCancel();
    });

    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);
    expect(fncRunCheckedBoxes(fldObjRenderer)).toEqual([true]);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the delete open when the delete fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [],
      product_images: [],
      product_voice_notes: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo version conflict: set changed' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrError).toContain('demo_delete_sets failed');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries pending files after a byte failure', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    const fldStrSet = '44444444-4444-4444-4444-444444444444';
    const fldStrProduct = '66666666-6666-6666-6666-666666666661';
    const fldStrName = `p/${fldStrProduct}/img.jpg`;
    fncRunServeTables(fldObjFake.fldObjFrom, {
      workspaces: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      nodes: [],
      sets: [
        {
          id: fldStrSet,
          name: 'First Editions',
          collection_id: fldStrSeedCollection,
          version: 1,
        },
      ],
      products: [
        {
          id: fldStrProduct,
          name: 'The Demo Codex',
          collection_id: fldStrSeedCollection,
          set_id: fldStrSet,
          version: 3,
        },
      ],
      product_images: [{ id: 'img-1' }],
      product_voice_notes: [],
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: {
        deleted: {
          collections: 0,
          sets: 1,
          products: 1,
          photos: 1,
          voices: 0,
        },
        files: [{ bucket: 'product-photos', name: fldStrName }],
        prefixes: [],
      },
      error: null,
    });
    fldObjFake.fldObjStorageRemove.mockResolvedValueOnce({
      data: null,
      error: { message: 'denied' },
    });
    const fldObjRenderer = await fncRunRenderBrowser(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
      fldStrSeedCollectionName,
    );

    await fncRunLongPressGesture(fldObjRenderer, 'First Editions');
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Delete');
    });
    await fncRunFlush();
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrError).toContain('Press Delete to retry');
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjStorageRemove).toHaveBeenLastCalledWith([
      fldStrName,
    ]);
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
