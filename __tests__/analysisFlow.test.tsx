/**
 * Logosphere BITS — analysis flow screen tests (maintained).
 *
 * Renders the real flow screen with react-test-renderer: the
 * normalize service and the analysis service are mocked, so
 * no files or network are touched. The screen takes plain
 * props plus mocked navigation and demo session. The
 * pipeline auto-starts on mount behind the searching modal
 * and replaces the route with the result on success.
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

const mockFncReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockFncReplace }),
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
import { vwSearchingModal } from '../src/components/vwSearchingModal';
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
          fldNumPublicationTypeCode: null,
          fldStrDescription: null,
          fldStrDescriptionTr: null,
          fldStrDescriptionEn: null,
          fldStrBinding: null,
          fldNumCoverCode: null,
          fldStrDustJacket: null,
          fldStrPaper: null,
          fldNumPaperCode: null,
          fldStrDimensions: null,
          fldStrCondition: null,
          fldNumConditionCode: null,
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
          fldArrObservations: [],
          fldObjAiEstimate: {
            fldNumReplacementNew: null,
            fldNumMarketMin: null,
            fldNumMarketMax: null,
            fldNumMarketMedian: null,
            fldNumMarketRecommended: null,
            fldStrCurrency: 'USD',
            fldNumConfidence: null,
          },
        },
        fldArrEvidence: [],
        fldObjDuplicate: null,
        fldArrNeedsReview: [],
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

function fncRunModal(fldObjRenderer: ReactTestRenderer.ReactTestRenderer) {
  return fldObjRenderer.root.findByType(vwSearchingModal);
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

function fncRunMockPipelineOk(fldObjPayload: fldObjAnalysisPayload) {
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
  jest.mocked(srvApiSubscribeAnalysisRun).mockReturnValue(jest.fn());
  jest.mocked(srvApiRunAnalysis).mockResolvedValue(fldObjPayload);
}

describe('analysis flow screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-runs on mount and replaces the route with the result', async () => {
    fncRunMockNormalizeOk();
    const fldObjPayload = fncConvSeedPayload();
    fncRunMockPipelineOk(fldObjPayload);
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
    await fncRunRender();
    await fncRunFlush();

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
    expect(mockFncReplace).toHaveBeenCalledWith('AnalysisResult', {
      fldObjAnalysis: fldObjPayload,
      fldArrLocalPhotos: [
        { fldStrId: 'photo-a', fldStrLocalPath: '/cache/a.jpg.norm' },
        { fldStrId: 'photo-b', fldStrLocalPath: '/cache/b.jpg.norm' },
      ],
      fldObjTarget,
    });
  });

  it('shows the live status in the searching modal while running', async () => {
    fncRunMockNormalizeOk();
    fncRunMockPipelineOk(fncConvSeedPayload());
    let fldFncResolveRun: (
      fldObjValue: fldObjAnalysisPayload,
    ) => void = () => {};
    jest.mocked(srvApiRunAnalysis).mockImplementation(
      () =>
        new Promise<fldObjAnalysisPayload>(fldFncResolve => {
          fldFncResolveRun = fldFncResolve;
        }),
    );
    const fldObjRenderer = await fncRunRender();
    await fncRunFlush();

    const fldObjModal = fncRunModal(fldObjRenderer);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrTitle).toBe('Searching…');
    expect(fldObjModal.props.fldStrStatus).toBe('Analyzing…');
    expect(mockFncReplace).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      fldFncResolveRun(fncConvSeedPayload());
      await fncRunFlush();
    });
    expect(mockFncReplace).toHaveBeenCalledTimes(1);
  });

  it('shows the error with a retry that resumes the same run key', async () => {
    fncRunMockNormalizeOk();
    fncRunMockPipelineOk(fncConvSeedPayload());
    jest
      .mocked(srvApiCreateAnalysisRun)
      .mockRejectedValueOnce(new Error('service down'));
    const fldObjRenderer = await fncRunRender();
    await fncRunFlush();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Analysis failed');
    expect(fldArrTexts).toContain('service down');
    expect(mockFncReplace).not.toHaveBeenCalled();
    expect(fncRunModal(fldObjRenderer).props.fldBooVisible).toBe(false);

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(fldObjRenderer, 'Retry')?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrKeys = jest
      .mocked(srvApiCreateAnalysisRun)
      .mock.calls.map(fldObjCall => fldObjCall[1]?.fldStrIdempotencyKey);
    expect(fldArrKeys).toHaveLength(2);
    expect(fldArrKeys[0]).toBe(fldArrKeys[1]);
    expect(mockFncReplace).toHaveBeenCalledTimes(1);
  });

  it('surfaces prepare failures with a retry', async () => {
    fncRunMockNormalizeOk();
    jest
      .mocked(srvApiNormalizeDraftImage)
      .mockRejectedValueOnce(new Error('bad pixels'));
    const fldObjRenderer = await fncRunRender();
    await fncRunFlush();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Analysis failed');
    expect(fldArrTexts).toContain('bad pixels');
    expect(srvApiCreateAnalysisRun).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(fldObjRenderer, 'Retry')?.props.actHandOnPress();
      await fncRunFlush();
    });
    expect(srvApiNormalizeDraftImage).toHaveBeenCalled();
  });

  it('cancels the modal through the close handler', async () => {
    fncRunMockNormalizeOk();
    fncRunMockPipelineOk(fncConvSeedPayload());
    jest
      .mocked(srvApiRunAnalysis)
      .mockImplementation(() => new Promise<fldObjAnalysisPayload>(() => {}));
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnClose);
    await fncRunFlush();

    expect(fncRunModal(fldObjRenderer).props.fldBooVisible).toBe(true);
    ReactTestRenderer.act(() => {
      fncRunModal(fldObjRenderer).props.actHandOnCancel();
    });
    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Back', async () => {
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnClose);

    ReactTestRenderer.act(() => {
      const fldObjBar = fldObjRenderer.root.findByType(vwTopBar);
      expect(fldObjBar.props.fldStrTitle).toBe('Analysis');
      fldObjBar.props.actHandOnBack();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });
});
