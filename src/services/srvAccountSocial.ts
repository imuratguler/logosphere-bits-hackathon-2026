/**
 * Logosphere BITS — HIDDEN account social service.
 *
 * Message, invitation, and person/org relation models plus their
 * calls for the real account plane (migration 20261031192940):
 * send/list messages with recipient-side read flags, manager
 * email invitations with token accept/decline into memberships,
 * and owner-scoped contact/partner/blocked links. Reads and
 * writes stay inside account_messages, account_invitations, and
 * account_relations (plus name lookups on profiles and
 * organizations) — no demo table is named, and nothing here is a
 * precondition of any demo path. Signatures take no persona,
 * session, or flag.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are
 * the database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { fldStrAccountRelation } from '../validation/vldAccount';
import {
  vldChgIsAccountRelation,
  vldChgIsEmailValid,
} from '../validation/vldAccount';

export type fldObjAccountMessage = {
  fldStrId: string;
  fldStrSenderProfileId: string;
  fldStrRecipientProfileId: string | null;
  fldStrRecipientOrganizationId: string | null;
  fldStrBody: string;
  fldBooIsRead: boolean;
};

export type fldObjMessageCompose = {
  fldStrRecipientProfileId?: string;
  fldStrRecipientOrganizationId?: string;
  fldStrBody: string;
};

export type fldStrInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired';

export type fldObjAccountInvitation = {
  fldStrId: string;
  fldStrOrganizationId: string;
  fldStrOrganizationName: string;
  fldStrEmail: string;
  fldStrRoleCode: string;
  fldStrStatus: fldStrInvitationStatus;
};

export type fldObjInviteRequest = {
  fldStrOrganizationId: string;
  fldStrEmail: string;
  fldStrRoleCode: string;
};

export type fldObjIssuedInvitation = {
  fldStrId: string;
  fldStrToken: string;
  fldStrExpiresAt: string;
};

export type fldObjAccountRelationLink = {
  fldStrId: string;
  fldStrPeerProfileId: string | null;
  fldStrPeerOrganizationId: string | null;
  fldStrPeerName: string | null;
  fldStrRelation: fldStrAccountRelation;
};

export type fldObjRelationAdd = {
  fldStrPeerProfileId?: string;
  fldStrPeerOrganizationId?: string;
  fldStrRelation: string;
};

type fldObjAccountMessageRow = {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string | null;
  recipient_organization_id: string | null;
  body: string;
  is_read: boolean;
};

type fldObjAccountInvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: string;
  organizations: { name: string } | null;
};

type fldObjAccountRelationRow = {
  id: string;
  peer_profile_id: string | null;
  peer_organization_id: string | null;
  relation: string;
};

type fldObjPeerNameRow = {
  id: string;
  display_name?: string | null;
  name?: string | null;
};

function fncRunRequireId(fldStrValue: string, fldStrLabel: string): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: account social ${fldStrLabel} is missing or blank.`,
    );
  }
  return fldStrTrimmed;
}

function fncRunIsMessageRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountMessageRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountMessageRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.sender_profile_id === 'string' &&
    (typeof fldObjRow.recipient_profile_id === 'string' ||
      fldObjRow.recipient_profile_id === null) &&
    (typeof fldObjRow.recipient_organization_id === 'string' ||
      fldObjRow.recipient_organization_id === null) &&
    typeof fldObjRow.body === 'string' &&
    typeof fldObjRow.is_read === 'boolean'
  );
}

function fncRunIsInvitationRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountInvitationRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountInvitationRow>;
  if (
    typeof fldObjRow.id !== 'string' ||
    typeof fldObjRow.organization_id !== 'string' ||
    typeof fldObjRow.email !== 'string' ||
    typeof fldObjRow.role !== 'string' ||
    typeof fldObjRow.status !== 'string'
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

function fncRunIsInvitationStatus(
  fldStrValue: string,
): fldStrValue is fldStrInvitationStatus {
  return (
    fldStrValue === 'pending' ||
    fldStrValue === 'accepted' ||
    fldStrValue === 'declined' ||
    fldStrValue === 'expired'
  );
}

function fncRunIsRelationRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountRelationRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountRelationRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    (typeof fldObjRow.peer_profile_id === 'string' ||
      fldObjRow.peer_profile_id === null) &&
    (typeof fldObjRow.peer_organization_id === 'string' ||
      fldObjRow.peer_organization_id === null) &&
    typeof fldObjRow.relation === 'string'
  );
}

function fncRunIsPeerNameRow(
  fldObjValue: unknown,
): fldObjValue is fldObjPeerNameRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjPeerNameRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    (fldObjRow.display_name === undefined ||
      typeof fldObjRow.display_name === 'string' ||
      fldObjRow.display_name === null) &&
    (fldObjRow.name === undefined ||
      typeof fldObjRow.name === 'string' ||
      fldObjRow.name === null)
  );
}

function fncRunSingleRecipient(
  fldStrProfileId: string | undefined,
  fldStrOrganizationId: string | undefined,
  fldStrLabel: string,
): { fldStrProfileId: string | null; fldStrOrganizationId: string | null } {
  const fldStrProfile = (fldStrProfileId ?? '').trim();
  const fldStrOrg = (fldStrOrganizationId ?? '').trim();
  const fldNumSet = (fldStrProfile === '' ? 0 : 1) + (fldStrOrg === '' ? 0 : 1);
  if (fldNumSet !== 1) {
    throw new Error(
      `Logosphere BITS: account social ${fldStrLabel} needs exactly one ` +
        'recipient.',
    );
  }
  return {
    fldStrProfileId: fldStrProfile === '' ? null : fldStrProfile,
    fldStrOrganizationId: fldStrOrg === '' ? null : fldStrOrg,
  };
}

export async function srvApiGetAccountMessages(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountMessage[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('account_messages')
    .select(
      'id, sender_profile_id, recipient_profile_id, ' +
        'recipient_organization_id, body, is_read',
    )
    .order('created_at', { ascending: false });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: message list unavailable ' +
        `(account_messages read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: account_messages returned an unexpected ' +
        'shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsMessageRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: account_messages returned an unexpected ' +
          'shape (need id + sender + recipient + body + is_read).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrSenderProfileId: fldObjRow.sender_profile_id,
      fldStrRecipientProfileId: fldObjRow.recipient_profile_id,
      fldStrRecipientOrganizationId: fldObjRow.recipient_organization_id,
      fldStrBody: fldObjRow.body,
      fldBooIsRead: fldObjRow.is_read,
    };
  });
}

export async function srvApiSendAccountMessage(
  fldObjClient: SupabaseClient,
  fldObjCompose: fldObjMessageCompose,
): Promise<fldObjAccountMessage> {
  const fldObjRecipient = fncRunSingleRecipient(
    fldObjCompose.fldStrRecipientProfileId,
    fldObjCompose.fldStrRecipientOrganizationId,
    'message',
  );
  const fldStrBody = fldObjCompose.fldStrBody.trim();
  if (fldStrBody === '') {
    throw new Error('Logosphere BITS: account social body is missing.');
  }
  const { data: fldObjUserData, error: fldObjUserError } =
    await fldObjClient.auth.getUser();
  if (fldObjUserError) {
    throw new Error(
      'Logosphere BITS: message send failed ' +
        `(identity read failed: ${fldObjUserError.message}).`,
    );
  }
  const fldStrSenderId = fldObjUserData?.user?.id;
  if (typeof fldStrSenderId !== 'string' || fldStrSenderId === '') {
    throw new Error(
      'Logosphere BITS: message send failed (no identity was returned).',
    );
  }
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('account_messages')
    .insert({
      sender_profile_id: fldStrSenderId,
      recipient_profile_id: fldObjRecipient.fldStrProfileId,
      recipient_organization_id: fldObjRecipient.fldStrOrganizationId,
      body: fldStrBody,
    })
    .select(
      'id, sender_profile_id, recipient_profile_id, ' +
        'recipient_organization_id, body, is_read',
    )
    .single();
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: message send failed: ' + `${fldObjError.message}.`,
    );
  }
  if (!fncRunIsMessageRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: account_messages returned an unexpected ' +
        'shape (need the sent row).',
    );
  }
  return {
    fldStrId: fldObjRow.id,
    fldStrSenderProfileId: fldObjRow.sender_profile_id,
    fldStrRecipientProfileId: fldObjRow.recipient_profile_id,
    fldStrRecipientOrganizationId: fldObjRow.recipient_organization_id,
    fldStrBody: fldObjRow.body,
    fldBooIsRead: fldObjRow.is_read,
  };
}

export async function srvApiMarkAccountMessageRead(
  fldObjClient: SupabaseClient,
  fldStrMessageId: string,
): Promise<void> {
  const fldStrId = fncRunRequireId(fldStrMessageId, 'message id');
  const { error: fldObjError } = await fldObjClient.rpc(
    'account_mark_message_read',
    { p_message_id: fldStrId },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: message read failed: ' + `${fldObjError.message}.`,
    );
  }
}

export async function srvApiGetAccountInvitations(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountInvitation[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('account_invitations')
    .select('id, organization_id, email, role, status, organizations ( name )')
    .order('created_at', { ascending: false });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: invitation list unavailable ' +
        `(account_invitations read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: account_invitations returned an unexpected ' +
        'shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsInvitationRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: account_invitations returned an unexpected ' +
          'shape (need id + organization + email + role + status).',
      );
    }
    if (!fncRunIsInvitationStatus(fldObjRow.status)) {
      throw new Error(
        'Logosphere BITS: account_invitations returned an unknown status.',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrOrganizationId: fldObjRow.organization_id,
      fldStrOrganizationName: fldObjRow.organizations?.name ?? '',
      fldStrEmail: fldObjRow.email,
      fldStrRoleCode: fldObjRow.role,
      fldStrStatus: fldObjRow.status,
    };
  });
}

export async function srvApiInviteAccountMember(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjInviteRequest,
): Promise<fldObjIssuedInvitation> {
  const fldStrOrgId = fncRunRequireId(
    fldObjRequest.fldStrOrganizationId,
    'organization id',
  );
  const fldStrEmail = fldObjRequest.fldStrEmail.trim();
  if (!vldChgIsEmailValid(fldStrEmail)) {
    throw new Error('Logosphere BITS: account social email invalid.');
  }
  const fldStrRoleCode = fncRunRequireId(
    fldObjRequest.fldStrRoleCode,
    'role code',
  );
  const { data: fldObjIssued, error: fldObjError } = await fldObjClient.rpc(
    'account_invite_member',
    {
      p_organization_id: fldStrOrgId,
      p_email: fldStrEmail,
      p_role: fldStrRoleCode,
    },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: invitation failed: ' + `${fldObjError.message}.`,
    );
  }
  const fldObjShape = fldObjIssued as {
    id?: unknown;
    token?: unknown;
    expires_at?: unknown;
  } | null;
  if (
    typeof fldObjShape !== 'object' ||
    fldObjShape === null ||
    typeof fldObjShape.id !== 'string' ||
    typeof fldObjShape.token !== 'string' ||
    typeof fldObjShape.expires_at !== 'string'
  ) {
    throw new Error(
      'Logosphere BITS: account_invite_member returned an ' +
        'unexpected shape (need id + token + expires_at).',
    );
  }
  return {
    fldStrId: fldObjShape.id,
    fldStrToken: fldObjShape.token,
    fldStrExpiresAt: fldObjShape.expires_at,
  };
}

export async function srvApiAcceptAccountInvitation(
  fldObjClient: SupabaseClient,
  fldStrToken: string,
): Promise<string> {
  const fldStrCleanToken = fncRunRequireId(fldStrToken, 'invitation token');
  const { data: fldObjOrgId, error: fldObjError } = await fldObjClient.rpc(
    'account_accept_invitation',
    { p_token: fldStrCleanToken },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: invitation accept failed: ' + `${fldObjError.message}.`,
    );
  }
  if (typeof fldObjOrgId !== 'string' || fldObjOrgId === '') {
    throw new Error(
      'Logosphere BITS: account_accept_invitation returned an ' +
        'unexpected shape (need the organization id).',
    );
  }
  return fldObjOrgId;
}

export async function srvApiDeclineAccountInvitation(
  fldObjClient: SupabaseClient,
  fldStrToken: string,
): Promise<void> {
  const fldStrCleanToken = fncRunRequireId(fldStrToken, 'invitation token');
  const { error: fldObjError } = await fldObjClient.rpc(
    'account_decline_invitation',
    { p_token: fldStrCleanToken },
  );
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: invitation decline failed: ' +
        `${fldObjError.message}.`,
    );
  }
}

export async function srvApiGetAccountRelations(
  fldObjClient: SupabaseClient,
): Promise<fldObjAccountRelationLink[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('account_relations')
    .select('id, peer_profile_id, peer_organization_id, relation')
    .order('created_at', { ascending: false });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: relation list unavailable ' +
        `(account_relations read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: account_relations returned an unexpected ' +
        'shape (need a row list).',
    );
  }
  const fldArrLinks = fldObjRows.map(fldObjRow => {
    if (!fncRunIsRelationRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: account_relations returned an unexpected ' +
          'shape (need id + peer + relation).',
      );
    }
    if (!vldChgIsAccountRelation(fldObjRow.relation)) {
      throw new Error(
        'Logosphere BITS: account_relations returned an unknown relation.',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrPeerProfileId: fldObjRow.peer_profile_id,
      fldStrPeerOrganizationId: fldObjRow.peer_organization_id,
      fldStrRelation: fldObjRow.relation,
    };
  });
  const fldArrProfileIds = fldArrLinks
    .map(fldObjLink => fldObjLink.fldStrPeerProfileId)
    .filter((fldStrId): fldStrId is string => fldStrId !== null);
  const fldArrOrgIds = fldArrLinks
    .map(fldObjLink => fldObjLink.fldStrPeerOrganizationId)
    .filter((fldStrId): fldStrId is string => fldStrId !== null);
  const fldObjNames = new Map<string, string | null>();
  if (fldArrProfileIds.length > 0) {
    const { data: fldObjProfileRows, error: fldObjProfileError } =
      await fldObjClient
        .from('profiles')
        .select('id, display_name')
        .in('id', fldArrProfileIds);
    if (fldObjProfileError) {
      throw new Error(
        'Logosphere BITS: relation list unavailable ' +
          `(profiles read failed: ${fldObjProfileError.message}).`,
      );
    }
    if (!Array.isArray(fldObjProfileRows)) {
      throw new Error(
        'Logosphere BITS: profiles returned an unexpected shape ' +
          '(need a row list).',
      );
    }
    for (const fldObjRow of fldObjProfileRows) {
      if (!fncRunIsPeerNameRow(fldObjRow)) {
        throw new Error(
          'Logosphere BITS: profiles returned an unexpected shape ' +
            '(need id + display_name).',
        );
      }
      fldObjNames.set(fldObjRow.id, fldObjRow.display_name ?? null);
    }
  }
  if (fldArrOrgIds.length > 0) {
    const { data: fldObjOrgRows, error: fldObjOrgError } = await fldObjClient
      .from('organizations')
      .select('id, name')
      .in('id', fldArrOrgIds);
    if (fldObjOrgError) {
      throw new Error(
        'Logosphere BITS: relation list unavailable ' +
          `(organizations read failed: ${fldObjOrgError.message}).`,
      );
    }
    if (!Array.isArray(fldObjOrgRows)) {
      throw new Error(
        'Logosphere BITS: organizations returned an unexpected ' +
          'shape (need a row list).',
      );
    }
    for (const fldObjRow of fldObjOrgRows) {
      if (!fncRunIsPeerNameRow(fldObjRow)) {
        throw new Error(
          'Logosphere BITS: organizations returned an unexpected ' +
            'shape (need id + name).',
        );
      }
      fldObjNames.set(fldObjRow.id, fldObjRow.name ?? null);
    }
  }
  return fldArrLinks.map(fldObjLink => ({
    fldStrId: fldObjLink.fldStrId,
    fldStrPeerProfileId: fldObjLink.fldStrPeerProfileId,
    fldStrPeerOrganizationId: fldObjLink.fldStrPeerOrganizationId,
    fldStrPeerName:
      fldObjNames.get(
        fldObjLink.fldStrPeerProfileId ??
          fldObjLink.fldStrPeerOrganizationId ??
          '',
      ) ?? null,
    fldStrRelation: fldObjLink.fldStrRelation,
  }));
}

export async function srvApiAddAccountRelation(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjRelationAdd,
): Promise<fldObjAccountRelationLink> {
  const fldObjPeer = fncRunSingleRecipient(
    fldObjRequest.fldStrPeerProfileId,
    fldObjRequest.fldStrPeerOrganizationId,
    'relation',
  );
  if (!vldChgIsAccountRelation(fldObjRequest.fldStrRelation)) {
    throw new Error('Logosphere BITS: unknown relation.');
  }
  const { data: fldObjUserData, error: fldObjUserError } =
    await fldObjClient.auth.getUser();
  if (fldObjUserError) {
    throw new Error(
      'Logosphere BITS: relation add failed ' +
        `(identity read failed: ${fldObjUserError.message}).`,
    );
  }
  const fldStrOwnerId = fldObjUserData?.user?.id;
  if (typeof fldStrOwnerId !== 'string' || fldStrOwnerId === '') {
    throw new Error(
      'Logosphere BITS: relation add failed (no identity was returned).',
    );
  }
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('account_relations')
    .insert({
      profile_id: fldStrOwnerId,
      peer_profile_id: fldObjPeer.fldStrProfileId,
      peer_organization_id: fldObjPeer.fldStrOrganizationId,
      relation: fldObjRequest.fldStrRelation,
    })
    .select('id, peer_profile_id, peer_organization_id, relation')
    .single();
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: relation add failed: ' + `${fldObjError.message}.`,
    );
  }
  if (!fncRunIsRelationRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: account_relations returned an unexpected ' +
        'shape (need the added row).',
    );
  }
  if (!vldChgIsAccountRelation(fldObjRow.relation)) {
    throw new Error(
      'Logosphere BITS: account_relations returned an unknown relation.',
    );
  }
  return {
    fldStrId: fldObjRow.id,
    fldStrPeerProfileId: fldObjRow.peer_profile_id,
    fldStrPeerOrganizationId: fldObjRow.peer_organization_id,
    fldStrPeerName: null,
    fldStrRelation: fldObjRow.relation,
  };
}

export async function srvApiRemoveAccountRelation(
  fldObjClient: SupabaseClient,
  fldStrRelationId: string,
): Promise<void> {
  const fldStrId = fncRunRequireId(fldStrRelationId, 'relation id');
  const { error: fldObjError } = await fldObjClient
    .from('account_relations')
    .delete()
    .eq('id', fldStrId);
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: relation removal failed: ' + `${fldObjError.message}.`,
    );
  }
}
