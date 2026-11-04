/**
 * Logosphere BITS — shared result detail tests.
 *
 * Six titled sections with Field | Value rows, coded
 * labels with codes, hidden empties, and the Dewey line
 * states (verified / unverified / none).
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
    fldStrEdition: null,
    fldStrPrinting: null,
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
      fldNumReplacementNew: null,
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

function fncConvTexts(
  fldObjRoot: ReactTestRenderer.ReactTestRenderer,
): string[] {
  return fldObjRoot.root
    .findAllByType(vwText)
    .map(fldObjNode => String(fldObjNode.props.children));
}

describe('vwResultDetail', () => {
  test('renders six sections with coded labels', () => {
    let fldObjRoot!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      fldObjRoot = ReactTestRenderer.create(
        React.createElement(vwResultDetail, {
          fldObjStrings: fldObjStringsEn,
          fldObjItem: FLD_OBJ_BASE,
          fldArrSources: FLD_ARR_SOURCES,
        }),
      );
    });
    const fldArrTexts = fncConvTexts(fldObjRoot);
    for (const fldStrSection of [
      'Publication',
      'People',
      'Content',
      'Physical copy',
      'Identifiers & classification',
      'Evidence & price',
    ]) {
      expect(fldArrTexts).toContain(fldStrSection);
    }
    expect(fldArrTexts).toContain('Title | The Demo Codex');
    expect(fldArrTexts).toContain('Demo Author | Author · 1');
    expect(fldArrTexts).toContain('Cover | Hardcover · 2');
    expect(fldArrTexts).toContain('Condition | Good · 3');
    expect(fldArrTexts).toContain('ISBN-13 | 9783161484100');
    expect(fldArrTexts).toContain(
      'Dewey | 813.54 · verified · American fiction',
    );
  });

  test('hides empty rows and reports missing Dewey', () => {
    const fldObjEmpty: fldObjAnalysisItem = {
      ...FLD_OBJ_BASE,
      fldObjBiblio: {
        ...FLD_OBJ_BASE.fldObjBiblio,
        fldStrTitle: null,
        fldStrPublisher: null,
        fldStrPublicationLanguage: null,
        fldNumPublicationYear: null,
        fldArrContributors: [],
        fldStrBinding: null,
        fldNumCoverCode: null,
        fldStrCondition: null,
        fldNumConditionCode: null,
        fldStrIsbn13: null,
        fldStrDewey: null,
        fldBooDeweyVerified: false,
        fldStrDeweyTitleEn: null,
      },
    };
    let fldObjRoot!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      fldObjRoot = ReactTestRenderer.create(
        React.createElement(vwResultDetail, {
          fldObjStrings: fldObjStringsEn,
          fldObjItem: fldObjEmpty,
          fldArrSources: FLD_ARR_SOURCES,
        }),
      );
    });
    const fldArrTexts = fncConvTexts(fldObjRoot);
    expect(fldArrTexts).not.toContain('Publication');
    expect(fldArrTexts).not.toContain('People');
    expect(fldArrTexts).toContain('Dewey | No Dewey code found');
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
    expect(fncConvTexts(fldObjRoot)).not.toContain('Publication');
    const fldObjToggle = fldObjRoot.root.findByType(vwButton);
    ReactTestRenderer.act(() => {
      fldObjToggle.props.actHandOnPress();
    });
    expect(fncConvTexts(fldObjRoot)).toContain('Publication');
  });
});
