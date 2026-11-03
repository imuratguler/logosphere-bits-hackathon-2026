/**
 * Logosphere BITS — market price screen tests (maintained).
 *
 * Renders the real price screen with react-test-renderer: the
 * detail service is mocked, so no network is touched, and the
 * screen takes plain props (no navigation object).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

jest.mock('../src/contexts/ctxDemoSession', () => ({
  useDemoSession: () => ({
    fldObjSession: { fldStrSessionId: 'session-1' },
  }),
}));

const fldObjStableClient = {};

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => fldObjStableClient),
}));

jest.mock('../src/services/srvDemoProductDetails', () => ({
  srvApiGetDemoProductDetails: jest.fn(),
}));

jest.mock('../src/services/srvAnalysis', () => ({
  srvApiResearchProductPrices: jest.fn(),
}));

import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrMarketPrice } from '../src/screens/scrMarketPrice';
import { srvApiResearchProductPrices } from '../src/services/srvAnalysis';
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
      fldObjPricing: {
        fldNumReplacementNew: 1999,
        fldNumMarketMin: 500,
        fldNumMarketMax: 1500,
        fldNumMarketRecommended: 900,
        fldNumMarketMedian: 800,
        fldStrCurrency: 'USD',
        fldNumSourcePrice: null,
        fldStrSourceCurrency: null,
        fldDatRateDate: null,
        fldStrPriceBasis: 'evidence',
      },
      fldObjSaleStatus: null,
    },
    fldArrImages: [],
    fldArrObservations: [
      {
        fldStrId: 'obs-1',
        fldNumAmount: 750,
        fldStrCurrency: 'USD',
        fldDatObservedAt: null,
        fldStrUrl: 'https://shop.test/listing-1',
        fldNumSourcePrice: null,
        fldStrSourceCurrency: null,
        fldDatRateDate: null,
      },
    ],
  };
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
}

async function fncRunRenderPrice(fldHandOnClose: () => void = () => {}) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrMarketPrice, {
        fldObjStrings: fldObjStringsEn,
        fldStrProductId: fldStrSeedProduct,
        actHandOnClose: fldHandOnClose,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: price screen was not rendered.');
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

describe('market price screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders estimate stats with the basis and observations', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderPrice();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('19.99 USD');
    expect(fldArrTexts).toContain('5.00 USD');
    expect(fldArrTexts).toContain('Basis: Evidence');
    expect(fldArrTexts).toContain('Observations (1)');
    expect(fldArrTexts).toContain('7.50 USD');
    expect(fldArrTexts).toContain('https://shop.test/listing-1');
  });

  it('labels knowledge estimates as AI estimates', async () => {
    const fldObjDetails = fncConvSeedDetails();
    if (fldObjDetails.fldObjProduct.fldObjPricing !== null) {
      fldObjDetails.fldObjProduct.fldObjPricing.fldStrPriceBasis =
        'ai-estimate';
    }
    jest.mocked(srvApiGetDemoProductDetails).mockResolvedValue(fldObjDetails);
    const fldObjRenderer = await fncRunRenderPrice();

    expect(fncRunTexts(fldObjRenderer)).toContain('Basis: AI estimate');
  });

  it('researches prices and reloads the estimates', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest.mocked(srvApiResearchProductPrices).mockResolvedValue(undefined);
    const fldObjRenderer = await fncRunRenderPrice();

    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Research prices')?.props
        .fldBooDisabled,
    ).toBe(false);

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Research prices',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(srvApiResearchProductPrices).toHaveBeenCalledWith(
      fldObjStableClient,
      'session-1',
      fldStrSeedProduct,
    );
    expect(srvApiGetDemoProductDetails).toHaveBeenCalledTimes(2);
    expect(fncRunTexts(fldObjRenderer)).toContain('The Demo Codex');
  });

  it('keeps the estimates on screen when research fails', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest
      .mocked(srvApiResearchProductPrices)
      .mockRejectedValue(new Error('service down'));
    const fldObjRenderer = await fncRunRenderPrice();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Research prices',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Could not research prices');
    expect(fldArrTexts).toContain('service down');
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(srvApiGetDemoProductDetails).toHaveBeenCalledTimes(1);
  });

  it('shows honest empty notes without saved prices', async () => {
    const fldObjDetails = fncConvSeedDetails();
    fldObjDetails.fldObjProduct.fldObjPricing = null;
    fldObjDetails.fldArrObservations = [];
    jest.mocked(srvApiGetDemoProductDetails).mockResolvedValue(fldObjDetails);
    const fldObjRenderer = await fncRunRenderPrice();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('No estimate yet');
    expect(fldArrTexts).toContain('No observations yet');
    expect(fldArrTexts).not.toContain('0.00 USD');
  });

  it('retries after a load failure', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderPrice();

    expect(fncRunTexts(fldObjRenderer)).toContain('Could not load the prices');

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
    const fldObjRenderer = await fncRunRenderPrice(fldHandOnClose);

    ReactTestRenderer.act(() => {
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      expect(fldObjBar.props.fldStrTitle).toBe('Market price');
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });
});
