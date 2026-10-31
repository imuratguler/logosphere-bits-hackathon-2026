/**
 * Logosphere BITS — shared move tree and atomic moves tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query and
 * RPC contract: no network. Row values are public, non-secret
 * fixtures in the shape of supabase/seed.sql.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiGetDemoMoveTree,
  srvApiMergeDemoCollections,
  srvApiMoveDemoCollections,
  srvApiMoveDemoProductsToCollection,
  srvApiMoveDemoProductsToSet,
  srvApiMoveDemoSets,
} from '../src/services/srvDemoMove';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';
const fldStrSeedSession = 'session-for-tests';

function fncConvFakeMoveClient(fldObjScript: {
  fldObjLists?: Record<string, unknown>;
  fldObjSingles?: Record<string, unknown>;
  fldObjRpcQueue?: { data: unknown; error: unknown }[];
  fldObjListError?: { table: string; message: string };
}) {
  const fldArrBuilders: Record<string, jest.Mock>[] = [];
  const fldObjRpc = jest.fn();
  (fldObjScript.fldObjRpcQueue ?? []).forEach(fldObjEntry => {
    fldObjRpc.mockResolvedValueOnce({
      data: fldObjEntry.data,
      error: fldObjEntry.error,
    });
  });
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    const fldArrEq: [string, unknown][] = [];
    const fldObjBuilder: Record<string, jest.Mock> = {};
    fldObjBuilder.select = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.eq = jest
      .fn()
      .mockImplementation((fldStrKey: string, fldObjValue: unknown) => {
        fldArrEq.push([fldStrKey, fldObjValue]);
        return fldObjBuilder;
      });
    fldObjBuilder.in = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.order = jest.fn().mockReturnValue(fldObjBuilder);
    fldObjBuilder.maybeSingle = jest.fn(() => {
      const fldObjIdEq = fldArrEq.find(([fldStrKey]) => fldStrKey === 'id');
      const fldStrKey = `${fldStrTable}:${String(fldObjIdEq?.[1] ?? '')}`;
      return Promise.resolve({
        data: fldObjScript.fldObjSingles?.[fldStrKey] ?? null,
        error: null,
      });
    });
    fldObjBuilder.then = jest.fn(
      (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) => {
        if (
          fldObjScript.fldObjListError !== undefined &&
          fldObjScript.fldObjListError.table === fldStrTable
        ) {
          return Promise.resolve({
            data: null,
            error: { message: fldObjScript.fldObjListError.message },
          }).then(fldObjResolve, fldObjReject);
        }
        return Promise.resolve({
          data: fldObjScript.fldObjLists?.[fldStrTable] ?? [],
          error: null,
        }).then(fldObjResolve, fldObjReject);
      },
    );
    fldArrBuilders.push(fldObjBuilder);
    return fldObjBuilder;
  });
  return {
    fldObjClient: { from: fldObjFrom, rpc: fldObjRpc } as unknown as Omit<
      SupabaseClient,
      'auth'
    > as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
    fldArrBuilders,
  };
}

describe('shared move tree and atomic moves', () => {
  it('returns the workspace nodes with their sets and products', async () => {
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          {
            id: fldStrSeedLibrary,
            name: 'Demo Library',
            kind: 'library',
            parent_id: null,
          },
          {
            id: fldStrSeedCollection,
            name: 'Manuscripts',
            kind: 'collection',
            parent_id: fldStrSeedLibrary,
          },
        ],
        sets: [
          {
            id: fldStrSeedSet,
            name: 'First Editions',
            collection_id: fldStrSeedCollection,
          },
        ],
        products: [
          {
            id: '66666666-6666-6666-6666-666666666601',
            collection_id: fldStrSeedCollection,
            set_id: fldStrSeedSet,
          },
          {
            id: '66666666-6666-6666-6666-666666666602',
            collection_id: fldStrSeedCollection,
            set_id: null,
          },
        ],
      },
    });

    const fldObjTree = await srvApiGetDemoMoveTree(
      fldObjFake.fldObjClient,
      fldStrSeedWorkspace,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('nodes');
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('sets');
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('products');
    expect(fldObjTree).toEqual({
      fldArrNodes: [
        {
          fldStrId: fldStrSeedLibrary,
          fldStrName: 'Demo Library',
          fldStrKind: 'library',
          fldStrParentId: null,
        },
        {
          fldStrId: fldStrSeedCollection,
          fldStrName: 'Manuscripts',
          fldStrKind: 'collection',
          fldStrParentId: fldStrSeedLibrary,
        },
      ],
      fldArrSets: [
        {
          fldStrId: fldStrSeedSet,
          fldStrName: 'First Editions',
          fldStrCollectionId: fldStrSeedCollection,
        },
      ],
      fldArrProducts: [
        {
          fldStrId: '66666666-6666-6666-6666-666666666601',
          fldStrCollectionId: fldStrSeedCollection,
          fldStrSetId: fldStrSeedSet,
        },
        {
          fldStrId: '66666666-6666-6666-6666-666666666602',
          fldStrCollectionId: fldStrSeedCollection,
          fldStrSetId: null,
        },
      ],
    });
  });

  it('skips the sets read when no collections exist', async () => {
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          {
            id: fldStrSeedLibrary,
            name: 'Demo Library',
            kind: 'library',
            parent_id: null,
          },
        ],
      },
    });

    const fldObjTree = await srvApiGetDemoMoveTree(
      fldObjFake.fldObjClient,
      fldStrSeedWorkspace,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('nodes');
    expect(fldObjTree.fldArrSets).toEqual([]);
    expect(fldObjTree.fldArrProducts).toEqual([]);
  });

  it('surfaces tree read errors naming the table', async () => {
    const fldObjFake = fncConvFakeMoveClient({
      fldObjListError: { table: 'nodes', message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoMoveTree(fldObjFake.fldObjClient, fldStrSeedWorkspace),
    ).rejects.toThrow('nodes read failed: demo db down');
  });

  it('rejects malformed tree rows and unknown kinds', async () => {
    const fldObjBadRow = fncConvFakeMoveClient({
      fldObjLists: { nodes: [{ id: fldStrSeedLibrary }] },
    });
    await expect(
      srvApiGetDemoMoveTree(fldObjBadRow.fldObjClient, fldStrSeedWorkspace),
    ).rejects.toThrow('need id + name + kind + parent_id');

    const fldObjBadKind = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          {
            id: fldStrSeedLibrary,
            name: 'Demo Library',
            kind: 'workspace',
            parent_id: null,
          },
        ],
      },
    });
    await expect(
      srvApiGetDemoMoveTree(fldObjBadKind.fldObjClient, fldStrSeedWorkspace),
    ).rejects.toThrow('need id + name + kind + parent_id');
  });

  it('moves each collection with its fresh version', async () => {
    const fldStrOther = '55555555-5555-5555-5555-555555555555';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjSingles: {
        [`nodes:${fldStrSeedCollection}`]: {
          id: fldStrSeedCollection,
          version: 3,
        },
        [`nodes:${fldStrOther}`]: { id: fldStrOther, version: 1 },
      },
      fldObjRpcQueue: [
        {
          data: { id: fldStrSeedCollection, version: 4 },
          error: null,
        },
        { data: { id: fldStrOther, version: 2 }, error: null },
      ],
    });

    const fldArrMoved = await srvApiMoveDemoCollections(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedCollection, fldStrOther],
      fldStrSeedLibrary,
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(2);
    expect(fldObjFake.fldObjRpc).toHaveBeenNthCalledWith(
      1,
      'demo_move_collection',
      {
        p_session_id: fldStrSeedSession,
        p_collection_id: fldStrSeedCollection,
        p_expected_version: 3,
        p_target_parent_id: fldStrSeedLibrary,
      },
    );
    expect(fldObjFake.fldObjRpc).toHaveBeenNthCalledWith(
      2,
      'demo_move_collection',
      expect.objectContaining({
        p_collection_id: fldStrOther,
        p_expected_version: 1,
      }),
    );
    expect(fldArrMoved).toEqual([
      { fldStrId: fldStrSeedCollection, fldNumVersion: 4 },
      { fldStrId: fldStrOther, fldNumVersion: 2 },
    ]);
  });

  it('rejects blank move arguments', async () => {
    const fldObjFake = fncConvFakeMoveClient({});

    await expect(
      srvApiMoveDemoCollections(
        fldObjFake.fldObjClient,
        '  ',
        [fldStrSeedCollection],
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('demo session ID is missing or blank');
    await expect(
      srvApiMoveDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [],
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('needs at least one item');
    await expect(
      srvApiMoveDemoSets(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedSet],
        '  ',
      ),
    ).rejects.toThrow('demo move target collection ID is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces collection move failures naming the function', async () => {
    const fldObjFailed = fncConvFakeMoveClient({
      fldObjSingles: {
        [`nodes:${fldStrSeedCollection}`]: {
          id: fldStrSeedCollection,
          version: 3,
        },
      },
      fldObjRpcQueue: [
        { data: null, error: { message: 'demo version conflict' } },
      ],
    });
    await expect(
      srvApiMoveDemoCollections(
        fldObjFailed.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection],
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('demo_move_collection failed: demo version conflict');

    const fldObjBadShape = fncConvFakeMoveClient({
      fldObjSingles: {
        [`nodes:${fldStrSeedCollection}`]: {
          id: fldStrSeedCollection,
          version: 3,
        },
      },
      fldObjRpcQueue: [{ data: { id: fldStrSeedCollection }, error: null }],
    });
    await expect(
      srvApiMoveDemoCollections(
        fldObjBadShape.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection],
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('need id + version');
  });

  it('moves a set with its exact member versions', async () => {
    const fldStrMemberA = '66666666-6666-6666-6666-666666666601';
    const fldStrMemberB = '66666666-6666-6666-6666-666666666602';
    const fldStrTarget = '77777777-7777-7777-7777-777777777777';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjSingles: {
        [`sets:${fldStrSeedSet}`]: { id: fldStrSeedSet, version: 2 },
      },
      fldObjLists: {
        products: [
          { id: fldStrMemberA, version: 1 },
          { id: fldStrMemberB, version: 5 },
        ],
      },
      fldObjRpcQueue: [
        {
          data: {
            set: { id: fldStrSeedSet, version: 3 },
            products: [
              { id: fldStrMemberA, version: 2 },
              { id: fldStrMemberB, version: 6 },
            ],
          },
          error: null,
        },
      ],
    });

    const fldArrMoved = await srvApiMoveDemoSets(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedSet],
      fldStrTarget,
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('demo_move_set', {
      p_session_id: fldStrSeedSession,
      p_set_id: fldStrSeedSet,
      p_expected_version: 2,
      p_target_collection_id: fldStrTarget,
      p_product_items: [
        { id: fldStrMemberA, version: 1 },
        { id: fldStrMemberB, version: 5 },
      ],
    });
    expect(fldArrMoved).toEqual([
      { fldStrId: fldStrSeedSet, fldNumVersion: 3 },
    ]);
  });

  it('reports a vanished set before calling the move', async () => {
    const fldObjFake = fncConvFakeMoveClient({});

    await expect(
      srvApiMoveDemoSets(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedSet],
        fldStrSeedCollection,
      ),
    ).rejects.toThrow('demo set was not found');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('bulk moves products to another collection', async () => {
    const fldStrProductA = '66666666-6666-6666-6666-666666666601';
    const fldStrProductB = '66666666-6666-6666-6666-666666666602';
    const fldStrTarget = '77777777-7777-7777-7777-777777777777';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        products: [
          { id: fldStrProductA, version: 1 },
          { id: fldStrProductB, version: 2 },
        ],
      },
      fldObjRpcQueue: [
        {
          data: [
            { id: fldStrProductA, version: 2 },
            { id: fldStrProductB, version: 3 },
          ],
          error: null,
        },
      ],
    });

    const fldArrMoved = await srvApiMoveDemoProductsToCollection(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrProductA, fldStrProductB],
      fldStrTarget,
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_bulk_move_products',
      {
        p_session_id: fldStrSeedSession,
        p_target_collection_id: fldStrTarget,
        p_items: [
          { id: fldStrProductA, version: 1 },
          { id: fldStrProductB, version: 2 },
        ],
      },
    );
    expect(fldArrMoved).toEqual([
      { fldStrId: fldStrProductA, fldNumVersion: 2 },
      { fldStrId: fldStrProductB, fldNumVersion: 3 },
    ]);
  });

  it('rejects a bulk move when a product is missing', async () => {
    const fldStrMissing = '66666666-6666-6666-6666-666666666699';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: { products: [] },
    });

    await expect(
      srvApiMoveDemoProductsToCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrMissing],
        fldStrSeedCollection,
      ),
    ).rejects.toThrow(`unknown product ${fldStrMissing}`);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('assigns only changed products to the target set', async () => {
    const fldStrProductA = '66666666-6666-6666-6666-666666666601';
    const fldStrProductB = '66666666-6666-6666-6666-666666666602';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        products: [
          { id: fldStrProductA, version: 1, set_id: null },
          { id: fldStrProductB, version: 2, set_id: fldStrSeedSet },
        ],
      },
      fldObjRpcQueue: [
        { data: [{ id: fldStrProductA, version: 2 }], error: null },
      ],
    });

    const fldArrMoved = await srvApiMoveDemoProductsToSet(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrProductA, fldStrProductB],
      fldStrSeedSet,
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('demo_set_membership', {
      p_session_id: fldStrSeedSession,
      p_set_id: fldStrSeedSet,
      p_items: [{ id: fldStrProductA, version: 1 }],
    });
    expect(fldArrMoved).toEqual([
      { fldStrId: fldStrProductA, fldNumVersion: 2 },
    ]);
  });

  it('skips the membership call when every product is assigned', async () => {
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        products: [
          {
            id: '66666666-6666-6666-6666-666666666601',
            version: 1,
            set_id: fldStrSeedSet,
          },
        ],
      },
    });

    const fldArrMoved = await srvApiMoveDemoProductsToSet(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      ['66666666-6666-6666-6666-666666666601'],
      fldStrSeedSet,
    );

    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
    expect(fldArrMoved).toEqual([]);
  });

  it('merges collections into an existing target', async () => {
    const fldStrSourceB = '55555555-5555-5555-5555-555555555555';
    const fldStrTarget = '77777777-7777-7777-7777-777777777777';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSourceB, version: 1 },
        ],
      },
      fldObjRpcQueue: [
        {
          data: {
            target: { id: fldStrTarget, version: 5 },
            moved: { collections: 1, sets: 2, products: 3 },
            deleted: [fldStrSeedCollection, fldStrSourceB],
          },
          error: null,
        },
      ],
    });

    const fldObjSummary = await srvApiMergeDemoCollections(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedCollection, fldStrSourceB],
      { fldStrKind: 'existing', fldStrCollectionId: fldStrTarget },
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_collections',
      {
        p_session_id: fldStrSeedSession,
        p_source_ids: [fldStrSeedCollection, fldStrSourceB],
        p_expected_versions: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSourceB, version: 1 },
        ],
        p_target_collection_id: fldStrTarget,
        p_new_name: null,
        p_new_parent_id: null,
      },
    );
    expect(fldObjSummary).toEqual({
      fldObjTarget: { fldStrId: fldStrTarget, fldNumVersion: 5 },
      fldNumCollections: 1,
      fldNumSets: 2,
      fldNumProducts: 3,
      fldArrDeleted: [fldStrSeedCollection, fldStrSourceB],
    });
  });

  it('merges collections into a newly named target', async () => {
    const fldStrSourceB = '55555555-5555-5555-5555-555555555555';
    const fldStrTarget = '77777777-7777-7777-7777-777777777777';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSourceB, version: 1 },
        ],
      },
      fldObjRpcQueue: [
        {
          data: {
            target: { id: fldStrTarget, version: 1 },
            moved: { collections: 0, sets: 1, products: 0 },
            deleted: [fldStrSeedCollection, fldStrSourceB],
          },
          error: null,
        },
      ],
    });

    await srvApiMergeDemoCollections(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      [fldStrSeedCollection, fldStrSourceB],
      {
        fldStrKind: 'new',
        fldStrName: 'Combined',
        fldStrParentId: fldStrSeedLibrary,
      },
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_merge_collections',
      expect.objectContaining({
        p_target_collection_id: null,
        p_new_name: 'Combined',
        p_new_parent_id: fldStrSeedLibrary,
      }),
    );
  });

  it('rejects merge calls without two sources or a name', async () => {
    const fldObjFake = fncConvFakeMoveClient({});

    await expect(
      srvApiMergeDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection],
        { fldStrKind: 'existing', fldStrCollectionId: fldStrSeedLibrary },
      ),
    ).rejects.toThrow('needs at least two collections');
    await expect(
      srvApiMergeDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection, '55555555-5555-5555-5555-555555555555'],
        {
          fldStrKind: 'new',
          fldStrName: '  ',
          fldStrParentId: fldStrSeedLibrary,
        },
      ),
    ).rejects.toThrow('merge name is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a merge when a source is missing', async () => {
    const fldStrMissing = '55555555-5555-5555-5555-555555555599';
    const fldObjFake = fncConvFakeMoveClient({
      fldObjLists: { nodes: [{ id: fldStrSeedCollection, version: 2 }] },
    });

    await expect(
      srvApiMergeDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection, fldStrMissing],
        { fldStrKind: 'existing', fldStrCollectionId: fldStrSeedLibrary },
      ),
    ).rejects.toThrow(`unknown collection ${fldStrMissing}`);
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces merge failures naming the function', async () => {
    const fldStrSourceB = '55555555-5555-5555-5555-555555555555';
    const fldObjFailed = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSourceB, version: 1 },
        ],
      },
      fldObjRpcQueue: [
        { data: null, error: { message: 'demo merge target is not empty' } },
      ],
    });
    await expect(
      srvApiMergeDemoCollections(
        fldObjFailed.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection, fldStrSourceB],
        { fldStrKind: 'existing', fldStrCollectionId: fldStrSeedLibrary },
      ),
    ).rejects.toThrow(
      'demo_merge_collections failed: demo merge target is not empty',
    );

    const fldObjBadShape = fncConvFakeMoveClient({
      fldObjLists: {
        nodes: [
          { id: fldStrSeedCollection, version: 2 },
          { id: fldStrSourceB, version: 1 },
        ],
      },
      fldObjRpcQueue: [{ data: { target: null }, error: null }],
    });
    await expect(
      srvApiMergeDemoCollections(
        fldObjBadShape.fldObjClient,
        fldStrSeedSession,
        [fldStrSeedCollection, fldStrSourceB],
        { fldStrKind: 'existing', fldStrCollectionId: fldStrSeedLibrary },
      ),
    ).rejects.toThrow('need moved counts and deleted ids');
  });
});
