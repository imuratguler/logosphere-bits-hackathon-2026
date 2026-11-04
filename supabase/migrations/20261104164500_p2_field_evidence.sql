-- Logosphere BITS — P2 field evidence ledger (AI pipeline contract §02/§10).
--
-- Every final field keeps its origin: which photo read, voice note,
-- transcript, or web record filled it — plus rejected/conflicting
-- candidates per field. Values live in stage payloads; this table is
-- the traceable why, keyed by run + candidate + field.
--
-- Rules enforced:
-- 1. Service-only (RLS on, no anon/authenticated policies): pipeline
--    job data may carry user uploads, like the other pipeline tables.
-- 2. One origin row per (run, candidate, field, origin): re-runs
--    upsert instead of duplicating the trace.
-- 3. Additive only: no existing table is touched.
--
-- No triggers: keys and checks only.

create table public.field_evidence (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.pipeline_runs (id),
  candidate_index integer not null check (candidate_index >= 0),
  field_name text not null,
  origin text not null check (origin in (
    'photo_read',
    'voice_claim',
    'voice_transcript',
    'catalog_record',
    'catalog_rejected',
    'ai_fill',
    'user_note'
  )),
  origin_detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint field_evidence_single_origin unique (
    run_id, candidate_index, field_name, origin
  )
);

comment on table public.field_evidence is
  'Logosphere BITS: per-field origin trace (run + candidate + field -> photo/voice/catalog/AI).';

comment on column public.field_evidence.origin_detail is
  'Logosphere BITS: image_id / transcript id / source + url + accessed_at / rejection reason, by origin.';

create index field_evidence_run_idx on public.field_evidence (run_id);

alter table public.field_evidence enable row level security;

revoke all on public.field_evidence from anon, authenticated;

grant all on public.field_evidence to service_role;
