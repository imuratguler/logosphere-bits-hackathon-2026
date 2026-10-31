-- Logosphere BITS — storage cleanup through scoped delete grants.
--
-- Revision of 20261031171719: Supabase Cloud forbids direct DML on
-- storage.objects from any function ("Direct deletion from storage
-- tables is not allowed. Use the Storage API instead."), so the
-- byte deletes move out of the RPC bodies. The server keeps full
-- authority over WHAT may be deleted; the bytes themselves go
-- through the Storage API:
--
-- 1. Each delete RPC still removes its SQL rows atomically, then
--    records scoped delete grants (exact object names read from the
--    media rows plus id-scoped prefixes per touched product and
--    image) and returns them to the caller.
-- 2. A narrow storage.objects DELETE policy allows anon /
--    authenticated callers to remove ONLY objects covered by a live
--    (unexpired) grant — exact match or id-scoped prefix match.
-- 3. The client removes the granted bytes via the Storage API. A
--    retry reuses the granted list (grants live one hour), so it
--    can neither miss its own leftovers nor touch another job's
--    files: prefixes are CHECK-bound to immutable row ids
--    (photos at p/{product_id}/, voices at v/{image_id}/), and
--    draft media under draft/ prefixes is never granted.
--
-- Grants are written only by the security-definer delete RPCs; the
-- table carries no direct write grant (SELECT only, for policy
-- evaluation). Expired grants are pruned opportunistically inside
-- the RPCs. The hierarchy guard trigger and all RPC validation
-- (auth cells, kind checks, sub-collection rule, version checks)
-- are unchanged.
--
-- Returns {deleted: {collections, sets, products, photos, voices},
-- files: [{bucket, name}], prefixes: [{bucket, prefix}]} where
-- photos/voices now count granted byte objects (exact names).

create table public.storage_delete_grants (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  path text not null,
  is_prefix boolean not null default false,
  session_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 hour'
);

create index storage_delete_grants_lookup_idx
  on public.storage_delete_grants (bucket_id, path, expires_at);

grant select on public.storage_delete_grants to anon, authenticated;

create or replace function public.demo_storage_grant_covers(
  p_bucket_id text,
  p_name text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.storage_delete_grants as g
      where g.bucket_id = p_bucket_id
        and g.expires_at > now()
        and (
          (g.is_prefix = false and g.path = p_name)
          or (g.is_prefix = true and p_name like g.path || '%')
        )
  );
$$;

drop policy if exists storage_granted_delete on storage.objects;

create policy storage_granted_delete
  on storage.objects
  for delete
  to anon, authenticated
  using (public.demo_storage_grant_covers(bucket_id, name));

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
