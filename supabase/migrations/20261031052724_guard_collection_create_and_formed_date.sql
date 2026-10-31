-- Logosphere BITS — collection shortcut storage: formed date plus guarded create.
--
-- The shortcut asks only for a name; the server stamps today and guards
-- the parent. demo_create_collection keeps its existing signature (so
-- the anon/authenticated execute grant survives; re-issued below for
-- clarity) and now validates parent suitability before inserting:
--
-- Rules enforced:
-- 1. Parent must exist ('unknown node'), must be a library or a
--    collection ('demo collection parent invalid'), and must live in
--    the caller's workspace ('cross-workspace link rejected'). The
--    hierarchy trigger still fires as a second layer.
-- 2. Leaf rule: a collection holding sets or products takes no
--    sub-collection ('demo collection is not empty'). Items live only
--    at leaf collections; libraries never hold sets or products
--    directly (the collection-link trigger guarantees it), so the leaf
--    check runs for collection parents only.
-- 3. Name is required on the server too (fail closed for any caller,
--    not just the validated form): 'demo collection name required'.
-- 4. Client identity is never authority: the RPC takes a session id
--    only and demo_authorize resolves plus gates (create, collection).
--
-- Storage: public.collection_details holds one row per collection node
-- (node_id PK/FK with cascade). Minimal on purpose: only the formed
-- date the shortcut stamps (server CURRENT_DATE — the client sends no
-- date, so the shortcut date is always today). Location parts and
-- website arrive with the collection-settings step. Older and seed
-- collections simply have no details row. Reads stay open: anon keeps
-- SELECT on the details table (shared demo scope, same as nodes).
-- No direct table write grant is added; RLS stays enabled.
--
-- Client error contract additions: 'demo collection parent invalid',
-- 'demo collection is not empty', 'demo collection name required'
-- (plus the demo_write_policy contract: session invalid/expired/
-- revoked, operation not permitted, unknown node).

create table public.collection_details (
  node_id uuid primary key references public.nodes (id) on delete cascade,
  formed_date date,
  updated_at timestamptz not null default now()
);

alter table public.collection_details enable row level security;

revoke all on public.collection_details from anon, authenticated;

grant all on public.collection_details to service_role;

grant select on public.collection_details to anon;

create policy collection_details_anon_read on public.collection_details
  for select to anon
  using (true);

create or replace function public.demo_create_collection(
  p_session_id uuid,
  p_workspace_id uuid,
  p_parent_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_kind text;
  parent_workspace_id uuid;
  new_id uuid;
begin
  select n.kind, n.workspace_id
    into parent_kind, parent_workspace_id
    from public.nodes as n
    where n.id = p_parent_id;

  if not found then
    raise exception 'unknown node';
  end if;

  if parent_kind not in ('library', 'collection') then
    raise exception 'demo collection parent invalid';
  end if;

  if parent_workspace_id is distinct from p_workspace_id then
    raise exception 'cross-workspace link rejected';
  end if;

  if parent_kind = 'collection'
    and (exists (select 1 from public.sets as s where s.collection_id = p_parent_id)
      or exists (select 1 from public.products as p where p.collection_id = p_parent_id)) then
    raise exception 'demo collection is not empty';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'collection');

  if p_name is null or btrim(p_name) = '' then
    raise exception 'demo collection name required';
  end if;

  insert into public.nodes (workspace_id, parent_id, kind, name)
  values (p_workspace_id, p_parent_id, 'collection', btrim(p_name))
  returning id into new_id;

  insert into public.collection_details (node_id, formed_date)
  values (new_id, CURRENT_DATE);

  return new_id;
end;
$$;

grant execute on function public.demo_create_collection(uuid, uuid, uuid, text)
  to anon, authenticated;
