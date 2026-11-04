-- Logosphere BITS — P3 waterfall attempt log + reusable source records.
--
-- The deterministic research flow records EVERY source try (term, URL,
-- time, HTTP status, candidate, match reason, parsed fields, reject
-- reason) in catalog_attempts. Accepted non-ISBN records live in
-- catalog_sources keyed by (source, source_key) — never in the
-- ISBN-keyed catalog_records cache, which keeps only ISBN-verified
-- facts (§10).
--
-- Rules enforced:
-- 1. Service-only (RLS on, no anon/authenticated policies): pipeline
--    job data, like the other pipeline tables.
-- 2. Attempts are append-only audit rows; sources upsert on
--    (source, source_key).
-- 3. Additive only: existing tables untouched.
--
-- No triggers: keys and checks only.

create table public.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_key text not null,
  url text,
  title text,
  title_norm text,
  authors jsonb not null default '[]'::jsonb,
  publisher text,
  language text,
  edition text,
  publish_year integer,
  pages integer,
  isbn10 text,
  isbn13 text,
  record jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  constraint catalog_sources_single_key unique (source, source_key)
);

comment on table public.catalog_sources is
  'Logosphere BITS: reusable accepted source records incl. ISBN-less results (§10).';

create index catalog_sources_title_idx on public.catalog_sources (title_norm);

create table public.catalog_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.pipeline_runs (id),
  image_id uuid references public.pipeline_run_images (id),
  source text not null,
  term_type text not null check (term_type in ('isbn', 'title')),
  term text not null,
  url text,
  accessed_at timestamptz not null default now(),
  http_status integer,
  candidate_id uuid references public.catalog_sources (id),
  match_reason text,
  parsed_fields jsonb not null default '{}'::jsonb,
  reject_reason text
);

comment on table public.catalog_attempts is
  'Logosphere BITS: every waterfall source try with match/reject trace (§07).';

create index catalog_attempts_run_idx on public.catalog_attempts (run_id);

alter table public.catalog_attempts enable row level security;
alter table public.catalog_sources enable row level security;

revoke all on public.catalog_attempts from anon, authenticated;
revoke all on public.catalog_sources from anon, authenticated;

grant all on public.catalog_attempts to service_role;
grant all on public.catalog_sources to service_role;
