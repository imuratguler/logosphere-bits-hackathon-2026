/**
 * Logosphere BITS — single result card tests.
 *
 * Sections, basis labels, null bands, clamping props, and
 * the save bar states render from the fixture payload.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { scrResultSingle } from '../src/screens/scrResultSingle';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import type {
  fldObjAnalysisItem,
  fldObjAnalysisPayload,
} from '../src/types/typModels';

function fncConvItem(
  fldObjPrice: Partial<fldObjAnalysisItem['fldObjPrice']> = {},
  fldBooVoice = true,
): fldObjAnalysisItem {
  return {
    fldArrPhotoIds: ['photo-a'],
    fldObjBiblio: {
      fldStrTitle: 'The Demo Codex',
      fldStrSubtitle: null,
      fldStrIsbn10: null,
      fldStrIsbn13: '9783161484100',
      fldStrPublisher: 'Logosphere Press',
      fldStrPublicationLanguage: 'en',
      fldStrEdition: null,
      fldStrPrinting: null,
      fldNumPublicationYear: 2026,
      fldArrContributors: [
        { fldStrPerson: 'Demo Author', fldStrRole: 'Author' },
      ],
      fldNumOriginalPublicationYear: null,
      fldNumPageCount: null,
      fldStrPublicationType: null,
      fldStrDescription: null,
      fldStrDescriptionTr: null,
      fldStrDescriptionEn: null,
      fldStrBinding: 'Hardcover',
      fldStrDustJacket: null,
      fldStrPaper: null,
      fldStrDimensions: null,
      fldStrCondition: 'Good',
      fldStrSignature: null,
      fldStrDedication: null,
      fldNumConfidence: 0.8,
      fldStrRationale: 'Cover matches the demo codex.',
    },
    fldObjPrice: {
      fldNumReplacementNew: 1999,
      fldNumMarketMin: 500,
      fldNumMarketMax: 1500,
      fldNumMarketMedian: 800,
      fldNumMarketRecommended: 900,
      fldStrCurrency: 'USD',
      fldNumConfidence: 0.5,
      fldStrBasis: 'ai-estimate',
      fldStrError: null,
      ...fldObjPrice,
    },
    fldArrEvidence: fldBooVoice
      ? [
          {
            fldStrPhotoId: 'photo-a',
            fldStrVoiceText: 'No pencil marks',
            fldObjCatalog: null,
          },
        ]
      : [],
    fldObjDuplicate: null,
  };
}

function fncConvPayload(fldObjItem: fldObjAnalysisItem): fldObjAnalysisPayload {
  return {
    fldStrRunId: 'run-1',
    fldStrMode: 'singleProduct',
    fldArrResults: [fldObjItem],
    fldArrSources: [{ fldStrSource: 'model-knowledge', fldStrDetail: 'x' }],
  };
}

async function fncRunRender(
  fldObjItem: fldObjAnalysisItem,
  fldObjBar: {
    fldBooSaving?: boolean;
    fldStrSaveError?: string | null;
    actHandOnSave?: () => void;
  } = {},
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrResultSingle, {
        fldObjStrings: fldObjStringsEn,
        fldObjAnalysis: fncConvPayload(fldObjItem),
        fldObjItem,
        fldArrStripPhotos: [
          { fldStrId: 'photo-a', fldStrUri: 'file:///a.jpg' },
        ],
        fldBooSaving: fldObjBar.fldBooSaving ?? false,
        fldStrSaveError: fldObjBar.fldStrSaveError ?? null,
        actHandOnBack: () => {},
        actHandOnSave: fldObjBar.actHandOnSave ?? (() => {}),
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: single card was not rendered.');
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

describe('single result card', () => {
  it('renders null bands as unavailable with the AI basis', async () => {
    const fldObjRenderer = await fncRunRender(
      fncConvItem({
        fldNumReplacementNew: null,
        fldNumMarketMin: null,
        fldNumMarketMax: null,
        fldNumMarketMedian: null,
        fldNumMarketRecommended: null,
        fldStrError: 'Muse call failed',
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(
      fldArrTexts.filter(fldStrText => fldStrText === 'Not available').length,
    ).toBe(5);
    expect(fldArrTexts).toContain('Basis: AI estimate');
    expect(fldArrTexts.join(' ')).not.toContain('0.00');
  });

  it('labels observed market data honestly', async () => {
    const fldObjRenderer = await fncRunRender(
      fncConvItem({ fldStrBasis: 'sourced' }),
    );

    expect(fncRunTexts(fldObjRenderer)).toContain(
      'Basis: Observed market data',
    );
  });

  it('hides the voice section without voice text', async () => {
    const fldObjRenderer = await fncRunRender(fncConvItem({}, false));

    expect(fncRunTexts(fldObjRenderer)).not.toContain('Voice note');
  });

  it('clamps titles and prices for narrow screens', async () => {
    const fldObjRenderer = await fncRunRender(fncConvItem());

    const fldArrNodes = fldObjRenderer.root.findAllByType(vwText);
    const fldObjTitle = fldArrNodes.find(
      fldObjNode => fldObjNode.props.children === 'The Demo Codex',
    );
    expect(fldObjTitle?.props.fldNumLines).toBe(2);
    expect(fldObjTitle?.props.fldStrEllipsize).toBe('tail');
    const fldObjPrice = fldArrNodes.find(
      fldObjNode => fldObjNode.props.children === '19.99 USD',
    );
    expect(fldObjPrice?.props.fldNumLines).toBe(1);
  });

  it('disables saving while the save runs', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fncConvItem(), {
      fldBooSaving: true,
      actHandOnSave: fldHandOnSave,
    });

    const fldObjButton = fldObjRenderer.root.findByType(vwButton);
    expect(fldObjButton.props.fldStrLabel).toBe('Saving…');
    expect(fldObjButton.props.fldBooDisabled).toBe(true);
  });

  it('shows save errors above a working retry', async () => {
    const fldHandOnSave = jest.fn();
    const fldObjRenderer = await fncRunRender(fncConvItem(), {
      fldStrSaveError: 'forbidden',
      actHandOnSave: fldHandOnSave,
    });

    expect(fncRunTexts(fldObjRenderer)).toContain('forbidden');
    const fldObjButton = fldObjRenderer.root.findByType(vwButton);
    expect(fldObjButton.props.fldBooDisabled).toBe(false);
    ReactTestRenderer.act(() => {
      fldObjButton.props.actHandOnPress();
    });
    expect(fldHandOnSave).toHaveBeenCalledTimes(1);
  });
});
