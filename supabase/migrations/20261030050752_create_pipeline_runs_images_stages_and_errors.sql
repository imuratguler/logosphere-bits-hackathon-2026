-- Logosphere BITS — pipeline runs, images, stage runs, errors.
--
-- Persistent home for analysis jobs. Stage and status vocabularies
-- keep the mobile model's exact strings (no translation layer):
-- stages draft/upload/transcribe/preRead/catalog/finalDiagnose/price/
-- merge/review; statuses pending/running/succeeded/failedRetryable/
-- failedPermanent/cancelled.
--
-- Rules enforced:
-- 1. One job per idempotency key: the key is required and unique, so a
--    retried creation resolves to the existing job (INSERT ... ON
--    CONFLICT DO NOTHING, then select by key) instead of starting a
--    second paid pipeline.
-- 2. Nine pending stage rows are seeded automatically at job creation,
--    in execution order (stage_order 0-8). History is append-only:
--    each retry inserts a new version row, never overwrites.
-- 3. A completed stage is never re-executed: claiming a succeeded,
--    failed-permanent, or cancelled stage returns NULL, so a resume
--    after a dropped connection reads the stored payload instead of
--    starting a new paid call.
-- 4. One worker per stage at a time: claim_pipeline_stage locks the
--    latest row (SELECT ... FOR UPDATE), grants running plus a lease
--    only when no live lease exists, and hands expired leases to the
--    take-over worker on the same version. Heartbeats extend the
--    lease; expiry is lazy (no sweeper needed).
-- Orchestrator contract (application side): mark terminal stages and
-- clear their lease in one transaction together with any error rows;
-- run-level status stays orchestrator-owned. Draft voice input rides
-- on the image row (one voice file per draft image, mirroring the
-- product pattern); there is no separate draft-voice table.

create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('singleProduct', 'multiProduct')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failedRetryable', 'failedPermanent', 'cancelled')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipeline_run_images (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.pipeline_runs (id),
  sort_order integer not null default 0,
  file_path text not null,
  mime_type text not null,
  rotation_degrees integer not null default 0,
  voice_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipeline_stage_runs (
  run_id uuid not null references public.pipeline_runs (id),
  stage text not null
    check (stage in ('draft', 'upload', 'transcribe', 'preRead', 'catalog', 'finalDiagnose', 'price', 'merge', 'review')),
  version integer not null check (version > 0),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failedRetryable', 'failedPermanent', 'cancelled')),
  payload jsonb,
  stage_order integer not null,
  worker_id text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_stage_runs_pkey primary key (run_id, stage, version)
);

create table public.pipeline_stage_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  stage text not null,
  version integer not null,
  code text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_stage_errors_attempt_fk
    foreign key (run_id, stage, version)
    references public.pipeline_stage_runs (run_id, stage, version)
);

create index pipeline_run_images_run_id_idx on public.pipeline_run_images (run_id);
create index pipeline_stage_runs_run_order_idx on public.pipeline_stage_runs (run_id, stage_order);

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
    (NEW.id, 'merge', 1, 7),
    (NEW.id, 'review', 1, 8);
  return NEW;
end;
$$;

drop trigger if exists pipeline_runs_seed_stages on public.pipeline_runs;

create trigger pipeline_runs_seed_stages
  after insert on public.pipeline_runs
  for each row
  execute function public.seed_pipeline_stage_runs();

create or replace function public.claim_pipeline_stage(
  p_run_id uuid,
  p_stage text,
  p_worker_id text,
  p_lease_seconds integer
)
returns integer
language plpgsql
as $$
declare
  latest record;
  new_version integer;
  new_lease timestamptz := now() + make_interval(secs => p_lease_seconds);
begin
  select *
    into latest
    from public.pipeline_stage_runs as s
    where s.run_id = p_run_id and s.stage = p_stage
    order by s.version desc
    limit 1
    for update;

  if not found then
    raise exception 'no such run or stage';
  end if;

  if latest.status in ('succeeded', 'failedPermanent', 'cancelled') then
    -- Terminal: reuse the stored outcome, never re-execute.
    return null;
  end if;

  if latest.status = 'failedRetryable' then
    new_version := latest.version + 1;
    insert into public.pipeline_stage_runs
      (run_id, stage, version, status, stage_order, worker_id, lease_expires_at)
    values
      (p_run_id, p_stage, new_version, 'running', latest.stage_order, p_worker_id, new_lease);
    return new_version;
  end if;

  if latest.worker_id is not null and latest.lease_expires_at > now() then
    -- Live lease held by another worker.
    return null;
  end if;

  update public.pipeline_stage_runs as s
    set status = 'running',
        worker_id = p_worker_id,
        lease_expires_at = new_lease
    where s.run_id = p_run_id and s.stage = p_stage and s.version = latest.version;
  return latest.version;
end;
$$;

create or replace function public.extend_stage_lease(
  p_run_id uuid,
  p_stage text,
  p_version integer,
  p_worker_id text,
  p_lease_seconds integer
)
returns timestamptz
language plpgsql
as $$
declare
  new_lease timestamptz := now() + make_interval(secs => p_lease_seconds);
  matched integer;
begin
  update public.pipeline_stage_runs as s
    set lease_expires_at = new_lease
    where s.run_id = p_run_id
      and s.stage = p_stage
      and s.version = p_version
      and s.status = 'running'
      and s.worker_id = p_worker_id;
  get diagnostics matched = row_count;
  if matched = 0 then
    raise exception 'not the running lease holder';
  end if;
  return new_lease;
end;
$$;
