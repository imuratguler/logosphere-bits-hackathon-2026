# Logosphere BITS — Repeatable Setup

Ordered procedure from an empty database to a full install. There
is no manual SQL step: every step closes with one of the files
below. Status: finalized 2026-11-06 (prior record: K81,
2026-10-30, 15 migrations).

## 1. Order

1. **Schema migrations** — `supabase/migrations/` in file-name
   order (43 files at finalization). Tool: `supabase db push`
   or equivalent. When reproducing, confirm with
   `supabase migration list --linked` that all 43 applied.
2. **Reference data** — Dewey 35,293 + Geo 233,001 rows. Loaded
   2026-10-30 as a verified DB-to-DB copy in atomic 2,000-row
   batches with deterministic UUID mapping (record D9; session
   `docs/sessions/Logosphere BITS, 20261030_153216_TST.MD`).
   The file-transfer scripts were NOT run for this load; they
   are kept for future verified loads. Rights in the loaded
   data are the user's responsibility and are NOT cleared for
   public distribution.
3. **Demo seed** — `supabase/seed.sql` applies last (10
   personas, 1 workspace, sample catalog). Re-runnable;
   duplicates nothing.

## 2. Reference data gates (final)

| Set | Source | Loaded | Rights status | Note |
|---|---|---|---|---|
| Dewey | DB copy (was: `Dewey_Nodes_Structure_and_Data_for_BITS.sql`, D:\Downloads, 35,292 lines) | 35,293 rows | NOT CLEARED: origin/license statement missing | Loaded tuple count is 1 row ahead of the audited SQL file |
| Geo | DB copy (was: `Geo_Structure_and_Data_for_BITS.sql` + `Geo_Nodes_Data_for_BITS.csv`, D:\Downloads, 233,001 rows) | 233,001 rows | NOT CLEARED for public distribution | County/state/city attribution: Countries States Cities Database (dr5hn), ODbL v1.0 |

Rules:

- The loaded data's source and accuracy are the user's
  responsibility (D9). Nothing here presents the sets as an
  official/complete catalog.
- The K73/K74 file gates below are historical: no file-based
  transfer ran, so they never opened — and the "Geo-global
  only" limit of K84 was exceeded by the full user-directed
  load.
- Historical file rules (kept for future verified loads):
  a transfer whose source/rights are unverified is never
  run, never loaded into the database (not even a trial
  run), never taken into the repo, never run remotely.
- Source files are NEVER run directly: the TRUNCATE /
  fixed-ID ON CONFLICT / missing-transaction content of the
  Dewey file never enters the transfer path.
- Transfer scripts hold no TRUNCATE/DELETE, delete no
  existing row, write code-based idempotent rows; the whole
  run stops when verification fails.

## 3. Migration assumptions

| Assumption | Used by | How met |
|---|---|---|
| `pgcrypto` (`gen_random_uuid`) | First migration + later ones | First migration installs with `IF NOT EXISTS` |
| `pg_trgm` | Geo migration | Same migration installs with `IF NOT EXISTS` |
| `auth.users` | Profile FK | Real on Supabase; a stub in the trial run (setup.js) |
| `storage` schema | Storage migration | Real on Supabase; a stub in the trial run (setup.js) |
| `anon`/`authenticated`/`service_role` | 10 migrations with grant/revoke/policy content | Platform roles; the trial setup.js creates them |
| Objects of previous migrations (tables, triggers, gate function) | Later migrations | File-name order resolves; verified on an empty DB |

## 4. Local trial recipe (historical, Docker absent)

Portable Postgres 17 (`$env:TEMP\bits-pg`, outside the repo),
127.0.0.1:55433. K81-era recipe (15 migrations); kept as a
record, not the current procedure:

```powershell
$d="$env:TEMP\bits-pg"
& "$d\bin\bin\pg_ctl.exe" -D "$d\data" -o "-p 55433 -c listen_addresses=127.0.0.1" -l "$d\server.log" start
Set-Location "$env:TEMP\bits-pg\client"
node setup.js        # empty DB + roles + stubs + migrations + seed
node <accept|verify>.js
& "$d\bin\bin\pg_ctl.exe" -D "$d\data" stop -m fast
```

`setup.js` drops and rebuilds the database on every run; roles
persist at cluster level. Acceptance scripts live outside the repo.

## 5. Access posture (summary)

- Demo reads/writes go only through the RPC and policy path;
  the client holds no direct table-write grant; RLS is on in
  every table.
- `dewey_nodes`/`geo_nodes`: anon SELECT opened per D9
  (user decision); no anon INSERT/UPDATE/DELETE. Account-core
  `authenticated` grants arrived with the hidden real-account
  flow (migration `20261031191911`).
- Expiring URLs are never stored as permanent identity (path
  CHECKs reject URLs); voice/corporate reads use
  server-signed URLs.
- Abandoned-job draft cleanup is server-only
  (`cleanup_abandoned_runs`, dry-run default); job records
  are kept for audit.
