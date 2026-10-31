-- Logosphere BITS — corporate documents: org-scoped rows plus a
-- controlled corporate-docs bucket.
--
-- Hidden account plane (SCOPE F11): private corporate documents are
-- managed through org-scoped rows and org-namespaced bucket objects.
-- Members read, add, and remove only their own organization's
-- documents; demo callers (anon, no JWT) hold no grant and match no
-- policy here. Document metadata is insert/delete only — no UPDATE
-- grant — so a row always describes the bytes it was registered
-- with; renaming re-registers.
--
-- Rules enforced:
-- 1. Path identity is bucket + path, bound to the owning row by
--    CHECK: corporate-docs/org/{organization_id}/{document_id}/
--    {filename}, single trailing segment (no nested slashes), so a
--    row can never point outside its own org folder and signed URLs
--    can never be stored as identity.
-- 2. Bucket access is membership-gated: the corporate-docs SELECT /
--    INSERT / DELETE policies require an authenticated caller whose
--    org UUID is the object's folder (strict 8-4-4-4-12 match, so
--    the folder cast cannot fail). The policies match only org/
--    folders, never p/, v/, or draft/ prefixes.
-- 3. Row access mirrors the bucket: SELECT / INSERT / DELETE on
--    corporate_documents require org membership; INSERT additionally
--    binds created_by to auth.uid(). anon gets nothing.
-- 4. Table-level DELETE on storage.objects is granted to
--    authenticated (and anon, which the demo sweep policy already
--    names): grants arm policies, policies still decide. This also
--    completes migration 20261031175334, whose demo byte-sweep
--    DELETE policy had no backing grant.
-- Concurrency: document ids are client-minted v4 UUIDs; a colliding
-- re-register fails closed on the primary key.

create table public.corporate_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null,
  file_path text not null,
  mime_type text,
  byte_size bigint,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint corporate_documents_name_check
    check (btrim(name) <> ''),
  constraint corporate_documents_byte_size_check
    check (byte_size is null or byte_size >= 0),
  constraint corporate_documents_file_path_shape
    check (
      file_path ~ (
        '^corporate-docs/org/'
        || organization_id::text
        || '/'
        || id::text
        || '/[^/]+$'
      )
    )
);

create index corporate_documents_organization_id_idx
  on public.corporate_documents (organization_id);

alter table public.corporate_documents enable row level security;

grant select, insert, delete on public.corporate_documents to authenticated;

grant delete on storage.objects to anon, authenticated;

drop policy if exists corporate_documents_member_read
  on public.corporate_documents;

create policy corporate_documents_member_read on public.corporate_documents
  for select to authenticated
  using (public.account_is_org_member(organization_id));

drop policy if exists corporate_documents_member_insert
  on public.corporate_documents;

create policy corporate_documents_member_insert on public.corporate_documents
  for insert to authenticated
  with check (
    public.account_is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists corporate_documents_member_delete
  on public.corporate_documents;

create policy corporate_documents_member_delete on public.corporate_documents
  for delete to authenticated
  using (public.account_is_org_member(organization_id));

drop policy if exists corporate_docs_member_read on storage.objects;

create policy corporate_docs_member_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'corporate-docs'
    and name ~ '^org/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.account_is_org_member(
      substring(
        name from '^org/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'
      )::uuid
    )
  );

drop policy if exists corporate_docs_member_insert on storage.objects;

create policy corporate_docs_member_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'corporate-docs'
    and name ~ '^org/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.account_is_org_member(
      substring(
        name from '^org/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'
      )::uuid
    )
  );

drop policy if exists corporate_docs_member_delete on storage.objects;

create policy corporate_docs_member_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'corporate-docs'
    and name ~ '^org/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.account_is_org_member(
      substring(
        name from '^org/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'
      )::uuid
    )
  );
