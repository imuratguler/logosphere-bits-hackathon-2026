-- Logosphere BITS — atomic set batch operations.
--
-- Three functions, each a single transaction (a failed batch never
-- leaves a partial move behind):
--
-- 1. demo_merge_to_new_set folds the contents of the given sets, or
--    the given products, into one newly named set in the same
--    collection and deletes the emptied old sets.
-- 2. demo_extract_from_sets releases the members of the given sets,
--    or the given products, back to the collection as separate
--    (loose) products and deletes the emptied old sets.
-- 3. demo_convert_leaf_products_to_sets walks the leaf collections
--    under a branch (the branch itself when it is already a leaf),
--    gathers every leaf's products — loose and member alike — into
--    one newly named set per leaf, and deletes the emptied old sets.
--    Products never cross collections: the (set_id, collection_id)
--    link keeps every product inside its own leaf.
--
-- Photo and voice links are preserved: products are only
-- re-attached (set_id updates) and sets are only removed once
-- empty — no product row is deleted and no media row is touched.
--
-- Rules enforced:
-- 1. Exactly one source form per call (set ids or product ids, never
--    both or neither) with at least one source
--    ('demo batch needs set or product sources').
-- 2. Every source must exist and live in the single operation
--    collection ('unknown set', 'unknown product %',
--    'demo merge crosses collections',
--    'demo extract crosses collections').
-- 3. The target collection (merge) or branch (convert) must be a
--    collection ('unknown collection', 'demo collection expected');
--    the new name is required
--    ('demo set name required').
-- 4. Optimistic concurrency: every touched set and product carries
--    its expected version; a mismatch aborts the batch
--    ('demo version conflict: set % expected % but found %',
--    'demo version conflict: product % expected % but found %',
--    'demo batch needs a version per item').
-- 5. Convert with no products anywhere in the leaf scope is rejected
--    ('demo convert scope has no products').
-- 6. The (create, collection) + (create, item) demo cells front every
--    call (set writes ride the collection cell like demo_move_set,
--    product writes ride the item cell like demo_set_membership);
--    no direct table write grant is added.
--
-- Returns {set: {id, version}, moved: {products}, deleted: [set ids]}
-- for merge, {freed: {products}, deleted: [set ids]} for extract,
-- and {sets: [{id, collection_id, version}], moved: {products},
-- deleted: [set ids]} for convert.

create function public.demo_merge_to_new_set(
  p_session_id uuid,
  p_set_ids uuid[],
  p_product_ids uuid[],
  p_expected_versions jsonb,
  p_new_name text,
  p_collection_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_sets uuid[] := '{}';
  source_products uuid[] := '{}';
  collection_kind text;
  source_id uuid;
  source_collection uuid;
  expected_version integer;
  current_version integer;
  new_set_id uuid;
  new_set_version integer;
  moved_products integer;
  changed integer;
  deleted_ids uuid[] := '{}';
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');
  perform public.demo_authorize(p_session_id, 'create', 'item');

  if p_set_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_sets
      from unnest(p_set_ids) as x(id);
  end if;

  if p_product_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_products
      from unnest(p_product_ids) as x(id);
  end if;

  if (cardinality(source_sets) > 0) = (cardinality(source_products) > 0) then
    raise exception 'demo batch needs set or product sources';
  end if;

  if p_new_name is null or btrim(p_new_name) = '' then
    raise exception 'demo set name required';
  end if;

  select n.kind
    into collection_kind
    from public.nodes as n
    where n.id = p_collection_id;

  if not found then
    raise exception 'unknown collection';
  end if;

  if collection_kind <> 'collection' then
    raise exception 'demo collection expected';
  end if;

  if cardinality(source_sets) > 0 then
    for source_id in select unnest(source_sets) loop
      select s.collection_id, s.version
        into source_collection, current_version
        from public.sets as s
        where s.id = source_id
        for update;

      if not found then
        raise exception 'unknown set';
      end if;

      if source_collection is distinct from p_collection_id then
        raise exception 'demo merge crosses collections';
      end if;

      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      if expected_version is null then
        raise exception 'demo batch needs a version per item';
      end if;

      if current_version is distinct from expected_version then
        raise exception 'demo version conflict: set % expected % but found %',
          source_id, expected_version, current_version;
      end if;
    end loop;
  else
    for source_id in select unnest(source_products) loop
      select p.collection_id, p.version
        into source_collection, current_version
        from public.products as p
        where p.id = source_id;

      if not found then
        raise exception 'unknown product %', source_id;
      end if;

      if source_collection is distinct from p_collection_id then
        raise exception 'demo merge crosses collections';
      end if;

      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      if expected_version is null then
        raise exception 'demo batch needs a version per item';
      end if;

      if current_version is distinct from expected_version then
        raise exception 'demo version conflict: product % expected % but found %',
          source_id, expected_version, current_version;
      end if;
    end loop;
  end if;

  insert into public.sets (collection_id, name)
  values (p_collection_id, btrim(p_new_name))
  returning id, version into new_set_id, new_set_version;

  if cardinality(source_sets) > 0 then
    update public.products
      set set_id = new_set_id
      where set_id = any (source_sets);

    get diagnostics moved_products = row_count;

    delete from public.sets as s
      where s.id = any (source_sets);

    get diagnostics changed = row_count;

    if changed is distinct from cardinality(source_sets) then
      raise exception 'unknown set';
    end if;

    deleted_ids := source_sets;
  else
    moved_products := 0;

    for source_id in select unnest(source_products) loop
      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      update public.products
        set set_id = new_set_id
        where id = source_id
          and version = expected_version;

      get diagnostics changed = row_count;

      if changed = 0 then
        select p.version
          into current_version
          from public.products as p
          where p.id = source_id;

        if not found then
          raise exception 'unknown product %', source_id;
        end if;

        raise exception 'demo version conflict: product % expected % but found %',
          source_id, expected_version, current_version;
      end if;

      moved_products := moved_products + 1;
    end loop;

    with affected(old_set_id) as (
      select distinct (item ->> 'set_id')::uuid
        from jsonb_array_elements(p_expected_versions) as item
        where (item ->> 'set_id') is not null
    )
    select coalesce(array_agg(s.id), '{}')
      into deleted_ids
      from public.sets as s
      join affected as a on a.old_set_id = s.id
      where s.collection_id = p_collection_id
        and not exists (
          select 1 from public.products as p where p.set_id = s.id
        );

    if cardinality(deleted_ids) > 0 then
      delete from public.sets as s
        where s.id = any (deleted_ids);
    end if;
  end if;

  return jsonb_build_object(
    'set', jsonb_build_object('id', new_set_id, 'version', new_set_version),
    'moved', jsonb_build_object('products', moved_products),
    'deleted', to_jsonb(deleted_ids)
  );
end;
$$;

create function public.demo_extract_from_sets(
  p_session_id uuid,
  p_set_ids uuid[],
  p_product_ids uuid[],
  p_expected_versions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_sets uuid[] := '{}';
  source_products uuid[] := '{}';
  source_collection uuid;
  first_collection uuid;
  source_id uuid;
  expected_version integer;
  current_version integer;
  freed_products integer := 0;
  changed integer;
  deleted_ids uuid[] := '{}';
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');
  perform public.demo_authorize(p_session_id, 'create', 'item');

  if p_set_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_sets
      from unnest(p_set_ids) as x(id);
  end if;

  if p_product_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_products
      from unnest(p_product_ids) as x(id);
  end if;

  if (cardinality(source_sets) > 0) = (cardinality(source_products) > 0) then
    raise exception 'demo batch needs set or product sources';
  end if;

  if cardinality(source_sets) > 0 then
    for source_id in select unnest(source_sets) loop
      select s.collection_id, s.version
        into source_collection, current_version
        from public.sets as s
        where s.id = source_id
        for update;

      if not found then
        raise exception 'unknown set';
      end if;

      if first_collection is null then
        first_collection := source_collection;
      elsif source_collection is distinct from first_collection then
        raise exception 'demo extract crosses collections';
      end if;

      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      if expected_version is null then
        raise exception 'demo batch needs a version per item';
      end if;

      if current_version is distinct from expected_version then
        raise exception 'demo version conflict: set % expected % but found %',
          source_id, expected_version, current_version;
      end if;
    end loop;

    update public.products
      set set_id = null
      where set_id = any (source_sets);

    get diagnostics freed_products = row_count;

    delete from public.sets as s
      where s.id = any (source_sets);

    get diagnostics changed = row_count;

    if changed is distinct from cardinality(source_sets) then
      raise exception 'unknown set';
    end if;

    deleted_ids := source_sets;
  else
    for source_id in select unnest(source_products) loop
      select p.collection_id, p.version
        into source_collection, current_version
        from public.products as p
        where p.id = source_id;

      if not found then
        raise exception 'unknown product %', source_id;
      end if;

      if first_collection is null then
        first_collection := source_collection;
      elsif source_collection is distinct from first_collection then
        raise exception 'demo extract crosses collections';
      end if;

      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      if expected_version is null then
        raise exception 'demo batch needs a version per item';
      end if;

      if current_version is distinct from expected_version then
        raise exception 'demo version conflict: product % expected % but found %',
          source_id, expected_version, current_version;
      end if;
    end loop;

    for source_id in select unnest(source_products) loop
      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = source_id::text;

      update public.products
        set set_id = null
        where id = source_id
          and version = expected_version;

      get diagnostics changed = row_count;

      if changed = 0 then
        select p.version
          into current_version
          from public.products as p
          where p.id = source_id;

        if not found then
          raise exception 'unknown product %', source_id;
        end if;

        raise exception 'demo version conflict: product % expected % but found %',
          source_id, expected_version, current_version;
      end if;

      freed_products := freed_products + 1;
    end loop;

    with affected(old_set_id) as (
      select distinct (item ->> 'set_id')::uuid
        from jsonb_array_elements(p_expected_versions) as item
        where (item ->> 'set_id') is not null
    )
    select coalesce(array_agg(s.id), '{}')
      into deleted_ids
      from public.sets as s
      join affected as a on a.old_set_id = s.id
      where s.collection_id = first_collection
        and not exists (
          select 1 from public.products as p where p.set_id = s.id
        );

    if cardinality(deleted_ids) > 0 then
      delete from public.sets as s
        where s.id = any (deleted_ids);
    end if;
  end if;

  return jsonb_build_object(
    'freed', jsonb_build_object('products', freed_products),
    'deleted', to_jsonb(deleted_ids)
  );
end;
$$;

create function public.demo_convert_leaf_products_to_sets(
  p_session_id uuid,
  p_branch_collection_id uuid,
  p_expected_versions jsonb,
  p_new_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  branch_kind text;
  leaf_id uuid;
  leaf_ids uuid[] := '{}';
  product_id uuid;
  old_set_id uuid;
  source_collection uuid;
  expected_version integer;
  current_version integer;
  new_set_id uuid;
  new_set_version integer;
  moved_products integer := 0;
  changed integer;
  created_sets jsonb := '[]'::jsonb;
  deleted_ids uuid[] := '{}';
  all_deleted_ids uuid[] := '{}';
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');
  perform public.demo_authorize(p_session_id, 'create', 'item');

  select n.kind
    into branch_kind
    from public.nodes as n
    where n.id = p_branch_collection_id;

  if not found then
    raise exception 'unknown collection';
  end if;

  if branch_kind <> 'collection' then
    raise exception 'demo collection expected';
  end if;

  if p_new_name is null or btrim(p_new_name) = '' then
    raise exception 'demo set name required';
  end if;

  with recursive subtree(id) as (
    select p_branch_collection_id
    union
    select n.id
      from public.nodes as n
      join subtree as s on n.parent_id = s.id
      where n.kind = 'collection'
  )
  select coalesce(array_agg(s.id order by s.id), '{}')
    into leaf_ids
    from subtree as s
    where not exists (
      select 1
        from public.nodes as c
        where c.parent_id = s.id
          and c.kind = 'collection'
    );

  if not exists (
    select 1
      from public.products as p
      where p.collection_id = any (leaf_ids)
  ) then
    raise exception 'demo convert scope has no products';
  end if;

  for product_id in
    select p.id
      from public.products as p
      where p.collection_id = any (leaf_ids)
      order by p.id
  loop
    select p.collection_id, p.version
      into source_collection, current_version
      from public.products as p
      where p.id = product_id;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = product_id::text;

    if expected_version is null then
      raise exception 'demo batch needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: product % expected % but found %',
        product_id, expected_version, current_version;
    end if;
  end loop;

  for old_set_id in
    select s.id
      from public.sets as s
      where s.collection_id = any (leaf_ids)
      order by s.id
  loop
    select s.version
      into current_version
      from public.sets as s
      where s.id = old_set_id
      for update;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = old_set_id::text;

    if expected_version is null then
      raise exception 'demo batch needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: set % expected % but found %',
        old_set_id, expected_version, current_version;
    end if;
  end loop;

  for leaf_id in select unnest(leaf_ids) loop
    if not exists (
      select 1
        from public.products as p
        where p.collection_id = leaf_id
    ) then
      continue;
    end if;

    insert into public.sets (collection_id, name)
    values (leaf_id, btrim(p_new_name))
    returning id, version into new_set_id, new_set_version;

    for product_id in
      select p.id
        from public.products as p
        where p.collection_id = leaf_id
        order by p.id
    loop
      select (item ->> 'version')::integer
        into expected_version
        from jsonb_array_elements(p_expected_versions) as item
        where item ->> 'id' = product_id::text;

      update public.products
        set set_id = new_set_id
        where id = product_id
          and version = expected_version;

      get diagnostics changed = row_count;

      if changed = 0 then
        select p.version
          into current_version
          from public.products as p
          where p.id = product_id;

        raise exception 'demo version conflict: product % expected % but found %',
          product_id, expected_version, current_version;
      end if;

      moved_products := moved_products + 1;
    end loop;

    created_sets := created_sets || jsonb_build_object(
      'id', new_set_id,
      'collection_id', leaf_id,
      'version', new_set_version
    );

    with emptied(old_set_id) as (
      select s.id
        from public.sets as s
        where s.collection_id = leaf_id
          and s.id is distinct from new_set_id
          and not exists (
            select 1 from public.products as p where p.set_id = s.id
          )
    )
    select coalesce(array_agg(e.old_set_id), '{}')
      into deleted_ids
      from emptied as e;

    if cardinality(deleted_ids) > 0 then
      delete from public.sets as s
        where s.id = any (deleted_ids);

      all_deleted_ids := all_deleted_ids || deleted_ids;
    end if;
  end loop;

  return jsonb_build_object(
    'sets', created_sets,
    'moved', jsonb_build_object('products', moved_products),
    'deleted', to_jsonb(all_deleted_ids)
  );
end;
$$;

grant execute on function public.demo_merge_to_new_set(
  uuid, uuid[], uuid[], jsonb, text, uuid
) to anon, authenticated;

grant execute on function public.demo_extract_from_sets(
  uuid, uuid[], uuid[], jsonb
) to anon, authenticated;

grant execute on function public.demo_convert_leaf_products_to_sets(
  uuid, uuid, jsonb, text
) to anon, authenticated;
