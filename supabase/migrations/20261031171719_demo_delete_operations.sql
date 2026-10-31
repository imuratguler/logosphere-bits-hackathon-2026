-- Logosphere BITS — atomic demo deletes with storage cleanup.
--
-- Three functions, each a single transaction (a failed batch never
-- leaves a partial delete behind):
--
-- 1. demo_delete_collections removes childless collections with
--    their sets, products, and media.
-- 2. demo_delete_sets removes sets with their member products and
--    media.
-- 3. demo_delete_products removes products with their media.
--
-- A delete guard trigger backs the hierarchy rules on every path
-- (RPC, direct SQL, future callers): a library holding collections
-- and a collection holding sub-collections cannot be deleted. There
-- is no library delete UI, so libraries are protected by the
-- trigger alone; collections are additionally pre-checked in their
-- RPC for an early, clean error.
--
-- Storage linkage: permanent file identity is CHECK-bound to
-- immutable row ids (photos at product-photos/p/{product_id}/
-- {image_id}.{ext}, voices at voice-notes/v/{image_id}/
-- {note_id}.{ext}), so each delete removes bytes by id-scoped
-- prefix only — never by client-supplied paths or mutable names.
-- A retry re-derives the same prefixes from the same ids and can
-- neither miss its own leftovers (atomic retry: rows still present
-- mean files still present) nor touch another job's files (draft
-- media lives under draft/ prefixes owned by pipeline runs and is
-- never matched). Media rows are removed innermost-first
-- (transcriptions, voice notes, images) to satisfy the FK chain;
-- details rows cascade with their nodes.
--
-- Rules enforced:
-- 1. At least one source per call
--    ('demo delete needs at least one collection|set|product').
-- 2. Every source must exist and (for collections) be a collection
--    ('unknown collection', 'unknown set', 'unknown product %',
--    'demo collection expected').
-- 3. Hierarchy guard: no sub-collections under a deleted collection,
--    no collections under a deleted library
--    ('demo collection has sub-collections',
--    'demo library has collections') — checked in the RPC and again
--    by the nodes_delete_guard trigger.
-- 4. Optimistic concurrency: every touched node, set, and product
--    carries its expected version; a mismatch aborts the batch
--    ('demo delete needs a version per item',
--    'demo version conflict: ...').
-- 5. The delete demo cells front every call — (delete, collection)
--    for collections and sets (sets ride the collection cell like
--    their rename), (delete, item) for products; no direct table
--    write grant is added.
--
-- Returns {deleted: {collections, sets, products, photos, voices}}
-- with statement counts (photos/voices count removed storage
-- objects).

create or replace function public.validate_node_delete()
returns trigger
language plpgsql
as $$
begin
  if OLD.kind = 'library'
    and exists (select 1 from public.nodes as n where n.parent_id = OLD.id) then
    raise exception 'demo library has collections';
  end if;

  if OLD.kind = 'collection'
    and exists (
      select 1
        from public.nodes as n
        where n.parent_id = OLD.id
          and n.kind = 'collection'
    ) then
    raise exception 'demo collection has sub-collections';
  end if;

  return OLD;
end;
$$;

drop trigger if exists nodes_delete_guard on public.nodes;

create trigger nodes_delete_guard
  before delete on public.nodes
  for each row
  execute function public.validate_node_delete();

create function public.demo_delete_collections(
  p_session_id uuid,
  p_collection_ids uuid[],
  p_expected_versions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_ids uuid[] := '{}';
  affected_sets uuid[] := '{}';
  affected_products uuid[] := '{}';
  image_ids uuid[] := '{}';
  voice_ids uuid[] := '{}';
  source_id uuid;
  source_kind text;
  expected_version integer;
  current_version integer;
  changed integer;
  removed_photos integer := 0;
  removed_voices integer := 0;
  removed_products integer := 0;
  removed_sets integer := 0;
  removed_collections integer := 0;
  target_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'delete', 'collection');

  if p_collection_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_ids
      from unnest(p_collection_ids) as x(id);
  end if;

  if cardinality(source_ids) = 0 then
    raise exception 'demo delete needs at least one collection';
  end if;

  for source_id in select unnest(source_ids) loop
    select n.kind, n.version
      into source_kind, current_version
      from public.nodes as n
      where n.id = source_id
      for update;

    if not found then
      raise exception 'unknown collection';
    end if;

    if source_kind <> 'collection' then
      raise exception 'demo collection expected';
    end if;

    if exists (
      select 1
        from public.nodes as n
        where n.parent_id = source_id
          and n.kind = 'collection'
    ) then
      raise exception 'demo collection has sub-collections';
    end if;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = source_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: node % expected % but found %',
        source_id, expected_version, current_version;
    end if;
  end loop;

  select coalesce(array_agg(s.id), '{}')
    into affected_sets
    from public.sets as s
    where s.collection_id = any (source_ids);

  select coalesce(array_agg(p.id), '{}')
    into affected_products
    from public.products as p
    where p.collection_id = any (source_ids);

  for target_id in select unnest(affected_sets) loop
    select s.version
      into current_version
      from public.sets as s
      where s.id = target_id
      for update;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = target_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: set % expected % but found %',
        target_id, expected_version, current_version;
    end if;
  end loop;

  for target_id in select unnest(affected_products) loop
    select p.version
      into current_version
      from public.products as p
      where p.id = target_id
      for update;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = target_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: product % expected % but found %',
        target_id, expected_version, current_version;
    end if;
  end loop;

  select coalesce(array_agg(i.id), '{}')
    into image_ids
    from public.product_images as i
    where i.product_id = any (affected_products);

  select coalesce(array_agg(v.id), '{}')
    into voice_ids
    from public.product_voice_notes as v
    where v.product_image_id = any (image_ids);

  for target_id in select unnest(affected_products) loop
    delete from storage.objects as o
      where o.bucket_id = 'product-photos'
        and o.name like 'p/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_photos := removed_photos + changed;
  end loop;

  for target_id in select unnest(image_ids) loop
    delete from storage.objects as o
      where o.bucket_id = 'voice-notes'
        and o.name like 'v/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_voices := removed_voices + changed;
  end loop;

  delete from public.voice_transcriptions as t
    where t.voice_note_id = any (voice_ids);

  delete from public.product_voice_notes as v
    where v.id = any (voice_ids);

  delete from public.product_images as i
    where i.id = any (image_ids);

  delete from public.products as p
    where p.id = any (affected_products);

  get diagnostics removed_products = row_count;

  delete from public.sets as s
    where s.id = any (affected_sets);

  get diagnostics removed_sets = row_count;

  delete from public.nodes as n
    where n.id = any (source_ids);

  get diagnostics removed_collections = row_count;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', removed_collections,
      'sets', removed_sets,
      'products', removed_products,
      'photos', removed_photos,
      'voices', removed_voices
    )
  );
end;
$$;

create function public.demo_delete_sets(
  p_session_id uuid,
  p_set_ids uuid[],
  p_expected_versions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_ids uuid[] := '{}';
  affected_products uuid[] := '{}';
  image_ids uuid[] := '{}';
  voice_ids uuid[] := '{}';
  source_id uuid;
  expected_version integer;
  current_version integer;
  changed integer;
  removed_photos integer := 0;
  removed_voices integer := 0;
  removed_products integer := 0;
  removed_sets integer := 0;
  target_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'delete', 'collection');

  if p_set_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_ids
      from unnest(p_set_ids) as x(id);
  end if;

  if cardinality(source_ids) = 0 then
    raise exception 'demo delete needs at least one set';
  end if;

  for source_id in select unnest(source_ids) loop
    select s.version
      into current_version
      from public.sets as s
      where s.id = source_id
      for update;

    if not found then
      raise exception 'unknown set';
    end if;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = source_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: set % expected % but found %',
        source_id, expected_version, current_version;
    end if;
  end loop;

  select coalesce(array_agg(p.id), '{}')
    into affected_products
    from public.products as p
    where p.set_id = any (source_ids);

  for target_id in select unnest(affected_products) loop
    select p.version
      into current_version
      from public.products as p
      where p.id = target_id
      for update;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = target_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: product % expected % but found %',
        target_id, expected_version, current_version;
    end if;
  end loop;

  select coalesce(array_agg(i.id), '{}')
    into image_ids
    from public.product_images as i
    where i.product_id = any (affected_products);

  select coalesce(array_agg(v.id), '{}')
    into voice_ids
    from public.product_voice_notes as v
    where v.product_image_id = any (image_ids);

  for target_id in select unnest(affected_products) loop
    delete from storage.objects as o
      where o.bucket_id = 'product-photos'
        and o.name like 'p/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_photos := removed_photos + changed;
  end loop;

  for target_id in select unnest(image_ids) loop
    delete from storage.objects as o
      where o.bucket_id = 'voice-notes'
        and o.name like 'v/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_voices := removed_voices + changed;
  end loop;

  delete from public.voice_transcriptions as t
    where t.voice_note_id = any (voice_ids);

  delete from public.product_voice_notes as v
    where v.id = any (voice_ids);

  delete from public.product_images as i
    where i.id = any (image_ids);

  delete from public.products as p
    where p.id = any (affected_products);

  get diagnostics removed_products = row_count;

  delete from public.sets as s
    where s.id = any (source_ids);

  get diagnostics removed_sets = row_count;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', 0,
      'sets', removed_sets,
      'products', removed_products,
      'photos', removed_photos,
      'voices', removed_voices
    )
  );
end;
$$;

create function public.demo_delete_products(
  p_session_id uuid,
  p_product_ids uuid[],
  p_expected_versions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_ids uuid[] := '{}';
  image_ids uuid[] := '{}';
  voice_ids uuid[] := '{}';
  source_id uuid;
  expected_version integer;
  current_version integer;
  changed integer;
  removed_photos integer := 0;
  removed_voices integer := 0;
  removed_products integer := 0;
  target_id uuid;
begin
  perform public.demo_authorize(p_session_id, 'delete', 'item');

  if p_product_ids is not null then
    select coalesce(array_agg(distinct x.id), '{}')
      into source_ids
      from unnest(p_product_ids) as x(id);
  end if;

  if cardinality(source_ids) = 0 then
    raise exception 'demo delete needs at least one product';
  end if;

  for source_id in select unnest(source_ids) loop
    select p.version
      into current_version
      from public.products as p
      where p.id = source_id
      for update;

    if not found then
      raise exception 'unknown product %', source_id;
    end if;

    select (item ->> 'version')::integer
      into expected_version
      from jsonb_array_elements(p_expected_versions) as item
      where item ->> 'id' = source_id::text;

    if expected_version is null then
      raise exception 'demo delete needs a version per item';
    end if;

    if current_version is distinct from expected_version then
      raise exception 'demo version conflict: product % expected % but found %',
        source_id, expected_version, current_version;
    end if;
  end loop;

  select coalesce(array_agg(i.id), '{}')
    into image_ids
    from public.product_images as i
    where i.product_id = any (source_ids);

  select coalesce(array_agg(v.id), '{}')
    into voice_ids
    from public.product_voice_notes as v
    where v.product_image_id = any (image_ids);

  for target_id in select unnest(source_ids) loop
    delete from storage.objects as o
      where o.bucket_id = 'product-photos'
        and o.name like 'p/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_photos := removed_photos + changed;
  end loop;

  for target_id in select unnest(image_ids) loop
    delete from storage.objects as o
      where o.bucket_id = 'voice-notes'
        and o.name like 'v/' || target_id::text || '/%';

    get diagnostics changed = row_count;
    removed_voices := removed_voices + changed;
  end loop;

  delete from public.voice_transcriptions as t
    where t.voice_note_id = any (voice_ids);

  delete from public.product_voice_notes as v
    where v.id = any (voice_ids);

  delete from public.product_images as i
    where i.id = any (image_ids);

  delete from public.products as p
    where p.id = any (source_ids);

  get diagnostics removed_products = row_count;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', 0,
      'sets', 0,
      'products', removed_products,
      'photos', removed_photos,
      'voices', removed_voices
    )
  );
end;
$$;

grant execute on function public.demo_delete_collections(
  uuid, uuid[], jsonb
) to anon, authenticated;

grant execute on function public.demo_delete_sets(
  uuid, uuid[], jsonb
) to anon, authenticated;

grant execute on function public.demo_delete_products(
  uuid, uuid[], jsonb
) to anon, authenticated;
