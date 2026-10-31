-- Logosphere BITS — role matrix management plus co-member profile reads.
--
-- Hidden account plane (SCOPE F11): the 7-action by 3-scope matrix
-- stays readable to clients (policy tables are intentionally open),
-- but grants and revokes ride on a manager-gated RPC — nobody edits
-- the matrix through table writes. Org managers also need member
-- names to assign roles, so members can read the profiles they
-- share an organization with (own row stays covered by the self
-- policy; the two SELECT policies combine with OR).
--
-- Rules enforced:
-- 1. Matrix writes are account_manager-only: the caller must hold
--    account_manager in at least one organization; demo callers
--    (auth.uid() null) fail at account_authorize() first.
-- 2. Closed vocabulary on the write path: role must exist in roles,
--    action and scope must name matrix vocabulary — each rejected
--    with its own error before any write. The table CHECKs still
--    fire as a second layer.
-- 3. No demo ids apply here: the RPC takes role/action/scope
--    vocabulary plus a grant flag — no profile or organization id
--    exists to trap, and demo sessions authenticate nowhere.
-- 4. Co-member reads stay org-bound: a profile row is visible only
--    to its owner or to a member of a shared organization; anon
--    gets nothing new.
-- Concurrency: grant inserts key on (role_code, action, scope);
-- concurrent grants serialize on the row, revokes delete idempotently.

drop policy if exists profiles_org_read on public.profiles;

create policy profiles_org_read on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
        from public.organization_memberships as m1
        join public.organization_memberships as m2
          on m2.organization_id = m1.organization_id
        where m1.profile_id = auth.uid()
          and m2.profile_id = profiles.id
    )
  );

create or replace function public.account_set_matrix_cell(
  p_role text,
  p_action text,
  p_scope text,
  p_grant boolean
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

  if p_role is null or not exists (
    select 1 from public.roles where code = p_role
  ) then
    raise exception 'unknown role';
  end if;

  if p_action is null or p_action not in (
    'view', 'create', 'delete', 'sell_toggle', 'price', 'buy', 'sell'
  ) then
    raise exception 'unknown action';
  end if;

  if p_scope is null or p_scope not in ('item', 'collection', 'library') then
    raise exception 'unknown scope';
  end if;

  if p_grant is null then
    raise exception 'grant flag required';
  end if;

  if not exists (
    select 1
      from public.organization_memberships
      where profile_id = user_id
        and role = 'account_manager'
  ) then
    raise exception 'account manager required';
  end if;

  if p_grant then
    insert into public.role_permissions (role_code, action, scope)
    values (p_role, p_action, p_scope)
    on conflict (role_code, action, scope) do nothing;
  else
    delete from public.role_permissions
    where role_code = p_role
      and action = p_action
      and scope = p_scope;
  end if;
end;
$$;

grant execute on function public.account_set_matrix_cell(text, text, text, boolean)
  to authenticated;
