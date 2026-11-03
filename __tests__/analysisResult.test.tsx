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
const mockFncReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockFncNavigate,
    replace: mockFncReplace,
  }),
}));

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
  srvApiSaveAnalysisRun: jest.fn(),
}));

import { Image } from 'react-native';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAnalysisResult } from '../src/screens/scrAnalysisResult';
import { srvApiSaveAnalysisRun } from '../src/services/srvAnalysis';
import { srvApiGetDemoProductDetails } from '../src/services/srvDemoProductDetails';
import type {
  fldObjAnalysisItem,
  fldObjAnalysisPayload,
  fldObjProductDetails,
} from '../src/types/typModels';

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

function fncConvSeedItem(
  fldStrTitle: string,
  fldArrPhotoIds: string[],
): fldObjAnalysisItem {
  return {
    fldArrPhotoIds,
    fldObjBiblio: {
      fldStrTitle,
      fldStrSubtitle: null,
      fldStrIsbn10: null,
      fldStrIsbn13: null,
      fldStrPublisher: 'Logosphere Press',
      fldStrPublicationLanguage: 'en',
      fldStrEdition: null,
      fldStrPrinting: null,
      fldNumPublicationYear: 2026,
      fldArrContributors: [],
      fldNumOriginalPublicationYear: null,
      fldNumPageCount: null,
      fldStrPublicationType: null,
      fldStrDescription: null,
      fldStrDescriptionTr: null,
      fldStrDescriptionEn: null,
      fldStrBinding: null,
      fldStrDustJacket: null,
      fldStrPaper: null,
      fldStrDimensions: null,
      fldStrCondition: 'Good — jacket worn',
      fldStrSignature: null,
      fldStrDedication: null,
      fldNumConfidence: 0.8,
      fldStrRationale: 'Cover matches the demo codex.',
    },
    fldObjPrice: {
      fldNumReplacementNew: 1200,
      fldNumMarketMin: 800,
      fldNumMarketMax: 1400,
      fldNumMarketRecommended: 1100,
      fldNumMarketMedian: 1000,
      fldStrCurrency: 'USD',
      fldNumConfidence: 0.5,
      fldStrBasis: 'ai-estimate',
      fldStrError: null,
    },
    fldArrEvidence: fldArrPhotoIds.map(fldStrPhotoId => ({
      fldStrPhotoId,
      fldStrVoiceText: 'No pencil marks',
      fldObjCatalog: {
        fldStrSource: 'openlibrary',
        fldStrReason: null,
        fldStrRecordTitle: fldStrTitle,
      },
    })),
    fldObjDuplicate: null,
  };
}

function fncConvSeedPayload(): fldObjAnalysisPayload {
  return {
    fldStrRunId: 'run-1',
    fldStrMode: 'singleProduct',
    fldArrResults: [fncConvSeedItem('The Demo Codex', ['photo-a'])],
    fldArrSources: [
      {
        fldStrSource: 'model-knowledge',
        fldStrDetail: 'Muse price estimate',
      },
    ],
  };
}

const fldArrLocalPhotos = [
  { fldStrId: 'photo-a', fldStrLocalPath: '/cache/a.jpg.norm' },
  { fldStrId: 'photo-b', fldStrLocalPath: '/cache/b.jpg.norm' },
];

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

const fldObjSeedTarget = {
  fldStrLibraryId: 'lib-1',
  fldStrLibraryName: 'Home',
  fldStrCollectionId: 'col-1',
  fldStrCollectionName: 'Study',
};

async function fncRunRenderAnalysis(
  fldObjAnalysis: fldObjAnalysisPayload = fncConvSeedPayload(),
  fldHandOnClose: () => void = () => {},
  fldObjTarget?: typeof fldObjSeedTarget,
  fldHandOnOpenFolder: (
    fldObjFolder: typeof fldObjSeedTarget,
  ) => void = () => {},
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAnalysisResult, {
        fldObjStrings: fldObjStringsEn,
        fldObjAnalysis,
        fldArrLocalPhotos,
        fldObjTarget,
        actHandOnClose: fldHandOnClose,
        actHandOnOpenFolder: fldHandOnOpenFolder,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: review screen was not rendered.');
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

    expect(fncRunTexts(fldObjRenderer)).toContain('Could not load the item');

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
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      expect(fldObjBar.props.fldStrTitle).toBe('Result');
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });

  it('reviews the single run as a card with sections and basis', async () => {
    const fldObjRenderer = await fncRunRenderAnalysis();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Photos');
    expect(fldArrTexts).toContain('Identity');
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('Logosphere Press · 2026');
    expect(fldArrTexts).toContain('Condition');
    expect(fldArrTexts).toContain('Good — jacket worn');
    expect(fldArrTexts).toContain('Voice note');
    expect(
      fldArrTexts.some(fldStrText => fldStrText.includes('No pencil marks')),
    ).toBe(true);
    expect(
      fldArrTexts.some(fldStrText => fldStrText.includes('User claim')),
    ).toBe(true);
    expect(fldArrTexts.some(fldStrText => fldStrText.includes('80%'))).toBe(
      true,
    );
    expect(
      fldArrTexts.some(fldStrText =>
        fldStrText.includes('Cover matches the demo codex.'),
      ),
    ).toBe(true);
    expect(
      fldArrTexts.some(fldStrText => fldStrText.includes('model-knowledge')),
    ).toBe(true);
    expect(fldArrTexts).toContain('12.00 USD');
    expect(fldArrTexts).toContain('8.00 USD');
    expect(fldArrTexts).toContain('10.00 USD');
    expect(fldArrTexts).toContain('14.00 USD');
    expect(fldArrTexts).toContain('11.00 USD');
    expect(fldArrTexts).toContain('Basis: AI estimate');
    const fldArrImages = fldObjRenderer.root.findAllByType(Image);
    expect(fldArrImages).toHaveLength(1);
    expect(fldArrImages[0]?.props.source).toEqual({
      uri: 'file:///cache/a.jpg.norm',
    });
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Add to Collection'),
    ).toBeDefined();
    expect(fncRunButtonByLabel(fldObjRenderer, 'Market price')).toBeUndefined();
    expect(srvApiGetDemoProductDetails).not.toHaveBeenCalled();
  });

  it('saves the run and opens the target folder', async () => {
    jest
      .mocked(srvApiSaveAnalysisRun)
      .mockResolvedValue({ fldArrProductIds: ['prod-1'], fldStrSetId: null });
    const fldHandOnOpenFolder = jest.fn();
    const fldObjRenderer = await fncRunRenderAnalysis(
      fncConvSeedPayload(),
      () => {},
      fldObjSeedTarget,
      fldHandOnOpenFolder,
    );

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Add to Collection',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(srvApiSaveAnalysisRun).toHaveBeenCalledWith(
      fldObjStableClient,
      'session-1',
      'run-1',
      null,
    );
    expect(fldHandOnOpenFolder).toHaveBeenCalledWith(fldObjSeedTarget);
  });

  it('keeps the review on screen when saving fails', async () => {
    jest
      .mocked(srvApiSaveAnalysisRun)
      .mockRejectedValue(new Error('forbidden'));
    const fldHandOnOpenFolder = jest.fn();
    const fldObjRenderer = await fncRunRenderAnalysis(
      fncConvSeedPayload(),
      () => {},
      fldObjSeedTarget,
      fldHandOnOpenFolder,
    );

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Add to Collection',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('forbidden');
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Add to Collection'),
    ).toBeDefined();
    expect(fldHandOnOpenFolder).not.toHaveBeenCalled();
    expect(mockFncReplace).not.toHaveBeenCalled();
  });

  it('shows the saved list when no target arrives', async () => {
    jest
      .mocked(srvApiSaveAnalysisRun)
      .mockResolvedValue({ fldArrProductIds: ['prod-1'], fldStrSetId: null });
    const fldObjRenderer = await fncRunRenderAnalysis();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Add to Collection',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(fncRunTexts(fldObjRenderer)).toContain('1 items saved');

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Open saved item',
      )?.props.actHandOnPress();
    });

    expect(mockFncReplace).toHaveBeenCalledWith('AnalysisResult', {
      fldStrProductId: 'prod-1',
    });
  });

  it('renders multi runs as a card list with set actions', async () => {
    const fldObjAnalysis = fncConvSeedPayload();
    fldObjAnalysis.fldStrMode = 'multiProduct';
    fldObjAnalysis.fldArrResults = [
      fncConvSeedItem('The Demo Codex', ['photo-a']),
      fncConvSeedItem('The Second Codex', ['photo-b']),
    ];
    const fldObjRenderer = await fncRunRenderAnalysis(fldObjAnalysis);

    expect(fncRunTexts(fldObjRenderer)).toContain('The Demo Codex');
    expect(fncRunTexts(fldObjRenderer)).toContain('The Second Codex');
    expect(fncRunButtonByLabel(fldObjRenderer, 'Add')).toBeDefined();
    expect(fncRunButtonByLabel(fldObjRenderer, 'Add as Set')).toBeDefined();
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Add to Collection'),
    ).toBeUndefined();
  });

  it('closes the review without saving', async () => {
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRenderAnalysis(
      fncConvSeedPayload(),
      fldHandOnClose,
    );

    ReactTestRenderer.act(() => {
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
    expect(srvApiSaveAnalysisRun).not.toHaveBeenCalled();
  });

  it('shows the mode error when neither payload nor product arrives', async () => {
    const fldHandOnClose = jest.fn();
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(scrAnalysisResult, {
          fldObjStrings: fldObjStringsEn,
          actHandOnClose: fldHandOnClose,
        }),
      );
    });
    if (fldObjRenderer === undefined) {
      throw new Error('Logosphere BITS: review screen was not rendered.');
    }
    const fldObjReady: ReactTestRenderer.ReactTestRenderer = fldObjRenderer;

    expect(fncRunTexts(fldObjReady)).toContain('Could not load the item');

    ReactTestRenderer.act(() => {
      const fldObjBar = fldObjReady.root.findByType(vwTopBar);
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
    expect(srvApiGetDemoProductDetails).not.toHaveBeenCalled();
  });
});
