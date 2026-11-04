/**
 * Logosphere BITS — collection settings screen tests (maintained).
 *
 * Renders the real settings screen with react-test-renderer: the demo
 * session comes from the real provider over in-memory AsyncStorage,
 * and the Supabase client is fake, so no network is touched.
 * Navigation ships untranspiled ESM and is stubbed like the other
 * suites. Seed rows are public, non-secret data shaped like
 * collection_details.
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

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

// Navigation ships untranspiled ESM; jest (CJS, committed config
// untouched) stubs the hook. The stub only records goBack — like the
// other suites — so the back tests prove the wiring, not internals.
const mockFncGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockFncGoBack,
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VwDemoSessionProvider } from '../src/contexts/ctxDemoSession';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { vwTopBar } from '../src/components/vwTopBar';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrCollectionSettings } from '../src/screens/scrCollectionSettings';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedCollectionName = 'Rare Books';
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

function fncRunServeDetails(fldObjFrom: jest.Mock, fldObjRow: unknown) {
  fldObjFrom.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(() =>
      Promise.resolve({ data: fldObjRow, error: null }),
    ),
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

async function fncRunRenderSettings(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrCollectionSettings, {
          fldObjStrings: fldObjStringsEn,
          fldStrCollectionId: fldStrSeedCollection,
          fldStrCollectionName: fldStrSeedCollectionName,
        }),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: settings screen was not rendered.');
  }
  await fncRunFlush();
  return fldObjRenderer;
}

function fncRunInputForCaption(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrCaption: string,
) {
  const fldObjCaption = fldObjRenderer.root
    .findAllByType(vwText)
    .find(
      fldObjNode =>
        fldObjNode.props.fldStrVariant === 'label' &&
        fldObjNode.props.children === fldStrCaption,
    );
  if (fldObjCaption === undefined || fldObjCaption.parent === null) {
    throw new Error(
      `Logosphere BITS: label '${fldStrCaption}' was not rendered.`,
    );
  }
  return fldObjCaption.parent.findByType(vwTextInput);
}

function fncRunPressButton(
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
  fldObjButton.props.actHandOnPress();
}

function fncConvDetailsRow() {
  return {
    formed_date: '2026-10-31',
    hall_room: 'Hall A',
    cabinet_face: 'North',
    block: 'B',
    shelf_row: '3',
    shelf: '5',
    website: 'https://example.org',
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('collection settings screen', () => {
  it('loads then prefills the form from the saved details', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    let fldObjResolveDetails: ((fldObjValue: unknown) => void) | undefined;
    const fldObjDetailsPromise = new Promise(fldObjResolve => {
      fldObjResolveDetails = fldObjResolve;
    });
    fldObjFake.fldObjFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => fldObjDetailsPromise),
    }));
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(VwDemoSessionProvider, {
          fldObjClient: fldObjFake.fldObjClient,
          children: React.createElement(scrCollectionSettings, {
            fldObjStrings: fldObjStringsEn,
            fldStrCollectionId: fldStrSeedCollection,
            fldStrCollectionName: fldStrSeedCollectionName,
          }),
        }),
      );
    });
    if (fldObjRenderer === undefined || fldObjResolveDetails === undefined) {
      throw new Error('Logosphere BITS: settings screen was not rendered.');
    }

    const fldArrLoadingTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrLoadingTexts).toContain('Loading settings…');

    await ReactTestRenderer.act(async () => {
      fldObjResolveDetails?.({ data: fncConvDetailsRow(), error: null });
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe(fldStrSeedCollectionName);
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Formed date').props.fldStrValue,
    ).toBe('2026-10-31');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Hall/room').props.fldStrValue,
    ).toBe('Hall A');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Cabinet face').props.fldStrValue,
    ).toBe('North');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Block').props.fldStrValue,
    ).toBe('B');
    expect(fncRunInputForCaption(fldObjRenderer, 'Row').props.fldStrValue).toBe(
      '3',
    );
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Shelf').props.fldStrValue,
    ).toBe('5');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Website').props.fldStrValue,
    ).toBe('https://example.org');
    const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
    expect(fldObjBar.props.fldStrTitle).toBe('Collection settings');
    expect(fldObjBar.props.fldStrBackLabel).toBe('Back');
    await ReactTestRenderer.act(async () => {
      (fldObjBar.props.actHandOnBack as () => void)();
    });
    expect(mockFncGoBack).toHaveBeenCalledTimes(1);

    const fldObjReadyRenderer = fldObjRenderer;
    ReactTestRenderer.act(() => {
      fldObjReadyRenderer.unmount();
    });
  });

  it('renders a blank form with the collection name when no row exists', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeDetails(fldObjFake.fldObjFrom, null);
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe(fldStrSeedCollectionName);
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Formed date').props.fldStrValue,
    ).toBe('');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Website').props.fldStrValue,
    ).toBe('');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('requires a name before saving', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeDetails(fldObjFake.fldObjFrom, null);
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Name').props.actHandOnChange('  ');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrError,
    ).toBe('Enter the collection name.');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('rejects a malformed date before saving', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeDetails(fldObjFake.fldObjFrom, null);
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(
        fldObjRenderer,
        'Formed date',
      ).props.actHandOnChange('31.10.2026');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Formed date').props.fldStrError,
    ).toBe('Enter a real YYYY-MM-DD date.');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('saves through the service and shows success after confirm', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeDetails(fldObjFake.fldObjFrom, null);
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fldStrSeedCollection,
      error: null,
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Row').props.actHandOnChange('3');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_save_collection_details',
      expect.objectContaining({
        p_node_id: fldStrSeedCollection,
        p_name: fldStrSeedCollectionName,
        p_shelf_row: '3',
      }),
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Settings saved.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps every input when saving fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeDetails(fldObjFake.fldObjFrom, null);
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Hall/room').props.actHandOnChange(
        'Hall A',
      );
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not save settings');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Hall/room').props.fldStrValue,
    ).toBe('Hall A');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe(fldStrSeedCollectionName);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries details after a load failure', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fldObjFake.fldObjFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() =>
        Promise.resolve({
          data: null,
          error: { message: 'demo db down' },
        }),
      ),
    }));
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    const fldArrErrorTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrErrorTexts).toContain('Could not load settings');

    fncRunServeDetails(fldObjFake.fldObjFrom, fncConvDetailsRow());
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Retry');
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Formed date').props.fldStrValue,
    ).toBe('2026-10-31');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
