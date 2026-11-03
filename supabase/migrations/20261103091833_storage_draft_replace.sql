-- Logosphere BITS - allow draft replaces on storage.objects.
--
-- Live acceptance proved the storage upsert path unusable for the
-- private voice-notes bucket (anon upsert fails RLS while the same
-- plain insert passes; the public photo bucket is unaffected), so
-- the client replaces draft bytes with delete-then-insert instead
-- of upsert. These two policies scope DELETE to the temporary
-- draft/% namespaces only (anon + authenticated, same as the
-- insert policies); persistent p/% and v/% paths stay untouched,
-- and no read capability is granted on the private bucket.
-- Idempotent: safe to re-apply. No data is deleted or rewritten
-- by this migration itself.

drop policy if exists photos_draft_replace on storage.objects;

create policy photos_draft_replace on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'product-photos' and name like 'draft/%');

drop policy if exists voice_draft_replace on storage.objects;

create policy voice_draft_replace on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'voice-notes' and name like 'draft/%');
