/**
 * Logosphere BITS — hidden account profile service tests (hermetic).
 *
 * The service imports only the SupabaseClient type, so the client is
 * fake: rpc and table reads resolve scripted rows, no network. Row
 * values are fictional. The seed-safety check asserts the account
 * path never names a demo table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiAssignAccountRole,
  srvApiCreateAccountOrganization,
  srvApiGetAccountMemberships,
  srvApiGetAccountProfile,
  srvApiSaveAccountProfile,
} from '../src/services/srvAccountProfile';

type fldObjFakeQuery = {
  fldObjClient: SupabaseClient;
  fldObjRpc: jest.Mock;
  fldObjFrom: jest.Mock;
};

function fncConvFakeQuery(fldObjScript: {
  rpc?: unknown;
  single?: unknown;
  rows?: unknown;
  error?: { message: string } | null;
}): fldObjFakeQuery {
  const fldObjRpc = jest
    .fn()
    .mockResolvedValue(fldObjScript.rpc ?? { data: null, error: null });
  const fldObjMaybeSingle = jest.fn().mockResolvedValue({
    data: fldObjScript.single ?? null,
    error: fldObjScript.error ?? null,
  });
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: fldObjMaybeSingle,
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.rows ?? null,
        error: fldObjScript.error ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  return {
    fldObjClient: {
      rpc: fldObjRpc,
      from: fldObjFrom,
    } as unknown as SupabaseClient,
    fldObjRpc,
    fldObjFrom,
  };
}

describe('hidden account profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves the profile through the account RPC', async () => {
    const fldObjFake = fncConvFakeQuery({
      rpc: { data: null, error: null },
    });

    await srvApiSaveAccountProfile(fldObjFake.fldObjClient, {
      fldStrDisplayName: '  Owner  ',
      fldStrProfileType: 'individual',
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_upsert_profile',
      { p_display_name: 'Owner', p_profile_type: 'individual' },
    );
  });

  it('rejects unknown profile types before any call', async () => {
    const fldObjFake = fncConvFakeQuery({});

    await expect(
      srvApiSaveAccountProfile(fldObjFake.fldObjClient, {
        fldStrDisplayName: 'Owner',
        fldStrProfileType: 'admin',
      }),
    ).rejects.toThrow('unknown profile type');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('requires a display name before any call', async () => {
    const fldObjFake = fncConvFakeQuery({});

    await expect(
      srvApiSaveAccountProfile(fldObjFake.fldObjClient, {
        fldStrDisplayName: '   ',
        fldStrProfileType: 'individual',
      }),
    ).rejects.toThrow('display name required');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces profile save failures naming the call', async () => {
    const fldObjFake = fncConvFakeQuery({
      rpc: { data: null, error: { message: 'real account required' } },
    });

    await expect(
      srvApiSaveAccountProfile(fldObjFake.fldObjClient, {
        fldStrDisplayName: 'Owner',
        fldStrProfileType: 'individual',
      }),
    ).rejects.toThrow('account profile save failed: real account required.');
  });

  it('reads the own profile row', async () => {
    const fldObjFake = fncConvFakeQuery({
      single: {
        id: 'user-real-1',
        profile_type: 'corporate',
        display_name: 'Owner',
      },
    });

    const fldObjProfile = await srvApiGetAccountProfile(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('profiles');
    expect(fldObjProfile).toEqual({
      fldStrId: 'user-real-1',
      fldStrProfileType: 'corporate',
      fldStrDisplayName: 'Owner',
    });
  });

  it('returns null when no profile row exists', async () => {
    const fldObjFake = fncConvFakeQuery({ single: null });

    await expect(
      srvApiGetAccountProfile(fldObjFake.fldObjClient),
    ).resolves.toBeNull();
  });

  it('rejects malformed profile rows', async () => {
    const fldObjFake = fncConvFakeQuery({
      single: { id: 'user-real-1' },
    });

    await expect(
      srvApiGetAccountProfile(fldObjFake.fldObjClient),
    ).rejects.toThrow('need id + profile_type + display_name');
  });

  it('creates an organization and returns its id', async () => {
    const fldObjFake = fncConvFakeQuery({
      rpc: { data: 'org-real-1', error: null },
    });

    const fldObjOrg = await srvApiCreateAccountOrganization(
      fldObjFake.fldObjClient,
      '  Acme  ',
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_create_organization',
      { p_name: 'Acme' },
    );
    expect(fldObjOrg).toEqual({
      fldStrId: 'org-real-1',
      fldStrName: 'Acme',
    });
  });

  it('requires an organization name before any call', async () => {
    const fldObjFake = fncConvFakeQuery({});

    await expect(
      srvApiCreateAccountOrganization(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('organization name required');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('assigns a role through the account RPC', async () => {
    const fldObjFake = fncConvFakeQuery({
      rpc: { data: null, error: null },
    });

    await srvApiAssignAccountRole(fldObjFake.fldObjClient, {
      fldStrOrganizationId: 'org-real-1',
      fldStrProfileId: 'user-real-2',
      fldStrRoleCode: 'authorized',
    });

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('account_assign_role', {
      p_organization_id: 'org-real-1',
      p_profile_id: 'user-real-2',
      p_role: 'authorized',
    });
  });

  it('requires role assignment ids before any call', async () => {
    const fldObjFake = fncConvFakeQuery({});

    await expect(
      srvApiAssignAccountRole(fldObjFake.fldObjClient, {
        fldStrOrganizationId: '  ',
        fldStrProfileId: 'user-real-2',
        fldStrRoleCode: 'authorized',
      }),
    ).rejects.toThrow('account organization id is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('lists memberships with organization names', async () => {
    const fldObjFake = fncConvFakeQuery({
      rows: [
        {
          organization_id: 'org-real-1',
          profile_id: 'user-real-1',
          role: 'account_manager',
          organizations: { name: 'Acme' },
        },
      ],
    });

    const fldArrMemberships = await srvApiGetAccountMemberships(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith(
      'organization_memberships',
    );
    expect(fldArrMemberships).toEqual([
      {
        fldStrOrganizationId: 'org-real-1',
        fldStrOrganizationName: 'Acme',
        fldStrProfileId: 'user-real-1',
        fldStrRoleCode: 'account_manager',
      },
    ]);
  });

  it('rejects malformed membership rows', async () => {
    const fldObjFake = fncConvFakeQuery({
      rows: [{ organization_id: 'org-real-1' }],
    });

    await expect(
      srvApiGetAccountMemberships(fldObjFake.fldObjClient),
    ).rejects.toThrow('need organization_id + profile_id + role');
  });

  it('keeps signatures free of persona, session, and flag parameters', () => {
    expect(srvApiSaveAccountProfile.length).toBe(2);
    expect(srvApiGetAccountProfile.length).toBe(1);
    expect(srvApiCreateAccountOrganization.length).toBe(2);
    expect(srvApiAssignAccountRole.length).toBe(2);
    expect(srvApiGetAccountMemberships.length).toBe(1);
  });

  it('never names a demo table on the account path', async () => {
    const fldObjFake = fncConvFakeQuery({
      rpc: { data: 'org-real-1', error: null },
      single: null,
      rows: [],
    });

    await srvApiSaveAccountProfile(fldObjFake.fldObjClient, {
      fldStrDisplayName: 'Owner',
      fldStrProfileType: 'individual',
    });
    await srvApiGetAccountProfile(fldObjFake.fldObjClient);
    await srvApiCreateAccountOrganization(fldObjFake.fldObjClient, 'Acme');
    await srvApiGetAccountMemberships(fldObjFake.fldObjClient);

    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    const fldArrRpcs = fldObjFake.fldObjRpc.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    expect(fldArrTables).toEqual(['profiles', 'organization_memberships']);
    for (const fldStrName of [...fldArrTables, ...fldArrRpcs]) {
      expect(String(fldStrName)).not.toMatch(/demo_personas|demo_sessions/);
    }
  });
});
