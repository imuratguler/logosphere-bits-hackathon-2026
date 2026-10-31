/**
 * Logosphere BITS — shared demo scope tests (hermetic).
 *
 * The services import only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract
 * (table, columns, ordering, limit): no network. Row values come from
 * supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiCreateDemoCollection,
  srvApiGetDemoCollections,
} from '../src/services/srvDemoCollections';
import { srvApiGetDemoLibraries } from '../src/services/srvDemoLibraries';
import { srvApiGetDemoPersonas } from '../src/services/srvDemoPersonas';
import {
  srvApiGetDemoSetProducts,
  srvApiGetDemoSets,
} from '../src/services/srvDemoSets';
import { srvApiGetDemoWorkspace } from '../src/services/srvDemoWorkspace';

const fldStrSeedPersonaPublicLibrary = '10000000-0000-4000-8000-000000000001';
const fldStrSeedPersonaHighSchool = '10000000-0000-4000-8000-000000000002';
const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';

type fldObjFakeBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    fldObjResolve: (fldObjValue: unknown) => void,
    fldObjReject: (fldObjReason?: unknown) => void,
  ) => Promise<unknown>;
};

type fldObjFakeClient = {
  fldObjClient: SupabaseClient;
  fldObjFrom: jest.Mock;
  fldObjBuilder: fldObjFakeBuilder;
  fldObjRpc: jest.Mock;
};

function fncConvFakeClient(
  fldObjResult: {
    data: unknown;
    error: unknown;
  },
  fldObjSingle: unknown = {
    kind: 'library',
    workspace_id: fldStrSeedWorkspace,
  },
): fldObjFakeClient {
  const fldObjBuilder: fldObjFakeBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: fldObjSingle,
      error: null,
    }),
    then: (fldObjResolve, fldObjReject) =>
      Promise.resolve(fldObjResult).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  const fldObjRpc = jest.fn();
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
    fldObjRpc,
  };
}

describe('shared demo scope', () => {
  it('returns the seed persona list in sort order', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [
        {
          id: fldStrSeedPersonaPublicLibrary,
          display_name: 'Public Library',
          sort_order: 0,
        },
        {
          id: fldStrSeedPersonaHighSchool,
          display_name: 'High School',
          sort_order: 1,
        },
      ],
      error: null,
    });

    const fldArrPersonas = await srvApiGetDemoPersonas(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('demo_personas');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith(
      'id, display_name, sort_order',
    );
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
    expect(fldArrPersonas).toEqual([
      {
        fldStrId: fldStrSeedPersonaPublicLibrary,
        fldStrDisplayName: 'Public Library',
        fldNumSortOrder: 0,
      },
      {
        fldStrId: fldStrSeedPersonaHighSchool,
        fldStrDisplayName: 'High School',
        fldNumSortOrder: 1,
      },
    ]);
  });

  it('surfaces persona read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoPersonas(fldObjFake.fldObjClient),
    ).rejects.toThrow(
      'demo persona list unavailable (demo_personas read failed: demo db down)',
    );
  });

  it('rejects malformed persona rows', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: 1, display_name: 'Broken', sort_order: 0 }],
      error: null,
    });

    await expect(
      srvApiGetDemoPersonas(fldObjFake.fldObjClient),
    ).rejects.toThrow('need id + display_name + sort_order');
  });

  it('returns an empty persona list when no rows exist', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoPersonas(fldObjFake.fldObjClient),
    ).resolves.toEqual([]);
  });

  it('returns the shared workspace row', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      error: null,
    });

    const fldObjWorkspace = await srvApiGetDemoWorkspace(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('workspaces');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith('id, name');
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('created_at', {
      ascending: true,
    });
    expect(fldObjFake.fldObjBuilder.limit).toHaveBeenCalledWith(1);
    expect(fldObjWorkspace).toEqual({
      fldStrId: fldStrSeedWorkspace,
      fldStrName: 'Demo Workspace',
    });
  });

  it('throws when the shared workspace is missing', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoWorkspace(fldObjFake.fldObjClient),
    ).rejects.toThrow('shared demo workspace is missing');
  });

  it('surfaces workspace read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoWorkspace(fldObjFake.fldObjClient),
    ).rejects.toThrow(
      'shared demo workspace unavailable (workspaces read failed: demo db down)',
    );
  });

  it('rejects a malformed workspace row', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: fldStrSeedWorkspace }],
      error: null,
    });

    await expect(
      srvApiGetDemoWorkspace(fldObjFake.fldObjClient),
    ).rejects.toThrow('need id + name');
  });

  it('keeps queries identical across personas and inside public scope', async () => {
    const fldObjFirst = fncConvFakeClient({
      data: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      error: null,
    });
    const fldObjSecond = fncConvFakeClient({
      data: [{ id: fldStrSeedWorkspace, name: 'Demo Workspace' }],
      error: null,
    });
    const fldObjPersonas = fncConvFakeClient({ data: [], error: null });

    await srvApiGetDemoWorkspace(fldObjFirst.fldObjClient);
    await srvApiGetDemoWorkspace(fldObjSecond.fldObjClient);
    await srvApiGetDemoPersonas(fldObjPersonas.fldObjClient);

    expect(srvApiGetDemoWorkspace.length).toBe(1);
    expect(srvApiGetDemoPersonas.length).toBe(1);
    expect(fldObjSecond.fldObjFrom.mock.calls).toEqual(
      fldObjFirst.fldObjFrom.mock.calls,
    );
    expect(fldObjSecond.fldObjBuilder.select.mock.calls).toEqual(
      fldObjFirst.fldObjBuilder.select.mock.calls,
    );
    const fldArrTables = [
      fldObjFirst.fldObjFrom.mock.calls[0][0],
      fldObjSecond.fldObjFrom.mock.calls[0][0],
      fldObjPersonas.fldObjFrom.mock.calls[0][0],
    ];
    expect(fldArrTables.sort()).toEqual([
      'demo_personas',
      'workspaces',
      'workspaces',
    ]);
  });

  it('shows two personas the same libraries', async () => {
    const fldObjRows = [{ id: fldStrSeedLibrary, name: 'Demo Library' }];
    const fldObjFirst = fncConvFakeClient({ data: fldObjRows, error: null });
    const fldObjSecond = fncConvFakeClient({ data: fldObjRows, error: null });

    const fldArrFirst = await srvApiGetDemoLibraries(
      fldObjFirst.fldObjClient,
      fldStrSeedWorkspace,
    );
    const fldArrSecond = await srvApiGetDemoLibraries(
      fldObjSecond.fldObjClient,
      fldStrSeedWorkspace,
    );

    expect(srvApiGetDemoLibraries.length).toBe(2);
    expect(fldArrFirst).toEqual(fldArrSecond);
    expect(fldArrFirst).toEqual([
      { fldStrId: fldStrSeedLibrary, fldStrName: 'Demo Library' },
    ]);
    expect(fldObjSecond.fldObjFrom.mock.calls).toEqual(
      fldObjFirst.fldObjFrom.mock.calls,
    );
    expect(fldObjSecond.fldObjBuilder.eq.mock.calls).toEqual(
      fldObjFirst.fldObjBuilder.eq.mock.calls,
    );
    const fldStrCalls = JSON.stringify([
      fldObjFirst.fldObjFrom.mock.calls,
      fldObjFirst.fldObjBuilder.eq.mock.calls,
    ]);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaPublicLibrary);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaHighSchool);
  });

  it('shows two personas the same collections', async () => {
    const fldObjRows = [{ id: fldStrSeedCollection, name: 'Rare Books' }];
    const fldObjFirst = fncConvFakeClient({ data: fldObjRows, error: null });
    const fldObjSecond = fncConvFakeClient({ data: fldObjRows, error: null });

    const fldArrFirst = await srvApiGetDemoCollections(
      fldObjFirst.fldObjClient,
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
    );
    const fldArrSecond = await srvApiGetDemoCollections(
      fldObjSecond.fldObjClient,
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
    );

    expect(srvApiGetDemoCollections.length).toBe(3);
    expect(fldArrFirst).toEqual(fldArrSecond);
    expect(fldObjSecond.fldObjBuilder.eq.mock.calls).toEqual(
      fldObjFirst.fldObjBuilder.eq.mock.calls,
    );
    const fldStrCalls = JSON.stringify(fldObjFirst.fldObjBuilder.eq.mock.calls);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaPublicLibrary);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaHighSchool);
  });

  it('shows two personas the same sets', async () => {
    const fldObjRows = [{ id: fldStrSeedSet, name: 'First Editions' }];
    const fldObjFirst = fncConvFakeClient({ data: fldObjRows, error: null });
    const fldObjSecond = fncConvFakeClient({ data: fldObjRows, error: null });

    const fldArrFirst = await srvApiGetDemoSets(
      fldObjFirst.fldObjClient,
      fldStrSeedCollection,
    );
    const fldArrSecond = await srvApiGetDemoSets(
      fldObjSecond.fldObjClient,
      fldStrSeedCollection,
    );

    expect(srvApiGetDemoSets.length).toBe(2);
    expect(fldArrFirst).toEqual(fldArrSecond);
    expect(fldObjSecond.fldObjBuilder.eq.mock.calls).toEqual(
      fldObjFirst.fldObjBuilder.eq.mock.calls,
    );
    const fldStrCalls = JSON.stringify(fldObjFirst.fldObjBuilder.eq.mock.calls);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaPublicLibrary);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaHighSchool);
  });

  it('shows two personas the same products', async () => {
    const fldObjRows = [
      {
        id: '55555555-5555-5555-5555-555555555501',
        name: 'The Demo Codex',
        set_id: fldStrSeedSet,
      },
      {
        id: '55555555-5555-5555-5555-555555555503',
        name: 'Loose Leaf Poems',
        set_id: null,
      },
    ];
    const fldObjFirst = fncConvFakeClient({ data: fldObjRows, error: null });
    const fldObjSecond = fncConvFakeClient({ data: fldObjRows, error: null });

    const fldArrFirst = await srvApiGetDemoSetProducts(
      fldObjFirst.fldObjClient,
      fldStrSeedCollection,
    );
    const fldArrSecond = await srvApiGetDemoSetProducts(
      fldObjSecond.fldObjClient,
      fldStrSeedCollection,
    );

    expect(srvApiGetDemoSetProducts.length).toBe(2);
    expect(fldArrFirst).toEqual(fldArrSecond);
    expect(fldArrFirst.length).toBe(2);
    expect(fldObjSecond.fldObjBuilder.eq.mock.calls).toEqual(
      fldObjFirst.fldObjBuilder.eq.mock.calls,
    );
    const fldStrCalls = JSON.stringify(fldObjFirst.fldObjBuilder.eq.mock.calls);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaPublicLibrary);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaHighSchool);
  });

  it('shows a record added by one persona to the other', async () => {
    const fldStrAddedId = '66666666-6666-6666-6666-666666666666';
    const fldObjWriter = fncConvFakeClient({ data: [], error: null });
    fldObjWriter.fldObjRpc.mockResolvedValue({
      data: fldStrAddedId,
      error: null,
    });
    const fldObjReader = fncConvFakeClient({
      data: [
        { id: fldStrSeedCollection, name: 'Rare Books' },
        { id: fldStrAddedId, name: 'Added By A' },
      ],
      error: null,
    });

    const fldStrNewId = await srvApiCreateDemoCollection(
      fldObjWriter.fldObjClient,
      'session-a',
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
      'Added By A',
    );
    const fldArrSeen = await srvApiGetDemoCollections(
      fldObjReader.fldObjClient,
      fldStrSeedWorkspace,
      fldStrSeedLibrary,
    );

    expect(fldStrNewId).toBe(fldStrAddedId);
    expect(fldArrSeen.map(fldObjRow => fldObjRow.fldStrId)).toContain(
      fldStrAddedId,
    );
    const fldStrCalls = JSON.stringify([
      fldObjWriter.fldObjRpc.mock.calls,
      fldObjReader.fldObjFrom.mock.calls,
      fldObjReader.fldObjBuilder.eq.mock.calls,
    ]);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaPublicLibrary);
    expect(fldStrCalls).not.toContain(fldStrSeedPersonaHighSchool);
  });
});
