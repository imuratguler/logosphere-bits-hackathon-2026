-- Logosphere BITS — atomic collection merge.
--
-- demo_merge_collections folds every source collection's contents
-- into one target collection and deletes the emptied sources, all
-- in a single transaction: a failed batch never leaves a partial
-- move behind. The target is either an existing collection or a
-- newly created one (name plus parent; formed date stamped today).
-- Contents ride along with their links intact: sub-collections are
-- reparented, sets and products are re-attached (product set links
-- keep working because their sets move to the same target), and the
-- sources' detail rows vanish with them through the cascade.
--
-- Rules enforced:
-- 1. At least one source; every source must exist, be a collection,
--    live in one workspace, and match its expected version
--    ('unknown collection', 'demo collection expected',
--    'demo version conflict: node <id> expected <e> but found <c>').
-- 2. Exactly one target form: an existing collection id or a
--    name plus parent id, never both or neither
--    ('demo merge target required').
-- 3. An existing target must be a collection in the sources'
--    workspace, must not be a source, and must sit outside every
--    source subtree (walked upward; a target inside a moved
--    collection is rejected: 'demo merge target inside merged
--    collection').
-- 4. A new target's parent must be a library or a collection in the
--    same workspace and must take sub-collections (leaf rule:
--    'demo collection is not empty'); its name is required.
-- 5. Placement: sources holding sub-collections merge only into an
--    empty target (no sets or products):
--    'demo merge target is not empty'.
-- 6. The (create, collection) demo cell fronts the call; no direct
--    table write grant is added.
--
-- Returns {target: {id, version}, moved: {collections, sets,
-- products}, deleted: [source ids]} with statement counts.

create function public.demo_merge_collections(
  p_session_id uuid,
  p_source_ids uuid[],
  p_expected_versions jsonb,
  p_target_collection_id uuid,
  p_new_name text,
  p_new_parent_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_workspace uuid;
  target_id uuid;
  target_kind text;
  target_workspace uuid;
  walk_id uuid;
  walk_parent uuid;
  source_id uuid;
  expected_version integer;
  current_version integer;
  source_kind text;
  has_subs boolean;
  target_items boolean;
  moved_collections integer;
  moved_sets integer;
  moved_products integer;
  changed integer;
  deleted_ids uuid[];
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');

  if p_source_ids is null or cardinality(p_source_ids) < 1 then
    raise exception 'demo merge needs at least one collection';
  end if;

  if (p_target_collection_id is null) = (p_new_name is null) then
    raise exception 'demo merge target required';
  end if;

  for source_id in select distinct unnest(p_source_ids) loop
    select n.kind, n.workspace_id, n.version
      into source_kind, target_workspace, current_version
      from public.nodes as n
      where n.id = source_id;

    if not found then
      raise exception 'unknown collection';
    end if;

    if source_kind <> 'collection' then
      raise exception 'demo collection expected';
    end if;

    if source_workspace is null then
      source_workspace := target_workspace;
    elsif target_workspace is distinct from source_workspace then
      raise exception 'cross-workspace link rejected';
    end if;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = source_id::text;

    if expected_version is null then
      raise exception 'demo merge needs a version per collection';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: node % expected % but found %',
        source_id, expected_version, current_version;
    end if;
  end loop;

  if p_target_collection_id is not null then
    select n.kind, n.workspace_id
      into target_kind, target_workspace
      from public.nodes as n
      where n.id = p_target_collection_id;

    if not found then
      raise exception 'unknown collection';
    end if;

    if target_kind <> 'collection' then
      raise exception 'demo collection expected';
    end if;

    if target_workspace is distinct from source_workspace then
      raise exception 'cross-workspace link rejected';
    end if;

    walk_id := p_target_collection_id;

    loop
      if walk_id = any (p_source_ids) then
        raise exception 'demo merge target inside merged collection';
      end if;

      select n.parent_id
        into walk_parent
        from public.nodes as n
        where n.id = walk_id;

      if not found or walk_parent is null then
        exit;
      end if;

      walk_id := walk_parent;
    end loop;

    target_id := p_target_collection_id;
  else
    if p_new_parent_id is null then
      raise exception 'demo merge target required';
    end if;

    if p_new_name is null or btrim(p_new_name) = '' then
      raise exception 'demo collection name required';
    end if;

    select n.kind, n.workspace_id
      into target_kind, target_workspace
      from public.nodes as n
      where n.id = p_new_parent_id;

    if not found then
      raise exception 'unknown node';
    end if;

    if target_kind <> 'library' and target_kind <> 'collection' then
      raise exception 'demo collection parent invalid';
    end if;

    if target_workspace is distinct from source_workspace then
      raise exception 'cross-workspace link rejected';
    end if;

    if target_kind = 'collection'
      and (exists (select 1 from public.sets as s where s.collection_id = p_new_parent_id)
        or exists (select 1 from public.products as p where p.collection_id = p_new_parent_id)) then
      raise exception 'demo collection is not empty';
    end if;

    insert into public.nodes (workspace_id, parent_id, kind, name)
    values (source_workspace, p_new_parent_id, 'collection', btrim(p_new_name))
    returning id into target_id;

    insert into public.collection_details (node_id, formed_date)
    values (target_id, CURRENT_DATE);
  end if;

  select exists (
    select 1
    from public.nodes as n
    where n.parent_id = any (p_source_ids)
      and n.kind = 'collection'
  ) into has_subs;

  if has_subs then
    select exists (select 1 from public.sets as s where s.collection_id = target_id)
      or exists (select 1 from public.products as p where p.collection_id = target_id)
    into target_items;

    if target_items then
      raise exception 'demo merge target is not empty';
    end if;
  end if;

  update public.nodes
    set parent_id = target_id
    where parent_id = any (p_source_ids)
      and kind = 'collection';

  get diagnostics moved_collections = row_count;

  update public.sets
    set collection_id = target_id
    where collection_id = any (p_source_ids);

  get diagnostics moved_sets = row_count;

  update public.products
    set collection_id = target_id
    where collection_id = any (p_source_ids);

  get diagnostics moved_products = row_count;

  deleted_ids := '{}';

  for source_id in select distinct unnest(p_source_ids) loop
    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = source_id::text;

    delete from public.nodes as n
      where n.id = source_id
        and n.version = expected_version;

    get diagnostics changed = row_count;

    if changed = 0 then
      select n.version
        into current_version
        from public.nodes as n
        where n.id = source_id;

      if not found then
        raise exception 'unknown collection';
      end if;

      raise exception 'demo version conflict: node % expected % but found %',
        source_id, expected_version, current_version;
    end if;

    deleted_ids := deleted_ids || source_id;
  end loop;

  select n.version
    into current_version
    from public.nodes as n
    where n.id = target_id;

  return jsonb_build_object(
    'target', jsonb_build_object('id', target_id, 'version', current_version),
    'moved', jsonb_build_object(
      'collections', moved_collections,
      'sets', moved_sets,
      'products', moved_products
    ),
    'deleted', to_jsonb(deleted_ids)
  );
end;
$$;

grant execute on function public.demo_merge_collections(
  uuid, uuid[], jsonb, uuid, text, uuid
) to anon, authenticated;
