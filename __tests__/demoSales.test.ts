/**
 * Logosphere BITS — demo sale moves tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so the fake
 * client records the RPC contract with no network: preview maps
 * the scope counts (collections, sets, products, missing,
 * non-USD, the deduped USD total) and apply maps the
 * applied/skipped/tag outcome. Expected tag/active values ride
 * along so racing updates conflict instead of overwriting.
 * Seed values are public, non-secret.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiApplySale,
  srvApiGetDemoSaleFlags,
  srvApiPreviewSale,
} from '../src/services/srvDemoSales';

const fldStrSeedSession = 'session-for-tests';
const fldStrSeedProduct = '55555555-5555-5555-5555-555555555501';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';

function fncConvFakeRpcClient(fldObjResult: { data: unknown; error: unknown }) {
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: fldObjResult.data,
    error: fldObjResult.error,
  });
  return {
    fldObjClient: { rpc: fldObjRpc } as unknown as SupabaseClient,
    fldObjRpc,
  };
}

describe('demo sale preview', () => {
  it('maps the scope counts and the deduped USD total', async () => {
    const { fldObjClient, fldObjRpc } = fncConvFakeRpcClient({
      data: {
        collections: 2,
        sets: 3,
        products: 7,
        missing: 1,
        non_usd: 1,
        total: 9050,
        currency: 'usd',
      },
      error: null,
    });

    const fldObjPreview = await srvApiPreviewSale(
      fldObjClient,
      fldStrSeedSession,
      'collection',
      fldStrSeedCollection,
    );

    expect(fldObjRpc).toHaveBeenCalledWith('demo_sale_preview', {
      p_session_id: fldStrSeedSession,
      p_subject: 'collection',
      p_subject_id: fldStrSeedCollection,
    });
    expect(fldObjPreview).toEqual({
      fldNumCollections: 2,
      fldNumSets: 3,
      fldNumProducts: 7,
      fldNumMissing: 1,
      fldNumNonUsd: 1,
      fldNumTotalMinor: 9050,
      fldStrCurrency: 'USD',
    });
  });

  it('defaults bad counts to zero and the currency to USD', async () => {
    const { fldObjClient } = fncConvFakeRpcClient({
      data: {
        collections: -1,
        sets: 'three',
        products: null,
        missing: 1.5,
        total: '9050',
        currency: '  ',
      },
      error: null,
    });

    const fldObjPreview = await srvApiPreviewSale(
      fldObjClient,
      fldStrSeedSession,
      'set',
      fldStrSeedSet,
    );

    expect(fldObjPreview).toEqual({
      fldNumCollections: 0,
      fldNumSets: 0,
      fldNumProducts: 0,
      fldNumMissing: 0,
      fldNumNonUsd: 0,
      fldNumTotalMinor: 0,
      fldStrCurrency: 'USD',
    });
  });

  it('rejects blank session and subject ids before any RPC', async () => {
    const { fldObjClient, fldObjRpc } = fncConvFakeRpcClient({
      data: {},
      error: null,
    });

    await expect(
      srvApiPreviewSale(fldObjClient, '  ', 'product', fldStrSeedProduct),
    ).rejects.toThrow('session ID is missing');
    await expect(
      srvApiPreviewSale(fldObjClient, fldStrSeedSession, 'product', ' '),
    ).rejects.toThrow('subject ID is missing');
    expect(fldObjRpc).not.toHaveBeenCalled();
  });

  it('wraps RPC failures and unexpected shapes', async () => {
    const fldObjFailing = fncConvFakeRpcClient({
      data: null,
      error: { message: 'boom' },
    });
    await expect(
      srvApiPreviewSale(
        fldObjFailing.fldObjClient,
        fldStrSeedSession,
        'product',
        fldStrSeedProduct,
      ),
    ).rejects.toThrow('sale preview failed');

    const fldObjShapeless = fncConvFakeRpcClient({
      data: 'nope',
      error: null,
    });
    await expect(
      srvApiPreviewSale(
        fldObjShapeless.fldObjClient,
        fldStrSeedSession,
        'product',
        fldStrSeedProduct,
      ),
    ).rejects.toThrow('unexpected shape');
  });
});

describe('demo sale apply', () => {
  it('sends the tag, the move, and the expected values', async () => {
    const { fldObjClient, fldObjRpc } = fncConvFakeRpcClient({
      data: { applied: 1, skipped: 0, tag: 1999 },
      error: null,
    });

    const fldObjDone = await srvApiApplySale(
      fldObjClient,
      fldStrSeedSession,
      'product',
      fldStrSeedProduct,
      {
        fldNumTagMinor: 1999,
        fldBooActive: true,
        fldNumExpectedTagMinor: 1500,
        fldBooExpectedActive: false,
        fldBooCheckExpected: true,
      },
    );

    expect(fldObjRpc).toHaveBeenCalledWith('demo_apply_sale', {
      p_session_id: fldStrSeedSession,
      p_subject: 'product',
      p_subject_id: fldStrSeedProduct,
      p_tag_price: 1999,
      p_is_active: true,
      p_expected_tag: 1500,
      p_expected_active: false,
      p_check_expected: true,
    });
    expect(fldObjDone).toEqual({
      fldNumApplied: 1,
      fldNumSkipped: 0,
      fldNumTagMinor: 1999,
    });
  });

  it('leaves the expected check off unless the caller asks', async () => {
    const { fldObjClient, fldObjRpc } = fncConvFakeRpcClient({
      data: { applied: 4, skipped: 2, tag: null },
      error: null,
    });

    const fldObjDone = await srvApiApplySale(
      fldObjClient,
      fldStrSeedSession,
      'collection',
      fldStrSeedCollection,
      { fldNumTagMinor: null, fldBooActive: false },
    );

    expect(fldObjRpc).toHaveBeenCalledWith('demo_apply_sale', {
      p_session_id: fldStrSeedSession,
      p_subject: 'collection',
      p_subject_id: fldStrSeedCollection,
      p_tag_price: null,
      p_is_active: false,
      p_expected_tag: null,
      p_expected_active: null,
      p_check_expected: false,
    });
    expect(fldObjDone).toEqual({
      fldNumApplied: 4,
      fldNumSkipped: 2,
      fldNumTagMinor: null,
    });
  });

  it('rejects non-positive tag prices before any RPC', async () => {
    const { fldObjClient, fldObjRpc } = fncConvFakeRpcClient({
      data: {},
      error: null,
    });

    await expect(
      srvApiApplySale(
        fldObjClient,
        fldStrSeedSession,
        'product',
        fldStrSeedProduct,
        {
          fldNumTagMinor: 0,
          fldBooActive: true,
        },
      ),
    ).rejects.toThrow('tag price must be positive');
    expect(fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces the server race conflict to the caller', async () => {
    const { fldObjClient } = fncConvFakeRpcClient({
      data: null,
      error: { message: 'sale changed, reload' },
    });

    await expect(
      srvApiApplySale(
        fldObjClient,
        fldStrSeedSession,
        'product',
        fldStrSeedProduct,
        {
          fldNumTagMinor: 1999,
          fldBooActive: true,
          fldBooCheckExpected: true,
        },
      ),
    ).rejects.toThrow('sale changed, reload');
  });
});

function fncConvFakeChainClient(fldObjResult: {
  data: unknown;
  error: unknown;
}) {
  const fldObjFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjResult.data,
        error: fldObjResult.error,
      }).then(fldObjResolve, fldObjReject),
  }));
  return {
    fldObjClient: { from: fldObjFrom } as unknown as SupabaseClient,
    fldObjFrom,
  };
}

describe('demo sale flags', () => {
  it('maps the newest row per product', async () => {
    const { fldObjClient, fldObjFrom } = fncConvFakeChainClient({
      data: [
        {
          product_id: fldStrSeedProduct,
          is_active: false,
          created_at: '2026-11-04T12:00:00Z',
        },
        {
          product_id: fldStrSeedProduct,
          is_active: true,
          created_at: '2026-11-04T11:00:00Z',
        },
        {
          product_id: '55555555-5555-5555-5555-555555555502',
          is_active: true,
          created_at: '2026-11-04T12:00:00Z',
        },
      ],
      error: null,
    });

    const fldObjFlags = await srvApiGetDemoSaleFlags(fldObjClient, [
      fldStrSeedProduct,
      '55555555-5555-5555-5555-555555555502',
      '55555555-5555-5555-5555-555555555503',
    ]);

    expect(fldObjFrom).toHaveBeenCalledWith('sale_transactions');
    expect(fldObjFlags).toEqual({
      [fldStrSeedProduct]: false,
      '55555555-5555-5555-5555-555555555502': true,
    });
  });

  it('returns an empty map without reading when no ids are given', async () => {
    const { fldObjClient, fldObjFrom } = fncConvFakeChainClient({
      data: [],
      error: null,
    });

    await expect(srvApiGetDemoSaleFlags(fldObjClient, [])).resolves.toEqual({});
    expect(fldObjFrom).not.toHaveBeenCalled();
  });

  it('throws when the read fails', async () => {
    const { fldObjClient } = fncConvFakeChainClient({
      data: null,
      error: { message: 'flags offline' },
    });

    await expect(
      srvApiGetDemoSaleFlags(fldObjClient, [fldStrSeedProduct]),
    ).rejects.toThrow('flags offline');
  });

  it('throws when a row misses its flag', async () => {
    const { fldObjClient } = fncConvFakeChainClient({
      data: [
        {
          product_id: fldStrSeedProduct,
          created_at: '2026-11-04T12:00:00Z',
        },
      ],
      error: null,
    });

    await expect(
      srvApiGetDemoSaleFlags(fldObjClient, [fldStrSeedProduct]),
    ).rejects.toThrow('need product_id + is_active');
  });
});
