-- Logosphere BITS — Waterfall evidence: catalog cache, duplicate stage, price basis.
--
-- 1. catalog_records: exact local ISBN matches plus cached remote lookups.
--    Service-only (RLS on, no anon/authenticated policies): the catalog
--    stage reads through the service client, never the mobile client.
-- 2. duplicate stage between price and merge (stage_order 7; merge and
--    review shift to 8/9). Existing runs are backfilled with a pending
--    duplicate row; no row is deleted or rewritten in place except the
--    order shift on merge/review rows.
-- 3. price_basis gains 'ai-estimate' (Muse knowledge, no live market
--    source) and 'sourced' (a live sales/catalog record backed the
--    bands). Old 'estimate'/'evidence' rows stay valid.

create table public.catalog_records (
  isbn text primary key,
  source text not null,
  record jsonb not null,
  fetched_at timestamptz not null default now()
);

comment on table public.catalog_records is
  'Logosphere BITS: normalized-ISBN catalog cache (local exact matches and remote lookups).';

alter table public.catalog_records enable row level security;

alter table public.pipeline_stage_runs
  drop constraint if exists pipeline_stage_runs_stage_check;

alter table public.pipeline_stage_runs
  add constraint pipeline_stage_runs_stage_check
  check (stage in ('draft', 'upload', 'transcribe', 'preRead', 'catalog', 'finalDiagnose', 'price', 'duplicate', 'merge', 'review'));

create or replace function public.seed_pipeline_stage_runs()
returns trigger
language plpgsql
as $$
begin
  insert into public.pipeline_stage_runs (run_id, stage, version, stage_order)
  values
    (NEW.id, 'draft', 1, 0),
    (NEW.id, 'upload', 1, 1),
    (NEW.id, 'transcribe', 1, 2),
    (NEW.id, 'preRead', 1, 3),
    (NEW.id, 'catalog', 1, 4),
    (NEW.id, 'finalDiagnose', 1, 5),
    (NEW.id, 'price', 1, 6),
    (NEW.id, 'duplicate', 1, 7),
    (NEW.id, 'merge', 1, 8),
    (NEW.id, 'review', 1, 9);
  return NEW;
end;
$$;

insert into public.pipeline_stage_runs (run_id, stage, version, stage_order)
select r.id, 'duplicate', 1, 7
from public.pipeline_runs as r
where not exists (
  select 1
  from public.pipeline_stage_runs as s
  where s.run_id = r.id and s.stage = 'duplicate'
);

update public.pipeline_stage_runs
set stage_order = 8
where stage = 'merge' and stage_order = 7;

update public.pipeline_stage_runs
set stage_order = 9
where stage = 'review' and stage_order = 8;

alter table public.price_estimates
  drop constraint if exists price_estimates_price_basis_check;

alter table public.price_estimates
  add constraint price_estimates_price_basis_check
  check (price_basis in ('estimate', 'evidence', 'ai-estimate', 'sourced'));
