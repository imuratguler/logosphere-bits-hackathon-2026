/**
 * Logosphere BITS — hidden account social service tests (hermetic).
 *
 * Message, invitation, and relation calls run against a fake
 * client: no network, no rows. Ids and bodies are fictional. The
 * confinement check asserts the social path never names a demo
 * table or a demo RPC.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiAcceptAccountInvitation,
  srvApiAddAccountRelation,
  srvApiDeclineAccountInvitation,
  srvApiGetAccountInvitations,
  srvApiGetAccountMessages,
  srvApiGetAccountRelations,
  srvApiInviteAccountMember,
  srvApiMarkAccountMessageRead,
  srvApiRemoveAccountRelation,
  srvApiSendAccountMessage,
} from '../src/services/srvAccountSocial';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

type fldObjFakeSocial = {
  fldObjClient: SupabaseClient;
  fldObjFrom: jest.Mock;
  fldObjRpc: jest.Mock;
  fldObjGetUser: jest.Mock;
};

function fncConvListBuilder(fldObjData: unknown, fldObjError: unknown) {
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

function fncConvInsertBuilder(fldObjData: unknown, fldObjError: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: fldObjData,
      error: fldObjError,
    }),
  };
}

function fncConvFakeSocial(fldObjScript: {
  messages?: unknown;
  messagesError?: { message: string } | null;
  sent?: unknown;
  sentError?: { message: string } | null;
  invitations?: unknown;
  invitationsError?: { message: string } | null;
  issued?: unknown;
  issuedError?: { message: string } | null;
  accepted?: unknown;
  acceptError?: { message: string } | null;
  declineError?: { message: string } | null;
  markError?: { message: string } | null;
  relations?: unknown;
  relationsError?: { message: string } | null;
  added?: unknown;
  addedError?: { message: string } | null;
  removeError?: { message: string } | null;
  profiles?: unknown;
  orgs?: unknown;
  userId?: string | null;
  userError?: { message: string } | null;
}): fldObjFakeSocial {
  const fldObjMessageBuilder = {
    ...fncConvListBuilder(
      fldObjScript.messages === undefined ? [] : fldObjScript.messages,
      fldObjScript.messagesError ?? null,
    ),
    insert: jest
      .fn()
      .mockReturnValue(
        fncConvInsertBuilder(
          fldObjScript.sent ?? null,
          fldObjScript.sentError ?? null,
        ),
      ),
  };
  const fldObjRelationBuilder = {
    ...fncConvListBuilder(
      fldObjScript.relations === undefined ? [] : fldObjScript.relations,
      fldObjScript.relationsError ?? fldObjScript.removeError ?? null,
    ),
    insert: jest
      .fn()
      .mockReturnValue(
        fncConvInsertBuilder(
          fldObjScript.added ?? null,
          fldObjScript.addedError ?? null,
        ),
      ),
    delete: jest.fn().mockReturnThis(),
  };
  const fldObjFrom = jest.fn((fldStrTable: string) => {
    if (fldStrTable === 'account_messages') {
      return fldObjMessageBuilder;
    }
    if (fldStrTable === 'account_invitations') {
      return fncConvListBuilder(
        fldObjScript.invitations === undefined ? [] : fldObjScript.invitations,
        fldObjScript.invitationsError ?? null,
      );
    }
    if (fldStrTable === 'account_relations') {
      return fldObjRelationBuilder;
    }
    if (fldStrTable === 'profiles') {
      return fncConvListBuilder(fldObjScript.profiles ?? [], null);
    }
    return fncConvListBuilder(fldObjScript.orgs ?? [], null);
  });
  const fldObjRpc = jest.fn((fldStrName: string) => {
    if (fldStrName === 'account_invite_member') {
      return Promise.resolve({
        data: fldObjScript.issued ?? null,
        error: fldObjScript.issuedError ?? null,
      });
    }
    if (fldStrName === 'account_accept_invitation') {
      return Promise.resolve({
        data: fldObjScript.accepted ?? null,
        error: fldObjScript.acceptError ?? null,
      });
    }
    if (fldStrName === 'account_decline_invitation') {
      return Promise.resolve({
        data: null,
        error: fldObjScript.declineError ?? null,
      });
    }
    return Promise.resolve({
      data: null,
      error: fldObjScript.markError ?? null,
    });
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
    fldObjGetUser,
  };
}

function fncConvMessageRow() {
  return {
    id: 'msg-1',
    sender_profile_id: 'user-real-1',
    recipient_profile_id: 'user-real-2',
    recipient_organization_id: null,
    body: 'Hello',
    is_read: false,
  };
}

function fncConvInvitationRow() {
  return {
    id: 'inv-1',
    organization_id: fldStrSeedOrg,
    email: 'guest@example.com',
    role: 'authorized',
    status: 'pending',
    organizations: { name: 'Acme' },
  };
}

function fncConvRelationRow() {
  return {
    id: 'rel-1',
    peer_profile_id: 'user-real-2',
    peer_organization_id: null,
    relation: 'contact',
  };
}

describe('hidden account social service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists messages newest first', async () => {
    const fldObjFake = fncConvFakeSocial({ messages: [fncConvMessageRow()] });

    const fldArrMessages = await srvApiGetAccountMessages(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_messages');
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(fldArrMessages).toEqual([
      {
        fldStrId: 'msg-1',
        fldStrSenderProfileId: 'user-real-1',
        fldStrRecipientProfileId: 'user-real-2',
        fldStrRecipientOrganizationId: null,
        fldStrBody: 'Hello',
        fldBooIsRead: false,
      },
    ]);
  });

  it('surfaces message errors naming the table', async () => {
    const fldObjFake = fncConvFakeSocial({
      messagesError: { message: 'db down' },
    });

    await expect(
      srvApiGetAccountMessages(fldObjFake.fldObjClient),
    ).rejects.toThrow(
      'message list unavailable (account_messages read failed: db down).',
    );
  });

  it('rejects malformed message rows', async () => {
    const fldObjFake = fncConvFakeSocial({ messages: [{ id: 'msg-1' }] });

    await expect(
      srvApiGetAccountMessages(fldObjFake.fldObjClient),
    ).rejects.toThrow('need id + sender + recipient + body + is_read');
  });

  it('sends a message as the authenticated user', async () => {
    const fldObjFake = fncConvFakeSocial({
      sent: fncConvMessageRow(),
      userId: 'user-real-1',
    });

    const fldObjMessage = await srvApiSendAccountMessage(
      fldObjFake.fldObjClient,
      {
        fldStrRecipientProfileId: 'user-real-2',
        fldStrBody: '  Hello  ',
      },
    );

    expect(fldObjFake.fldObjGetUser).toHaveBeenCalledTimes(1);
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.insert).toHaveBeenCalledWith({
      sender_profile_id: 'user-real-1',
      recipient_profile_id: 'user-real-2',
      recipient_organization_id: null,
      body: 'Hello',
    });
    expect(fldObjMessage.fldStrId).toBe('msg-1');
  });

  it('requires exactly one message recipient before any call', async () => {
    const fldObjFake = fncConvFakeSocial({
      sent: fncConvMessageRow(),
      userId: 'user-real-1',
    });

    await expect(
      srvApiSendAccountMessage(fldObjFake.fldObjClient, {
        fldStrRecipientProfileId: 'user-real-2',
        fldStrRecipientOrganizationId: fldStrSeedOrg,
        fldStrBody: 'Hello',
      }),
    ).rejects.toThrow('needs exactly one recipient');
    await expect(
      srvApiSendAccountMessage(fldObjFake.fldObjClient, {
        fldStrBody: 'Hello',
      }),
    ).rejects.toThrow('needs exactly one recipient');
    expect(fldObjFake.fldObjGetUser).not.toHaveBeenCalled();
  });

  it('requires a message body before any call', async () => {
    const fldObjFake = fncConvFakeSocial({
      sent: fncConvMessageRow(),
      userId: 'user-real-1',
    });

    await expect(
      srvApiSendAccountMessage(fldObjFake.fldObjClient, {
        fldStrRecipientProfileId: 'user-real-2',
        fldStrBody: '   ',
      }),
    ).rejects.toThrow('body is missing');
    expect(fldObjFake.fldObjGetUser).not.toHaveBeenCalled();
  });

  it('stops send when identity is missing', async () => {
    const fldObjFake = fncConvFakeSocial({
      sent: fncConvMessageRow(),
      userId: null,
    });

    await expect(
      srvApiSendAccountMessage(fldObjFake.fldObjClient, {
        fldStrRecipientProfileId: 'user-real-2',
        fldStrBody: 'Hello',
      }),
    ).rejects.toThrow('no identity was returned');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces send failure naming the call', async () => {
    const fldObjFake = fncConvFakeSocial({
      sentError: { message: 'not a member' },
      userId: 'user-real-1',
    });

    await expect(
      srvApiSendAccountMessage(fldObjFake.fldObjClient, {
        fldStrRecipientProfileId: 'user-real-2',
        fldStrBody: 'Hello',
      }),
    ).rejects.toThrow('message send failed: not a member.');
  });

  it('marks a message read through the account RPC', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await srvApiMarkAccountMessageRead(fldObjFake.fldObjClient, 'msg-1');

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_mark_message_read',
      { p_message_id: 'msg-1' },
    );
  });

  it('requires a message id before any call', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await expect(
      srvApiMarkAccountMessageRead(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('message id is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces read refusal naming the call', async () => {
    const fldObjFake = fncConvFakeSocial({
      markError: { message: 'message recipient required' },
    });

    await expect(
      srvApiMarkAccountMessageRead(fldObjFake.fldObjClient, 'msg-1'),
    ).rejects.toThrow('message read failed: message recipient required.');
  });

  it('lists invitations with organization names', async () => {
    const fldObjFake = fncConvFakeSocial({
      invitations: [fncConvInvitationRow()],
    });

    const fldArrInvitations = await srvApiGetAccountInvitations(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_invitations');
    expect(fldArrInvitations).toEqual([
      {
        fldStrId: 'inv-1',
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrOrganizationName: 'Acme',
        fldStrEmail: 'guest@example.com',
        fldStrRoleCode: 'authorized',
        fldStrStatus: 'pending',
      },
    ]);
  });

  it('rejects invitations outside the status vocabulary', async () => {
    const fldObjFake = fncConvFakeSocial({
      invitations: [{ ...fncConvInvitationRow(), status: 'forwarded' }],
    });

    await expect(
      srvApiGetAccountInvitations(fldObjFake.fldObjClient),
    ).rejects.toThrow('unknown status');
  });

  it('invites through the account RPC and maps the issued token', async () => {
    const fldObjFake = fncConvFakeSocial({
      issued: {
        id: 'inv-1',
        token: 'tok-abc',
        expires_at: '2026-11-07T00:00:00Z',
      },
    });

    const fldObjIssued = await srvApiInviteAccountMember(
      fldObjFake.fldObjClient,
      {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrEmail: '  guest@example.com  ',
        fldStrRoleCode: 'authorized',
      },
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith('account_invite_member', {
      p_organization_id: fldStrSeedOrg,
      p_email: 'guest@example.com',
      p_role: 'authorized',
    });
    expect(fldObjIssued).toEqual({
      fldStrId: 'inv-1',
      fldStrToken: 'tok-abc',
      fldStrExpiresAt: '2026-11-07T00:00:00Z',
    });
  });

  it('rejects a malformed invite email before any call', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await expect(
      srvApiInviteAccountMember(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrEmail: 'guest@example',
        fldStrRoleCode: 'authorized',
      }),
    ).rejects.toThrow('email invalid');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('rejects a malformed issued invitation', async () => {
    const fldObjFake = fncConvFakeSocial({ issued: { id: 'inv-1' } });

    await expect(
      srvApiInviteAccountMember(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrEmail: 'guest@example.com',
        fldStrRoleCode: 'authorized',
      }),
    ).rejects.toThrow('need id + token + expires_at');
  });

  it('accepts an invitation into its organization', async () => {
    const fldObjFake = fncConvFakeSocial({ accepted: fldStrSeedOrg });

    const fldStrOrgId = await srvApiAcceptAccountInvitation(
      fldObjFake.fldObjClient,
      '  tok-abc  ',
    );

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_accept_invitation',
      { p_token: 'tok-abc' },
    );
    expect(fldStrOrgId).toBe(fldStrSeedOrg);
  });

  it('requires an accept token before any call', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await expect(
      srvApiAcceptAccountInvitation(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('invitation token is missing or blank');
    expect(fldObjFake.fldObjRpc).not.toHaveBeenCalled();
  });

  it('surfaces accept refusal naming the call', async () => {
    const fldObjFake = fncConvFakeSocial({
      acceptError: { message: 'invitation expired' },
    });

    await expect(
      srvApiAcceptAccountInvitation(fldObjFake.fldObjClient, 'tok-abc'),
    ).rejects.toThrow('invitation accept failed: invitation expired.');
  });

  it('declines an invitation through the account RPC', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await srvApiDeclineAccountInvitation(fldObjFake.fldObjClient, 'tok-abc');

    expect(fldObjFake.fldObjRpc).toHaveBeenCalledWith(
      'account_decline_invitation',
      { p_token: 'tok-abc' },
    );
  });

  it('surfaces decline refusal naming the call', async () => {
    const fldObjFake = fncConvFakeSocial({
      declineError: { message: 'invitation already decided' },
    });

    await expect(
      srvApiDeclineAccountInvitation(fldObjFake.fldObjClient, 'tok-abc'),
    ).rejects.toThrow('invitation decline failed: invitation already decided.');
  });

  it('lists relations with peer names', async () => {
    const fldObjFake = fncConvFakeSocial({
      relations: [
        fncConvRelationRow(),
        {
          id: 'rel-2',
          peer_profile_id: null,
          peer_organization_id: fldStrSeedOrg,
          relation: 'partner',
        },
      ],
      profiles: [{ id: 'user-real-2', display_name: 'Guest' }],
      orgs: [{ id: fldStrSeedOrg, name: 'Acme' }],
    });

    const fldArrLinks = await srvApiGetAccountRelations(
      fldObjFake.fldObjClient,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_relations');
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('profiles');
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('organizations');
    expect(fldArrLinks).toEqual([
      {
        fldStrId: 'rel-1',
        fldStrPeerProfileId: 'user-real-2',
        fldStrPeerOrganizationId: null,
        fldStrPeerName: 'Guest',
        fldStrRelation: 'contact',
      },
      {
        fldStrId: 'rel-2',
        fldStrPeerProfileId: null,
        fldStrPeerOrganizationId: fldStrSeedOrg,
        fldStrPeerName: 'Acme',
        fldStrRelation: 'partner',
      },
    ]);
  });

  it('skips peer lookups when no relations exist', async () => {
    const fldObjFake = fncConvFakeSocial({ relations: [] });

    await expect(
      srvApiGetAccountRelations(fldObjFake.fldObjClient),
    ).resolves.toEqual([]);
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledTimes(1);
  });

  it('rejects relations outside the vocabulary', async () => {
    const fldObjFake = fncConvFakeSocial({
      relations: [{ ...fncConvRelationRow(), relation: 'stalking' }],
    });

    await expect(
      srvApiGetAccountRelations(fldObjFake.fldObjClient),
    ).rejects.toThrow('unknown relation');
  });

  it('adds a relation as the authenticated user', async () => {
    const fldObjFake = fncConvFakeSocial({
      added: fncConvRelationRow(),
      userId: 'user-real-1',
    });

    const fldObjLink = await srvApiAddAccountRelation(fldObjFake.fldObjClient, {
      fldStrPeerProfileId: 'user-real-2',
      fldStrRelation: 'contact',
    });

    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.insert).toHaveBeenCalledWith({
      profile_id: 'user-real-1',
      peer_profile_id: 'user-real-2',
      peer_organization_id: null,
      relation: 'contact',
    });
    expect(fldObjLink.fldStrId).toBe('rel-1');
    expect(fldObjLink.fldStrPeerName).toBeNull();
  });

  it('requires exactly one relation peer before any call', async () => {
    const fldObjFake = fncConvFakeSocial({
      added: fncConvRelationRow(),
      userId: 'user-real-1',
    });

    await expect(
      srvApiAddAccountRelation(fldObjFake.fldObjClient, {
        fldStrRelation: 'contact',
      }),
    ).rejects.toThrow('needs exactly one recipient');
    expect(fldObjFake.fldObjGetUser).not.toHaveBeenCalled();
  });

  it('rejects an unknown relation before any call', async () => {
    const fldObjFake = fncConvFakeSocial({
      added: fncConvRelationRow(),
      userId: 'user-real-1',
    });

    await expect(
      srvApiAddAccountRelation(fldObjFake.fldObjClient, {
        fldStrPeerProfileId: 'user-real-2',
        fldStrRelation: 'stalking',
      }),
    ).rejects.toThrow('unknown relation');
    expect(fldObjFake.fldObjGetUser).not.toHaveBeenCalled();
  });

  it('removes a relation by id', async () => {
    const fldObjFake = fncConvFakeSocial({});

    await srvApiRemoveAccountRelation(fldObjFake.fldObjClient, 'rel-1');

    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('account_relations');
    expect(fldObjBuilder.delete).toHaveBeenCalledTimes(1);
    expect(fldObjBuilder.eq).toHaveBeenCalledWith('id', 'rel-1');
  });

  it('surfaces relation removal failure naming the call', async () => {
    const fldObjFake = fncConvFakeSocial({
      removeError: { message: 'db down' },
    });

    await expect(
      srvApiRemoveAccountRelation(fldObjFake.fldObjClient, 'rel-1'),
    ).rejects.toThrow('relation removal failed: db down.');
  });

  it('keeps signatures free of persona, session, and flag parameters', () => {
    expect(srvApiGetAccountMessages.length).toBe(1);
    expect(srvApiSendAccountMessage.length).toBe(2);
    expect(srvApiMarkAccountMessageRead.length).toBe(2);
    expect(srvApiGetAccountInvitations.length).toBe(1);
    expect(srvApiInviteAccountMember.length).toBe(2);
    expect(srvApiAcceptAccountInvitation.length).toBe(2);
    expect(srvApiDeclineAccountInvitation.length).toBe(2);
    expect(srvApiGetAccountRelations.length).toBe(1);
    expect(srvApiAddAccountRelation.length).toBe(2);
    expect(srvApiRemoveAccountRelation.length).toBe(2);
  });

  it('stays inside the social tables and RPCs', async () => {
    const fldObjFake = fncConvFakeSocial({
      messages: [fncConvMessageRow()],
      sent: fncConvMessageRow(),
      invitations: [fncConvInvitationRow()],
      issued: { id: 'inv-1', token: 'tok', expires_at: 'x' },
      accepted: fldStrSeedOrg,
      relations: [fncConvRelationRow()],
      added: fncConvRelationRow(),
      profiles: [{ id: 'user-real-2', display_name: 'Guest' }],
      userId: 'user-real-1',
    });

    await srvApiGetAccountMessages(fldObjFake.fldObjClient);
    await srvApiSendAccountMessage(fldObjFake.fldObjClient, {
      fldStrRecipientProfileId: 'user-real-2',
      fldStrBody: 'Hello',
    });
    await srvApiMarkAccountMessageRead(fldObjFake.fldObjClient, 'msg-1');
    await srvApiGetAccountInvitations(fldObjFake.fldObjClient);
    await srvApiInviteAccountMember(fldObjFake.fldObjClient, {
      fldStrOrganizationId: fldStrSeedOrg,
      fldStrEmail: 'guest@example.com',
      fldStrRoleCode: 'authorized',
    });
    await srvApiAcceptAccountInvitation(fldObjFake.fldObjClient, 'tok');
    await srvApiDeclineAccountInvitation(fldObjFake.fldObjClient, 'tok');
    await srvApiGetAccountRelations(fldObjFake.fldObjClient);
    await srvApiAddAccountRelation(fldObjFake.fldObjClient, {
      fldStrPeerProfileId: 'user-real-2',
      fldStrRelation: 'contact',
    });
    await srvApiRemoveAccountRelation(fldObjFake.fldObjClient, 'rel-1');

    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    const fldArrRpcs = fldObjFake.fldObjRpc.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    expect(fldArrTables).toEqual([
      'account_messages',
      'account_messages',
      'account_invitations',
      'account_relations',
      'profiles',
      'account_relations',
      'account_relations',
    ]);
    expect(fldArrRpcs).toEqual([
      'account_mark_message_read',
      'account_invite_member',
      'account_accept_invitation',
      'account_decline_invitation',
    ]);
    for (const fldStrName of [...fldArrTables, ...fldArrRpcs]) {
      expect(String(fldStrName)).not.toMatch(/demo_/);
    }
  });
});
