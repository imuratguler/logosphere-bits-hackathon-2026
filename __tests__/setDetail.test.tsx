/**
 * Logosphere BITS — set detail screen tests (maintained).
 *
 * Renders the real set detail screen with react-test-renderer:
 * the Supabase client and the set services are fake, so no
 * network is touched. Navigation ships untranspiled ESM and is
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

jest.mock('../src/services/srvDemoSets', () => ({
  srvApiGetDemoSetProducts: jest.fn(),
  srvApiGetDemoProductPhotoCounts: jest.fn(),
}));

jest.mock('../src/contexts/ctxDemoSession', () => ({
  useDemoSession: () => ({
    fldObjSession: { fldStrSessionId: 'session-1' },
  }),
}));

jest.mock('../src/services/srvDemoSales', () => ({
  srvApiApplySale: jest.fn(),
  srvApiPreviewSale: jest.fn(),
}));

jest.mock('../src/services/srvDemoExport', () => ({
  srvApiExportAndShare: jest.fn(),
}));

import { vwButton } from '../src/components/vwButton';
import { vwListRow } from '../src/components/vwListRow';
import { vwSaleModal } from '../src/components/vwSaleModal';
import { vwText } from '../src/components/vwText';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrSetDetail } from '../src/screens/scrSetDetail';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import { srvApiExportAndShare } from '../src/services/srvDemoExport';
import {
  srvApiApplySale,
  srvApiPreviewSale,
} from '../src/services/srvDemoSales';
import {
  srvApiGetDemoProductPhotoCounts,
  srvApiGetDemoSetProducts,
} from '../src/services/srvDemoSets';

const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';
const fldStrSeedOtherSet = '55555555-5555-5555-5555-555555555555';
const fldStrSeedSetName = 'Rare Folios';

function fncConvFakeClient(): SupabaseClient {
  const fldObjClient = {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  } as unknown as SupabaseClient;
  jest.mocked(srvApiGetDemoClient).mockReturnValue(fldObjClient);
  return fldObjClient;
}

async function fncRunRenderDetail() {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrSetDetail, {
        fldObjStrings: fldObjStringsEn,
        fldStrCollectionId: fldStrSeedCollection,
        fldStrSetId: fldStrSeedSet,
        fldStrSetName: fldStrSeedSetName,
      }),
    );
  });
  await ReactTestRenderer.act(async () => {});
  return fldObjRenderer as ReactTestRenderer.ReactTestRenderer;
}

describe('set detail screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fncConvFakeClient();
    jest.mocked(srvApiGetDemoSetProducts).mockResolvedValue([
      {
        fldStrId: 'a0000000-0000-4000-8000-000000000001',
        fldStrName: 'Member One',
        fldStrSetId: fldStrSeedSet,
      },
      {
        fldStrId: 'a0000000-0000-4000-8000-000000000002',
        fldStrName: 'Member Two',
        fldStrSetId: fldStrSeedSet,
      },
      {
        fldStrId: 'a0000000-0000-4000-8000-000000000003',
        fldStrName: 'Other Set Member',
        fldStrSetId: fldStrSeedOtherSet,
      },
      {
        fldStrId: 'a0000000-0000-4000-8000-000000000004',
        fldStrName: 'Loose Product',
        fldStrSetId: null,
      },
    ]);
    jest.mocked(srvApiGetDemoProductPhotoCounts).mockResolvedValue({
      'a0000000-0000-4000-8000-000000000001': 3,
      'a0000000-0000-4000-8000-000000000002': 1,
    });
  });

  it('titles the strip with the set name and no settings icon', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldObjTopBar = fldObjRenderer.root.findByType(vwTopBar);
    expect(fldObjTopBar.props.fldStrTitle).toBe(fldStrSeedSetName);
    expect(fldObjTopBar.props.fldStrActionLabel ?? null).toBeNull();
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('lists only this set members with their photo counts', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldArrRows = fldObjRenderer.root.findAllByType(vwListRow);
    expect(fldArrRows.map(fldObjRow => fldObjRow.props.fldStrTitle)).toEqual([
      'Member One',
      'Member Two',
    ]);
    expect(fldArrRows.map(fldObjRow => fldObjRow.props.fldStrSubtitle)).toEqual(
      ['Photos: 3', 'Photos: 1'],
    );
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('opens the result view when a member row is tapped', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldObjRow = fldObjRenderer.root.findAllByType(vwListRow)[0];
    ReactTestRenderer.act(() => {
      fldObjRow.props.actHandOnPress();
    });
    expect(mockFncNavigate).toHaveBeenCalledWith('AnalysisResult', {
      fldStrProductId: 'a0000000-0000-4000-8000-000000000001',
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('goes back when Back is pressed', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldObjTopBar = fldObjRenderer.root.findByType(vwTopBar);
    ReactTestRenderer.act(() => {
      fldObjTopBar.props.actHandOnBack();
    });
    expect(mockFncGoBack).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows an empty state when the set holds no products', async () => {
    jest.mocked(srvApiGetDemoSetProducts).mockResolvedValue([]);
    const fldObjRenderer = await fncRunRenderDetail();
    expect(fldObjRenderer.root.findAllByType(vwListRow)).toHaveLength(0);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('previews the set scope with the deduped total and skips', async () => {
    jest.mocked(srvApiPreviewSale).mockResolvedValue({
      fldNumCollections: 0,
      fldNumSets: 1,
      fldNumProducts: 2,
      fldNumMissing: 1,
      fldNumNonUsd: 0,
      fldNumTotalMinor: 9050,
      fldStrCurrency: 'USD',
    });
    const fldObjRenderer = await fncRunRenderDetail();
    const fldObjSale = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Sale');
    expect(fldObjSale).toBeDefined();

    await ReactTestRenderer.act(async () => {
      fldObjSale?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });

    expect(srvApiPreviewSale).toHaveBeenCalledWith(
      expect.anything(),
      'session-1',
      'set',
      fldStrSeedSet,
    );
    const fldObjModal = fldObjRenderer.root.findByType(vwSaleModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldBooTagInput).toBe(false);
    expect(fldObjModal.props.fldArrScopeLines).toEqual([
      'Activation tags every in-scope item at its recommended USD price.',
      'Sale scope: Rare Folios',
      '1 sets · 2 items',
      'Recommended total: 90.50 USD',
      '1 items have no USD recommendation and will be skipped',
    ]);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('activates the whole set with no manual tag', async () => {
    jest.mocked(srvApiPreviewSale).mockResolvedValue({
      fldNumCollections: 0,
      fldNumSets: 1,
      fldNumProducts: 2,
      fldNumMissing: 0,
      fldNumNonUsd: 0,
      fldNumTotalMinor: 9050,
      fldStrCurrency: 'USD',
    });
    jest.mocked(srvApiApplySale).mockResolvedValue({
      fldNumApplied: 2,
      fldNumSkipped: 0,
      fldNumTagMinor: null,
    });
    const fldObjRenderer = await fncRunRenderDetail();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Sale')
        ?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnActivate();
      await ReactTestRenderer.act(async () => {});
    });

    expect(srvApiApplySale).toHaveBeenCalledWith(
      expect.anything(),
      'session-1',
      'set',
      fldStrSeedSet,
      { fldNumTagMinor: null, fldBooActive: true },
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('Listings applied: 2, 0 skipped');
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('cancels the set sale without writing', async () => {
    jest.mocked(srvApiPreviewSale).mockResolvedValue({
      fldNumCollections: 0,
      fldNumSets: 1,
      fldNumProducts: 2,
      fldNumMissing: 0,
      fldNumNonUsd: 0,
      fldNumTotalMinor: 9050,
      fldStrCurrency: 'USD',
    });
    const fldObjRenderer = await fncRunRenderDetail();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Sale')
        ?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnCancel();
    });

    expect(srvApiApplySale).not.toHaveBeenCalled();
    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldBooVisible,
    ).toBe(false);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the set sale closed when the preview fails', async () => {
    jest.mocked(srvApiPreviewSale).mockRejectedValue(new Error('preview down'));
    const fldObjRenderer = await fncRunRenderDetail();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Sale')
        ?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });

    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldBooVisible,
    ).toBe(false);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('preview down');
    expect(srvApiApplySale).not.toHaveBeenCalled();
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('exports the set to the share sheet', async () => {
    jest.mocked(srvApiExportAndShare).mockResolvedValue('shared');
    const fldObjRenderer = await fncRunRenderDetail();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Export Excel')
        ?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });

    expect(srvApiExportAndShare).toHaveBeenCalledWith(
      expect.anything(),
      'set',
      fldStrSeedSet,
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('Export shared.');
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('reports an empty set export without failing', async () => {
    jest.mocked(srvApiExportAndShare).mockResolvedValue('empty');
    const fldObjRenderer = await fncRunRenderDetail();

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Export Excel')
        ?.props.actHandOnPress();
      await ReactTestRenderer.act(async () => {});
    });

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('Nothing to export.');
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('retries members after a load failure', async () => {
    jest
      .mocked(srvApiGetDemoSetProducts)
      .mockRejectedValueOnce(new Error('Load failed'));
    const fldObjRenderer = await fncRunRenderDetail();
    const fldObjButton = fldObjRenderer.root.findByType(
      jest.requireActual('../src/components/vwButton').vwButton as never,
    ) as ReactTestRenderer.ReactTestInstance;
    ReactTestRenderer.act(() => {
      (fldObjButton.props as { actHandOnPress: () => void }).actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {});
    expect(jest.mocked(srvApiGetDemoSetProducts)).toHaveBeenCalledTimes(2);
    expect(fldObjRenderer.root.findAllByType(vwListRow)).toHaveLength(2);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
