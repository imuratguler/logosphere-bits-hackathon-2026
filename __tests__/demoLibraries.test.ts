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
  srvApiGetDemoLibraryDetails,
  srvApiSaveDemoLibraryDetails,
} from '../src/services/srvDemoLibraries';
import type { fldObjLibraryInput } from '../src/validation/vldDetails';
import { fncConvBlankAddressParts } from '../src/validation/vldDetails';

const fldStrSeedWorkspace = '11111111-1111-1111-1111-111111111111';
const fldStrSeedSession = 'session-for-tests';
const fldStrNewLibraryId = '33333333-3333-3333-3333-333333333333';

function fncConvFakeClient(fldObjResult: { data: unknown; error: unknown }) {
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(fldObjResult),
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
      fldObjAddressParts: fncConvBlankAddressParts(),
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
        fncConvArgsToShortcutInput({ fldStrLibraryType: 'branch' }),
      ),
    ).rejects.toThrow('library type must be Branch, Department, or Hall');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('allows a null type for settings callers', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fldStrNewLibraryId,
      error: null,
    });

    await srvApiCreateDemoLibrary(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedWorkspace,
      fncConvArgsToShortcutInput({ fldStrLibraryType: null }),
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledTimes(1);
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

describe('shared library detail saving', () => {
  const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';

  function fncConvFakeRpcClient() {
    const fldObjRpc = jest.fn();
    return {
      fldObjClient: { rpc: fldObjRpc } as unknown as SupabaseClient,
      fldObjRpc,
    };
  }

  function fncConvArgsToDetailsInput(
    fldObjOverrides: Partial<fldObjLibraryInput> = {},
  ): fldObjLibraryInput {
    return {
      fldStrCode: 'L-001',
      fldStrName: 'Main Library',
      fldStrLibraryType: 'Branch',
      fldDatFoundedDate: '2026-10-31',
      fldStrAddress: null,
      fldObjAddressParts: {
        fldObjCountry: { fldStrCode: 'TR', fldStrText: 'Türkiye' },
        fldObjState: { fldStrCode: 'TR-34', fldStrText: 'Istanbul' },
        fldObjCity: { fldStrCode: null, fldStrText: 'Kadikoy' },
        fldObjDistrict: { fldStrCode: null, fldStrText: null },
        fldObjTown: { fldStrCode: null, fldStrText: null },
        fldObjNeighborhood: { fldStrCode: null, fldStrText: 'Caferaga' },
        fldObjStreet: { fldStrCode: null, fldStrText: null },
        fldStrExtraDescription: 'Near the pier',
        fldStrPostalCode: null,
        fldStrBuilding: 'Block A',
        fldStrFloor: '3',
        fldStrApartment: '12',
      },
      fldStrWebsite: 'https://example.org',
      ...fldObjOverrides,
    };
  }

  it('saves every field through the RPC', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fldStrSeedLibrary,
      error: null,
    });

    const fldStrId = await srvApiSaveDemoLibraryDetails(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedLibrary,
      fncConvArgsToDetailsInput(),
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_save_library_details',
      {
        p_session_id: fldStrSeedSession,
        p_node_id: fldStrSeedLibrary,
        p_name: 'Main Library',
        p_code: 'L-001',
        p_library_type: 'Branch',
        p_founded_date: '2026-10-31',
        p_country_code: 'TR',
        p_country_text: 'Türkiye',
        p_state_code: 'TR-34',
        p_state_text: 'Istanbul',
        p_city_code: null,
        p_city_text: 'Kadikoy',
        p_district_code: null,
        p_district_text: null,
        p_town_code: null,
        p_town_text: null,
        p_neighborhood_code: null,
        p_neighborhood_text: 'Caferaga',
        p_street_code: null,
        p_street_text: null,
        p_extra_description: 'Near the pier',
        p_postal_code: null,
        p_building: 'Block A',
        p_floor: '3',
        p_apartment: '12',
        p_website: 'https://example.org',
      },
    );
    expect(fldStrId).toBe(fldStrSeedLibrary);
  });

  it('normalizes blank optionals to null and trims required text', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: fldStrSeedLibrary,
      error: null,
    });

    await srvApiSaveDemoLibraryDetails(
      fldObjFake.fldObjClient,
      fldStrSeedSession,
      fldStrSeedLibrary,
      fncConvArgsToDetailsInput({
        fldStrCode: '  L-001 ',
        fldStrName: '  Main Library ',
        fldStrLibraryType: '',
        fldDatFoundedDate: '   ',
        fldObjAddressParts: {
          fldObjCountry: { fldStrCode: null, fldStrText: '  ' },
          fldObjState: { fldStrCode: null, fldStrText: null },
          fldObjCity: { fldStrCode: null, fldStrText: null },
          fldObjDistrict: { fldStrCode: null, fldStrText: null },
          fldObjTown: { fldStrCode: null, fldStrText: null },
          fldObjNeighborhood: { fldStrCode: null, fldStrText: null },
          fldObjStreet: { fldStrCode: null, fldStrText: null },
          fldStrExtraDescription: null,
          fldStrPostalCode: '   ',
          fldStrBuilding: null,
          fldStrFloor: null,
          fldStrApartment: null,
        },
        fldStrWebsite: '',
      }),
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'demo_save_library_details',
      expect.objectContaining({
        p_name: 'Main Library',
        p_code: 'L-001',
        p_library_type: null,
        p_founded_date: null,
        p_country_text: null,
        p_postal_code: null,
        p_website: null,
      }),
    );
  });

  it('rejects blank identity and required fields before any call', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        '  ',
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput(),
      ),
    ).rejects.toThrow('demo session ID is missing or blank');
    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        '',
        fncConvArgsToDetailsInput(),
      ),
    ).rejects.toThrow('demo library ID is missing or blank');
    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput({ fldStrName: '  ' }),
      ),
    ).rejects.toThrow('library name is missing or blank');
    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput({ fldStrCode: null }),
      ),
    ).rejects.toThrow('library code is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects unknown types and malformed dates', async () => {
    const fldObjFake = fncConvFakeRpcClient();

    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput({ fldStrLibraryType: 'Archive' }),
      ),
    ).rejects.toThrow('library type must be Branch, Department, or Hall');
    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput({ fldDatFoundedDate: 'tomorrow' }),
      ),
    ).rejects.toThrow('library founded date must be YYYY-MM-DD');
    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput({ fldDatFoundedDate: '2026-13-99' }),
      ),
    ).rejects.toThrow('library founded date must be YYYY-MM-DD');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces RPC errors with the server message', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({
      data: null,
      error: { message: 'demo operation not permitted' },
    });

    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput(),
      ),
    ).rejects.toThrow(
      'demo_save_library_details failed: demo operation not permitted',
    );
  });

  it('rejects an unexpected RPC shape', async () => {
    const fldObjFake = fncConvFakeRpcClient();
    fldObjFake.fldObjRpc.mockResolvedValue({ data: null, error: null });

    await expect(
      srvApiSaveDemoLibraryDetails(
        fldObjFake.fldObjClient,
        fldStrSeedSession,
        fldStrSeedLibrary,
        fncConvArgsToDetailsInput(),
      ),
    ).rejects.toThrow('need the library id');
  });
});

describe('shared library detail reading', () => {
  const fldStrSeedLibrary = '22222222-2222-2222-2222-222222222222';

  function fncConvSeedRow() {
    return {
      code: 'L-001',
      library_type: 'Branch',
      founded_date: '2026-10-31',
      country_code: 'TR',
      country_text: 'Türkiye',
      state_code: null,
      state_text: 'Istanbul',
      city_code: null,
      city_text: null,
      district_code: null,
      district_text: null,
      town_code: null,
      town_text: null,
      neighborhood_code: null,
      neighborhood_text: null,
      street_code: null,
      street_text: null,
      extra_description: null,
      postal_code: null,
      building: null,
      floor: null,
      apartment: null,
      website: null,
    };
  }

  it('returns the mapped details input', async () => {
    const fldObjFake = fncConvFakeClient({
      data: fncConvSeedRow(),
      error: null,
    });

    const fldObjDetails = await srvApiGetDemoLibraryDetails(
      fldObjFake.fldObjClient,
      fldStrSeedLibrary,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('library_details');
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'node_id',
      fldStrSeedLibrary,
    );
    expect(fldObjDetails).toEqual({
      fldStrCode: 'L-001',
      fldStrName: null,
      fldStrLibraryType: 'Branch',
      fldDatFoundedDate: '2026-10-31',
      fldStrAddress: null,
      fldObjAddressParts: {
        fldObjCountry: { fldStrCode: 'TR', fldStrText: 'Türkiye' },
        fldObjState: { fldStrCode: null, fldStrText: 'Istanbul' },
        fldObjCity: { fldStrCode: null, fldStrText: null },
        fldObjDistrict: { fldStrCode: null, fldStrText: null },
        fldObjTown: { fldStrCode: null, fldStrText: null },
        fldObjNeighborhood: { fldStrCode: null, fldStrText: null },
        fldObjStreet: { fldStrCode: null, fldStrText: null },
        fldStrExtraDescription: null,
        fldStrPostalCode: null,
        fldStrBuilding: null,
        fldStrFloor: null,
        fldStrApartment: null,
      },
      fldStrWebsite: null,
    });
  });

  it('returns null when no details row exists', async () => {
    const fldObjFake = fncConvFakeClient({ data: null, error: null });

    await expect(
      srvApiGetDemoLibraryDetails(fldObjFake.fldObjClient, fldStrSeedLibrary),
    ).resolves.toBeNull();
  });

  it('rejects a blank library id before any call', async () => {
    const fldObjFake = fncConvFakeClient({ data: null, error: null });

    await expect(
      srvApiGetDemoLibraryDetails(fldObjFake.fldObjClient, '  '),
    ).rejects.toThrow('demo library ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(
      srvApiGetDemoLibraryDetails(fldObjFake.fldObjClient, fldStrSeedLibrary),
    ).rejects.toThrow('library_details read failed: demo db down');
  });

  it('rejects malformed rows', async () => {
    const fldObjFake = fncConvFakeClient({
      data: { library_type: 'Branch' },
      error: null,
    });

    await expect(
      srvApiGetDemoLibraryDetails(fldObjFake.fldObjClient, fldStrSeedLibrary),
    ).rejects.toThrow('need the detail columns');
  });
});
