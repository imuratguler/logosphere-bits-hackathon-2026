/**
 * Logosphere BITS — HIDDEN real-account profile/organization service.
 *
 * Self-service writes for authenticated users only: profile upsert,
 * organization creation (creator becomes account_manager), and
 * manager-gated role assignment ride on the account RPCs (migration
 * 20261031191911), which reject demo callers server-side. Reads stay
 * inside the authenticated self/member scope (profiles,
 * organizations, organization_memberships) and never touch demo
 * tables: registering a real account cannot read or alter the
 * shared demo persona seed. Signatures take no persona, session, or
 * flag — identity comes only from the authenticated client.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are
 * the database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  vldChgIsProfileType,
  type fldStrAccountProfileType,
} from '../validation/vldAccount';

export type fldObjAccountProfile = {
  fldStrId: string;
  fldStrProfileType: fldStrAccountProfileType;
  fldStrDisplayName: string | null;
};

export type fldObjAccountOrganization = {
  fldStrId: string;
  fldStrName: string;
};

export type fldObjAccountMembership = {
  fldStrOrganizationId: string;
  fldStrOrganizationName: string;
  fldStrProfileId: string;
  fldStrRoleCode: string;
};

export type fldObjAccountProfileRequest = {
  fldStrDisplayName: string;
  fldStrProfileType: string;
};

export type fldObjAccountRoleRequest = {
  fldStrOrganizationId: string;
  fldStrProfileId: string;
  fldStrRoleCode: string;
};

type fldObjAccountProfileRow = {
  id: string;
  profile_type: string;
  display_name: string | null;
};

type fldObjAccountMembershipRow = {
  organization_id: string;
  profile_id: string;
  role: string;
  organizations: { name: string } | null;
};

function fncRunRequireId(fldStrValue: string, fldStrLabel: string): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: account ${fldStrLabel} is missing or blank.`,
    );
  }
  return fldStrTrimmed;
}

function fncRunIsProfileRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountProfileRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountProfileRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.profile_type === 'string' &&
    (typeof fldObjRow.display_name === 'string' ||
      fldObjRow.display_name === null)
  );
}

function fncRunIsMembershipRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountMembershipRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountMembershipRow>;
  if (
    typeof fldObjRow.organization_id !== 'string' ||
    typeof fldObjRow.profile_id !== 'string' ||
    typeof fldObjRow.role !== 'string'
  ) {
    return false;
  }
  if (fldObjRow.organizations === null) {
    return true;
  }
  return (
    typeof fldObjRow.organizations === 'object' &&
    fldObjRow.organizations !== null &&
    typeof (fldObjRow.organizations as { name: unknown }).name === 'string'
  );
}

export async function srvApiSaveAccountProfile(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjAccountProfileRequest,
): Promise<void> {
  if (!vldChgIsProfileType(fldObjRequest.fldStrProfileType)) {
    throw new Error('Logosphere BITS: unknown profile type.');
  }
  const fldStrDisplayName = fldObjRequest.fldStrDisplayName.trim();
  if (fldStrDisplayName === '') {
    throw new Error('Logosphere BITS: display name required.');
  }
  const { error: fldObjError } = await fldObjClient.rpc(
    'account_upsert_profile',
    {
      p_display_name: fldStrDisplayName,
      p_profile_type: fldObjRequest.fldStrProfileType,
    },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: account profile save failed: ' +
        `${fldObjError.message}.`,
    );
  }
}

export async function srvApiGetAccountProfile(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountProfile | null> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('profiles')
    .select('id, profile_type, display_name')
    .limit(1)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: account profile unavailable (profiles ' +
        `read failed: ${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    return null;
  }
  if (!fncRunIsProfileRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: profiles returned an unexpected shape ' +
        '(need id + profile_type + display_name).',
    );
  }
  if (!vldChgIsProfileType(fldObjRow.profile_type)) {
    throw new Error('Logosphere BITS: unknown profile type.');
  }
  return {
    fldStrId: fldObjRow.id,
    fldStrProfileType: fldObjRow.profile_type,
    fldStrDisplayName: fldObjRow.display_name,
  };
}

export async function srvApiCreateAccountOrganization(
  fldObjClient: SupabaseClient,
  fldStrName: string,
): Promise<fldObjAccountOrganization> {
  const fldStrTrimmed = fldStrName.trim();
  if (fldStrTrimmed === '') {
    throw new Error('Logosphere BITS: organization name required.');
  }
  const { data: fldObjId, error: fldObjError } = await fldObjClient.rpc(
    'account_create_organization',
    { p_name: fldStrTrimmed },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: organization creation failed: ' +
        `${fldObjError.message}.`,
    );
  }
  if (typeof fldObjId !== 'string' || fldObjId === '') {
    throw new Error(
      'Logosphere BITS: account_create_organization returned an ' +
        'unexpected shape (need the organization id).',
    );
  }
  return { fldStrId: fldObjId, fldStrName: fldStrTrimmed };
}

export async function srvApiAssignAccountRole(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjAccountRoleRequest,
): Promise<void> {
  const fldStrOrganizationId = fncRunRequireId(
    fldObjRequest.fldStrOrganizationId,
    'organization id',
  );
  const fldStrProfileId = fncRunRequireId(
    fldObjRequest.fldStrProfileId,
    'profile id',
  );
  const fldStrRoleCode = fncRunRequireId(
    fldObjRequest.fldStrRoleCode,
    'role code',
  );
  const { error: fldObjError } = await fldObjClient.rpc('account_assign_role', {
    p_organization_id: fldStrOrganizationId,
    p_profile_id: fldStrProfileId,
    p_role: fldStrRoleCode,
  });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: role assignment failed: ' + `${fldObjError.message}.`,
    );
  }
}

export async function srvApiGetAccountMemberships(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountMembership[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('organization_memberships')
    .select('organization_id, profile_id, role, organizations ( name )');
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: membership list unavailable ' +
        `(organization_memberships read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: organization_memberships returned an ' +
        'unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsMembershipRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: organization_memberships returned an ' +
          'unexpected shape (need organization_id + profile_id + ' +
          'role + organizations.name).',
      );
    }
    return {
      fldStrOrganizationId: fldObjRow.organization_id,
      fldStrOrganizationName: fldObjRow.organizations?.name ?? '',
      fldStrProfileId: fldObjRow.profile_id,
      fldStrRoleCode: fldObjRow.role,
    };
  });
}
