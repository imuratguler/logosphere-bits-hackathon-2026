/**
 * Logosphere BITS — shared workspace libraries tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so no polyfill or
 * storage mocks are needed. The fake client records the query contract:
 * no network. Row values follow supabase/seed.sql (public, non-secret).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiCreateDemoLibrary,
  srvApiGetDemoLibraries,
} from '../src/services/srvDemoLibraries';
import type { fldObjLibraryInput } from '../src/validation/vldDetails';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedSession = 'session-for-tests';
const fldStrNewLibraryId = '33333333-3333-3333-3333-333333333333';

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

describe('shared workspace library creation', () => {
  function fncConvFakeRpcClient() {
    const fldObjRpc = jest.fn();
    return {
      fldObjClient: { rpc: fldObjRpc } as unknown as SupabaseClient,
      fldObjRpc,
    };
  }

  function fncConvArgsToShortcutInput(
    fldObjOverrides: Partial<fldObjLibraryInput> = {},
  ): fldObjLibraryInput {
    return {
      fldStrCode: null,
      fldStrName: 'North Branch',
      fldStrLibraryType: 'Branch',
      fldDatFoundedDate: '2026-10-31',
      fldStrAddress: null,
      fldStrWebsite: null,
      ...fldObjOverrides,
    };
  }

  it('creates through the RPC with the trimmed name', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fldStrNewLibraryId,
      error: null,
    });

    const fldStrId = await srvApiCreateDemoLibrary(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedWorkspace,
      fncConvArgsToShortcutInput({ fldStrName: '  North Branch  ' }),
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('demo_create_library', {
      p_session_id: fldStrSeedSession,
      p_workspace_id: fldStrSeedWorkspace,
      p_name: 'North Branch',
    });
    expect(fldStrId).toBe(fldStrNewLibraryId);
  });

  it('accepts an array-wrapped new id', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: [fldStrNewLibraryId],
      error: null,
    });

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput(),
      ),
    ).resolves.toBe(fldStrNewLibraryId);
  });

  it('rejects a blank session id before any call', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        '   ',
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput(),
      ),
    ).rejects.toThrow('demo session ID is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a blank workspace id before any call', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        '',
        fncConvArgsToShortcutInput(),
      ),
    ).rejects.toThrow('demo workspace ID is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a blank name before any call', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput({ fldStrName: '   ' }),
      ),
    ).rejects.toThrow('library name is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects types outside the shortcut vocabulary', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput({ fldStrLibraryType: 'Archive' }),
      ),
    ).rejects.toThrow('library type must be Branch, Department, or Hall');
    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput({ fldStrLibraryType: null }),
      ),
    ).rejects.toThrow('library type must be Branch, Department, or Hall');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces RPC errors with the server message', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo session expired' },
    });

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput(),
      ),
    ).rejects.toThrow('demo_create_library failed: demo session expired');
  });

  it('rejects an unexpected RPC shape', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({ data: null, error: null });

    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput(),
      ),
    ).rejects.toThrow('need the new library id');
    fldObjFake.fldObjRpc.mockResolvedValue({ data: 42, error: null });
    await expect(
      srvApiCreateDemoLibrary(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedWorkspace,
        fncConvArgsToShortcutInput(),
      ),
    ).rejects.toThrow('need the new library id');
  });
});
