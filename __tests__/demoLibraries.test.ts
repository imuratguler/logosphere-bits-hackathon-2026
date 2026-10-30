/**
 * Logosphere BITS — shared workspace libraries tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract:
 * no network. Row values follow supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvApiGetDemoLibraries } from '../src/services/srvDemoLibraries';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';

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

describe('shared workspace libraries', () => {
  it('returns the workspace libraries in order', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [
        { id: '22222222-2222-2222-2222-222222222222', name: 'Demo Library' },
      ],
      error: null,
    });

    const fldArrLibraries = await srvApiGetDemoLibraries(
      fldObjFake.fldObjClient,
      fldStrSeedWorkspace,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('nodes');
    expect(fldObjFake.fldObjBuilder.select).toHaveBeenCalledWith('id, name');
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'workspace_id',
      fldStrSeedWorkspace,
    );
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith('kind', 'library');
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
    expect(fldArrLibraries).toEqual([
      {
        fldStrId: '22222222-2222-2222-2222-222222222222',
        fldStrName: 'Demo Library',
      },
    ]);
  });

  it('surfaces read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoLibraries(fldObjFake.fldObjClient, fldStrSeedWorkspace),
    ).rejects.toThrow('nodes read failed: demo db down');
  });

  it('rejects malformed rows', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: '22222222-2222-2222-2222-222222222222' }],
      error: null,
    });

    await expect(
      srvApiGetDemoLibraries(fldObjFake.fldObjClient, fldStrSeedWorkspace),
    ).rejects.toThrow('need id + name');
  });

  it('returns an empty list when no libraries exist', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoLibraries(fldObjFake.fldObjClient, fldStrSeedWorkspace),
    ).resolves.toEqual([]);
  });

  it('rejects a blank workspace id before any call', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetDemoLibraries(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('demo workspace ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });
});
