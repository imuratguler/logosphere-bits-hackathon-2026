-- Logosphere BITS — account social plane: messages, invitations,
-- person/org relations.
--
-- Hidden account plane (SCOPE F11): authenticated users message
-- profiles or orgs, managers invite by email with a server-minted
-- token, invitees accept into memberships, and users keep their
-- own contact/partner/blocked links. Nothing here is a precondition
-- of any demo path: no demo table is read or written, and demo
-- callers (anon, no JWT) hold no grant and match no policy.
--
-- Rules enforced:
-- 1. Messages carry exactly one recipient (profile XOR org),
--    sender-bound to auth.uid() on insert, and visible only to
--    sender, recipient profile, or recipient org members. The read
--    flag flips only through account_mark_message_read, which
--    verifies the caller is the recipient side. No UPDATE/DELETE
--    grant exists: bodies are immutable once sent.
-- 2. Invitations ride on RPCs only (no direct write grant):
--    account_invite_member requires an org manager, validates
--    email shape and role vocabulary, and mints a random token;
--    account_accept_invitation / account_decline_invitation
--    require a pending, unexpired token whose email matches the
--    caller's JWT email. Accept upserts the membership and stamps
--    the decision; expiry stamps on first late touch. Token
--    delivery is out of band (no mailer in this stage).
-- 3. Relations are owner-scoped links with exactly one peer
--    (profile XOR org, never self) from a closed vocabulary;
--    only the owner reads, adds, or removes them. No UPDATE
--    grant: change means remove plus re-add.
-- 4. Demo ids fail closed: the org-taking invite RPC traps demo
--    session ids; token-taking RPCs take no ids at all, and demo
--    sessions authenticate nowhere.
-- Concurrency: invitation rows lock per token (FOR UPDATE), so a
-- racing accept/decline pair decides exactly once; relation
-- adds key on (profile, peer) partial uniques.

create table public.account_messages (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles (id),
  recipient_profile_id uuid references public.profiles (id),
  recipient_organization_id uuid references public.organizations (id),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint account_messages_body_check check (btrim(body) <> ''),
  constraint account_messages_single_recipient check (
    num_nonnulls(recipient_profile_id, recipient_organization_id) = 1
  )
);

create index account_messages_sender_idx
  on public.account_messages (sender_profile_id);
create index account_messages_recipient_profile_idx
  on public.account_messages (recipient_profile_id);
create index account_messages_recipient_org_idx
  on public.account_messages (recipient_organization_id);

create table public.account_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  email text not null,
  role text not null references public.roles (code),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  invited_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index account_invitations_organization_id_idx
  on public.account_invitations (organization_id);
create index account_invitations_email_idx
  on public.account_invitations (email);

create table public.account_relations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  peer_profile_id uuid references public.profiles (id),
  peer_organization_id uuid references public.organizations (id),
  relation text not null
    check (relation in ('contact', 'partner', 'blocked')),
  created_at timestamptz not null default now(),
  constraint account_relations_single_peer check (
    num_nonnulls(peer_profile_id, peer_organization_id) = 1
  ),
  constraint account_relations_no_self_link check (
    peer_profile_id is distinct from profile_id
  )
);

create unique index account_relations_profile_peer_profile_uidx
  on public.account_relations (profile_id, peer_profile_id)
  where peer_profile_id is not null;
create unique index account_relations_profile_peer_org_uidx
  on public.account_relations (profile_id, peer_organization_id)
  where peer_organization_id is not null;

alter table public.account_messages enable row level security;
alter table public.account_invitations enable row level security;
alter table public.account_relations enable row level security;

grant select, insert on public.account_messages to authenticated;
grant select on public.account_invitations to authenticated;
grant select, insert, delete on public.account_relations to authenticated;

drop policy if exists account_messages_party_read on public.account_messages;

create policy account_messages_party_read on public.account_messages
  for select to authenticated
  using (
    sender_profile_id = auth.uid()
    or recipient_profile_id = auth.uid()
    or (
      recipient_organization_id is not null
      and public.account_is_org_member(recipient_organization_id)
    )
  );

drop policy if exists account_messages_sender_insert
  on public.account_messages;

create policy account_messages_sender_insert on public.account_messages
  for insert to authenticated
  with check (sender_profile_id = auth.uid());

drop policy if exists account_invitations_party_read
  on public.account_invitations;

create policy account_invitations_party_read on public.account_invitations
  for select to authenticated
  using (
    public.account_is_org_member(organization_id)
    or email = auth.jwt() ->> 'email'
  );

drop policy if exists account_relations_owner_read
  on public.account_relations;

create policy account_relations_owner_read on public.account_relations
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists account_relations_owner_insert
  on public.account_relations;

create policy account_relations_owner_insert on public.account_relations
  for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists account_relations_owner_delete
  on public.account_relations;

create policy account_relations_owner_delete on public.account_relations
  for delete to authenticated
  using (profile_id = auth.uid());

create or replace function public.account_mark_message_read(
  p_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  message_row public.account_messages%rowtype;
begin
  user_id := public.account_authorize();

  perform public.account_reject_demo_id(p_message_id);

  select *
    into message_row
    from public.account_messages
    where id = p_message_id;

  if not found then
    raise exception 'unknown message';
  end if;

  if not (
    message_row.recipient_profile_id = user_id
    or (
      message_row.recipient_organization_id is not null
      and public.account_is_org_member(
        message_row.recipient_organization_id
      )
    )
  ) then
    raise exception 'message recipient required';
  end if;

  update public.account_messages
    set is_read = true
    where id = p_message_id;
end;
$$;

create or replace function public.account_invite_member(
  p_organization_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  new_invitation public.account_invitations%rowtype;
  clean_email text;
begin
  user_id := public.account_authorize();

  perform public.account_reject_demo_id(p_organization_id);

  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if not public.account_is_org_manager(p_organization_id) then
    raise exception 'account manager required';
  end if;

  clean_email := btrim(coalesce(p_email, ''));

  if clean_email = ''
    or clean_email like '% %'
    or position('@' in clean_email) < 2
    or position('.' in substring(clean_email from position('@' in clean_email))) < 2
  then
    raise exception 'email invalid';
  end if;

  if p_role is null or not exists (
    select 1 from public.roles where code = p_role
  ) then
    raise exception 'unknown role';
  end if;

  insert into public.account_invitations
    (organization_id, email, role, token, invited_by)
  values (
    p_organization_id,
    clean_email,
    p_role,
    encode(gen_random_bytes(16), 'hex'),
    user_id
  )
  returning * into new_invitation;

  return jsonb_build_object(
    'id', new_invitation.id,
    'token', new_invitation.token,
    'expires_at', new_invitation.expires_at
  );
end;
$$;

create or replace function public.account_accept_invitation(
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  caller_email text;
  invitation_row public.account_invitations%rowtype;
begin
  user_id := public.account_authorize();

  if p_token is null or btrim(p_token) = '' then
    raise exception 'invitation token required';
  end if;

  select *
    into invitation_row
    from public.account_invitations
    where token = btrim(p_token)
    for update;

  if not found then
    raise exception 'unknown invitation';
  end if;

  if invitation_row.status <> 'pending' then
    raise exception 'invitation already decided';
  end if;

  if invitation_row.expires_at <= now() then
    update public.account_invitations
      set status = 'expired', decided_at = now()
      where id = invitation_row.id;
    raise exception 'invitation expired';
  end if;

  caller_email := auth.jwt() ->> 'email';

  if caller_email is null or caller_email <> invitation_row.email then
    raise exception 'invitation email mismatch';
  end if;

  insert into public.organization_memberships
    (organization_id, profile_id, role)
  values (invitation_row.organization_id, user_id, invitation_row.role)
  on conflict (organization_id, profile_id) do update set
    role = excluded.role,
    updated_at = now();

  update public.account_invitations
    set status = 'accepted', decided_at = now()
    where id = invitation_row.id;

  return invitation_row.organization_id;
end;
$$;

create or replace function public.account_decline_invitation(
  p_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  caller_email text;
  invitation_row public.account_invitations%rowtype;
begin
  user_id := public.account_authorize();

  if p_token is null or btrim(p_token) = '' then
    raise exception 'invitation token required';
  end if;

  select *
    into invitation_row
    from public.account_invitations
    where token = btrim(p_token)
    for update;

  if not found then
    raise exception 'unknown invitation';
  end if;

  if invitation_row.status <> 'pending' then
    raise exception 'invitation already decided';
  end if;

  caller_email := auth.jwt() ->> 'email';

  if caller_email is null or caller_email <> invitation_row.email then
    raise exception 'invitation email mismatch';
  end if;

  update public.account_invitations
    set status = 'declined', decided_at = now()
    where id = invitation_row.id;
end;
$$;

grant execute on function public.account_mark_message_read(uuid)
  to authenticated;
grant execute on function public.account_invite_member(uuid, text, text)
  to authenticated;
grant execute on function public.account_accept_invitation(text)
  to authenticated;
grant execute on function public.account_decline_invitation(text)
  to authenticated;
