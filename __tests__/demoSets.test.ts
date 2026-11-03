/**
 * Logosphere BITS — shared collection sets tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query
 * contract: no network. Row values follow supabase/seed.sql (public,
 * non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiCreateDemoSet,
  srvApiGetDemoProductCovers,
  srvApiGetDemoProductPhotoCounts,
  srvApiGetDemoSetProducts,
  srvApiGetDemoSets,
} from '../src/services/srvDemoSets';

const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedSession = 'session-for-tests';
const fldStrNewSetId = '77777777-7777-7777-7777-777777777777';

function fncConvFakeListClient(fldObjResult: {
  data: unknown;
  error: unknown;
}) {
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) => Promise.resolve(fldObjResult).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  return {
    fldObjClient: { from: fldObjFrom } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
  };
}

function fncConvFakeCreateClient(fldObjData: {
  parentRow: unknown;
  rpcData: unknown;
  rpcError?: unknown;
}) {
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: fldObjData.rpcData,
    error: fldObjData.rpcError ?? null,
  });
  const fldObjFrom = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: fldObjData.parentRow, error: null }),
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
    } as unknown as SupabaseClient,
    fldObjRpc,
  };
}

describe('shared collection sets', () => {
  it('returns the collection sets in order', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: [
        { id: '44444444-4444-4444-4444-444444444444', name: 'First Editions' },
      ],
      error: null,
    });

    const fldArrSets = await srvApiGetDemoSets(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('sets');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith('id, name');
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'collection_id',
      fldStrSeedCollection,
    );
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
    expect(fldArrSets).toEqual([
      {
        fldStrId: '44444444-4444-4444-4444-444444444444',
        fldStrName: 'First Editions',
      },
    ]);
  });

  it('surfaces set read errors naming the table', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoSets(fldObjFake.fldObjClient, fldStrSeedCollection),
    ).rejects.toThrow('sets read failed: demo db down');
  });

  it('rejects malformed set rows', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: [{ id: '44444444-4444-4444-4444-444444444444' }],
      error: null,
    });

    await expect(
      srvApiGetDemoSets(fldObjFake.fldObjClient, fldStrSeedCollection),
    ).rejects.toThrow('need id + name');
  });

  it('returns an empty list when no sets exist', async () => {
    const fldObjFake = fncConvFakeListClient({ data: [], error: null });

    await expect(
      srvApiGetDemoSets(fldObjFake.fldObjClient, fldStrSeedCollection),
    ).resolves.toEqual([]);
  });

  it('rejects a blank collection id before any call', async () => {
    const fldObjFake = fncConvFakeListClient({ data: [], error: null });

    await expect(
      srvApiGetDemoSets(fldObjFake.fldObjClient, '  '),
    ).rejects.toThrow('demo collection ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });
});

describe('shared set products', () => {
  it('returns the collection products with their set links', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: [
        {
          id: '55555555-5555-5555-5555-555555555501',
          name: 'The Demo Codex',
          set_id: '44444444-4444-4444-4444-444444444444',
        },
        {
          id: '55555555-5555-5555-5555-555555555503',
          name: 'Loose Leaf Poems',
          set_id: null,
        },
      ],
      error: null,
    });

    const fldArrProducts = await srvApiGetDemoSetProducts(
      fldObjFake.fldObjClient,
      fldStrSeedCollection,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('products');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith(
      'id, name, set_id',
    );
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'collection_id',
      fldStrSeedCollection,
    );
    expect(fldArrProducts).toEqual([
      {
        fldStrId: '55555555-5555-5555-5555-555555555501',
        fldStrName: 'The Demo Codex',
        fldStrSetId: '44444444-4444-4444-4444-444444444444',
      },
      {
        fldStrId: '55555555-5555-5555-5555-555555555503',
        fldStrName: 'Loose Leaf Poems',
        fldStrSetId: null,
      },
    ]);
  });

  it('surfaces product read errors naming the table', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoSetProducts(fldObjFake.fldObjClient, fldStrSeedCollection),
    ).rejects.toThrow('products read failed: demo db down');
  });

  it('rejects malformed product rows', async () => {
    const fldObjFake = fncConvFakeListClient({
      data: [{ id: '55555555-5555-5555-5555-555555555501' }],
      error: null,
    });

    await expect(
      srvApiGetDemoSetProducts(fldObjFake.fldObjClient, fldStrSeedCollection),
    ).rejects.toThrow('need id + name + set_id');
  });

  it('rejects a blank collection id before any call', async () => {
    const fldObjFake = fncConvFakeListClient({ data: [], error: null });

    await expect(
      srvApiGetDemoSetProducts(fldObjFake.fldObjClient, ''),
    ).rejects.toThrow('demo collection ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });
});

describe('shared set creation', () => {
  it('creates under a collection parent', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'collection' },
      rpcData: fldStrNewSetId,
    });

    const fldStrNewId = await srvApiCreateDemoSet(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedCollection,
      '  Signed Copies  ',
    );

    expect(fldStrNewId).toBe(fldStrNewSetId);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('demo_create_set', {
      p_session_id: fldStrSeedSession,
      p_collection_id: fldStrSeedCollection,
      p_name: 'Signed Copies',
    });
  });

  it('rejects a parent that is not a collection', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'library' },
      rpcData: fldStrNewSetId,
    });

    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        '22222222-2222-2222-2222-222222222222',
        'Signed Copies',
      ),
    ).rejects.toThrow('demo set parent must be a collection');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects an unknown parent', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: null,
      rpcData: fldStrNewSetId,
    });

    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        '99999999-9999-9999-9999-999999999999',
        'Signed Copies',
      ),
    ).rejects.toThrow('demo collection was not found');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects blank inputs before any call', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'collection' },
      rpcData: fldStrNewSetId,
    });

    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedCollection,
        '   ',
      ),
    ).rejects.toThrow('set name is missing or blank');
    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        '',
        fldStrSeedCollection,
        'Signed Copies',
      ),
    ).rejects.toThrow('demo session ID is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces RPC errors naming the function', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'collection' },
      rpcData: null,
      rpcError: { message: 'demo session expired' },
    });

    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedCollection,
        'Signed Copies',
      ),
    ).rejects.toThrow('demo_create_set failed: demo session expired');
  });

  it('rejects a malformed RPC id', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'collection' },
      rpcData: null,
    });

    await expect(
      srvApiCreateDemoSet(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedCollection,
        'Signed Copies',
      ),
    ).rejects.toThrow('need the set id');
  });

  it('groups photo counts per product from one read', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [
            { product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
            { product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
            { product_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
          ],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;
    const fldArrIds = [
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
    ];

    const fldObjCounts = await srvApiGetDemoProductPhotoCounts(
      fldObjClient,
      fldArrIds,
    );

    expect(fldObjFrom).toHaveBeenCalledWith('product_images');
    expect(fldObjBuilder.select).toHaveBeenCalledWith('product_id');
    expect(fldObjBuilder.in).toHaveBeenCalledWith('product_id', fldArrIds);
    expect(fldObjCounts).toEqual({
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': 2,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': 1,
      'cccccccc-cccc-cccc-cccc-cccccccccccc': 0,
    });
  });

  it('skips the read when no product ids are given', async () => {
    const fldObjFrom = jest.fn();
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoProductPhotoCounts(fldObjClient, []),
    ).resolves.toEqual({});
    expect(fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces photo count read errors naming the table', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: null,
          error: { message: 'demo db down' },
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoProductPhotoCounts(fldObjClient, [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ]),
    ).rejects.toThrow('product_images read failed: demo db down');
  });

  it('rejects malformed photo count rows', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [{ product_id: 42 }],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoProductPhotoCounts(fldObjClient, [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ]),
    ).rejects.toThrow('need product_id');
  });

  it('maps each product to its first cover url from one read', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [
            {
              product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              file_path: 'product-photos/p/aaa/cover.jpg',
              sort_order: 0,
            },
            {
              product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              file_path: 'p/aaa/second.jpg',
              sort_order: 1,
            },
            {
              product_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              file_path: 'p/bbb/only.jpg',
              sort_order: null,
            },
          ],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjGetPublicUrl = jest.fn((fldStrName: string) => ({
      data: { publicUrl: `https://demo.test/${fldStrName}` },
    }));
    const fldObjClient = {
      from: fldObjFrom,
      storage: {
        from: jest.fn().mockReturnValue({ getPublicUrl: fldObjGetPublicUrl }),
      },
    } as unknown as SupabaseClient;
    const fldArrIds = [
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
    ];

    const fldObjCovers = await srvApiGetDemoProductCovers(
      fldObjClient,
      fldArrIds,
    );

    expect(fldObjFrom).toHaveBeenCalledWith('product_images');
    expect(fldObjBuilder.select).toHaveBeenCalledWith(
      'product_id, file_path, sort_order',
    );
    expect(fldObjBuilder.in).toHaveBeenCalledWith('product_id', fldArrIds);
    expect(fldObjBuilder.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
    expect(fldObjCovers).toEqual({
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':
        'https://demo.test/p/aaa/cover.jpg',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb':
        'https://demo.test/p/bbb/only.jpg',
    });
  });

  it('skips the cover read when no product ids are given', async () => {
    const fldObjFrom = jest.fn();
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(srvApiGetDemoProductCovers(fldObjClient, [])).resolves.toEqual(
      {},
    );
    expect(fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces cover read errors naming the table', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: null,
          error: { message: 'demo db down' },
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoProductCovers(fldObjClient, [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ]),
    ).rejects.toThrow('product_images read failed: demo db down');
  });

  it('rejects malformed cover rows', async () => {
    const fldObjBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [{ product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
    const fldObjClient = { from: fldObjFrom } as unknown as SupabaseClient;

    await expect(
      srvApiGetDemoProductCovers(fldObjClient, [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ]),
    ).rejects.toThrow('need product_id + file_path');
  });
});
