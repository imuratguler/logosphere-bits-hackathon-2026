/**
 * Logosphere BITS — shared result detail tests.
 *
 * Flat label-over-value rows with no section headers and no
 * code flags: roles label their people, prices split into
 * bands with a bold Recommended, edition/printing read as
 * numerals, and the Dewey value is the verified path text.
 * Source traces stay off the card.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  vwResultDetail,
  vwResultDetailExpandable,
} from '../src/components/vwResultDetail';
import { vwButton } from '../src/components/vwButton';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import type {
  fldObjAnalysisItem,
  fldObjAnalysisSource,
} from '../src/types/typModels';

const FLD_OBJ_BASE: fldObjAnalysisItem = {
  fldArrPhotoIds: ['photo-a'],
  fldObjBiblio: {
    fldStrTitle: 'The Demo Codex',
    fldStrSubtitle: null,
    fldStrIsbn10: null,
    fldStrIsbn13: '9783161484100',
    fldStrPublisher: 'Logosphere Press',
    fldStrPublicationLanguage: 'en',
    fldStrEdition: 'First Edition',
    fldStrPrinting: '9 8 7 6 5 4 3 2',
    fldNumPublicationYear: 2026,
    fldArrContributors: [
      { fldStrPerson: 'Demo Author', fldStrRole: 'Author', fldNumRoleCode: 1 },
    ],
    fldNumOriginalPublicationYear: null,
    fldNumPageCount: 128,
    fldStrPublicationType: null,
    fldNumPublicationTypeCode: 0,
    fldStrDescription: 'A codex for the demo shelf.',
    fldStrDescriptionTr: null,
    fldStrDescriptionEn: null,
    fldStrBinding: 'Hardcover',
    fldNumCoverCode: 2,
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
    fldStrDewey: '813.54',
    fldBooDeweyVerified: true,
    fldStrDeweyTitleEn: 'American fiction',
    fldStrDeweyParent: null,
    fldArrDeweyPath: [
      { fldStrCode: '800', fldStrTitle: 'Root Eight' },
      { fldStrCode: '813.54', fldStrTitle: 'Leaf Five-Four' },
    ],
    fldStrDeweyPathBroken: null,
  },
  fldObjPrice: {
    fldNumReplacementNew: 1200,
    fldNumMarketMin: 800,
    fldNumMarketMedian: 1000,
    fldNumMarketMax: 1400,
    fldNumMarketRecommended: 1100,
    fldStrCurrency: 'USD',
    fldStrBasis: 'observed',
    fldNumConfidence: 0.7,
    fldStrError: null,
    fldObjAiEstimate: {
      fldNumReplacementNew: 1200,
      fldNumMarketMin: null,
      fldNumMarketMedian: null,
      fldNumMarketMax: null,
      fldNumMarketRecommended: null,
      fldStrCurrency: 'USD',
      fldNumConfidence: null,
    },
    fldArrObservations: [],
  },
  fldArrEvidence: [],
  fldObjDuplicate: null,
  fldArrNeedsReview: [],
};

const FLD_ARR_SOURCES: fldObjAnalysisSource[] = [];

function fncRunRender(
  fldObjItem: fldObjAnalysisItem,
): ReactTestRenderer.ReactTestRenderer {
  let fldObjRoot!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    fldObjRoot = ReactTestRenderer.create(
      React.createElement(vwResultDetail, {
        fldObjStrings: fldObjStringsEn,
        fldObjItem,
        fldArrSources: FLD_ARR_SOURCES,
      }),
    );
  });
  return fldObjRoot;
}

function fncConvTexts(
  fldObjRoot: ReactTestRenderer.ReactTestRenderer,
): string[] {
  return fldObjRoot.root
    .findAllByType(vwText)
    .map(fldObjNode => String(fldObjNode.props.children));
}

describe('vwResultDetail', () => {
  test('stacks labels over values without headers or flags', () => {
    const fldArrTexts = fncConvTexts(fncRunRender(FLD_OBJ_BASE));
    for (const fldStrLabel of [
      'Title',
      'Publisher',
      'Publication type',
      'Cover',
      'Condition',
      'Dewey',
      'Recommended',
    ]) {
      expect(fldArrTexts).toContain(fldStrLabel);
    }
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('Book');
    expect(fldArrTexts).toContain('Hardcover');
    expect(fldArrTexts).toContain('Good');
    for (const fldStrHidden of [
      'Publication',
      'People',
      'Content',
      'Physical copy',
      'Identifiers & classification',
      'Evidence & price',
      'Basis',
      'Confidence',
      'Pipeline',
    ]) {
      expect(fldArrTexts).not.toContain(fldStrHidden);
    }
    expect(fldArrTexts.join('\n')).not.toContain('· 1');
    expect(fldArrTexts.join('\n')).not.toContain('· 2');
    expect(fldArrTexts.join('\n')).not.toContain('· 3');
  });

  test('labels each person with their role', () => {
    const fldObjRoot = fncRunRender(FLD_OBJ_BASE);
    const fldArrNodes = fldObjRoot.root.findAllByType(vwText);
    const fldNumAuthor = fldArrNodes.findIndex(
      fldObjNode => fldObjNode.props.children === 'Author',
    );
    expect(fldNumAuthor).toBeGreaterThanOrEqual(0);
    expect(fldArrNodes[fldNumAuthor + 1]?.props.children).toBe('Demo Author');
  });

  test('reads edition and printing as numerals', () => {
    const fldObjRoot = fncRunRender(FLD_OBJ_BASE);
    const fldArrNodes = fldObjRoot.root.findAllByType(vwText);
    const fldNumEdition = fldArrNodes.findIndex(
      fldObjNode => fldObjNode.props.children === 'Edition',
    );
    expect(fldArrNodes[fldNumEdition + 1]?.props.children).toBe('1');
    const fldNumPrinting = fldArrNodes.findIndex(
      fldObjNode => fldObjNode.props.children === 'Printing',
    );
    expect(fldArrNodes[fldNumPrinting + 1]?.props.children).toBe('9');
  });

  test('bolds the Recommended value', () => {
    const fldObjRoot = fncRunRender(FLD_OBJ_BASE);
    const fldArrNodes = fldObjRoot.root.findAllByType(vwText);
    const fldNumLabel = fldArrNodes.findIndex(
      fldObjNode => fldObjNode.props.children === 'Recommended',
    );
    const fldObjValue = fldArrNodes[fldNumLabel + 1];
    expect(fldObjValue?.props.children).toBe('11.00 USD');
    expect(fldObjValue?.props.fldObjStyle).toEqual(
      expect.objectContaining({ fontWeight: 'bold' }),
    );
  });

  test('shows the verified Dewey path as selectable text', () => {
    const fldObjRoot = fncRunRender(FLD_OBJ_BASE);
    const fldArrNodes = fldObjRoot.root.findAllByType(vwText);
    const fldNumLabel = fldArrNodes.findIndex(
      fldObjNode => fldObjNode.props.children === 'Dewey',
    );
    const fldObjValue = fldArrNodes[fldNumLabel + 1];
    expect(fldObjValue?.props.children).toBe(
      '800 Root Eight\n  > 813.54 Leaf Five-Four',
    );
    expect(fldObjValue?.props.fldBooSelectable).toBe(true);
  });

  test('states unverified, broken, and missing Dewey honestly', () => {
    const fldObjGuess: fldObjAnalysisItem = {
      ...FLD_OBJ_BASE,
      fldObjBiblio: {
        ...FLD_OBJ_BASE.fldObjBiblio,
        fldBooDeweyVerified: false,
      },
    };
    expect(fncConvTexts(fncRunRender(fldObjGuess))).toContain(
      '813.54 · Unverified suggestion',
    );
    const fldObjBroken: fldObjAnalysisItem = {
      ...FLD_OBJ_BASE,
      fldObjBiblio: {
        ...FLD_OBJ_BASE.fldObjBiblio,
        fldArrDeweyPath: [
          { fldStrCode: '813.54', fldStrTitle: 'Leaf Five-Four' },
        ],
        fldStrDeweyPathBroken: 'missing-parent',
      },
    };
    expect(fncConvTexts(fncRunRender(fldObjBroken))).toContain(
      '813.54 Leaf Five-Four\nCatalog path incomplete: data error',
    );
    const fldObjEmpty: fldObjAnalysisItem = {
      ...FLD_OBJ_BASE,
      fldObjBiblio: {
        ...FLD_OBJ_BASE.fldObjBiblio,
        fldStrDewey: null,
        fldBooDeweyVerified: false,
        fldStrDeweyTitleEn: null,
        fldArrDeweyPath: [],
      },
    };
    expect(fncConvTexts(fncRunRender(fldObjEmpty))).toContain(
      'No Dewey code found',
    );
  });

  test('expandable wrapper toggles the detail', () => {
    let fldObjRoot!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      fldObjRoot = ReactTestRenderer.create(
        React.createElement(vwResultDetailExpandable, {
          fldObjStrings: fldObjStringsEn,
          fldObjItem: FLD_OBJ_BASE,
          fldArrSources: FLD_ARR_SOURCES,
        }),
      );
    });
    expect(fncConvTexts(fldObjRoot)).not.toContain('Title');
    const fldObjToggle = fldObjRoot.root.findByType(vwButton);
    ReactTestRenderer.act(() => {
      fldObjToggle.props.actHandOnPress();
    });
    expect(fncConvTexts(fldObjRoot)).toContain('Title');
  });
});
