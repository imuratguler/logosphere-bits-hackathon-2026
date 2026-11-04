/**
 * Logosphere BITS — multi result list tests.
 *
 * Candidates render as collection cards with the duplicate
 * rationale on merged rows; Add saves plain, Add as Set
 * asks the name first, and cancel paths create no rows.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { scrResultMulti } from '../src/screens/scrResultMulti';
import { vwButton } from '../src/components/vwButton';
import { vwProductCard } from '../src/components/vwProductCard';
import { vwSetNameModal } from '../src/components/vwSetNameModal';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import type {
  fldObjAnalysisItem,
  fldObjAnalysisPayload,
} from '../src/types/typModels';

function fncConvItem(
  fldStrTitle: string,
  fldStrPhotoId: string,
  fldNumRecommended: number | null,
  fldObjDuplicate: fldObjAnalysisItem['fldObjDuplicate'] = null,
): fldObjAnalysisItem {
  return {
    fldArrPhotoIds: [fldStrPhotoId],
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
      fldNumPublicationTypeCode: null,
      fldStrDescription: null,
      fldStrDescriptionTr: null,
      fldStrDescriptionEn: null,
      fldStrBinding: null,
      fldNumCoverCode: null,
      fldStrPackaging: null,
      fldNumPackagingCode: null,
      fldStrDustJacket: null,
      fldStrPaper: null,
      fldNumPaperCode: null,
      fldStrDimensions: null,
      fldStrCondition: 'Good',
      fldNumConditionCode: 3,
      fldStrSignature: null,
      fldStrDedication: null,
      fldNumConfidence: 0.8,
      fldStrRationale: 'Cover match.',
      fldStrDewey: null,
      fldBooDeweyVerified: false,
      fldStrDeweyTitleEn: null,
      fldStrDeweyParent: null,
    },
    fldObjPrice: {
      fldNumReplacementNew: null,
      fldNumMarketMin: null,
      fldNumMarketMax: null,
      fldNumMarketMedian: null,
      fldNumMarketRecommended: fldNumRecommended,
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
    fldObjDuplicate,
    fldArrNeedsReview: [],
  };
}

const fldObjSeedAnalysis: fldObjAnalysisPayload = {
  fldStrRunId: 'run-1',
  fldStrMode: 'multiProduct',
  fldArrResults: [
    fncConvItem('The Demo Codex', 'photo-a', 900),
    {
      ...fncConvItem('The Second Codex', 'photo-b', null, {
        fldArrMergedFrom: [1, 2],
        fldStrReason: 'Same ISBN',
        fldNumConfidence: 0.9,
      }),
      fldArrPhotoIds: ['photo-b', 'photo-c'],
    },
  ],
  fldArrSources: [],
};

const fldArrLocalPhotos = [
  { fldStrId: 'photo-a', fldStrLocalPath: '/cache/a.jpg' },
  { fldStrId: 'photo-b', fldStrLocalPath: '/cache/b.jpg' },
];

async function fncRunRender(
  fldHandOnSave: (fldStrSetName: string | null) => void = () => {},
  fldObjAnalysis: fldObjAnalysisPayload = fldObjSeedAnalysis,
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrResultMulti, {
        fldObjStrings: fldObjStringsEn,
        fldObjAnalysis,
        fldArrLocalPhotos,
        fldBooSaving: false,
        fldStrSaveError: null,
        actHandOnBack: () => {},
        actHandOnSave: fldHandOnSave,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: multi list was not rendered.');
  }
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

describe('multi result list', () => {
  it('renders candidates as collection cards with prices', async () => {
    const fldObjRenderer = await fncRunRender();

    expect(fldObjRenderer.root.findAllByType(vwProductCard)).toHaveLength(2);
    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('9.00 USD');
    expect(fldArrTexts).toContain('Not available');
  });

  it('shows the duplicate rationale on merged rows only', async () => {
    const fldObjRenderer = await fncRunRender();

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(
      fldArrTexts.filter(fldStrText => fldStrText.includes('Merged duplicate'))
        .length,
    ).toBe(1);
    expect(
      fldArrTexts.some(fldStrText => fldStrText.includes('Same ISBN')),
    ).toBe(true);
  });

  it('flags review reasons on the matching rows', async () => {
    const fldObjAnalysis: fldObjAnalysisPayload = {
      ...fldObjSeedAnalysis,
      fldArrResults: fldObjSeedAnalysis.fldArrResults.map(
        (fldObjItem, fldNumAt) =>
          fldNumAt === 0
            ? {
                ...fldObjItem,
                fldArrNeedsReview: ['uncertain-duplicate'],
              }
            : fldObjItem,
      ),
    };
    const fldObjRenderer = await fncRunRender(() => {}, fldObjAnalysis);

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(
      fldArrTexts.filter(fldStrText => fldStrText.includes('Needs your review'))
        .length,
    ).toBe(1);
    expect(
      fldArrTexts.some(fldStrText =>
        fldStrText.includes('uncertain-duplicate'),
      ),
    ).toBe(true);
  });

  it('saves plain on Add', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnSave);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Add')?.props.actHandOnPress();
    });

    expect(fldHandOnSave).toHaveBeenCalledWith(null);
  });

  it('asks the set name before saving as a set', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnSave);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Add as Set')?.props.actHandOnPress();
    });
    expect(fldHandOnSave).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
      expect(fldObjModal.props.fldBooVisible).toBe(true);
      fldObjModal.props.actHandOnChange('Boxed Trilogy');
    });
    ReactTestRenderer.act(() => {
      const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
      fldObjModal.props.actHandOnSave();
    });

    expect(fldHandOnSave).toHaveBeenCalledWith('Boxed Trilogy');
  });

  it('blocks blank set names without saving', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnSave);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Add as Set')?.props.actHandOnPress();
    });
    ReactTestRenderer.act(() => {
      const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
      fldObjModal.props.actHandOnSave();
    });

    expect(fldHandOnSave).not.toHaveBeenCalled();
    const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
    expect(fldObjModal.props.fldStrError).toBe('Enter a set name.');
  });

  it('cancels the set modal without saving', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fldHandOnSave);

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Add as Set')?.props.actHandOnPress();
    });
    ReactTestRenderer.act(() => {
      const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
      fldObjModal.props.actHandOnCancel();
    });

    expect(fldHandOnSave).not.toHaveBeenCalled();
    const fldObjModal = fldObjRenderer.root.findByType(vwSetNameModal);
    expect(fldObjModal.props.fldBooVisible).toBe(false);
  });
});
