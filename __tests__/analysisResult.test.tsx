/**
 * Logosphere BITS — analysis result screen tests (maintained).
 *
 * Renders the real result screen with react-test-renderer: the
 * detail service is mocked, so no network is touched, and the
 * screen takes plain props plus a mocked navigator.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

const mockFncNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockFncNavigate }),
}));

const fldObjStableClient = {};

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => fldObjStableClient),
}));

jest.mock('../src/services/srvDemoProductDetails', () => ({
  srvApiGetDemoProductDetails: jest.fn(),
}));

import { Image } from 'react-native';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAnalysisResult } from '../src/screens/scrAnalysisResult';
import { srvApiGetDemoProductDetails } from '../src/services/srvDemoProductDetails';
import type { fldObjProductDetails } from '../src/types/typModels';

const fldStrSeedProduct = '55555555-5555-5555-5555-555555555501';

function fncConvSeedDetails(): fldObjProductDetails {
  return {
    fldObjProduct: {
      fldStrId: fldStrSeedProduct,
      fldStrName: 'The Demo Codex',
      fldDatCreatedAt: '2026-10-28T00:00:00Z',
      fldDatUpdatedAt: '2026-10-28T00:00:00Z',
      fldStrCollectionId: '33333333-3333-3333-3333-333333333333',
      fldStrSetId: null,
      fldObjBibliographicData: {
        fldStrTitle: 'The Demo Codex',
        fldStrSubtitle: null,
        fldStrIsbn10: null,
        fldStrIsbn13: null,
        fldStrPublisher: 'Logosphere Press',
        fldStrPublicationLanguage: 'en',
        fldStrEdition: null,
        fldStrPrinting: null,
        fldNumPublicationYear: 2026,
        fldArrContributors: null,
        fldNumOriginalPublicationYear: null,
        fldNumPageCount: null,
        fldStrPublicationType: null,
        fldObjDescription: null,
        fldStrBinding: null,
        fldStrDustJacket: null,
        fldStrPaper: null,
        fldStrDimensions: null,
        fldStrCondition: null,
        fldStrSignature: null,
        fldStrDedication: null,
      },
      fldObjPricing: null,
      fldObjSaleStatus: {
        fldNumTagPrice: 1200,
        fldBooIsActive: true,
        fldStrTransactionScope: 'item',
        fldDatTransactionAt: null,
        fldStrTransactionId: 'sale-1',
      },
    },
    fldArrImages: [
      {
        fldStrId: 'img-cover',
        fldNumSortOrder: 0,
        fldStrFilePath: 'product-photos/p/cover.jpg',
        fldStrUrl: 'https://cdn.test/p/cover.jpg',
        fldNumRotationDegrees: 0,
      },
    ],
    fldArrObservations: [],
  };
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
}

async function fncRunRenderResult(fldHandOnClose: () => void = () => {}) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAnalysisResult, {
        fldObjStrings: fldObjStringsEn,
        fldStrProductId: fldStrSeedProduct,
        actHandOnClose: fldHandOnClose,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: result screen was not rendered.');
  }
  await fncRunFlush();
  return fldObjRenderer;
}

function fncRunTexts(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
): string[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => String(fldObjNode.props.children));
}

function fncRunButtonByLabel(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
  fldStrLabel: string,
) {
  return fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
}

describe('analysis result screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the saved product with photos, sale row, and price button', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderResult();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('Logosphere Press');
    expect(fldArrTexts).toContain('Listed for sale');
    expect(fldArrTexts).toContain('Tag price: 12.00 USD');
    const fldArrImages = fldObjRenderer.root.findAllByType(Image);
    expect(fldArrImages).toHaveLength(1);
    expect(fldArrImages[0]?.props.source).toEqual({
      uri: 'https://cdn.test/p/cover.jpg',
    });
    expect(fncRunButtonByLabel(fldObjRenderer, 'Market price')).toBeDefined();
  });

  it('opens the market price screen for the product', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderResult();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Market price',
      )?.props.actHandOnPress();
    });

    expect(mockFncNavigate).toHaveBeenCalledWith('MarketPrice', {
      fldStrProductId: fldStrSeedProduct,
    });
  });

  it('shows the no-photos note without saved images', async () => {
    const fldObjDetails = fncConvSeedDetails();
    fldObjDetails.fldArrImages = [];
    jest.mocked(srvApiGetDemoProductDetails).mockResolvedValue(fldObjDetails);
    const fldObjRenderer = await fncRunRenderResult();

    expect(fncRunTexts(fldObjRenderer)).toContain('No saved photos yet');
    expect(fldObjRenderer.root.findAllByType(Image)).toHaveLength(0);
  });

  it('retries after a load failure', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderResult();

    expect(fncRunTexts(fldObjRenderer)).toContain('Could not load the product');

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(fldObjRenderer, 'Retry')?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(fncRunTexts(fldObjRenderer)).toContain('The Demo Codex');
    expect(srvApiGetDemoProductDetails).toHaveBeenCalledTimes(2);
  });

  it('closes on Back', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRenderResult(fldHandOnClose);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Back')?.props.actHandOnPress();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });
});
