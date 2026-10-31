/**
 * Logosphere BITS — shared workspace collections tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract:
 * no network. Row values follow supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvApiGetDemoCollections } from '../src/services/srvDemoCollections';

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
