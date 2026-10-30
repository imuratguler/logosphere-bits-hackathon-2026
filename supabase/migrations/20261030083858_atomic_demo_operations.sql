-- Logosphere BITS — atomic demo operations: versions and bulk RPCs.
--
-- Single-row RPCs are atomic by themselves, but real demo flows move
-- many rows at once (grow a branch, fill a set, relocate products).
-- This migration adds the transaction foundation those flows need:
-- every bulk RPC below runs its reads and writes in one function
-- call, so any failure rolls the whole operation back — no half-grown
-- branch, no half-moved set, no collection-less product.
--
-- Rules enforced:
-- 1. Optimistic versions: nodes, sets, and products carry a version
--    integer (starts at 1, bumped by a trigger on every UPDATE).
--    Every demo UPDATE requires the expected version in the call; the
--    write is a single UPDATE ... WHERE id AND version, so a
--    concurrent change turns the caller's write into a version
--    conflict instead of a silent overwrite. Missing rows still
--    report unknown-subject; only a present row with a different
--    version reports a conflict.
-- 2. Bulk membership: demo_set_membership assigns (or, with a null
--    set, unassigns) a batch of products in one call. Each product
--    must already live in the set's collection — cross-collection
--    assignment is rejected before any write, and the deferred
--    composite key rechecks the batch at commit.
-- 3. Bulk moves: demo_bulk_move_products relocates a batch of
--    products to another collection (set links clear, since a set
--    belongs to one collection). demo_move_set relocates a set with
--    its members: the caller supplies the set version plus the exact
--    member list with versions, and any drift (missing, extra, or
--    re-versioned member) aborts the move.
-- 4. Tree creation: demo_create_collection_tree grows a library with
--    nested collections from one jsonb document (at most 200 nodes);
--    malformed nodes abort before anything is stored.
-- 5. Contract change: the three rename RPCs now take an expected
--    version and return {id, version} as jsonb; the old signatures
--    are dropped. All bulk RPCs return fresh {id, version} pairs so
--    callers never reuse a stale version.
-- 6. The demo gate still fronts every RPC (session + demo_permissions
--    cell); moves consult create/item, set operations consult
--    create/collection, tree creation consults both library and
--    collection cells. No direct table write grant is added; RLS is
--    untouched.
-- Concurrency: the version predicate is the whole lock analysis — no
-- SELECT ... FOR UPDATE, no lock ordering, no deadlock path. Two
-- writers racing on one row serialize on the row lock; the loser
-- matches zero rows and gets a conflict (READ COMMITTED re-evaluates
-- the predicate on the latest committed row). The composite
-- set/collection key is DEFERRABLE INITIALLY DEFERRED so set-with-
-- members moves can order their writes freely inside one call; the
-- key still rejects violations at commit.
--
-- Client error contract additions: 'demo version conflict: <subject>
-- <id> expected <e> but found <c>', 'demo set members changed',
-- 'demo membership crosses collections: <product id>',
-- 'demo move target must be a collection', 'unknown collection',
-- 'unknown workspace', 'demo tree must be an object',
-- 'demo tree node needs a name', 'demo tree node must be an object',
-- 'demo tree collections must be an array', 'demo tree too large',
-- 'demo membership needs an item array',
-- 'demo membership item <n> needs id and version',
-- 'demo move needs an item array',
-- 'demo move item <n> needs id and version'.

alter table public.nodes add column version integer not null default 1;
alter table public.sets add column version integer not null default 1;
alter table public.products add column version integer not null default 1;

create or replace function public.bump_row_version()
returns trigger
language plpgsql
as $$
begin
  NEW.version := OLD.version + 1;
  return NEW;
end;
$$;

drop trigger if exists nodes_version_before_update on public.nodes;

create trigger nodes_version_before_update
  before update on public.nodes
  for each row
  execute function public.bump_row_version();

drop trigger if exists sets_version_before_update on public.sets;

create trigger sets_version_before_update
  before update on public.sets
  for each row
  execute function public.bump_row_version();

drop trigger if exists products_version_before_update on public.products;

create trigger products_version_before_update
  before update on public.products
  for each row
  execute function public.bump_row_version();

alter table public.products drop constraint products_set_collection_fk;

alter table public.products add constraint products_set_collection_fk
  foreign key (set_id, collection_id) references public.sets (id, collection_id)
  deferrable initially deferred;

drop function if exists public.demo_rename_node(uuid, uuid, text);
drop function if exists public.demo_rename_set(uuid, uuid, text);
drop function if exists public.demo_rename_product(uuid, uuid, text);

create function public.demo_rename_node(
  p_session_id uuid,
  p_node_id uuid,
  p_expected_version integer,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  node_kind text;
  current_version integer;
  new_version integer;
  changed integer;
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
    where id = p_node_id
      and version = p_expected_version
    returning version into new_version;

  get diagnostics changed = row_count;

  if changed = 0 then
    select n.version
      into current_version
      from public.nodes as n
      where n.id = p_node_id;

    if not found then
      raise exception 'unknown node';
    end if;

    raise exception 'demo version conflict: node % expected % but found %',
      p_node_id, p_expected_version, current_version;
  end if;

  return jsonb_build_object('id', p_node_id, 'version', new_version);
end;
$$;

create function public.demo_rename_set(
  p_session_id uuid,
  p_set_id uuid,
  p_expected_version integer,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_version integer;
  new_version integer;
  changed integer;
begin
  if not exists (
    select 1 from public.sets where id = p_set_id
  ) then
    raise exception 'unknown set';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'collection');

  update public.sets
    set name = p_name
    where id = p_set_id
      and version = p_expected_version
    returning version into new_version;

  get diagnostics changed = row_count;

  if changed = 0 then
    select s.version
      into current_version
      from public.sets as s
      where s.id = p_set_id;

    if not found then
      raise exception 'unknown set';
    end if;

    raise exception 'demo version conflict: set % expected % but found %',
      p_set_id, p_expected_version, current_version;
  end if;

  return jsonb_build_object('id', p_set_id, 'version', new_version);
end;
$$;

create function public.demo_rename_product(
  p_session_id uuid,
  p_product_id uuid,
  p_expected_version integer,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_version integer;
  new_version integer;
  changed integer;
begin
  if not exists (
    select 1 from public.products where id = p_product_id
  ) then
    raise exception 'unknown product %', p_product_id;
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'item');

  update public.products
    set name = p_name
    where id = p_product_id
      and version = p_expected_version
    returning version into new_version;

  get diagnostics changed = row_count;

  if changed = 0 then
    select p.version
      into current_version
      from public.products as p
      where p.id = p_product_id;

    if not found then
      raise exception 'unknown product %', p_product_id;
    end if;

    raise exception 'demo version conflict: product % expected % but found %',
      p_product_id, p_expected_version, current_version;
  end if;

  return jsonb_build_object('id', p_product_id, 'version', new_version);
end;
$$;

create function public.demo_create_collection_tree(
  p_session_id uuid,
  p_workspace_id uuid,
  p_tree jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stack jsonb[] := '{}';
  stack_parents uuid[] := '{}';
  stack_kinds text[] := '{}';
  sp integer := 0;
  node jsonb;
  parent_id uuid;
  node_kind text;
  node_name text;
  kids jsonb;
  kid jsonb;
  new_id uuid;
  inserted integer := 0;
  created jsonb := '[]'::jsonb;
begin
  perform public.demo_authorize(p_session_id, 'create', 'library');
  perform public.demo_authorize(p_session_id, 'create', 'collection');

  if not exists (
    select 1 from public.workspaces where id = p_workspace_id
  ) then
    raise exception 'unknown workspace';
  end if;

  if p_tree is null or jsonb_typeof(p_tree) <> 'object' then
    raise exception 'demo tree must be an object';
  end if;

  sp := 1;
  stack[sp] := p_tree;
  stack_parents[sp] := null;
  stack_kinds[sp] := 'library';

  while sp > 0 loop
    node := stack[sp];
    parent_id := stack_parents[sp];
    node_kind := stack_kinds[sp];
    sp := sp - 1;

    node_name := node->>'name';

    if node_name is null then
      raise exception 'demo tree node needs a name';
    end if;

    insert into public.nodes (workspace_id, parent_id, kind, name)
    values (p_workspace_id, parent_id, node_kind, node_name)
    returning id into new_id;

    inserted := inserted + 1;

    if inserted > 200 then
      raise exception 'demo tree too large';
    end if;

    created := created || jsonb_build_object(
      'id', new_id, 'kind', node_kind, 'name', node_name, 'version', 1
    );

    kids := node->'collections';

    if kids is not null and kids <> 'null'::jsonb then
      if jsonb_typeof(kids) <> 'array' then
        raise exception 'demo tree collections must be an array';
      end if;

      for kid in select * from jsonb_array_elements(kids) loop
        if jsonb_typeof(kid) <> 'object' then
          raise exception 'demo tree node must be an object';
        end if;

        sp := sp + 1;
        stack[sp] := kid;
        stack_parents[sp] := new_id;
        stack_kinds[sp] := 'collection';
      end loop;
    end if;
  end loop;

  return created;
end;
$$;

create function public.demo_set_membership(
  p_session_id uuid,
  p_set_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  set_collection uuid;
  item jsonb;
  item_id uuid;
  item_version integer;
  product_collection uuid;
  current_version integer;
  new_version integer;
  changed integer;
  idx integer;
  moved jsonb := '[]'::jsonb;
begin
  perform public.demo_authorize(p_session_id, 'create', 'item');

  if p_set_id is not null then
    select s.collection_id
      into set_collection
      from public.sets as s
      where s.id = p_set_id;

    if not found then
      raise exception 'unknown set';
    end if;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'demo membership needs an item array';
  end if;

  for idx in 0 .. jsonb_array_length(p_items) - 1 loop
    item := p_items->idx;

    if jsonb_typeof(item) <> 'object'
      or item->>'id' is null
      or item->>'version' is null then
      raise exception 'demo membership item % needs id and version', idx;
    end if;

    item_id := (item->>'id')::uuid;
    item_version := (item->>'version')::integer;

    select p.collection_id
      into product_collection
      from public.products as p
      where p.id = item_id;

    if not found then
      raise exception 'unknown product %', item_id;
    end if;

    if set_collection is not null
      and product_collection is distinct from set_collection then
      raise exception 'demo membership crosses collections: product %', item_id;
    end if;

    update public.products
      set set_id = p_set_id
      where id = item_id
        and version = item_version
      returning version into new_version;

    get diagnostics changed = row_count;

    if changed = 0 then
      select p.version
        into current_version
        from public.products as p
        where p.id = item_id;

      if not found then
        raise exception 'unknown product %', item_id;
      end if;

      raise exception 'demo version conflict: product % expected % but found %',
        item_id, item_version, current_version;
    end if;

    moved := moved || jsonb_build_object('id', item_id, 'version', new_version);
  end loop;

  return moved;
end;
$$;

create function public.demo_bulk_move_products(
  p_session_id uuid,
  p_target_collection_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kind text;
  item jsonb;
  item_id uuid;
  item_version integer;
  current_version integer;
  new_version integer;
  changed integer;
  idx integer;
  moved jsonb := '[]'::jsonb;
begin
  perform public.demo_authorize(p_session_id, 'create', 'item');

  select n.kind
    into target_kind
    from public.nodes as n
    where n.id = p_target_collection_id;

  if not found then
    raise exception 'unknown collection';
  end if;

  if target_kind <> 'collection' then
    raise exception 'demo move target must be a collection';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'demo move needs an item array';
  end if;

  for idx in 0 .. jsonb_array_length(p_items) - 1 loop
    item := p_items->idx;

    if jsonb_typeof(item) <> 'object'
      or item->>'id' is null
      or item->>'version' is null then
      raise exception 'demo move item % needs id and version', idx;
    end if;

    item_id := (item->>'id')::uuid;
    item_version := (item->>'version')::integer;

    if not exists (
      select 1 from public.products where id = item_id
    ) then
      raise exception 'unknown product %', item_id;
    end if;

    update public.products
      set collection_id = p_target_collection_id,
        set_id = null
      where id = item_id
        and version = item_version
      returning version into new_version;

    get diagnostics changed = row_count;

    if changed = 0 then
      select p.version
        into current_version
        from public.products as p
        where p.id = item_id;

      if not found then
        raise exception 'unknown product %', item_id;
      end if;

      raise exception 'demo version conflict: product % expected % but found %',
        item_id, item_version, current_version;
    end if;

    moved := moved || jsonb_build_object('id', item_id, 'version', new_version);
  end loop;

  return moved;
end;
$$;

create function public.demo_move_set(
  p_session_id uuid,
  p_set_id uuid,
  p_expected_version integer,
  p_target_collection_id uuid,
  p_product_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kind text;
  current_members uuid[];
  supplied_sorted uuid[];
  supplied_ids uuid[] := '{}';
  item jsonb;
  item_id uuid;
  item_version integer;
  current_version integer;
  new_set_version integer;
  new_version integer;
  changed integer;
  idx integer;
  products_moved jsonb := '[]'::jsonb;
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');
  perform public.demo_authorize(p_session_id, 'create', 'item');

  select n.kind
    into target_kind
    from public.nodes as n
    where n.id = p_target_collection_id;

  if not found then
    raise exception 'unknown collection';
  end if;

  if target_kind <> 'collection' then
    raise exception 'demo move target must be a collection';
  end if;

  if p_product_items is null or jsonb_typeof(p_product_items) <> 'array' then
    raise exception 'demo move needs an item array';
  end if;

  for idx in 0 .. jsonb_array_length(p_product_items) - 1 loop
    item := p_product_items->idx;

    if jsonb_typeof(item) <> 'object'
      or item->>'id' is null
      or item->>'version' is null then
      raise exception 'demo move item % needs id and version', idx;
    end if;

    supplied_ids := supplied_ids || (item->>'id')::uuid;
  end loop;

  select coalesce(array_agg(p.id order by p.id), '{}')
    into current_members
    from public.products as p
    where p.set_id = p_set_id;

  select coalesce(array_agg(x.id order by x.id), '{}')
    into supplied_sorted
    from unnest(supplied_ids) as x(id);

  if current_members is distinct from supplied_sorted then
    raise exception 'demo set members changed';
  end if;

  update public.sets
    set collection_id = p_target_collection_id
    where id = p_set_id
      and version = p_expected_version
    returning version into new_set_version;

  get diagnostics changed = row_count;

  if changed = 0 then
    select s.version
      into current_version
      from public.sets as s
      where s.id = p_set_id;

    if not found then
      raise exception 'unknown set';
    end if;

    raise exception 'demo version conflict: set % expected % but found %',
      p_set_id, p_expected_version, current_version;
  end if;

  for idx in 0 .. jsonb_array_length(p_product_items) - 1 loop
    item := p_product_items->idx;
    item_id := (item->>'id')::uuid;
    item_version := (item->>'version')::integer;

    update public.products
      set collection_id = p_target_collection_id
      where id = item_id
        and version = item_version
      returning version into new_version;

    get diagnostics changed = row_count;

    if changed = 0 then
      select p.version
        into current_version
        from public.products as p
        where p.id = item_id;

      if not found then
        raise exception 'unknown product %', item_id;
      end if;

      raise exception 'demo version conflict: product % expected % but found %',
        item_id, item_version, current_version;
    end if;

    products_moved := products_moved || jsonb_build_object('id', item_id, 'version', new_version);
  end loop;

  return jsonb_build_object(
    'set', jsonb_build_object('id', p_set_id, 'version', new_set_version),
    'products', products_moved
  );
end;
$$;

grant execute on function public.demo_rename_node(uuid, uuid, integer, text) to anon, authenticated;
grant execute on function public.demo_rename_set(uuid, uuid, integer, text) to anon, authenticated;
grant execute on function public.demo_rename_product(uuid, uuid, integer, text) to anon, authenticated;
grant execute on function public.demo_create_collection_tree(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.demo_set_membership(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.demo_bulk_move_products(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.demo_move_set(uuid, uuid, integer, uuid, jsonb) to anon, authenticated;
