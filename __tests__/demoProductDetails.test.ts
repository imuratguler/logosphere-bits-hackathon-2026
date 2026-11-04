/**
 * Logosphere BITS — saved-product detail read tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so the fake
 * client records the query contract per table: no network. Row
 * values follow supabase/seed.sql (public, non-secret) with
 * price fixtures shaped like the price tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvApiGetDemoProductDetails } from '../src/services/srvDemoProductDetails';

const fldStrSeedProduct = '55555555-5555-5555-5555-555555555501';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';

type fldObjTableServe = {
  fldArrRows?: unknown[];
  fldObjSingle?: unknown;
  fldObjError?: { message: string } | null;
};

function fncConvFakeDetailsClient(
  fldObjTables: Record<string, fldObjTableServe>,
) {
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    const fldObjServe = fldObjTables[fldStrTable] ?? {};
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: fldObjServe.fldObjSingle ?? null,
        error: fldObjServe.fldObjError ?? null,
      }),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: fldObjServe.fldArrRows ?? [],
          error: fldObjServe.fldObjError ?? null,
        }).then(fldObjResolve, fldObjReject),
    };
    return fldObjBuilder;
  });
  const fldObjGetPublicUrl = jest.fn((fldStrName: string) => ({
    data: { publicUrl: `https://cdn.test/${fldStrName}` },
  }));
  const fldObjStorageFrom = jest.fn(() => ({
    getPublicUrl: fldObjGetPublicUrl,
  }));
  const fldObjClient = {
    from: fldObjFrom,
    storage: { from: fldObjStorageFrom },
  } as unknown as SupabaseClient;
  return { fldObjClient, fldObjFrom, fldObjStorageFrom, fldObjGetPublicUrl };
}

function fncConvSeedTables(): Record<string, fldObjTableServe> {
  return {
    products: {
      fldObjSingle: {
        id: fldStrSeedProduct,
        collection_id: fldStrSeedCollection,
        set_id: null,
        name: 'The Demo Codex',
        created_at: '2026-10-28T00:00:00Z',
        updated_at: '2026-10-28T00:00:00Z',
      },
    },
    product_bibliography: {
      fldObjSingle: {
        title: 'The Demo Codex',
        subtitle: null,
        isbn10: null,
        isbn13: null,
        publisher: 'Logosphere Press',
        publication_language: 'en',
        edition: null,
        printing: null,
        publication_year: 2026,
        original_publication_year: null,
        page_count: null,
        publication_type: null,
        description_text: null,
        description_original_language: null,
        description_text_tr: null,
        description_text_en: null,
        binding: null,
        dust_jacket: null,
        paper: null,
        dimensions: null,
        condition: 'good',
        signature: null,
        dedication: null,
      },
    },
    product_person_roles: {
      fldArrRows: [
        {
          role: 'author',
          sort_order: 0,
          persons: { name: 'Demo Author' },
        },
        {
          role: 'editor',
          sort_order: 1,
          persons: [{ name: 'Demo Editor' }],
        },
      ],
    },
    product_images: {
      fldArrRows: [
        {
          id: 'img-cover',
          sort_order: 0,
          file_path: `product-photos/p/${fldStrSeedProduct}/img-cover.jpg`,
          rotation_degrees: 0,
        },
      ],
    },
    price_estimates: {
      fldArrRows: [
        {
          replacement_new: 1999,
          market_min: 500,
          market_max: 1500,
          market_recommended: 900,
          market_median: 800,
          currency: 'USD',
          price_basis: 'evidence',
          source_price: null,
          source_currency: null,
          rate_date: null,
        },
      ],
    },
    price_observations: {
      fldArrRows: [
        {
          id: 'obs-1',
          amount: 750,
          currency: 'USD',
          observed_at: null,
          url: null,
          source_price: null,
          source_currency: null,
          rate_date: null,
          source: 'kitapyurdu',
          market: 'new',
        },
      ],
    },
    sale_transactions: {
      fldArrRows: [
        {
          id: 'sale-1',
          tag_price: 1200,
          is_active: true,
          transaction_scope: 'item',
          transaction_at: null,
        },
      ],
    },
  };
}

describe('saved-product detail read', () => {
  it('composes product, bibliography, contributors, images, prices, sale', async () => {
    const fldObjFake = fncConvFakeDetailsClient(fncConvSeedTables());

    const fldObjDetails = await srvApiGetDemoProductDetails(
      fldObjFake.fldObjClient,
      fldStrSeedProduct,
    );

    expect(fldObjDetails.fldObjProduct.fldStrName).toBe('The Demo Codex');
    expect(
      fldObjDetails.fldObjProduct.fldObjBibliographicData.fldStrPublisher,
    ).toBe('Logosphere Press');
    expect(
      fldObjDetails.fldObjProduct.fldObjBibliographicData.fldArrContributors,
    ).toEqual([
      { fldStrPerson: 'Demo Author', fldStrRole: 'author' },
      { fldStrPerson: 'Demo Editor', fldStrRole: 'editor' },
    ]);
    expect(fldObjDetails.fldArrImages).toEqual([
      {
        fldStrId: 'img-cover',
        fldNumSortOrder: 0,
        fldStrFilePath: `product-photos/p/${fldStrSeedProduct}/img-cover.jpg`,
        fldStrUrl: `https://cdn.test/p/${fldStrSeedProduct}/img-cover.jpg`,
        fldNumRotationDegrees: 0,
      },
    ]);
    expect(fldObjDetails.fldObjProduct.fldObjPricing).toEqual({
      fldNumReplacementNew: 1999,
      fldNumMarketMin: 500,
      fldNumMarketMax: 1500,
      fldNumMarketRecommended: 900,
      fldNumMarketMedian: 800,
      fldStrCurrency: 'USD',
      fldNumSourcePrice: null,
      fldStrSourceCurrency: null,
      fldDatRateDate: null,
      fldStrPriceBasis: 'evidence',
    });
    expect(fldObjDetails.fldArrObservations).toEqual([
      {
        fldStrId: 'obs-1',
        fldNumAmount: 750,
        fldStrCurrency: 'USD',
        fldDatObservedAt: null,
        fldStrUrl: null,
        fldNumSourcePrice: null,
        fldStrSourceCurrency: null,
        fldDatRateDate: null,
        fldStrSource: 'kitapyurdu',
        fldStrMarket: 'new',
      },
    ]);
    expect(fldObjDetails.fldObjProduct.fldObjSaleStatus).toEqual({
      fldNumTagPrice: 1200,
      fldBooIsActive: true,
      fldStrTransactionScope: 'item',
      fldDatTransactionAt: null,
      fldStrTransactionId: 'sale-1',
    });
    expect(fldObjFake.fldObjStorageFrom).toHaveBeenCalledWith('product-photos');
    expect(fldObjFake.fldObjGetPublicUrl).toHaveBeenCalledWith(
      `p/${fldStrSeedProduct}/img-cover.jpg`,
    );
  });

  it('rejects blank product ids', async () => {
    const fldObjFake = fncConvFakeDetailsClient(fncConvSeedTables());

    await expect(
      srvApiGetDemoProductDetails(fldObjFake.fldObjClient, '  '),
    ).rejects.toThrow('product ID is missing or blank');
  });

  it('rejects missing products', async () => {
    const fldObjTables = fncConvSeedTables();
    fldObjTables.products = { fldObjSingle: null };
    const fldObjFake = fncConvFakeDetailsClient(fldObjTables);

    await expect(
      srvApiGetDemoProductDetails(fldObjFake.fldObjClient, fldStrSeedProduct),
    ).rejects.toThrow('product is missing');
  });

  it('reports read failures per table', async () => {
    const fldObjTables = fncConvSeedTables();
    fldObjTables.product_images = {
      fldArrRows: [],
      fldObjError: { message: 'boom' },
    };
    const fldObjFake = fncConvFakeDetailsClient(fldObjTables);

    await expect(
      srvApiGetDemoProductDetails(fldObjFake.fldObjClient, fldStrSeedProduct),
    ).rejects.toThrow('images read failed: boom');
  });

  it('keeps unknown bibliography null without fabricating', async () => {
    const fldObjTables = fncConvSeedTables();
    fldObjTables.product_bibliography = { fldObjSingle: null };
    fldObjTables.product_person_roles = { fldArrRows: [] };
    const fldObjFake = fncConvFakeDetailsClient(fldObjTables);

    const fldObjDetails = await srvApiGetDemoProductDetails(
      fldObjFake.fldObjClient,
      fldStrSeedProduct,
    );

    expect(
      fldObjDetails.fldObjProduct.fldObjBibliographicData.fldStrTitle,
    ).toBe(null);
    expect(
      fldObjDetails.fldObjProduct.fldObjBibliographicData.fldArrContributors,
    ).toBe(null);
  });

  it('keeps missing prices and sale null with empty observations', async () => {
    const fldObjTables = fncConvSeedTables();
    fldObjTables.price_estimates = { fldArrRows: [] };
    fldObjTables.price_observations = { fldArrRows: [] };
    fldObjTables.sale_transactions = { fldArrRows: [] };
    const fldObjFake = fncConvFakeDetailsClient(fldObjTables);

    const fldObjDetails = await srvApiGetDemoProductDetails(
      fldObjFake.fldObjClient,
      fldStrSeedProduct,
    );

    expect(fldObjDetails.fldObjProduct.fldObjPricing).toBe(null);
    expect(fldObjDetails.fldArrObservations).toEqual([]);
    expect(fldObjDetails.fldObjProduct.fldObjSaleStatus).toBe(null);
  });

  it('rejects malformed rows', async () => {
    const fldObjTables = fncConvSeedTables();
    fldObjTables.price_observations = { fldArrRows: [{ id: 'obs-x' }] };
    const fldObjFake = fncConvFakeDetailsClient(fldObjTables);

    await expect(
      srvApiGetDemoProductDetails(fldObjFake.fldObjClient, fldStrSeedProduct),
    ).rejects.toThrow('observations returned an unexpected shape');
  });
});
