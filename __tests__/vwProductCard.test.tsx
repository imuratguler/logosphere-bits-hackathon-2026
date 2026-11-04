/**
 * Logosphere BITS — shared product card tests (presentational only).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwProductCard } from '../src/components/vwProductCard';
import { vwText } from '../src/components/vwText';
import type {
  fldObjBibliographicData,
  fldObjProduct,
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
    fldArrContributors: [
      { fldStrPerson: 'Ada Example', fldStrRole: 'Author', fldNumRoleCode: 1 },
    ],
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
  fldObjOverrides: Partial<fldObjProduct> = {},
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
    ...fldObjOverrides,
  };
}

function fncRunRenderCard(
  fldObjProduct: fldObjProduct,
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwProductCard, {
        fldObjProduct,
        fldStrCoverUri: 'https://example.org/cover.jpg',
        fldStrNoCoverTitle: 'No cover yet',
        fldStrNoCoverMessage: 'Add a photo to show the cover here.',
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: product card was not rendered.');
  }
  return fldObjRenderer;
}

function fncRunCoverNodes(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
) {
  return fldObjRenderer.root.findAll(
    fldObjNode => fldObjNode.props.testID === 'product-cover',
  );
}

function fncRunTexts(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
): unknown[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
}

describe('shared product card', () => {
  it('renders cover, title, contributor, print info, and condition', () => {
    const fldObjRenderer = fncRunRenderCard(fncConvArgsToProduct());

    const fldArrCovers = fncRunCoverNodes(fldObjRenderer);
    expect(fldArrCovers.length).toBeGreaterThan(0);
    expect(
      fldArrCovers.map(fldObjNode => fldObjNode.props.source),
    ).toContainEqual({
      uri: 'https://example.org/cover.jpg',
    });
    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('Ada Example — Author');
    expect(fldArrTexts).toContain('Logosphere Press · 2026');
    expect(fldArrTexts).toContain('Good');
    expect(fldArrTexts).not.toContain('No cover yet');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the empty state without a cover', () => {
    const fldObjRenderer = fncRunRenderCard(fncConvArgsToProduct(), {
      fldStrCoverUri: null,
    });

    expect(fncRunCoverNodes(fldObjRenderer).length).toBe(0);
    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('No cover yet');
    expect(fldArrTexts).toContain('Add a photo to show the cover here.');
    expect(fldArrTexts).toContain('The Demo Codex');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('treats a blank cover URI as missing', () => {
    const fldObjRenderer = fncRunRenderCard(fncConvArgsToProduct(), {
      fldStrCoverUri: '   ',
    });

    expect(fncRunCoverNodes(fldObjRenderer).length).toBe(0);
    expect(fncRunTexts(fldObjRenderer)).toContain('No cover yet');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('falls back to the record name when the title is unknown', () => {
    const fldObjRenderer = fncRunRenderCard(
      fncConvArgsToProduct({}, { fldStrTitle: null }),
    );

    expect(fncRunTexts(fldObjRenderer)).toContain('Demo record');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('skips unknown optional lines without placeholders', () => {
    const fldObjRenderer = fncRunRenderCard(
      fncConvArgsToProduct(
        {},
        {
          fldArrContributors: null,
          fldStrPublisher: null,
          fldNumPublicationYear: null,
          fldStrEdition: null,
          fldStrCondition: null,
        },
      ),
      { fldStrCoverUri: null },
    );

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('The Demo Codex');
    expect(fldArrTexts).toContain('No cover yet');
    expect(fldArrTexts.length).toBe(3);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders price and sale slots in fixed positions', () => {
    const fldObjRenderer = fncRunRenderCard(fncConvArgsToProduct(), {
      fldObjPriceSlot: React.createElement(vwText, {
        fldStrVariant: 'body',
        children: 'PRICE-SLOT',
      }),
      fldObjSaleSlot: React.createElement(vwText, {
        fldStrVariant: 'body',
        children: 'SALE-SLOT',
      }),
    });

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('PRICE-SLOT');
    expect(fldArrTexts).toContain('SALE-SLOT');
    expect(fldArrTexts.indexOf('PRICE-SLOT')).toBeLessThan(
      fldArrTexts.indexOf('SALE-SLOT'),
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
