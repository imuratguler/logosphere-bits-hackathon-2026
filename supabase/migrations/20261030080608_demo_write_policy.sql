-- Logosphere BITS — demo write policy: server-verified session RPCs.
--
-- Anonymous demo sessions may insert, rename, price, and sell on the
-- shared demo catalog — but only through these SECURITY DEFINER RPCs.
-- No direct table write grant is added for anon/authenticated, RLS
-- stays enabled everywhere, and every RPC verifies session identity
-- plus operation scope on the server before touching a row.
--
-- Rules enforced:
-- 1. Sessions are server-minted: start_demo_session takes a persona id
--    as a selector only, validates it against demo_personas (real
--    profile ids and role codes cannot match), and returns a random
--    session id with a 24-hour expiry. Clients hold no INSERT grant on
--    demo_sessions, so they cannot mint, extend, or rebind sessions;
--    revocation is a server-side update of revoked_at.
-- 2. A client persona id is never authority: write RPCs take a session
--    id only — no persona, role, or profile parameter exists — and the
--    gate resolves the persona from its own session row, then checks
--    the (action, scope) cell in demo_permissions. The real matrix
--    (role_permissions / real_effective_permissions) is never
--    consulted on the demo path.
-- 3. Closed operation world: the RPC list is the allowlist. Renames
--    ride on the create cell (the matrix vocabulary has no update
--    action); pricing observations need the price cell; listing rows
--    additionally need sell_toggle; sale records need sell and carry
--    the current tag/active snapshot server-side instead of trusting
--    client values. No RPC deletes, moves subtrees, edits detail
--    columns, or writes AI estimates — those stay server-side
--    (service_role), even where a sandbox cell exists.
-- 4. Scope mapping is fixed server-side: product subjects resolve to
--    item, set and collection subjects to collection, library nodes to
--    library. Pricing/sale RPCs require exactly one subject; the table
--    single-subject checks still fire as a second layer. A sale with
--    no prior listing snapshots an unknown tag and inactive.
-- 5. Table rules still apply inside RPCs: hierarchy, collection-kind,
--    same-collection, single-subject, and money checks fire normally —
--    the RPC layer adds identity/scope, it never bypasses relational
--    rules.
-- Concurrency: the gate is a read-only lookup (no lock needed —
-- sessions are immutable once minted; a revoke racing an in-flight RPC
-- resolves on the statement snapshot, which is acceptable at demo
-- scale). Relational races keep their existing FOR UPDATE handling.
--
-- Client error contract (exception messages): 'unknown demo persona',
-- 'unknown node' / 'unknown set' / 'unknown product',
-- 'demo pricing needs exactly one subject',
-- 'demo session invalid' | 'demo session expired' | 'demo session revoked',
-- 'demo operation not permitted: <action> on <scope>'.

create table public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.demo_personas (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  revoked_at timestamptz
);

create index demo_sessions_persona_id_idx on public.demo_sessions (persona_id);

alter table public.demo_sessions enable row level security;

revoke all on public.demo_sessions from anon, authenticated;

grant all on public.demo_sessions to service_role;

create or replace function public.demo_authorize(
  p_session_id uuid,
  p_action text,
  p_scope text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.demo_sessions%rowtype;
begin
  select *
    into session_row
    from public.demo_sessions
    where id = p_session_id;

  if not found then
    raise exception 'demo session invalid';
  end if;

  if session_row.revoked_at is not null then
    raise exception 'demo session revoked';
  end if;

  if session_row.expires_at <= now() then
    raise exception 'demo session expired';
  end if;

  if not exists (
    select 1
      from public.demo_permissions
      where action = p_action
        and scope = p_scope
  ) then
    raise exception 'demo operation not permitted: % on %', p_action, p_scope;
  end if;

  return session_row.persona_id;
end;
$$;

revoke all on function public.demo_authorize(uuid, text, text)
  from public, anon, authenticated;

create or replace function public.start_demo_session(p_persona_id uuid)
returns public.demo_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  new_session public.demo_sessions%rowtype;
begin
  if not exists (
    select 1
      from public.demo_personas
      where id = p_persona_id
  ) then
    raise exception 'unknown demo persona';
  end if;

  insert into public.demo_sessions (persona_id)
  values (p_persona_id)
  returning * into new_session;

  return new_session;
end;
$$;

create or replace function public.demo_create_library(
  p_session_id uuid,
  p_workspace_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'create', 'library');

  insert into public.nodes (workspace_id, parent_id, kind, name)
  values (p_workspace_id, null, 'library', p_name)
  returning id into new_id;

  return new_id;
end;
$$;

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
  new_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');

  insert into public.nodes (workspace_id, parent_id, kind, name)
  values (p_workspace_id, p_parent_id, 'collection', p_name)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.demo_rename_node(
  p_session_id uuid,
  p_node_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  node_kind text;
begin
  select n.kind
    into node_kind
    from public.nodes as n
    where n.id = p_node_id;

  if not found then
    raise exception 'unknown node';
  end if;

  perform public.demo_authorize(p_session_id, 'create', node_kind);

  update public.nodes
    set name = p_name
    where id = p_node_id;

  return p_node_id;
end;
$$;

create or replace function public.demo_create_set(
  p_session_id uuid,
  p_collection_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');

  insert into public.sets (collection_id, name)
  values (p_collection_id, p_name)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.demo_rename_set(
  p_session_id uuid,
  p_set_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.sets where id = p_set_id
  ) then
    raise exception 'unknown set';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'collection');

  update public.sets
    set name = p_name
    where id = p_set_id;

  return p_set_id;
end;
$$;

create or replace function public.demo_create_product(
  p_session_id uuid,
  p_collection_id uuid,
  p_set_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'create', 'item');

  insert into public.products (collection_id, set_id, name)
  values (p_collection_id, p_set_id, p_name)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.demo_rename_product(
  p_session_id uuid,
  p_product_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.products where id = p_product_id
  ) then
    raise exception 'unknown product';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'item');

  update public.products
    set name = p_name
    where id = p_product_id;

  return p_product_id;
end;
$$;

create or replace function public.demo_observe_price(
  p_session_id uuid,
  p_product_id uuid,
  p_set_id uuid,
  p_collection_id uuid,
  p_amount bigint,
  p_currency text,
  p_url text default null,
  p_observed_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  subject_scope text;
  new_id uuid;
begin
  if num_nonnulls(p_product_id, p_set_id, p_collection_id) <> 1 then
    raise exception 'demo pricing needs exactly one subject';
  end if;

  if p_product_id is not null then
    subject_scope := 'item';
  else
    subject_scope := 'collection';
  end if;

  perform public.demo_authorize(p_session_id, 'price', subject_scope);

  insert into public.price_observations (
    product_id, set_id, collection_id, amount, currency, url, observed_at
  )
  values (
    p_product_id, p_set_id, p_collection_id, p_amount, p_currency, p_url, p_observed_at
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.demo_set_listing(
  p_session_id uuid,
  p_product_id uuid,
  p_set_id uuid,
  p_collection_id uuid,
  p_tag_price bigint,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  subject_scope text;
  new_id uuid;
begin
  if num_nonnulls(p_product_id, p_set_id, p_collection_id) <> 1 then
    raise exception 'demo pricing needs exactly one subject';
  end if;

  if p_product_id is not null then
    subject_scope := 'item';
  else
    subject_scope := 'collection';
  end if;

  perform public.demo_authorize(p_session_id, 'price', subject_scope);
  perform public.demo_authorize(p_session_id, 'sell_toggle', subject_scope);

  insert into public.sale_transactions (
    product_id, set_id, collection_id, tag_price, is_active
  )
  values (
    p_product_id, p_set_id, p_collection_id, p_tag_price, p_is_active
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.demo_record_sale(
  p_session_id uuid,
  p_product_id uuid,
  p_set_id uuid,
  p_collection_id uuid,
  p_transaction_scope text default null,
  p_transaction_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  subject_scope text;
  carried_tag bigint := null;
  carried_active boolean := false;
  new_id uuid;
begin
  if num_nonnulls(p_product_id, p_set_id, p_collection_id) <> 1 then
    raise exception 'demo pricing needs exactly one subject';
  end if;

  if p_product_id is not null then
    subject_scope := 'item';
  else
    subject_scope := 'collection';
  end if;

  perform public.demo_authorize(p_session_id, 'sell', subject_scope);

  select s.tag_price, s.is_active
    into carried_tag, carried_active
    from public.sale_transactions as s
    where s.product_id is not distinct from p_product_id
      and s.set_id is not distinct from p_set_id
      and s.collection_id is not distinct from p_collection_id
    order by s.created_at desc, s.id desc
    limit 1;

  if not found then
    carried_tag := null;
    carried_active := false;
  end if;

  insert into public.sale_transactions (
    product_id, set_id, collection_id, tag_price, is_active,
    transaction_scope, transaction_at
  )
  values (
    p_product_id, p_set_id, p_collection_id, carried_tag, carried_active,
    p_transaction_scope, p_transaction_at
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.start_demo_session(uuid) to anon, authenticated;
grant execute on function public.demo_create_library(uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_create_collection(uuid, uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_rename_node(uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_create_set(uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_rename_set(uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_create_product(uuid, uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_rename_product(uuid, uuid, text) to anon, authenticated;
grant execute on function public.demo_observe_price(uuid, uuid, uuid, uuid, bigint, text, text, timestamptz) to anon, authenticated;
grant execute on function public.demo_set_listing(uuid, uuid, uuid, uuid, bigint, boolean) to anon, authenticated;
grant execute on function public.demo_record_sale(uuid, uuid, uuid, uuid, text, timestamptz) to anon, authenticated;
