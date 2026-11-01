/**
 * Logosphere BITS — library settings screen tests (maintained).
 *
 * Renders the real settings screen with react-test-renderer: the demo
 * session comes from the real provider over in-memory AsyncStorage,
 * and the Supabase client is fake, so no network is touched.
 * Navigation ships untranspiled ESM and is stubbed like the other
 * suites. Seed rows are public, non-secret reference data shaped
 * like geo_nodes and library_details.
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
import { vwGeoField } from '../src/components/vwGeoField';
import { vwTopBar } from '../src/components/vwTopBar';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrLibrarySettings } from '../src/screens/scrLibrarySettings';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvStorSupabaseAuthStorage } from '../src/services/srvSupabase';

const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrSeedLibraryName = 'Demo Library';
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

type fldObjGeoServeData = {
  roots: unknown[];
  childrenByParent: Record<string, unknown[]>;
  detailsRow: unknown;
};

type fldObjGeoChain = {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    fldObjResolve: (fldObjValue: unknown) => void,
    fldObjReject: (fldObjReason?: unknown) => void,
  ) => Promise<unknown>;
};

function fncRunServeGeo(fldObjFrom: jest.Mock, fldObjData: fldObjGeoServeData) {
  fldObjFrom.mockImplementation((fldStrTable: string) => {
    const fldArrEqs: [string, unknown][] = [];
    const fldObjBuilder = {} as fldObjGeoChain;
    fldObjBuilder.select = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.eq = jest.fn((fldStrColumn: string, fldObjValue: unknown) => {
      fldArrEqs.push([fldStrColumn, fldObjValue]);
      return fldObjBuilder;
    });
    fldObjBuilder.is = jest.fn((fldStrColumn: string, fldObjValue: unknown) => {
      fldArrEqs.push([fldStrColumn, fldObjValue]);
      return fldObjBuilder;
    });
    fldObjBuilder.order = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.limit = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.maybeSingle = jest.fn(() =>
      Promise.resolve({ data: fldObjData.detailsRow, error: null }),
    );
    fldObjBuilder.then = (fldObjResolve, fldObjReject) => {
      if (fldStrTable !== 'geo_nodes') {
        return Promise.resolve({ data: [], error: null }).then(
          fldObjResolve,
          fldObjReject,
        );
      }
      const fldObjParentEq = fldArrEqs.find(
        ([fldStrColumn]) => fldStrColumn === 'parent_id',
      );
      const fldObjParentId =
        fldObjParentEq === undefined ? null : fldObjParentEq[1];
      const fldArrRows =
        typeof fldObjParentId === 'string'
          ? fldObjData.childrenByParent[fldObjParentId] ?? []
          : fldObjData.roots;
      return Promise.resolve({ data: fldArrRows, error: null }).then(
        fldObjResolve,
        fldObjReject,
      );
    };
    return fldObjBuilder;
  });
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

async function fncRunRenderSettings(
  fldObjClient: SupabaseClient,
  fldStrLibraryId: string = fldStrSeedLibrary,
  fldStrLibraryName: string = fldStrSeedLibraryName,
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(VwDemoSessionProvider, {
        fldObjClient,
        children: React.createElement(scrLibrarySettings, {
          fldObjStrings: fldObjStringsEn,
          fldStrLibraryId,
          fldStrLibraryName,
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
        fldObjNode.props.fldStrVariant === 'caption' &&
        fldObjNode.props.children === fldStrCaption,
    );
  if (fldObjCaption === undefined || fldObjCaption.parent === null) {
    throw new Error(
      `Logosphere BITS: caption '${fldStrCaption}' was not rendered.`,
    );
  }
  return fldObjCaption.parent.findByType(vwTextInput);
}

function fncRunGeoField(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
) {
  const fldObjField = fldObjRenderer.root
    .findAllByType(vwGeoField)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
  if (fldObjField === undefined) {
    throw new Error(
      `Logosphere BITS: geo field '${fldStrLabel}' was not rendered.`,
    );
  }
  return fldObjField;
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

function fncConvCountryRow(fldObjOverrides: Record<string, unknown> = {}) {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    code: 'TR',
    name: 'Türkiye',
    level: 'country',
    parent_id: null,
    postal_code: null,
    ...fldObjOverrides,
  };
}

function fncConvDetailsRow() {
  return {
    code: 'L-001',
    library_type: 'Branch',
    founded_date: '2026-10-31',
    country_code: 'TR',
    country_text: 'Türkiye',
    state_code: 'TR-34',
    state_text: 'Istanbul',
    city_code: null,
    city_text: 'Kadikoy',
    district_code: null,
    district_text: null,
    town_code: null,
    town_text: null,
    neighborhood_code: null,
    neighborhood_text: null,
    street_code: null,
    street_text: null,
    extra_description: null,
    postal_code: null,
    building: null,
    floor: null,
    apartment: null,
    website: 'https://example.org',
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('library settings screen', () => {
  it('loads then renders a blank form with the library name', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    let fldObjResolveDetails: ((fldObjValue: unknown) => void) | undefined;
    const fldObjDetailsPromise = new Promise(fldObjResolve => {
      fldObjResolveDetails = fldObjResolve;
    });
    fldObjFake.fldObjFrom.mockImplementation((fldStrTable: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => fldObjDetailsPromise),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve(
          fldStrTable === 'geo_nodes'
            ? { data: [fncConvCountryRow()], error: null }
            : { data: [], error: null },
        ).then(fldObjResolve, fldObjReject),
    }));
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(VwDemoSessionProvider, {
          fldObjClient: fldObjFake.fldObjClient,
          children: React.createElement(scrLibrarySettings, {
            fldObjStrings: fldObjStringsEn,
            fldStrLibraryId: fldStrSeedLibrary,
            fldStrLibraryName: fldStrSeedLibraryName,
          }),
        }),
      );
    });
    if (fldObjRenderer === undefined || fldObjResolveDetails === undefined) {
      throw new Error('Logosphere BITS: settings screen was not rendered.');
    }

    const fldArrLoading = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrLoading).toContain('Loading settings…');

    await ReactTestRenderer.act(async () => {
      fldObjResolveDetails?.({ data: null, error: null });
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrValue,
    ).toBe('');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe('Demo Library');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Postal code').props.fldStrValue,
    ).toBe('');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Branch');
    expect(
      fldArrLabels.some(fldStrLabel => fldStrLabel.includes('Selected')),
    ).toBe(false);
    expect(fncRunGeoField(fldObjRenderer, 'Country').props.fldStrText).toBe('');
    expect(
      fncRunGeoField(fldObjRenderer, 'Country').props.fldArrOptions,
    ).toHaveLength(1);
    const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
    expect(fldObjBar.props.fldStrTitle).toBe('Library settings');
    expect(fldObjBar.props.fldStrBackLabel).toBe('Back');
    await ReactTestRenderer.act(async () => {
      (fldObjBar.props.actHandOnBack as () => void)();
    });
    expect(mockFncGoBack).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer?.unmount();
    });
  });

  it('prefills every field from the saved details row', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [fncConvCountryRow()],
      childrenByParent: {},
      detailsRow: fncConvDetailsRow(),
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrValue,
    ).toBe('L-001');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe('Demo Library');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Founded date').props.fldStrValue,
    ).toBe('2026-10-31');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Website').props.fldStrValue,
    ).toBe('https://example.org');
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel as string);
    expect(fldArrLabels).toContain('Branch — Selected');
    expect(fncRunGeoField(fldObjRenderer, 'Country').props.fldStrText).toBe(
      'Türkiye',
    );
    expect(fncRunGeoField(fldObjRenderer, 'City').props.fldStrText).toBe(
      'Kadikoy',
    );
    expect(fncRunGeoField(fldObjRenderer, 'Town').props.fldStrText).toBe('');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Postal code').props.fldStrValue,
    ).toBe('');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('requires code and name before saving', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [],
      childrenByParent: {},
      detailsRow: null,
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Name').props.actHandOnChange('');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrError,
    ).toBe('Enter the library code.');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrError,
    ).toBe('Enter the library name.');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows success only after the server confirms the save', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [
        fncConvCountryRow({ postal_code: '34000' }),
        fncConvCountryRow({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          code: 'DE',
          name: 'Germany',
        }),
      ],
      childrenByParent: {},
      detailsRow: null,
    });
    let fldObjResolveRpc: ((fldObjValue: unknown) => void) | undefined;
    fldObjFake.fldObjRpc.mockImplementation(
      () =>
        new Promise(fldObjResolve => {
          fldObjResolveRpc = fldObjResolve;
        }),
    );
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Code').props.actHandOnChange(
        '  L-001 ',
      );
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Hall');
    });
    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Country').props.actHandOnSelect({
        fldStrId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fldStrCode: 'TR',
        fldStrName: 'Türkiye',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: '34000',
      });
    });
    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Town').props.actHandOnText('BeldeX');
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });

    const fldArrBefore = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrBefore).not.toContain('Settings saved.');

    await ReactTestRenderer.act(async () => {
      fldObjResolveRpc?.({ data: fldStrSeedLibrary, error: null });
    });
    await fncRunFlush();

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_save_library_details',
      expect.objectContaining({
        p_session_id: 'session-for-001',
        p_node_id: fldStrSeedLibrary,
        p_name: 'Demo Library',
        p_code: 'L-001',
        p_library_type: 'Hall',
        p_country_code: 'TR',
        p_country_text: 'Türkiye',
        p_town_code: null,
        p_town_text: 'BeldeX',
        p_postal_code: '34000',
      }),
    );
    const fldArrAfter = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrAfter).toContain('Settings saved.');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrValue,
    ).toBe('  L-001 ');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps every input when saving fails', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [fncConvCountryRow()],
      childrenByParent: {},
      detailsRow: null,
    });
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Code').props.actHandOnChange(
        'L-001',
      );
    });
    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Country').props.actHandOnSelect({
        fldStrId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fldStrCode: 'TR',
        fldStrName: 'Türkiye',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: null,
      });
    });
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Save settings');
    });
    await fncRunFlush();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children as string);
    expect(fldArrTexts).toContain('Could not save settings');
    expect(
      fldArrTexts.some(
        fldStrText =>
          typeof fldStrText === 'string' &&
          fldStrText.includes('demo session expired'),
      ),
    ).toBe(true);
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrValue,
    ).toBe('L-001');
    expect(fncRunGeoField(fldObjRenderer, 'Country').props.fldStrText).toBe(
      'Türkiye',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('cascades the geo hierarchy and clears descendants', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [fncConvCountryRow()],
      childrenByParent: {
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': [
          {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            code: 'TR-34',
            name: 'Istanbul',
            level: 'state',
            parent_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            postal_code: null,
          },
        ],
      },
      detailsRow: null,
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Country').props.actHandOnSelect({
        fldStrId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fldStrCode: 'TR',
        fldStrName: 'Türkiye',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: null,
      });
    });
    await fncRunFlush();

    expect(
      fncRunGeoField(fldObjRenderer, 'State').props.fldArrOptions.map(
        (fldObjNode: { fldStrName: string }) => fldObjNode.fldStrName,
      ),
    ).toEqual(['Istanbul']);

    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'State').props.actHandOnText('Izm');
    });
    expect(
      fncRunGeoField(fldObjRenderer, 'State').props.fldArrOptions,
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Country').props.actHandOnText('De');
    });
    expect(fncRunGeoField(fldObjRenderer, 'State').props.fldStrText).toBe('');
    expect(
      fncRunGeoField(fldObjRenderer, 'State').props.fldArrOptions,
    ).toHaveLength(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps a typed postal code over the reference value', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [fncConvCountryRow({ postal_code: '34000' })],
      childrenByParent: {},
      detailsRow: null,
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(
        fldObjRenderer,
        'Postal code',
      ).props.actHandOnChange('12000');
    });
    await ReactTestRenderer.act(async () => {
      fncRunGeoField(fldObjRenderer, 'Country').props.actHandOnSelect({
        fldStrId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fldStrCode: 'TR',
        fldStrName: 'Türkiye',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: '34000',
      });
    });

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Postal code').props.fldStrValue,
    ).toBe('12000');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('reloads when the library changes', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    fncRunServeGeo(fldObjFake.fldObjFrom, {
      roots: [],
      childrenByParent: {},
      detailsRow: null,
    });
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    await ReactTestRenderer.act(async () => {
      fncRunInputForCaption(fldObjRenderer, 'Code').props.actHandOnChange(
        'L-001',
      );
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.update(
        React.createElement(VwDemoSessionProvider, {
          fldObjClient: fldObjFake.fldObjClient,
          children: React.createElement(scrLibrarySettings, {
            fldObjStrings: fldObjStringsEn,
            fldStrLibraryId: '44444444-4444-4444-4444-444444444444',
            fldStrLibraryName: 'Second Library',
          }),
        }),
      );
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Code').props.fldStrValue,
    ).toBe('');
    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe('Second Library');
    const fldNumDetailsCalls = fldObjFake.fldObjFrom.mock.calls.filter(
      fldArrCall => (fldArrCall[0] as string) === 'library_details',
    ).length;
    expect(fldNumDetailsCalls).toBe(2);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries the details load after a failure', async () => {
    await fncRunPreSeedPersona(fldStrPersonaA);
    const fldObjFake = fncConvFakeClient();
    let fldBooFailDetails = true;
    fldObjFake.fldObjFrom.mockImplementation((fldStrTable: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() =>
        fldBooFailDetails
          ? Promise.resolve({
              data: null,
              error: { message: 'demo db down' },
            })
          : Promise.resolve({ data: null, error: null }),
      ),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve(
          fldStrTable === 'geo_nodes'
            ? { data: [], error: null }
            : { data: [], error: null },
        ).then(fldObjResolve, fldObjReject),
    }));
    const fldObjRenderer = await fncRunRenderSettings(fldObjFake.fldObjClient);

    const fldArrError = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrError).toContain('Could not load settings');
    expect(fldObjRenderer.root.findAllByType(vwTextInput)).toHaveLength(0);

    fldBooFailDetails = false;
    await ReactTestRenderer.act(async () => {
      fncRunPressButton(fldObjRenderer, 'Retry');
    });
    await fncRunFlush();

    expect(
      fncRunInputForCaption(fldObjRenderer, 'Name').props.fldStrValue,
    ).toBe('Demo Library');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
