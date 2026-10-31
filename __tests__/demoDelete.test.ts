/**
 * Logosphere BITS — shared atomic deletes tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query and
 * RPC contract: no network. Row values are public, non-secret
 * fixtures in the shape of supabase/seed.sql.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiDeleteDemoCollections,
  srvApiDeleteDemoProducts,
  srvApiDeleteDemoSets,
  srvApiGetDemoMediaCounts,
} from '../src/services/srvDemoDelete';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';
const fldStrSeedProduct = '66666666-6666-6666-6666-666666666661';
const fldStrSeedSession = 'session-for-tests';

function fncConvFakeDeleteClient(fldObjScript: {
  fldObjLists?: Record<string, unknown>;
  fldObjRpcQueue?: { data: unknown; error: unknown }[];
}) {
  const fldObjRpc = jest.fn();
  (fldObjScript.fldObjRpcQueue ?? []).forEach(fldObjEntry => {
    fldObjRpc.mockResolvedValueOnce({
      data: fldObjEntry.data,
      error: fldObjEntry.error,
    });
  });
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    const fldObjBuilder: Record<string, jest.Mock> = {};
    fldObjBuilder.select = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.eq = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.in = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.order = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.then = jest.fn(
      (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: fldObjScript.fldObjLists?.[fldStrTable] ?? [],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    );
    return fldObjBuilder;
  });
  return {
    fldObjClient: { from: fldObjFrom, rpc: fldObjRpc } as unknown as Omit<
      SupabaseClient,
      'auth'
    > as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
  };
}

describe('shared atomic deletes', () => {
  it('counts photos and voices for the preview', async () => {
    const fldObjFake = fncConvFakeDeleteClient({
      fldObjLists: {
        product_images: [{ id: 'img-1' }, { id: 'img-2' }],
        product_voice_notes: [{ id: 'voice-1' }],
      },
    });

    await expect(
      srvApiGetDemoMediaCounts(fldObjFake.fldObjClient, []),
    ).resolves.toEqual({ fldNumPhotos: 0, fldNumVoices: 0 });
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();

    await expect(
      srvApiGetDemoMediaCounts(fldObjFake.fldObjClient, [fldStrSeedProduct]),
    ).resolves.toEqual({ fldNumPhotos: 2, fldNumVoices: 1 });
  });

  it('deletes collections with their contents', async () => {
    const fldObjFake = fncConvFakeDeleteClient({
      fldObjLists: {
        nodes: [
          {
            id: fldStrSeedCollection,
            name: 'Manuscripts',
            kind: 'collection',
            parent_id: fldStrSeedLibrary,
            version: 2,
          },
        ],
        sets: [
          {
            id: fldStrSeedSet,
            name: 'First Editions',
            collection_id: fldStrSeedCollection,
            version: 1,
          },
        ],
        products: [
          {
            id: fldStrSeedProduct,
            collection_id: fldStrSeedCollection,
            set_id: fldStrSeedSet,
            version: 3,
          },
        ],
      },
      fldObjRpcQueue: [
        {
          data: {
            deleted: {
              collections: 1,
              sets: 1,
              products: 1,
              photos: 2,
              voices: 1,
            },
          },
          error: null,
        },
      ],
    });

    const fldObjSummary = await srvApiDeleteDemoCollections(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedWorkspace,
      [fldStrSeedCollection],
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_delete_collections',
      {
        p_session_id: fldStrSeedSession,
        p_collection_ids: [fldStrSeedCollection],
        p_expected_versions: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSeedSet, version: 1 },
          { id: fldStrSeedProduct, version: 3 },
        ],
      },
    );
    expect(fldObjSummary).toEqual({
      fldNumCollections: 1,
      fldNumSets: 1,
      fldNumProducts: 1,
      fldNumPhotos: 2,
      fldNumVoices: 1,
    });
  });

  it('rejects collection deletes without sources and surfaces failures', async () => {
    const fldObjFake = fncConvFakeDeleteClient({});

    await expect(
      srvApiDeleteDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        [],
      ),
    ).rejects.toThrow('needs at least one collection');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();

    const fldObjBlocked = fncConvFakeDeleteClient({
      fldObjLists: {
        nodes: [
          {
            id: fldStrSeedCollection,
            name: 'Manuscripts',
            kind: 'collection',
            parent_id: fldStrSeedLibrary,
            version: 2,
          },
        ],
        sets: [],
        products: [],
      },
      fldObjRpcQueue: [
        {
          data: null,
          error: { message: 'demo collection has sub-collections' },
        },
      ],
    });
    await expect(
      srvApiDeleteDemoCollections(
        fldObjBlocked.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        [fldStrSeedCollection],
      ),
    ).rejects.toThrow(
      'demo_delete_collections failed: demo collection has sub-collections',
    );
  });

  it('deletes sets with their member products', async () => {
    const fldObjFake = fncConvFakeDeleteClient({
      fldObjLists: {
        sets: [{ id: fldStrSeedSet, version: 1 }],
        products: [{ id: fldStrSeedProduct, version: 3 }],
      },
      fldObjRpcQueue: [
        {
          data: {
            deleted: {
              collections: 0,
              sets: 1,
              products: 1,
              photos: 0,
              voices: 0,
            },
          },
          error: null,
        },
      ],
    });

    const fldObjSummary = await srvApiDeleteDemoSets(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedSet],
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_delete_sets',
      expect.objectContaining({
        p_set_ids: [fldStrSeedSet],
        p_expected_versions: [
          { id: fldStrSeedSet, version: 1 },
          { id: fldStrSeedProduct, version: 3 },
        ],
      }),
    );
    expect(fldObjSummary.fldNumSets).toBe(1);
    expect(fldObjSummary.fldNumProducts).toBe(1);
  });

  it('deletes products and rejects unknown ids', async () => {
    const fldStrMissing = '66666666-6666-6666-6666-666666666699';
    const fldObjFake = fncConvFakeDeleteClient({
      fldObjLists: {
        products: [{ id: fldStrSeedProduct, version: 3 }],
      },
      fldObjRpcQueue: [
        {
          data: {
            deleted: {
              collections: 0,
              sets: 0,
              products: 1,
              photos: 1,
              voices: 0,
            },
          },
          error: null,
        },
      ],
    });

    const fldObjSummary = await srvApiDeleteDemoProducts(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedProduct],
    );
    expect(fldObjSummary.fldNumProducts).toBe(1);
    expect(fldObjSummary.fldNumPhotos).toBe(1);

    await expect(
      srvApiDeleteDemoProducts(fldObjFake.fldObjClient, fldStrSeedSession, [
        fldStrMissing,
      ]),
    ).rejects.toThrow(`unknown product ${fldStrMissing}`);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed delete summaries', async () => {
    const fldObjFake = fncConvFakeDeleteClient({
      fldObjLists: {
        products: [{ id: fldStrSeedProduct, version: 3 }],
      },
      fldObjRpcQueue: [{ data: { deleted: null }, error: null }],
    });

    await expect(
      srvApiDeleteDemoProducts(fldObjFake.fldObjClient, fldStrSeedSession, [
        fldStrSeedProduct,
      ]),
    ).rejects.toThrow('need deleted counts');
  });
});
