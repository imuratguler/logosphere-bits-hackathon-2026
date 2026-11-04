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

jest.mock('../src/services/srvDemoSales', () => ({
  srvApiApplySale: jest.fn(),
  srvApiPreviewSale: jest.fn(),
}));

jest.mock('../src/services/srvDemoExport', () => ({
  srvApiExportAndSave: jest.fn(),
}));

import { vwButton } from '../src/components/vwButton';
import { vwSaleModal } from '../src/components/vwSaleModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrMarketPrice } from '../src/screens/scrMarketPrice';
import { srvApiResearchProductPrices } from '../src/services/srvAnalysis';
import { srvApiGetDemoProductDetails } from '../src/services/srvDemoProductDetails';
import { srvApiExportAndSave } from '../src/services/srvDemoExport';
import { srvApiApplySale } from '../src/services/srvDemoSales';
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
        fldDatObservedAt: '2026-11-04T10:00:00.000Z',
        fldStrUrl: 'https://shop.test/listing-1',
        fldNumSourcePrice: 43470,
        fldStrSourceCurrency: 'TRY',
        fldDatRateDate: '2026-11-03',
        fldStrSource: 'kitapyurdu',
        fldStrMarket: 'new',
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
    expect(fldArrTexts).toContain(
      'kitapyurdu · New · 434.70 TRY · Observed 2026-11-04',
    );
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

  it('opens the sale modal prefilled with the recommended USD price', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
    });

    const fldObjModal = fldObjRenderer.root.findByType(vwSaleModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrTagValue).toBe('9.00');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '9.00',
    );
  });

  it('activates the listing with the expected race values', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest.mocked(srvApiApplySale).mockResolvedValue({
      fldNumApplied: 1,
      fldNumSkipped: 0,
      fldNumTagMinor: 900,
    });
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnActivate();
      await fncRunFlush();
    });

    expect(srvApiApplySale).toHaveBeenCalledWith(
      fldObjStableClient,
      'session-1',
      'product',
      fldStrSeedProduct,
      {
        fldNumTagMinor: 900,
        fldBooActive: true,
        fldNumExpectedTagMinor: null,
        fldBooExpectedActive: undefined,
        fldBooCheckExpected: true,
      },
    );
    expect(fncRunTexts(fldObjRenderer)).toContain(
      'Listed for sale at 9.00 USD',
    );
    expect(srvApiGetDemoProductDetails).toHaveBeenCalledTimes(2);
  });

  it('sends the edited tag price on activation', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest.mocked(srvApiApplySale).mockResolvedValue({
      fldNumApplied: 1,
      fldNumSkipped: 0,
      fldNumTagMinor: 2499,
    });
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
      fldObjRenderer.root
        .findByType(vwSaleModal)
        .props.actHandOnTagChange('24.99');
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnActivate();
      await fncRunFlush();
    });

    expect(jest.mocked(srvApiApplySale).mock.calls[0]?.[4]).toEqual({
      fldNumTagMinor: 2499,
      fldBooActive: true,
      fldNumExpectedTagMinor: null,
      fldBooExpectedActive: undefined,
      fldBooCheckExpected: true,
    });
  });

  it('rejects an invalid tag without calling apply', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
      fldObjRenderer.root
        .findByType(vwSaleModal)
        .props.actHandOnTagChange('nine');
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnActivate();
    });

    expect(srvApiApplySale).not.toHaveBeenCalled();
    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldStrTagError,
    ).toBe('Enter a valid tag price.');
  });

  it('deactivates with no tag and keeps the stored price', async () => {
    const fldObjDetails = fncConvSeedDetails();
    fldObjDetails.fldObjProduct.fldObjSaleStatus = {
      fldNumTagPrice: 900,
      fldBooIsActive: true,
      fldStrTransactionScope: 'product',
      fldDatTransactionAt: '2026-10-28T00:00:00Z',
      fldStrTransactionId: 'tx-1',
    };
    jest.mocked(srvApiGetDemoProductDetails).mockResolvedValue(fldObjDetails);
    jest.mocked(srvApiApplySale).mockResolvedValue({
      fldNumApplied: 1,
      fldNumSkipped: 0,
      fldNumTagMinor: null,
    });
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnDeactivate();
      await fncRunFlush();
    });

    expect(jest.mocked(srvApiApplySale).mock.calls[0]?.[4]).toEqual({
      fldNumTagMinor: null,
      fldBooActive: false,
      fldNumExpectedTagMinor: 900,
      fldBooExpectedActive: true,
      fldBooCheckExpected: true,
    });
    expect(fncRunTexts(fldObjRenderer)).toContain(
      'Sale deactivated. Tag price kept.',
    );
  });

  it('maps a race conflict to the reload message', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest
      .mocked(srvApiApplySale)
      .mockRejectedValue(new Error('sale changed, reload'));
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnActivate();
      await fncRunFlush();
    });

    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldStrSaveError,
    ).toBe('The listing changed. Reload and try again.');
    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldBooVisible,
    ).toBe(true);
  });

  it('saves the product CSV to Downloads', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest.mocked(srvApiExportAndSave).mockResolvedValue({
      fldStrOutcome: 'saved',
      fldStrFileName: 'bits-item-export-20261103-085000.csv',
    });
    const fldObjRenderer = await fncRunRenderPrice();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(fldObjRenderer, 'Export CSV')?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(srvApiExportAndSave).toHaveBeenCalledWith(
      fldObjStableClient,
      'product',
      fldStrSeedProduct,
    );
    expect(fncRunTexts(fldObjRenderer)).toContain(
      'Export saved to Downloads.\nbits-item-export-20261103-085000.csv',
    );
  });

  it('keeps the product on screen when the export fails', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    jest
      .mocked(srvApiExportAndSave)
      .mockRejectedValue(new Error('save unavailable'));
    const fldObjRenderer = await fncRunRenderPrice();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(fldObjRenderer, 'Export CSV')?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Export failed');
    expect(fldArrTexts).toContain('save unavailable');
    expect(fldArrTexts).toContain('The Demo Codex');
  });

  it('cancels the sale modal without writing', async () => {
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
    const fldObjRenderer = await fncRunRenderPrice();

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Sale')?.props.actHandOnPress();
    });
    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldBooVisible,
    ).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwSaleModal).props.actHandOnCancel();
    });

    expect(srvApiApplySale).not.toHaveBeenCalled();
    expect(
      fldObjRenderer.root.findByType(vwSaleModal).props.fldBooVisible,
    ).toBe(false);
  });
});
