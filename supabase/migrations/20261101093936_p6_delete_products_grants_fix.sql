-- Logosphere BITS — P6 delete fix: keep the grants contract, add analysis children.
--
-- The P6 rewrite of demo_delete_products broke the live tour twice:
-- it deleted storage.objects rows directly (Supabase forbids that;
-- files go through the Storage API) and it dropped the
-- storage_delete_grants rows plus the files/prefixes answer the
-- client requires. This restores the original grants body verbatim
-- and adds only the five analysis child-table deletes (person
-- roles, bibliography, estimates, observations, sale rows) ahead
-- of the products delete. Shared person rows are never deleted.

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

  delete from public.product_person_roles as r
    where r.product_id = any (source_ids);

  delete from public.product_bibliography as b
    where b.product_id = any (source_ids);

  delete from public.price_estimates as e
    where e.product_id = any (source_ids);

  delete from public.price_observations as o
    where o.product_id = any (source_ids);

  delete from public.sale_transactions as s
    where s.product_id = any (source_ids);

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
