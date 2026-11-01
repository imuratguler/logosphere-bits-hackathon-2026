-- Logosphere BITS — P6 pipeline targets and delete cleanup.
--
-- 1. Pipeline runs learn their demo home: the target collection
--    (required), the target set (null for loose products), and the
--    demo session that started the run. No foreign keys: runs are
--    append-only history and must survive session cleanup.
--    Edge calls authorize as ('create', 'collection') — a seeded
--    demo permission — because a run stages product creation.
-- 2. Deleting products also removes their analysis children
--    (bibliography, person roles, estimates, observations, sale
--    rows). Without this, saving an analysis would create an
--    undeletable product (the bibliography FK has no cascade).
--    Shared person rows are never deleted.

alter table public.pipeline_runs
  add column target_collection_id uuid not null,
  add column target_set_id uuid,
  add column demo_session_id uuid not null;

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
