-- Logosphere BITS - allow draft re-uploads (upsert) on storage.objects.
--
-- The mobile upload path re-sends draft bytes with upsert, which the
-- storage API evaluates against UPDATE policies as well as INSERT
-- ones; without an UPDATE policy every re-upload fails RLS even on
-- first write. These two policies scope UPDATE to the temporary
-- draft/% namespaces only (anon + authenticated, same as the
-- insert policies); persistent p/% and v/% paths stay untouched.
-- Idempotent: safe to re-apply. No data is deleted or rewritten.

drop policy if exists photos_draft_reupload on storage.objects;

create policy photos_draft_reupload on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'product-photos' and name like 'draft/%')
  with check (bucket_id = 'product-photos' and name like 'draft/%');

drop policy if exists voice_draft_reupload on storage.objects;

create policy voice_draft_reupload on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'voice-notes' and name like 'draft/%')
  with check (bucket_id = 'voice-notes' and name like 'draft/%');
