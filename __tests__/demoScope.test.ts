/**
 * Logosphere BITS — shared demo scope tests (hermetic).
 *
 * The services import only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract
 * (table, columns, ordering, limit): no network. Row values come from
 * supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvApiGetDemoPersonas } from '../src/services/srvDemoPersonas';
import { srvApiGetDemoWorkspace } from '../src/services/srvDemoWorkspace';

const fldStrSeedPersonaPublicLibrary = '10000000-0000-4000-8000-000000000001';
const fldStrSeedPersonaHighSchool = '10000000-0000-4000-8000-000000000002';
const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';

type fldObjFakeBuilder = {
  select: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  then: (
    fldObjResolve: (fldObjValue: unknown) => void,
    fldObjReject: (fldObjReason?: unknown) => void,
  ) => Promise<unknown>;
};

type fldObjFakeClient = {
  fldObjClient: SupabaseClient;
  fldObjFrom: jest.Mock;
  fldObjBuilder: fldObjFakeBuilder;
};

function fncConvFakeClient(fldObjResult: {
  data: unknown;
  error: unknown;
}): fldObjFakeClient {
  const fldObjBuilder: fldObjFakeBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (fldObjResolve, fldObjReject) =>
      Promise.resolve(fldObjResult).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  return {
    fldObjClient: { from: fldObjFrom } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
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
});
