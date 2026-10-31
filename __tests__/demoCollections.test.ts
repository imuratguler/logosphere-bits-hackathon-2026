/**
 * Logosphere BITS — shared workspace collections tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract:
 * no network. Row values follow supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiCreateDemoCollection,
  srvApiGetDemoCollections,
} from '../src/services/srvDemoCollections';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';

function fncConvFakeClient(fldObjResult: { data: unknown; error: unknown }) {
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

describe('shared workspace collections', () => {
  it('returns the parent collections in order', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [
        { id: '33333333-3333-3333-3333-333333333333', name: 'Manuscripts' },
      ],
      error: null,
    });

    const fldArrCollections = await srvApiGetDemoCollections(
      fldObjFake.fldObjClient,
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('nodes');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith('id, name');
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'workspace_id',
      fldStrSeedWorkspace,
    );
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'kind',
      'collection',
    );
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'parent_id',
      fldStrSeedLibrary,
    );
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
    expect(fldArrCollections).toEqual([
      {
        fldStrId: '33333333-3333-3333-3333-333333333333',
        fldStrName: 'Manuscripts',
      },
    ]);
  });

  it('surfaces read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('nodes read failed: demo db down');
  });

  it('rejects malformed rows', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: '33333333-3333-3333-3333-333333333333' }],
      error: null,
    });

    await expect(
      srvApiGetDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('need id + name');
  });

  it('returns an empty list when no collections exist', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
      ),
    ).resolves.toEqual([]);
  });

  it('rejects a blank workspace id before any call', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoCollections(
        fldObjFake.fldObjClient,
        '   ',
        fldStrSeedLibrary,
      ),
    ).rejects.toThrow('demo workspace ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('rejects a blank parent id before any call', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoCollections(
        fldObjFake.fldObjClient,
        fldStrSeedWorkspace,
        '',
      ),
    ).rejects.toThrow('demo parent ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });
});

type fldObjCreateFakeData = {
  parentRow: unknown;
  sets: unknown;
  products: unknown;
  rpcData: unknown;
  rpcError?: unknown;
};

function fncConvFakeCreateClient(fldObjData: fldObjCreateFakeData) {
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: fldObjData.rpcData,
    error: fldObjData.rpcError ?? null,
  });
  const fldObjFrom = jest.fn().mockImplementation((fldStrTable: string) => {
    if (fldStrTable === 'nodes') {
      const fldObjParentBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: fldObjData.parentRow, error: null }),
      };
      return fldObjParentBuilder;
    }
    const fldObjRows =
      fldStrTable === 'sets' ? fldObjData.sets : fldObjData.products;
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({ data: fldObjRows, error: null }).then(
          fldObjResolve,
          fldObjReject,
        ),
    };
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
  };
}

describe('shared workspace collection creation', () => {
  const fldStrSeedSession = 'session-for-tests';
  const fldStrNewCollectionId = '66666666-6666-6666-6666-666666666666';
  const fldObjLibraryParent = {
    kind: 'library',
    workspace_id: fldStrSeedWorkspace,
  };
  const fldObjEmptyCollectionParent = {
    kind: 'collection',
    workspace_id: fldStrSeedWorkspace,
  };

  it('creates under a library parent without leaf reads', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjLibraryParent,
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    const fldStrNewId = await srvApiCreateDemoCollection(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
      '  Manuscripts  ',
    );

    expect(fldStrNewId).toBe(fldStrNewCollectionId);
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalledWith('sets');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalledWith('products');
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_create_collection',
      {
        p_session_id: fldStrSeedSession,
        p_workspace_id: fldStrSeedWorkspace,
        p_parent_id: fldStrSeedLibrary,
        p_name: 'Manuscripts',
      },
    );
  });

  it('creates under an empty collection parent', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjEmptyCollectionParent,
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    const fldStrNewId = await srvApiCreateDemoCollection(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedWorkspace,
      '33333333-3333-3333-3333-333333333333',
      'Incunabula',
    );

    expect(fldStrNewId).toBe(fldStrNewCollectionId);
    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_create_collection',
      expect.objectContaining({ p_name: 'Incunabula' }),
    );
  });

  it('rejects a parent holding sets before any RPC call', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjEmptyCollectionParent,
      sets: [{ id: '44444444-4444-4444-4444-444444444444' }],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        '33333333-3333-3333-3333-333333333333',
        'Incunabula',
      ),
    ).rejects.toThrow('already holds sets or products');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a parent holding products before any RPC call', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjEmptyCollectionParent,
      sets: [],
      products: [{ id: '55555555-5555-5555-5555-555555555501' }],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        '33333333-3333-3333-3333-333333333333',
        'Incunabula',
      ),
    ).rejects.toThrow('already holds sets or products');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects an unknown parent', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: null,
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        '99999999-9999-9999-9999-999999999999',
        'Incunabula',
      ),
    ).rejects.toThrow('demo parent was not found');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a parent of the wrong kind', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: { kind: 'product', workspace_id: fldStrSeedWorkspace },
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        '55555555-5555-5555-5555-555555555501',
        'Incunabula',
      ),
    ).rejects.toThrow('demo parent cannot hold collections');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a parent outside the workspace', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: {
        kind: 'library',
        workspace_id: '99999999-9999-9999-9999-999999999999',
      },
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
        'Incunabula',
      ),
    ).rejects.toThrow('demo parent is outside the workspace');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects blank inputs before any call', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjLibraryParent,
      sets: [],
      products: [],
      rpcData: fldStrNewCollectionId,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        '   ',
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
        'Incunabula',
      ),
    ).rejects.toThrow('demo session ID is missing or blank');
    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
        '   ',
      ),
    ).rejects.toThrow('collection name is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces RPC errors naming the function', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjLibraryParent,
      sets: [],
      products: [],
      rpcData: null,
      rpcError: { message: 'demo session expired' },
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
        'Incunabula',
      ),
    ).rejects.toThrow('demo_create_collection failed: demo session expired');
  });

  it('rejects a malformed RPC id', async () => {
    const fldObjFake = fncConvFakeCreateClient({
      parentRow: fldObjLibraryParent,
      sets: [],
      products: [],
      rpcData: null,
    });

    await expect(
      srvApiCreateDemoCollection(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fldStrSeedLibrary,
        'Incunabula',
      ),
    ).rejects.toThrow('need the collection id');
  });
});
