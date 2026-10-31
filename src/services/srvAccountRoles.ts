/**
 * Logosphere BITS — HIDDEN account role/matrix service.
 *
 * Role and 7-action by 3-scope matrix reads plus manager-gated
 * writes for the real account plane: matrix cells toggle through
 * account_set_matrix_cell (account_manager in any org, vocabulary
 * validated both sides), and org member rows join memberships to
 * co-member profiles for assignment display. Reads stay inside
 * roles, role_permissions, organization_memberships, and profiles
 * — demo tables are never named, and demo persona types never
 * count as role assignment: only server membership rows do.
 * Signatures take no persona, session, or flag.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are
 * the database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { fldObjRolePermissionCell } from '../validation/vldAuthorization';
import {
  vldChgIsPermissionAction,
  vldChgIsPermissionScope,
} from '../validation/vldAuthorization';

export type fldObjAccountRole = {
  fldStrCode: string;
  fldStrDescription: string;
};

export type fldObjOrgMember = {
  fldStrProfileId: string;
  fldStrDisplayName: string | null;
  fldStrRoleCode: string;
};

export type fldObjMatrixCellRequest = {
  fldStrRoleCode: string;
  fldStrAction: string;
  fldStrScope: string;
  fldBooGrant: boolean;
};

type fldObjAccountRoleRow = {
  code: string;
  description: string;
};

type fldObjMatrixCellRow = {
  role_code: string;
  action: string;
  scope: string;
};

type fldObjMemberRow = {
  profile_id: string;
  role: string;
};

type fldObjMemberProfileRow = {
  id: string;
  display_name: string | null;
};

function fncRunRequireText(fldStrValue: string, fldStrLabel: string): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: account role ${fldStrLabel} is missing or blank.`,
    );
  }
  return fldStrTrimmed;
}

function fncRunIsRoleRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountRoleRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountRoleRow>;
  return (
    typeof fldObjRow.code === 'string' &&
    typeof fldObjRow.description === 'string'
  );
}

function fncRunIsMatrixCellRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMatrixCellRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMatrixCellRow>;
  return (
    typeof fldObjRow.role_code === 'string' &&
    typeof fldObjRow.action === 'string' &&
    typeof fldObjRow.scope === 'string'
  );
}

function fncRunIsMemberRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMemberRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMemberRow>;
  return (
    typeof fldObjRow.profile_id === 'string' &&
    typeof fldObjRow.role === 'string'
  );
}

function fncRunIsMemberProfileRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMemberProfileRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMemberProfileRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    (typeof fldObjRow.display_name === 'string' ||
      fldObjRow.display_name === null)
  );
}

export async function srvApiGetAccountRoles(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountRole[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('roles')
    .select('code, description')
    .order('code', { ascending: true });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: role list unavailable ' +
        `(roles read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: roles returned an unexpected shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsRoleRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: roles returned an unexpected shape ' +
          '(need code + description).',
      );
    }
    return {
      fldStrCode: fldObjRow.code,
      fldStrDescription: fldObjRow.description,
    };
  });
}

export async function srvApiGetAccountMatrix(
  fldObjClient: SupabaseClient,
): Promise<fldObjRolePermissionCell[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('role_permissions')
    .select('role_code, action, scope')
    .order('role_code', { ascending: true });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: permission matrix unavailable ' +
        `(role_permissions read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: role_permissions returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsMatrixCellRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: role_permissions returned an unexpected ' +
          'shape (need role_code + action + scope).',
      );
    }
    if (
      !vldChgIsPermissionAction(fldObjRow.action) ||
      !vldChgIsPermissionScope(fldObjRow.scope)
    ) {
      throw new Error(
        'Logosphere BITS: role_permissions returned an unknown ' +
          'action or scope.',
      );
    }
    return {
      fldStrRoleCode: fldObjRow.role_code,
      fldStrAction: fldObjRow.action,
      fldStrScope: fldObjRow.scope,
    };
  });
}

export async function srvApiGetOrgMembers(
  fldObjClient: SupabaseClient,
  fldStrOrganizationId: string,
): Promise<fldObjOrgMember[]> {
  const fldStrOrgId = fncRunRequireText(
    fldStrOrganizationId,
    'organization id',
  );
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('organization_memberships')
    .select('profile_id, role')
    .eq('organization_id', fldStrOrgId);
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: member list unavailable ' +
        `(organization_memberships read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: organization_memberships returned an ' +
        'unexpected shape (need a row list).',
    );
  }
  const fldArrMembers = fldObjRows.map(fldObjRow => {
    if (!fncRunIsMemberRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: organization_memberships returned an ' +
          'unexpected shape (need profile_id + role).',
      );
    }
    return fldObjRow;
  });
  if (fldArrMembers.length === 0) {
    return [];
  }
  const { data: fldObjProfileRows, error: fldObjProfileError } =
    await fldObjClient
      .from('profiles')
      .select('id, display_name')
      .in(
        'id',
        fldArrMembers.map(fldObjMember => fldObjMember.profile_id),
      );
  if (fldObjProfileError) {
    throw new Error(
      'Logosphere BITS: member list unavailable ' +
        `(profiles read failed: ${fldObjProfileError.message}).`,
    );
  }
  if (!Array.isArray(fldObjProfileRows)) {
    throw new Error(
      'Logosphere BITS: profiles returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldObjNames = new Map<string, string | null>();
  for (const fldObjRow of fldObjProfileRows) {
    if (!fncRunIsMemberProfileRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: profiles returned an unexpected shape ' +
          '(need id + display_name).',
      );
    }
    fldObjNames.set(fldObjRow.id, fldObjRow.display_name);
  }
  return fldArrMembers.map(fldObjMember => ({
    fldStrProfileId: fldObjMember.profile_id,
    fldStrDisplayName: fldObjNames.get(fldObjMember.profile_id) ?? null,
    fldStrRoleCode: fldObjMember.role,
  }));
}

export async function srvApiGetOwnProfileId(
  fldObjClient: SupabaseClient,
): Promise<string | null> {
  const { data: fldObjData, error: fldObjError } =
    await fldObjClient.auth.getUser();
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: identity read failed: ' + `${fldObjError.message}.`,
    );
  }
  const fldStrUserId = fldObjData?.user?.id;
  return typeof fldStrUserId === 'string' && fldStrUserId !== ''
    ? fldStrUserId
    : null;
}

export async function srvApiSetAccountMatrixCell(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjMatrixCellRequest,
): Promise<void> {
  const fldStrRoleCode = fncRunRequireText(
    fldObjRequest.fldStrRoleCode,
    'role code',
  );
  if (!vldChgIsPermissionAction(fldObjRequest.fldStrAction)) {
    throw new Error('Logosphere BITS: unknown action.');
  }
  if (!vldChgIsPermissionScope(fldObjRequest.fldStrScope)) {
    throw new Error('Logosphere BITS: unknown scope.');
  }
  const { error: fldObjError } = await fldObjClient.rpc(
    'account_set_matrix_cell',
    {
      p_role: fldStrRoleCode,
      p_action: fldObjRequest.fldStrAction,
      p_scope: fldObjRequest.fldStrScope,
      p_grant: fldObjRequest.fldBooGrant,
    },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: matrix update failed: ' + `${fldObjError.message}.`,
    );
  }
}
