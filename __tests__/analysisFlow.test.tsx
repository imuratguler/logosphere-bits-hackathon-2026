/**
 * Logosphere BITS — analysis flow screen tests (maintained).
 *
 * Renders the real flow screen with react-test-renderer: the
 * normalize service and the analysis service are mocked, so
 * no files or network are touched. The screen takes plain
 * props plus mocked navigation and demo session.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockFncNavigate }),
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

jest.mock('../src/services/srvImageNormalize', () => ({
  srvApiNormalizeDraftImage: jest.fn(),
}));

jest.mock('../src/services/srvAnalysis', () => ({
  srvApiCreateAnalysisRun: jest.fn(),
  srvApiUploadAnalysisFiles: jest.fn(),
  srvApiSubscribeAnalysisRun: jest.fn(),
  srvApiRunAnalysis: jest.fn(),
}));

import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { vwTopBar } from '../src/components/vwTopBar';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAnalysisFlow } from '../src/screens/scrAnalysisFlow';
import {
  srvApiCreateAnalysisRun,
  srvApiRunAnalysis,
  srvApiSubscribeAnalysisRun,
  srvApiUploadAnalysisFiles,
} from '../src/services/srvAnalysis';
import { srvApiNormalizeDraftImage } from '../src/services/srvImageNormalize';
import type {
  fldObjAnalysisPayload,
  fldObjAnalysisPhoto,
  fldObjPipelineStep,
} from '../src/types/typModels';

const fldObjTarget = {
  fldStrLibraryId: 'lib-1',
  fldStrLibraryName: 'Demo Library',
  fldStrCollectionId: 'col-1',
  fldStrCollectionName: 'Rare Books',
};

const fldArrPhotos: fldObjAnalysisPhoto[] = [
  {
    fldStrId: 'photo-a',
    fldNumSortOrder: 0,
    fldStrLocalPath: '/cache/a.jpg',
    fldNumRotationDegrees: 0,
    fldBooHasVoiceNote: true,
    fldStrVoicePath: '/cache/a.m4a',
  },
  {
    fldStrId: 'photo-b',
    fldNumSortOrder: 1,
    fldStrLocalPath: '/cache/b.jpg',
    fldNumRotationDegrees: 90,
    fldBooHasVoiceNote: false,
    fldStrVoicePath: null,
  },
];

function fncConvSeedPayload(): fldObjAnalysisPayload {
  return {
    fldStrRunId: 'run-1',
    fldStrMode: 'singleProduct',
    fldArrResults: [
      {
        fldArrPhotoIds: ['photo-a', 'photo-b'],
        fldObjBiblio: {
          fldStrTitle: 'The Demo Codex',
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
          fldStrCondition: null,
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
        fldArrEvidence: [],
        fldObjDuplicate: null,
      },
    ],
    fldArrSources: [
      {
        fldStrSource: 'model-knowledge',
        fldStrDetail: 'Muse price estimate',
      },
    ],
  };
}

async function fncRunRender(
  fldHandOnClose: () => void = () => {},
  fldArrGiven: fldObjAnalysisPhoto[] = fldArrPhotos,
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAnalysisFlow, {
        fldObjStrings: fldObjStringsEn,
        fldStrMode: 'single',
        fldObjTarget,
        fldArrPhotos: fldArrGiven,
        actHandOnClose: fldHandOnClose,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: flow screen was not rendered.');
  }
  return fldObjRenderer;
}

function fncRunButtonByLabel(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
  fldStrLabel: string,
) {
  return fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
}

function fncRunTexts(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
): string[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => String(fldObjNode.props.children));
}

async function fncRunFlush() {
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
}

function fncRunMockNormalizeOk() {
  jest
    .mocked(srvApiNormalizeDraftImage)
    .mockImplementation((fldStrPath: string) =>
      Promise.resolve({
        fldStrPath: `${fldStrPath}.norm`,
        fldStrUri: `file://${fldStrPath}.norm`,
        fldNumWidth: 100,
        fldNumHeight: 100,
        fldNumSize: 10,
      }),
    );
}

async function fncRunPrepareAll(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
) {
  await ReactTestRenderer.act(async () => {
    fncRunButtonByLabel(
      fldObjRenderer,
      'Prepare photos',
    )?.props.actHandOnPress();
    await fncRunFlush();
  });
}

describe('analysis flow screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the summary, photo rows, and waiting stages', async () => {
    const fldObjRenderer = await fncRunRender();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('2 photos ready');
    expect(fldArrTexts).toContain('Single Item · Rare Books');
    expect(fldArrTexts).toContain('Voice note attached');
    expect(fldArrTexts).toContain('Prepare');
    expect(fldArrTexts).toContain('Upload');
    expect(fldArrTexts).toContain('Live route');
    expect(fldArrTexts).toContain('Result');
    expect(fldArrTexts).toContain('Confirmed save');
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Prepare photos')?.props
        .fldBooDisabled,
    ).toBe(false);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Upload and analyze')?.props
        .fldBooDisabled,
    ).toBe(true);
  });

  it('prepares every photo in order and locks when done', async () => {
    fncRunMockNormalizeOk();
    const fldObjRenderer = await fncRunRender();

    await fncRunPrepareAll(fldObjRenderer);

    expect(srvApiNormalizeDraftImage).toHaveBeenCalledTimes(2);
    expect(srvApiNormalizeDraftImage).toHaveBeenNthCalledWith(
      1,
      '/cache/a.jpg',
      0,
    );
    expect(srvApiNormalizeDraftImage).toHaveBeenNthCalledWith(
      2,
      '/cache/b.jpg',
      90,
    );
    expect(
      fncRunTexts(fldObjRenderer).filter(fldStrText =>
        fldStrText.includes('Prepared'),
      ),
    ).toHaveLength(2);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Prepare photos')?.props
        .fldBooDisabled,
    ).toBe(true);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Upload and analyze')?.props
        .fldBooDisabled,
    ).toBe(false);
  });

  it('keeps other photos prepared when one fails', async () => {
    jest
      .mocked(srvApiNormalizeDraftImage)
      .mockImplementation((fldStrPath: string) => {
        if (fldStrPath === '/cache/a.jpg') {
          return Promise.reject(new Error('bad pixels'));
        }
        return Promise.resolve({
          fldStrPath: `${fldStrPath}.norm`,
          fldStrUri: `file://${fldStrPath}.norm`,
          fldNumWidth: 100,
          fldNumHeight: 100,
          fldNumSize: 10,
        });
      });
    const fldObjRenderer = await fncRunRender();

    await fncRunPrepareAll(fldObjRenderer);

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(
      fldArrTexts.filter(fldStrText => fldStrText.includes('Prepared')),
    ).toHaveLength(1);
    expect(fldArrTexts).toContain('Could not prepare the photos');
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Prepare photos')?.props
        .fldBooDisabled,
    ).toBe(false);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Upload and analyze')?.props
        .fldBooDisabled,
    ).toBe(true);
  });

  it('uploads prepared photos and navigates with the review payload', async () => {
    fncRunMockNormalizeOk();
    jest.mocked(srvApiCreateAnalysisRun).mockResolvedValue({
      fldStrRunId: 'run-1',
      fldArrImages: [
        {
          fldStrId: 'photo-a',
          fldStrFilePath: 'product-photos/draft/run-1/a.jpg',
          fldStrVoiceFilePath: 'voice-notes/draft/run-1/a.m4a',
        },
        {
          fldStrId: 'photo-b',
          fldStrFilePath: 'product-photos/draft/run-1/b.jpg',
          fldStrVoiceFilePath: null,
        },
      ],
    });
    jest.mocked(srvApiUploadAnalysisFiles).mockResolvedValue(undefined);
    let fldHandOnStep: ((fldObjStep: fldObjPipelineStep) => void) | undefined;
    jest
      .mocked(srvApiSubscribeAnalysisRun)
      .mockImplementation(
        (
          _fldObjClient: unknown,
          _fldStrRunId: string,
          fldHandGiven: (fldObjStep: fldObjPipelineStep) => void,
        ) => {
          fldHandOnStep = fldHandGiven;
          return jest.fn();
        },
      );
    const fldObjPayload = fncConvSeedPayload();
    jest.mocked(srvApiRunAnalysis).mockImplementation(() => {
      fldHandOnStep?.({
        fldStrRunId: 'run-1',
        fldNumSeq: 1,
        fldStrStage: 'pre-read',
        fldStrEvent: 'started',
        fldStrDetail: null,
      });
      return Promise.resolve(fldObjPayload);
    });
    const fldObjRenderer = await fncRunRender();

    await fncRunPrepareAll(fldObjRenderer);
    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Upload and analyze',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    expect(srvApiCreateAnalysisRun).toHaveBeenCalledWith(
      fldObjStableClient,
      expect.objectContaining({
        fldStrSessionId: 'session-1',
        fldStrMode: 'singleProduct',
        fldStrCollectionId: 'col-1',
      }),
    );
    const fldObjCreateArg = jest.mocked(srvApiCreateAnalysisRun).mock
      .calls[0]?.[1];
    expect(fldObjCreateArg?.fldArrImages).toEqual([
      {
        fldStrClientImageId: 'photo-a',
        fldNumSortOrder: 0,
        fldStrMimeType: 'image/jpeg',
        fldNumRotationDegrees: 0,
        fldBooHasVoice: true,
      },
      {
        fldStrClientImageId: 'photo-b',
        fldNumSortOrder: 1,
        fldStrMimeType: 'image/jpeg',
        fldNumRotationDegrees: 90,
        fldBooHasVoice: false,
      },
    ]);
    expect(srvApiUploadAnalysisFiles).toHaveBeenCalledWith(fldObjStableClient, [
      {
        fldStrStoragePath: 'product-photos/draft/run-1/a.jpg',
        fldStrLocalPath: '/cache/a.jpg.norm',
        fldStrMimeType: 'image/jpeg',
      },
      {
        fldStrStoragePath: 'voice-notes/draft/run-1/a.m4a',
        fldStrLocalPath: '/cache/a.m4a',
        fldStrMimeType: 'audio/mp4',
      },
      {
        fldStrStoragePath: 'product-photos/draft/run-1/b.jpg',
        fldStrLocalPath: '/cache/b.jpg.norm',
        fldStrMimeType: 'image/jpeg',
      },
    ]);
    expect(srvApiSubscribeAnalysisRun).toHaveBeenCalledWith(
      fldObjStableClient,
      'run-1',
      expect.any(Function),
    );
    expect(srvApiRunAnalysis).toHaveBeenCalledWith(
      fldObjStableClient,
      'session-1',
      'run-1',
    );
    expect(fncRunTexts(fldObjRenderer)).toContain('pre-read · started');
    expect(mockFncNavigate).toHaveBeenCalledWith('AnalysisResult', {
      fldObjAnalysis: fldObjPayload,
      fldArrLocalPhotos: [
        { fldStrId: 'photo-a', fldStrLocalPath: '/cache/a.jpg.norm' },
        { fldStrId: 'photo-b', fldStrLocalPath: '/cache/b.jpg.norm' },
      ],
      fldObjTarget,
    });
  });

  it('stays on screen with a retry when the run fails', async () => {
    fncRunMockNormalizeOk();
    jest
      .mocked(srvApiCreateAnalysisRun)
      .mockRejectedValue(new Error('service down'));
    const fldObjRenderer = await fncRunRender();

    await fncRunPrepareAll(fldObjRenderer);
    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Upload and analyze',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Analysis failed');
    expect(fldArrTexts).toContain('service down');
    expect(mockFncNavigate).not.toHaveBeenCalled();
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Upload and analyze')?.props
        .fldBooDisabled,
    ).toBe(false);
  });

  it('closes on Back', async () => {
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnClose);

    ReactTestRenderer.act(() => {
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      expect(fldObjBar.props.fldStrTitle).toBe('Analysis');
      (fldObjBar.props.actHandOnBack as () => void)();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });
});
