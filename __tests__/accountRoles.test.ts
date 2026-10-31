/**
 * Logosphere BITS — hidden account role service tests (hermetic).
 *
 * Role, matrix, member, and identity calls run against a fake
 * client: no network, no rows. Vocabulary values mirror the
 * migration CHECKs. The confinement check asserts the account
 * path never names a demo table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiGetAccountMatrix,
  srvApiGetAccountRoles,
  srvApiGetOrgMembers,
  srvApiGetOwnProfileId,
  srvApiSetAccountMatrixCell,
} from '../src/services/srvAccountRoles';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

type fldObjFakeRoles = {
  fldObjClient: SupabaseClient;
  fldObjFrom: jest.Mock;
  fldObjRpc: jest.Mock;
};

function fncConvBuilder(fldObjData: unknown, fldObjError: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({ data: fldObjData, error: fldObjError }).then(
        fldObjResolve,
        fldObjReject,
      ),
  };
}

function fncConvFakeRoles(fldObjScript: {
  roles?: unknown;
  rolesError?: { message: string } | null;
  matrix?: unknown;
  matrixError?: { message: string } | null;
  members?: unknown;
  membersError?: { message: string } | null;
  profiles?: unknown;
  profilesError?: { message: string } | null;
  userId?: string | null;
  userError?: { message: string } | null;
  rpcError?: { message: string } | null;
}): fldObjFakeRoles {
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    if (fldStrTable === 'roles') {
      return fncConvBuilder(
        fldObjScript.roles === undefined ? [] : fldObjScript.roles,
        fldObjScript.rolesError ?? null,
      );
    }
    if (fldStrTable === 'role_permissions') {
      return fncConvBuilder(
        fldObjScript.matrix === undefined ? [] : fldObjScript.matrix,
        fldObjScript.matrixError ?? null,
      );
    }
    if (fldStrTable === 'organization_memberships') {
      return fncConvBuilder(
        fldObjScript.members === undefined ? [] : fldObjScript.members,
        fldObjScript.membersError ?? null,
      );
    }
    return fncConvBuilder(
      fldObjScript.profiles === undefined ? [] : fldObjScript.profiles,
      fldObjScript.profilesError ?? null,
    );
  });
  const fldObjRpc = jest.fn().mockResolvedValue({
    data: null,
    error: fldObjScript.rpcError ?? null,
  });
  const fldObjGetUser = jest.fn().mockResolvedValue({
    data: {
      user:
        fldObjScript.userId === null || fldObjScript.userId === undefined
          ? null
          : { id: fldObjScript.userId },
    },
    error: fldObjScript.userError ?? null,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      rpc: fldObjRpc,
      auth: { getUser: fldObjGetUser },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjRpc,
  };
}

describe('hidden account role service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists roles in code order', async () => {
    const fldObjFake = fncConvFakeRoles({
      roles: [
        { code: 'account_manager', description: 'Account manager' },
        { code: 'authorized', description: 'Authorized member' },
      ],
    });

    const fldArrRoles = await srvApiGetAccountRoles(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('roles');
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.select).toHaveBeenCalledWith('code, description');
    expect(fldObjBuilder.order).toHaveBeenCalledWith('code', {
      ascending: true,
    });
    expect(fldArrRoles).toEqual([
      { fldStrCode: 'account_manager', fldStrDescription: 'Account manager' },
      { fldStrCode: 'authorized', fldStrDescription: 'Authorized member' },
    ]);
  });

  it('surfaces role errors naming the table', async () => {
    const fldObjFake = fncConvFakeRoles({
      rolesError: { message: 'db down' },
    });

    await expect(
      srvApiGetAccountRoles(fldObjFake.fldObjClient),
    ).rejects.toThrow('role list unavailable (roles read failed: db down).');
  });

  it('rejects malformed role rows', async () => {
    const fldObjFake = fncConvFakeRoles({ roles: [{ code: 'x' }] });

    await expect(
      srvApiGetAccountRoles(fldObjFake.fldObjClient),
    ).rejects.toThrow('need code + description');
  });

  it('rejects a non-list role payload', async () => {
    const fldObjFake = fncConvFakeRoles({ roles: null });

    await expect(
      srvApiGetAccountRoles(fldObjFake.fldObjClient),
    ).rejects.toThrow('need a row list');
  });

  it('maps matrix cells through the closed vocabulary', async () => {
    const fldObjFake = fncConvFakeRoles({
      matrix: [
        {
          role_code: 'authorized',
          action: 'view',
          scope: 'item',
        },
      ],
    });

    const fldArrCells = await srvApiGetAccountMatrix(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('role_permissions');
    expect(fldArrCells).toEqual([
      {
        fldStrRoleCode: 'authorized',
        fldStrAction: 'view',
        fldStrScope: 'item',
      },
    ]);
  });

  it('rejects matrix rows outside the vocabulary', async () => {
    const fldObjFake = fncConvFakeRoles({
      matrix: [{ role_code: 'authorized', action: 'launch', scope: 'item' }],
    });

    await expect(
      srvApiGetAccountMatrix(fldObjFake.fldObjClient),
    ).rejects.toThrow('unknown action or scope');
  });

  it('surfaces matrix errors naming the table', async () => {
    const fldObjFake = fncConvFakeRoles({
      matrixError: { message: 'db down' },
    });

    await expect(
      srvApiGetAccountMatrix(fldObjFake.fldObjClient),
    ).rejects.toThrow(
      'permission matrix unavailable (role_permissions read failed: db down).',
    );
  });

  it('joins members to co-member display names', async () => {
    const fldObjFake = fncConvFakeRoles({
      members: [
        { profile_id: 'user-real-1', role: 'account_manager' },
        { profile_id: 'user-real-2', role: 'authorized' },
      ],
      profiles: [{ id: 'user-real-1', display_name: 'Owner' }],
    });

    const fldArrMembers = await srvApiGetOrgMembers(
      fldObjFake.fldObjClient,
      fldStrSeedOrg,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith(
      'organization_memberships',
    );
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('profiles');
    const fldObjProfilesBuilder = fldObjFake.fldObjFrom.mock.results[1]?.value;
    expect(fldObjProfilesBuilder.in).toHaveBeenCalledWith('id', [
      'user-real-1',
      'user-real-2',
    ]);
    expect(fldArrMembers).toEqual([
      {
        fldStrProfileId: 'user-real-1',
        fldStrDisplayName: 'Owner',
        fldStrRoleCode: 'account_manager',
      },
      {
        fldStrProfileId: 'user-real-2',
        fldStrDisplayName: null,
        fldStrRoleCode: 'authorized',
      },
    ]);
  });

  it('skips the profile read when nobody is a member', async () => {
    const fldObjFake = fncConvFakeRoles({ members: [] });

    await expect(
      srvApiGetOrgMembers(fldObjFake.fldObjClient, fldStrSeedOrg),
    ).resolves.toEqual([]);
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledTimes(1);
  });

  it('rejects a blank member org id before any call', async () => {
    const fldObjFake = fncConvFakeRoles({});

    await expect(
      srvApiGetOrgMembers(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('account role organization id is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces member errors naming the failing table', async () => {
    const fldObjFake = fncConvFakeRoles({
      membersError: { message: 'db down' },
    });

    await expect(
      srvApiGetOrgMembers(fldObjFake.fldObjClient, fldStrSeedOrg),
    ).rejects.toThrow(
      'member list unavailable (organization_memberships read failed: db down).',
    );
  });

  it('reads the own profile id and the signed-out null', async () => {
    const fldObjSignedIn = fncConvFakeRoles({ userId: 'user-real-1' });
    await expect(
      srvApiGetOwnProfileId(fldObjSignedIn.fldObjClient),
    ).resolves.toBe('user-real-1');

    const fldObjSignedOut = fncConvFakeRoles({ userId: null });
    await expect(
      srvApiGetOwnProfileId(fldObjSignedOut.fldObjClient),
    ).resolves.toBeNull();
  });

  it('surfaces identity errors', async () => {
    const fldObjFake = fncConvFakeRoles({
      userError: { message: 'token gone' },
    });

    await expect(
      srvApiGetOwnProfileId(fldObjFake.fldObjClient),
    ).rejects.toThrow('identity read failed: token gone.');
  });

  it('toggles a matrix cell through the account RPC', async () => {
    const fldObjFake = fncConvFakeRoles({});

    await srvApiSetAccountMatrixCell(fldObjFake.fldObjClient, {
      fldStrRoleCode: 'authorized',
      fldStrAction: 'delete',
      fldStrScope: 'item',
      fldBooGrant: true,
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_set_matrix_cell',
      {
        p_role: 'authorized',
        p_action: 'delete',
        p_scope: 'item',
        p_grant: true,
      },
    );
  });

  it('rejects out-of-vocabulary cells before any call', async () => {
    const fldObjFake = fncConvFakeRoles({});

    await expect(
      srvApiSetAccountMatrixCell(fldObjFake.fldObjClient, {
        fldStrRoleCode: 'authorized',
        fldStrAction: 'launch',
        fldStrScope: 'item',
        fldBooGrant: true,
      }),
    ).rejects.toThrow('unknown action');
    await expect(
      srvApiSetAccountMatrixCell(fldObjFake.fldObjClient, {
        fldStrRoleCode: 'authorized',
        fldStrAction: 'view',
        fldStrScope: 'planet',
        fldBooGrant: true,
      }),
    ).rejects.toThrow('unknown scope');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces matrix refusal naming the call', async () => {
    const fldObjFake = fncConvFakeRoles({
      rpcError: { message: 'account manager required' },
    });

    await expect(
      srvApiSetAccountMatrixCell(fldObjFake.fldObjClient, {
        fldStrRoleCode: 'authorized',
        fldStrAction: 'view',
        fldStrScope: 'item',
        fldBooGrant: true,
      }),
    ).rejects.toThrow('matrix update failed: account manager required.');
  });

  it('keeps signatures free of persona, session, and flag parameters', () => {
    expect(srvApiGetAccountRoles.length).toBe(1);
    expect(srvApiGetAccountMatrix.length).toBe(1);
    expect(srvApiGetOrgMembers.length).toBe(2);
    expect(srvApiGetOwnProfileId.length).toBe(1);
    expect(srvApiSetAccountMatrixCell.length).toBe(2);
  });

  it('stays inside the role tables and the matrix RPC', async () => {
    const fldObjFake = fncConvFakeRoles({
      roles: [{ code: 'authorized', description: 'Authorized member' }],
      matrix: [],
      members: [{ profile_id: 'user-real-1', role: 'authorized' }],
      profiles: [{ id: 'user-real-1', display_name: 'Owner' }],
      userId: 'user-real-1',
    });

    await srvApiGetAccountRoles(fldObjFake.fldObjClient);
    await srvApiGetAccountMatrix(fldObjFake.fldObjClient);
    await srvApiGetOrgMembers(fldObjFake.fldObjClient, fldStrSeedOrg);
    await srvApiGetOwnProfileId(fldObjFake.fldObjClient);
    await srvApiSetAccountMatrixCell(fldObjFake.fldObjClient, {
      fldStrRoleCode: 'authorized',
      fldStrAction: 'view',
      fldStrScope: 'item',
      fldBooGrant: false,
    });

    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    const fldArrRpcs = fldObjFake.fldObjRpc.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    expect(fldArrTables).toEqual([
      'roles',
      'role_permissions',
      'organization_memberships',
      'profiles',
    ]);
    expect(fldArrRpcs).toEqual(['account_set_matrix_cell']);
    for (const fldStrName of [...fldArrTables, ...fldArrRpcs]) {
      expect(String(fldStrName)).not.toMatch(/demo_/);
    }
  });
});
