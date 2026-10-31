-- Logosphere BITS — real-account core: self-service profile/org plane
-- plus explicit demo-session rejection.
--
-- Hidden account plane (SCOPE F11): authenticated users manage ONLY
-- their own profile row and the organizations they belong to. Demo
-- callers (sessionless anon, auth.uid() null) are rejected by every
-- account RPC, and any demo session id passed where a profile or
-- organization id belongs is trapped explicitly. No trigger is added
-- on auth.users, and nothing here writes demo_personas: real
-- registration can never alter the shared demo persona seed.
--
-- Rules enforced:
-- 1. Auth is the only authority: account_authorize() returns
--    auth.uid() and raises 'real account required' when no Auth user
--    is present. Demo sessions carry no JWT, so they fail here.
-- 2. Demo ids fail closed: account_reject_demo_id() raises 'demo
--    session cannot manage accounts' for any id found in
--    demo_sessions. Every account RPC that takes a profile or
--    organization id calls it before touching a row.
-- 3. Self scoping: profiles rows are readable/writable only by their
--    own user (id = auth.uid()); organizations and memberships are
--    readable only by members, through SECURITY DEFINER membership
--    helpers (no recursive policy lookup).
-- 4. Writes ride on RPCs: profile upsert, organization creation
--    (creator becomes account_manager), and role assignment
--    (account_manager of that org only). Role vocabulary stays the
--    roles FK; profile-type vocabulary stays the profiles CHECK.
-- 5. Grants stay minimal: authenticated gets SELECT on
--    organizations/memberships and SELECT/INSERT/UPDATE on profiles
--    (all policy-bound); anon gets nothing new. This is the D9
--    reconsideration the auth flow's arrival calls for.
-- Concurrency: membership upserts key on (organization_id,
-- profile_id); concurrent assigns serialize on the row.

create or replace function public.account_authorize()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_id uuid;
begin
  user_id := auth.uid();

  if user_id is null then
    raise exception 'real account required';
  end if;

  return user_id;
end;
$$;

revoke all on function public.account_authorize()
  from public, anon, authenticated;

create or replace function public.account_reject_demo_id(p_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_id is not null and exists (
    select 1
      from public.demo_sessions
      where id = p_id
  ) then
    raise exception 'demo session cannot manage accounts';
  end if;
end;
$$;

revoke all on function public.account_reject_demo_id(uuid)
  from public, anon, authenticated;

create or replace function public.account_is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_memberships as m
      where m.organization_id = p_organization_id
        and m.profile_id = auth.uid()
  );
$$;

revoke all on function public.account_is_org_member(uuid)
  from public, anon, authenticated;

create or replace function public.account_is_org_manager(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_memberships as m
      where m.organization_id = p_organization_id
        and m.profile_id = auth.uid()
        and m.role = 'account_manager'
  );
$$;

revoke all on function public.account_is_org_manager(uuid)
  from public, anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;

drop policy if exists profiles_self_read on public.profiles;

create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;

create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists organizations_member_read on public.organizations;

create policy organizations_member_read on public.organizations
  for select to authenticated
  using (public.account_is_org_member(id));

drop policy if exists memberships_member_read on public.organization_memberships;

create policy memberships_member_read on public.organization_memberships
  for select to authenticated
  using (public.account_is_org_member(organization_id));

create or replace function public.account_upsert_profile(
  p_display_name text,
  p_profile_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
begin
  user_id := public.account_authorize();

  if p_profile_type is null
    or (p_profile_type <> 'individual' and p_profile_type <> 'corporate')
  then
    raise exception 'unknown profile type';
  end if;

  if p_display_name is null or btrim(p_display_name) = '' then
    raise exception 'display name required';
  end if;

  insert into public.profiles (id, profile_type, display_name)
  values (user_id, p_profile_type, btrim(p_display_name))
  on conflict (id) do update set
    profile_type = excluded.profile_type,
    display_name = excluded.display_name,
    updated_at = now();
end;
$$;

create or replace function public.account_create_organization(
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  new_id uuid;
begin
  user_id := public.account_authorize();

  if p_name is null or btrim(p_name) = '' then
    raise exception 'organization name required';
  end if;

  insert into public.organizations (name)
  values (btrim(p_name))
  returning id into new_id;

  insert into public.organization_memberships
    (organization_id, profile_id, role)
  values (new_id, user_id, 'account_manager')
  on conflict (organization_id, profile_id) do update set
    role = excluded.role,
    updated_at = now();

  return new_id;
end;
$$;

create or replace function public.account_assign_role(
  p_organization_id uuid,
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
begin
  user_id := public.account_authorize();

  perform public.account_reject_demo_id(p_organization_id);
  perform public.account_reject_demo_id(p_profile_id);

  if p_organization_id is null or p_profile_id is null then
    raise exception 'organization and profile required';
  end if;

  if not public.account_is_org_manager(p_organization_id) then
    raise exception 'account manager required';
  end if;

  if p_role is null or not exists (
    select 1 from public.roles where code = p_role
  ) then
    raise exception 'unknown role';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_profile_id
  ) then
    raise exception 'unknown profile';
  end if;

  insert into public.organization_memberships
    (organization_id, profile_id, role)
  values (p_organization_id, p_profile_id, p_role)
  on conflict (organization_id, profile_id) do update set
    role = excluded.role,
    updated_at = now();
end;
$$;

grant execute on function public.account_upsert_profile(text, text)
  to authenticated;
grant execute on function public.account_create_organization(text)
  to authenticated;
grant execute on function public.account_assign_role(uuid, uuid, text)
  to authenticated;
