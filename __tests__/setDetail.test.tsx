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
  srvApiGetDemoProductCovers: jest.fn(),
}));

import { vwListRow } from '../src/components/vwListRow';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrSetDetail } from '../src/screens/scrSetDetail';
import { srvApiGetDemoClient } from '../src/services/srvDemoClient';
import {
  srvApiGetDemoProductCovers,
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
    jest.mocked(srvApiGetDemoProductCovers).mockResolvedValue({
      'a0000000-0000-4000-8000-000000000001':
        'https://demo.test/p/one/cover.jpg',
    });
  });

  it('numbers the indented member rows', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldArrRows = fldObjRenderer.root
      .findAllByType(vwListRow)
      .map(fldObjNode => [
        fldObjNode.props.fldStrTitle,
        fldObjNode.props.fldStrNumber,
        fldObjNode.props.fldBooIndented,
      ]);
    expect(fldArrRows).toEqual([
      ['Member One', '1.', true],
      ['Member Two', '2.', true],
    ]);
    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
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

  it('lists only this set members with single-line cover rows', async () => {
    const fldObjRenderer = await fncRunRenderDetail();
    const fldArrRows = fldObjRenderer.root.findAllByType(vwListRow);
    expect(fldArrRows.map(fldObjRow => fldObjRow.props.fldStrTitle)).toEqual([
      'Member One',
      'Member Two',
    ]);
    expect(
      fldArrRows.map(fldObjRow => fldObjRow.props.fldStrSubtitle ?? null),
    ).toEqual([null, null]);
    expect(
      fldArrRows.map(fldObjRow => fldObjRow.props.fldStrThumbnailUri ?? null),
    ).toEqual(['https://demo.test/p/one/cover.jpg', null]);
    expect(
      fldArrRows.every(
        fldObjRow =>
          fldObjRow.props.fldBooSlim === true &&
          fldObjRow.props.fldBooTight === true,
      ),
    ).toBe(true);
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
