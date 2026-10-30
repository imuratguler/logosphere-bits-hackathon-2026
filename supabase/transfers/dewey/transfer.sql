-- Dewey reference transfer: staging CSV into public.dewey_nodes.
--
-- Order of application (after rights are verified):
--   1. Apply the schema migration (dewey_nodes + normalize function).
--   2. Run extract.ps1 (source dump -> staging CSV). The dump itself is
--      never executed; fixed numeric ids are staging-only mapping keys.
--   3. Run this script with psql:
--        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v csv_path='C:/path/dewey_staging.csv'
--          -f supabase/transfers/dewey/transfer.sql
--      (\copy is psql-only; other runners must load the CSV into
--      staging_dewey with equivalent CSV semantics first.)
-- Expected input: 35,292 staging rows (verified tuple count of the
-- source file). Any validation failure aborts the whole transaction;
-- nothing is partially transferred.
--
-- Guarantees: codes transfer verbatim (normalization is search-time
-- only, never written); parents resolve through the staging id map
-- (no truncation derivation); insert is code-idempotent
-- (ON CONFLICT DO NOTHING) and parent links only fill NULL slots, so
-- re-runs never clobber and existing headings stay untouched. This
-- script contains no TRUNCATE and no DELETE: existing Dewey rows and
-- any products linked to them cannot be removed by it.
-- Status: flow-verified on empty staging; full-data run pending the
-- K73 rights gate.

SET client_encoding TO 'UTF8';

BEGIN;

CREATE TEMPORARY TABLE staging_dewey (
  source_id integer primary key,
  parent_source_id integer,
  code text,
  name_tr text,
  name_en text
) ON COMMIT DROP;

\copy staging_dewey (source_id, parent_source_id, code, name_tr, name_en) FROM :'csv_path' WITH (FORMAT csv, HEADER true)

DO $$
declare
  bad_count integer;
  sample text;
begin
  -- V1: source ids unique (primary key enforces; explicit for the report).
  -- V2: codes unique across staging.
  select count(*) into bad_count from (
    select code from staging_dewey where code is not null group by code having count(*) > 1
  ) t;
  if bad_count > 0 then
    select string_agg(dup, ', ') into sample from (
      select code as dup from staging_dewey where code is not null group by code having count(*) > 1 limit 5
    ) t;
    raise exception 'dewey transfer stopped: % duplicate codes (%)', bad_count, sample;
  end if;
  -- V3: every code present and non-blank.
  select count(*) into bad_count from staging_dewey
    where code is null or btrim(code) = '';
  if bad_count > 0 then
    raise exception 'dewey transfer stopped: % blank codes', bad_count;
  end if;
  -- V4: every parent reference resolves inside staging.
  select count(*) into bad_count from staging_dewey as s
    where s.parent_source_id is not null
      and not exists (
        select 1 from staging_dewey as p where p.source_id = s.parent_source_id
      );
  if bad_count > 0 then
    select string_agg(source_id::text, ', ') into sample from (
      select s.source_id from staging_dewey as s
        where s.parent_source_id is not null
          and not exists (
            select 1 from staging_dewey as p where p.source_id = s.parent_source_id
          )
        limit 5
    ) t;
    raise exception 'dewey transfer stopped: % orphan parents (e.g. rows %)', bad_count, sample;
  end if;
  -- V5: no self-parent rows.
  select count(*) into bad_count from staging_dewey
    where parent_source_id is not null and parent_source_id = source_id;
  if bad_count > 0 then
    raise exception 'dewey transfer stopped: % self-parent rows', bad_count;
  end if;
  -- V6: no cycles in the parent graph.
  with recursive reach(start_id, cur_id, path, cyc) as (
    select source_id, source_id, array[source_id], false from staging_dewey
    union all
    select r.start_id, s.parent_source_id,
           r.path || s.parent_source_id,
           s.parent_source_id = any (r.path)
      from reach as r
      join staging_dewey as s on s.source_id = r.cur_id
      where s.parent_source_id is not null
        and not r.cyc
        and cardinality(r.path) < 100000
  )
  select count(*) into bad_count from reach where cyc;
  if bad_count > 0 then
    raise exception 'dewey transfer stopped: parent graph contains a cycle';
  end if;
  -- V7: normalization is collision-free (distinct raw codes never share
  -- a normalized form), so search-time stripping cannot confuse nodes.
  select count(*) into bad_count from (
    select public.normalize_dewey_code(code) as n
      from staging_dewey
      group by 1 having count(distinct code) > 1
  ) t;
  if bad_count > 0 then
    select string_agg(n, ', ') into sample from (
      select public.normalize_dewey_code(code) as n
        from staging_dewey
        group by 1 having count(distinct code) > 1 limit 5
    ) t;
    raise exception 'dewey transfer stopped: % normalization collisions (e.g. %)', bad_count, sample;
  end if;
  raise notice 'dewey validations passed';
end;
$$;

DO $$
declare
  inserted_count integer;
  filled_count integer;
  staging_count integer;
begin
  select count(*) into staging_count from staging_dewey;
  insert into public.dewey_nodes (code, name_en, name_tr)
    select s.code, s.name_en, s.name_tr from staging_dewey as s
    on conflict (code) do nothing;
  get diagnostics inserted_count = row_count;
  update public.dewey_nodes as dc
    set parent_id = dp.id
    from staging_dewey as s
    join staging_dewey as p on p.source_id = s.parent_source_id
    join public.dewey_nodes as dp on dp.code = p.code
    where dc.code = s.code
      and s.parent_source_id is not null
      and dc.parent_id is null;
  get diagnostics filled_count = row_count;
  raise notice 'dewey transfer: staging %, inserted %, parents filled %',
    staging_count, inserted_count, filled_count;
end;
$$;

select count(*) as dewey_rows,
       count(*) filter (where parent_id is null) as root_rows
  from public.dewey_nodes;

COMMIT;
