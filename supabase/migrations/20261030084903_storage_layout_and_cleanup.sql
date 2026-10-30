-- Logosphere BITS — storage layout: buckets, object policies, path identity, draft cleanup.
--
-- Three buckets with three postures on storage.objects (RLS stays
-- enabled; no client UPDATE/DELETE policy exists anywhere):
-- product-photos is public-read with namespaced client inserts
-- (p/% persistent, draft/% temporary); voice-notes takes client
-- inserts under draft/% only and no client reads (write-only drop;
-- playback goes through server-minted signed URLs); corporate-docs
-- has no client policy at all (fully server-mediated).
--
-- Rules enforced:
-- 1. Permanent file identity is bucket + path, bound to the owning
--    row by CHECK constraints: product images live at
--    product-photos/p/{product_id}/{image_id}.{ext}; draft images at
--    product-photos/draft/{run_id}/{image_id}.{ext} (job UUID plus
--    photo UUID); draft voices at
--    voice-notes/draft/{run_id}/{image_id}.{ext} or null;
--    persistent voices at voice-notes/v/{image_id}/{note_id}.{ext}.
--    Corporate paths reserve corporate-docs/org/{organization_id}/
--    {doc_uuid}/{filename} for the future documents table.
-- 2. Signed URLs can never be stored as identity: the shapes above
--    are the only values the constraints accept, so an https URL
--    fails at the check. Clients keep (bucket, path); short-lived
--    URLs are minted per view by the server (service key) and never
--    persisted. Voice playback and corporate reads therefore stay
--    controlled even though the identity columns are client-readable.
-- 3. Bucket guards ride on the bucket rows: photo MIME allowlist plus
--    10 MB cap, voice audio allowlist plus 25 MB cap, corporate
--    50 MB cap with unrestricted types. (Enforced by the Storage API
--    on Supabase; stored as data in throwaway harnesses.)
-- 4. Controlled cleanup: cleanup_abandoned_runs reclaims draft
--    media of dead jobs — runs older than the cutoff that are
--    terminal (succeeded/failedPermanent/cancelled) or carry no live
--    stage lease anywhere. It deletes pipeline_run_images rows only;
--    the run, stage, and error rows stay for audit. It returns the
--    server byte-deletion list as {bucket, name} pairs (never URLs):
--    the server removes bytes through the Storage API with the
--    service key. Dry-run is the default; wet runs take an explicit
--    false plus a positive limit. Execute is revoked from clients.
-- Concurrency: concurrent wet cleanups serialize on the row
-- deletes; the loser matches zero rows and skips its entry, so no
-- object is reported twice and no lock ordering is needed.
--
-- Harness note: Supabase Cloud already owns the storage schema; this
-- migration only adds bucket rows, policies, grants, CHECKs, and the
-- cleanup function. Throwaway harnesses stub the schema in setup.js.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-photos', 'product-photos', true, 10485760,
    '{image/jpeg,image/png,image/webp,image/heic,image/heif}'),
  ('voice-notes', 'voice-notes', false, 26214400,
    '{audio/mp4,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/x-m4a}'),
  ('corporate-docs', 'corporate-docs', false, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

grant select, insert on storage.objects to anon, authenticated;

drop policy if exists photos_public_read on storage.objects;

create policy photos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-photos');

drop policy if exists photos_namespaced_insert on storage.objects;

create policy photos_namespaced_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'product-photos'
    and (name like 'p/%' or name like 'draft/%')
  );

drop policy if exists voice_draft_insert on storage.objects;

create policy voice_draft_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'voice-notes' and name like 'draft/%');

alter table public.product_images add constraint product_images_file_path_shape
  check (file_path ~ ('^product-photos/p/' || product_id::text || '/' || id::text || '\.[A-Za-z0-9]+$'));

alter table public.pipeline_run_images add constraint pipeline_run_images_file_path_shape
  check (file_path ~ ('^product-photos/draft/' || run_id::text || '/' || id::text || '\.[A-Za-z0-9]+$'));

alter table public.pipeline_run_images add constraint pipeline_run_images_voice_path_shape
  check (
    voice_file_path is null
    or voice_file_path ~ ('^voice-notes/draft/' || run_id::text || '/' || id::text || '\.[A-Za-z0-9]+$')
  );

alter table public.product_voice_notes add constraint product_voice_notes_file_path_shape
  check (file_path ~ ('^voice-notes/v/' || product_image_id::text || '/' || id::text || '\.[A-Za-z0-9]+$'));

create or replace function public.cleanup_abandoned_runs(
  p_before timestamptz,
  p_limit integer default 100,
  p_dry_run boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate record;
  cleaned jsonb := '[]'::jsonb;
  removed integer;
begin
  if p_limit is null or p_limit <= 0 then
    raise exception 'demo cleanup needs a positive limit';
  end if;

  for candidate in
    select
      i.run_id,
      i.id as image_id,
      i.file_path as photo_path,
      i.voice_file_path as voice_path
      from public.pipeline_run_images as i
      join public.pipeline_runs as r on r.id = i.run_id
      where r.created_at < p_before
        and (
          r.status in ('succeeded', 'failedPermanent', 'cancelled')
          or not exists (
            select 1
              from public.pipeline_stage_runs as s
              where s.run_id = r.id
                and s.status = 'running'
                and s.lease_expires_at > now()
          )
        )
      order by r.created_at, i.id
      limit p_limit
  loop
    if not p_dry_run then
      delete from public.pipeline_run_images where id = candidate.image_id;

      get diagnostics removed = row_count;

      if removed = 0 then
        -- Raced by a concurrent cleanup; skip silently.
        continue;
      end if;
    end if;

    cleaned := cleaned || jsonb_build_object(
      'run_id', candidate.run_id,
      'image_id', candidate.image_id,
      'photo', jsonb_build_object(
        'bucket', 'product-photos',
        'name', substring(candidate.photo_path from position('/' in candidate.photo_path) + 1)
      ),
      'voice', case
        when candidate.voice_path is null then null
        else jsonb_build_object(
          'bucket', 'voice-notes',
          'name', substring(candidate.voice_path from position('/' in candidate.voice_path) + 1)
        )
      end
    );
  end loop;

  return jsonb_build_object('dry_run', p_dry_run, 'cleaned', cleaned);
end;
$$;

revoke all on function public.cleanup_abandoned_runs(timestamptz, integer, boolean)
  from public, anon, authenticated;
