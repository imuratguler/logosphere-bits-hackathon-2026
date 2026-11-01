/**
 * Logosphere BITS — analysis flow screen tests (maintained).
 *
 * Renders the real flow screen with react-test-renderer: the
 * normalize service is mocked, so no files are touched. The
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

jest.mock('../src/services/srvImageNormalize', () => ({
  srvApiNormalizeDraftImage: jest.fn(),
}));

import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAnalysisFlow } from '../src/screens/scrAnalysisFlow';
import { srvApiNormalizeDraftImage } from '../src/services/srvImageNormalize';
import type { fldObjAnalysisPhoto } from '../src/types/typModels';

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
  },
  {
    fldStrId: 'photo-b',
    fldNumSortOrder: 1,
    fldStrLocalPath: '/cache/b.jpg',
    fldNumRotationDegrees: 90,
    fldBooHasVoiceNote: false,
  },
];

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
    expect(fldArrTexts).toContain('Upload');
    expect(fldArrTexts).toContain('Live route');
    expect(fldArrTexts).toContain('The analysis service is not connected yet.');
    const fldObjPrepare = fncRunButtonByLabel(fldObjRenderer, 'Prepare photos');
    expect(fldObjPrepare?.props.fldBooDisabled).toBe(false);
  });

  it('prepares every photo in order and locks when done', async () => {
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
    const fldObjRenderer = await fncRunRender();

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Prepare photos',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

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

    await ReactTestRenderer.act(async () => {
      fncRunButtonByLabel(
        fldObjRenderer,
        'Prepare photos',
      )?.props.actHandOnPress();
      await fncRunFlush();
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(
      fldArrTexts.filter(fldStrText => fldStrText.includes('Prepared')),
    ).toHaveLength(1);
    expect(fldArrTexts).toContain('Could not prepare the photos');
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Prepare photos')?.props
        .fldBooDisabled,
    ).toBe(false);
  });

  it('closes on Back', async () => {
    const fldHandOnClose = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnClose);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Back')?.props.actHandOnPress();
    });

    expect(fldHandOnClose).toHaveBeenCalledTimes(1);
  });
});
