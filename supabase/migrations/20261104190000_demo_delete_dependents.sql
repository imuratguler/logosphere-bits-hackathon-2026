-- Revision of 20261031175334: the delete RPCs removed media,
-- products, sets, and nodes but left every other dependent row
-- behind, so any set or product carrying prices, sales, or
-- bibliography failed with a foreign key violation (empty sets
-- listed for sale failed the same way via sale_transactions).
-- No FK carries ON DELETE CASCADE by design, so each RPC now
-- deletes its scope's dependents explicitly, innermost-first:
-- sale transactions, price observations, price estimates,
-- product bibliography, and person roles; collections also
-- drop their detail rows. Persons stay shared and are never
-- deleted. The returned summary shape is unchanged.

create or replace function public.demo_delete_collections(
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
  photo_names text[] := '{}';
  voice_names text[] := '{}';
  source_id uuid;
  source_kind text;
  expected_version integer;
  current_version integer;
  removed_products integer := 0;
  removed_sets integer := 0;
  removed_collections integer := 0;
  target_id uuid;
  granted_files jsonb := '[]'::jsonb;
  granted_prefixes jsonb := '[]'::jsonb;
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

  select coalesce(array_agg(n), '{}')
    into photo_names
    from (
      select distinct substring(i.file_path from '^product-photos/(.+)$') as n
        from public.product_images as i
        where i.product_id = any (affected_products)
    ) as names
    where n is not null;

  select coalesce(array_agg(n), '{}')
    into voice_names
    from (
      select distinct substring(v.file_path from '^voice-notes/(.+)$') as n
        from public.product_voice_notes as v
        where v.id = any (voice_ids)
    ) as names
    where n is not null;

  delete from public.sale_transactions as t
    where t.product_id = any (affected_products)
       or t.set_id = any (affected_sets)
       or t.collection_id = any (source_ids);

  delete from public.price_observations as o
    where o.product_id = any (affected_products)
       or o.set_id = any (affected_sets)
       or o.collection_id = any (source_ids);

  delete from public.price_estimates as e
    where e.product_id = any (affected_products)
       or e.set_id = any (affected_sets)
       or e.collection_id = any (source_ids);

  delete from public.product_bibliography as b
    where b.product_id = any (affected_products);

  delete from public.product_person_roles as r
    where r.product_id = any (affected_products);

  delete from public.collection_details as d
    where d.node_id = any (source_ids);

  delete from public.library_details as d
    where d.node_id = any (source_ids);

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

  delete from public.storage_delete_grants as g
    where g.expires_at <= now();

  insert into public.storage_delete_grants
    (bucket_id, path, is_prefix, session_id)
    select 'product-photos', n, false, p_session_id
      from unnest(photo_names) as n
    union all
    select 'voice-notes', n, false, p_session_id
      from unnest(voice_names) as n
    union all
    select 'product-photos', 'p/' || p::text || '/', true, p_session_id
      from unnest(affected_products) as p
    union all
    select 'voice-notes', 'v/' || i::text || '/', true, p_session_id
      from unnest(image_ids) as i;

  select coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'product-photos', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(photo_names) as n;

  select granted_files || coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'voice-notes', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(voice_names) as n;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'product-photos', 'prefix', 'p/' || p::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(affected_products) as p;

  select granted_prefixes || coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'voice-notes', 'prefix', 'v/' || i::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(image_ids) as i;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', removed_collections,
      'sets', removed_sets,
      'products', removed_products,
      'photos', cardinality(photo_names),
      'voices', cardinality(voice_names)
    ),
    'files', granted_files,
    'prefixes', granted_prefixes
  );
end;
$$;

create or replace function public.demo_delete_sets(
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
  photo_names text[] := '{}';
  voice_names text[] := '{}';
  source_id uuid;
  expected_version integer;
  current_version integer;
  removed_products integer := 0;
  removed_sets integer := 0;
  target_id uuid;
  granted_files jsonb := '[]'::jsonb;
  granted_prefixes jsonb := '[]'::jsonb;
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

  select coalesce(array_agg(n), '{}')
    into photo_names
    from (
      select distinct substring(i.file_path from '^product-photos/(.+)$') as n
        from public.product_images as i
        where i.product_id = any (affected_products)
    ) as names
    where n is not null;

  select coalesce(array_agg(n), '{}')
    into voice_names
    from (
      select distinct substring(v.file_path from '^voice-notes/(.+)$') as n
        from public.product_voice_notes as v
        where v.id = any (voice_ids)
    ) as names
    where n is not null;

  delete from public.sale_transactions as t
    where t.product_id = any (affected_products)
       or t.set_id = any (source_ids);

  delete from public.price_observations as o
    where o.product_id = any (affected_products)
       or o.set_id = any (source_ids);

  delete from public.price_estimates as e
    where e.product_id = any (affected_products)
       or e.set_id = any (source_ids);

  delete from public.product_bibliography as b
    where b.product_id = any (affected_products);

  delete from public.product_person_roles as r
    where r.product_id = any (affected_products);

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

  delete from public.storage_delete_grants as g
    where g.expires_at <= now();

  insert into public.storage_delete_grants
    (bucket_id, path, is_prefix, session_id)
    select 'product-photos', n, false, p_session_id
      from unnest(photo_names) as n
    union all
    select 'voice-notes', n, false, p_session_id
      from unnest(voice_names) as n
    union all
    select 'product-photos', 'p/' || p::text || '/', true, p_session_id
      from unnest(affected_products) as p
    union all
    select 'voice-notes', 'v/' || i::text || '/', true, p_session_id
      from unnest(image_ids) as i;

  select coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'product-photos', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(photo_names) as n;

  select granted_files || coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'voice-notes', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(voice_names) as n;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'product-photos', 'prefix', 'p/' || p::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(affected_products) as p;

  select granted_prefixes || coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'voice-notes', 'prefix', 'v/' || i::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(image_ids) as i;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', 0,
      'sets', removed_sets,
      'products', removed_products,
      'photos', cardinality(photo_names),
      'voices', cardinality(voice_names)
    ),
    'files', granted_files,
    'prefixes', granted_prefixes
  );
end;
$$;

create or replace function public.demo_delete_products(
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
  photo_names text[] := '{}';
  voice_names text[] := '{}';
  source_id uuid;
  expected_version integer;
  current_version integer;
  removed_products integer := 0;
  target_id uuid;
  granted_files jsonb := '[]'::jsonb;
  granted_prefixes jsonb := '[]'::jsonb;
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

  select coalesce(array_agg(n), '{}')
    into photo_names
    from (
      select distinct substring(i.file_path from '^product-photos/(.+)$') as n
        from public.product_images as i
        where i.product_id = any (source_ids)
    ) as names
    where n is not null;

  select coalesce(array_agg(n), '{}')
    into voice_names
    from (
      select distinct substring(v.file_path from '^voice-notes/(.+)$') as n
        from public.product_voice_notes as v
        where v.id = any (voice_ids)
    ) as names
    where n is not null;

  delete from public.sale_transactions as t
    where t.product_id = any (source_ids);

  delete from public.price_observations as o
    where o.product_id = any (source_ids);

  delete from public.price_estimates as e
    where e.product_id = any (source_ids);

  delete from public.product_bibliography as b
    where b.product_id = any (source_ids);

  delete from public.product_person_roles as r
    where r.product_id = any (source_ids);

  delete from public.voice_transcriptions as t
    where t.voice_note_id = any (voice_ids);

  delete from public.product_voice_notes as v
    where v.id = any (voice_ids);

  delete from public.product_images as i
    where i.id = any (image_ids);

  delete from public.products as p
    where p.id = any (source_ids);

  get diagnostics removed_products = row_count;

  delete from public.storage_delete_grants as g
    where g.expires_at <= now();

  insert into public.storage_delete_grants
    (bucket_id, path, is_prefix, session_id)
    select 'product-photos', n, false, p_session_id
      from unnest(photo_names) as n
    union all
    select 'voice-notes', n, false, p_session_id
      from unnest(voice_names) as n
    union all
    select 'product-photos', 'p/' || p::text || '/', true, p_session_id
      from unnest(source_ids) as p
    union all
    select 'voice-notes', 'v/' || i::text || '/', true, p_session_id
      from unnest(image_ids) as i;

  select coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'product-photos', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(photo_names) as n;

  select granted_files || coalesce(
    jsonb_agg(jsonb_build_object('bucket', 'voice-notes', 'name', n)),
    '[]'::jsonb
  )
    into granted_files
    from unnest(voice_names) as n;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'product-photos', 'prefix', 'p/' || p::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(source_ids) as p;

  select granted_prefixes || coalesce(
    jsonb_agg(
      jsonb_build_object('bucket', 'voice-notes', 'prefix', 'v/' || i::text || '/')
    ),
    '[]'::jsonb
  )
    into granted_prefixes
    from unnest(image_ids) as i;

  return jsonb_build_object(
    'deleted', jsonb_build_object(
      'collections', 0,
      'sets', 0,
      'products', removed_products,
      'photos', cardinality(photo_names),
      'voices', cardinality(voice_names)
    ),
    'files', granted_files,
    'prefixes', granted_prefixes
  );
end;
$$;
