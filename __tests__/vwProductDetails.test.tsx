/**
 * Logosphere BITS — shared product details tests (presentational only).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwProductDetails } from '../src/components/vwProductDetails';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import type {
  fldObjBibliographicData,
  fldObjProduct,
  fldObjSourceEvidence,
} from '../src/types/typModels';

function fncConvArgsToBiblio(
  fldObjOverrides: Partial<fldObjBibliographicData> = {},
): fldObjBibliographicData {
  return {
    fldStrTitle: 'The Demo Codex',
    fldStrSubtitle: null,
    fldStrIsbn10: null,
    fldStrIsbn13: null,
    fldStrPublisher: 'Logosphere Press',
    fldStrPublicationLanguage: null,
    fldStrEdition: null,
    fldStrPrinting: null,
    fldNumPublicationYear: 2026,
    fldArrContributors: [{ fldStrPerson: 'Ada Example', fldStrRole: 'Author' }],
    fldNumOriginalPublicationYear: null,
    fldNumPageCount: null,
    fldStrPublicationType: null,
    fldObjDescription: null,
    fldStrBinding: null,
    fldStrDustJacket: null,
    fldStrPaper: null,
    fldStrDimensions: null,
    fldStrCondition: 'Good',
    fldStrSignature: null,
    fldStrDedication: null,
    ...fldObjOverrides,
  };
}

function fncConvArgsToProduct(
  fldObjBiblioOverrides: Partial<fldObjBibliographicData> = {},
): fldObjProduct {
  return {
    fldStrId: '55555555-5555-5555-5555-555555555501',
    fldStrName: 'Demo record',
    fldDatCreatedAt: '2026-10-31T00:00:00.000Z',
    fldDatUpdatedAt: '2026-10-31T00:00:00.000Z',
    fldStrCollectionId: '33333333-3333-3333-3333-333333333333',
    fldStrSetId: null,
    fldObjBibliographicData: fncConvArgsToBiblio(fldObjBiblioOverrides),
    fldObjPricing: null,
    fldObjSaleStatus: null,
  };
}

function fncRunRenderDetails(
  fldObjProduct: fldObjProduct,
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwProductDetails, {
        fldObjProduct,
        fldArrSources: [],
        fldObjStrings: fldObjStringsEn.fldObjProductDetails,
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: product details were not rendered.');
  }
  return fldObjRenderer;
}

function fncRunTexts(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
): unknown[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
}

describe('shared product details', () => {
  it('skips blank strings like nulls', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldStrSubtitle: '',
        fldStrPublisher: '',
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).not.toContain('Subtitle');
    expect(fldArrTexts).not.toContain('Publisher');
    expect(fldArrTexts).toContain('The Demo Codex');
  });

  it('renders the identity group with labels, skipping nulls', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldStrIsbn13: '978-0-00000-00-0',
        fldStrEdition: 'Second',
        fldNumPageCount: 320,
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Identity');
    expect(fldArrTexts).toContain('Title');
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('ISBN-13');
    expect(fldArrTexts).toContain('978-0-00000-00-0');
    expect(fldArrTexts).toContain('Publisher');
    expect(fldArrTexts).toContain('Publication year');
    expect(fldArrTexts).toContain('2026');
    expect(fldArrTexts).toContain('Edition');
    expect(fldArrTexts).toContain('Page count');
    expect(fldArrTexts).toContain('320');
    expect(fldArrTexts).not.toContain('Subtitle');
    expect(fldArrTexts).not.toContain('ISBN-10');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('falls back to the record name when the title is unknown', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({ fldStrTitle: null }),
    );

    expect(fncRunTexts(fldObjRenderer)).toContain('Demo record');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('lists contributors as role-name pairs', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldArrContributors: [
          { fldStrPerson: 'Ada Example', fldStrRole: 'Author' },
          { fldStrPerson: 'Ada Example', fldStrRole: 'Illustrator' },
          { fldStrPerson: 'Bo Test', fldStrRole: 'Editor' },
        ],
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Contributors');
    expect(fldArrTexts).toContain('Ada Example — Author');
    expect(fldArrTexts).toContain('Ada Example — Illustrator');
    expect(fldArrTexts).toContain('Bo Test — Editor');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the description with explained language and translations', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldObjDescription: {
          fldStrText: 'Örnek açıklama.',
          fldStrOriginalLanguage: 'tr',
          fldStrTextTr: 'Örnek açıklama.',
          fldStrTextEn: 'Example description.',
        },
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Description');
    expect(fldArrTexts).toContain('Original text (Turkish)');
    expect(fldArrTexts).toContain('Örnek açıklama.');
    expect(fldArrTexts).toContain('Turkish translation');
    expect(fldArrTexts).toContain('English translation');
    expect(fldArrTexts).toContain('Example description.');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('explains unknown language codes inside their label', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldStrPublicationLanguage: 'en',
        fldObjDescription: {
          fldStrText: 'Exemple de description.',
          fldStrOriginalLanguage: 'fr',
          fldStrTextTr: null,
          fldStrTextEn: null,
        },
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Publication language');
    expect(fldArrTexts).toContain('English');
    expect(fldArrTexts).toContain('Original text (fr)');
    expect(fldArrTexts).not.toContain('Turkish translation');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders physical and signature groups, skipping empty groups', () => {
    const fldObjRenderer = fncRunRenderDetails(
      fncConvArgsToProduct({
        fldArrContributors: [],
        fldStrBinding: 'Hardcover',
        fldStrDimensions: '24 cm',
        fldStrSignature: 'A. Example',
      }),
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Physical condition');
    expect(fldArrTexts).toContain('Binding');
    expect(fldArrTexts).toContain('Dimensions');
    expect(fldArrTexts).toContain('Condition');
    expect(fldArrTexts).toContain('Signature & dedication');
    expect(fldArrTexts).toContain('Signature');
    expect(fldArrTexts).not.toContain('Contributors');
    expect(fldArrTexts).not.toContain('Description');
    expect(fldArrTexts).not.toContain('Dedication');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the no-sources note when no evidence is recorded', () => {
    const fldObjRenderer = fncRunRenderDetails(fncConvArgsToProduct());

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Sources');
    expect(fldArrTexts).toContain('No sources recorded');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders recorded source evidence with its parts', () => {
    const fldArrSources: fldObjSourceEvidence[] = [
      {
        fldStrName: 'National Catalog',
        fldStrUrl: 'https://example.org/catalog/42',
        fldDatAccessedAt: '2026-10-31',
        fldStrField: 'Title',
      },
      {
        fldStrName: 'Archive slip',
        fldStrUrl: null,
        fldDatAccessedAt: null,
        fldStrField: null,
      },
    ];
    const fldObjRenderer = fncRunRenderDetails(fncConvArgsToProduct(), {
      fldArrSources,
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Sources');
    expect(fldArrTexts).not.toContain('No sources recorded');
    expect(fldArrTexts).toContain('National Catalog');
    expect(fldArrTexts).toContain('https://example.org/catalog/42');
    expect(fldArrTexts).toContain('Accessed');
    expect(fldArrTexts).toContain('2026-10-31');
    expect(fldArrTexts).toContain('Field');
    expect(fldArrTexts).toContain('Title');
    expect(fldArrTexts).toContain('Archive slip');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
