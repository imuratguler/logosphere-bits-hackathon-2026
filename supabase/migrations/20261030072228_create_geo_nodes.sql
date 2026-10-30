-- Logosphere BITS — geo_nodes reference table.
--
-- Address hierarchy reference (country/state/city/district/
-- neighborhood present; town/street/postal absent in the source —
-- recorded, never fabricated). Levels town and street stay inside the
-- check and postal_code stays nullable so the table extends without
-- DDL when those rows or codes arrive; until then, addresses missing
-- from the list are entered as manual text at the application layer
-- (its own step), never invented here. Code is the permanent matching
-- key (unique, stored verbatim); parents resolve through it.
--
-- Source and rights: global rows derive from
-- https://github.com/dr5hn/countries-states-cities-database under the
-- Open Database License v1.0 (commercial use, modification, and
-- redistribution permitted; attribution required — keep the URL with
-- any redistribution). That upstream additionally credits open
-- sources (GeoNames CC BY 4.0, OpenStreetMap contributors, Stats NZ
-- CC BY 4.0, and others; full list in its SOURCES.txt). The combined
-- transfer also merges Turkish detail whose exact origin and reuse
-- terms are unverified (K74 gate): do not load, publish, or deploy
-- the combined data set until they are confirmed. This table is not
-- presented as an official or complete address catalog.
--
-- Setup order: this migration owns the shape; the combined transfer
-- file owns the rows plus read policy. Its CREATE TABLE and indexes
-- are IF NOT EXISTS no-ops against this shape, and its INSERT names
-- columns explicitly, so the extra timestamp columns are safe. Writes
-- stay revoked from anon/authenticated (secure default); the transfer
-- grants SELECT at load time. Re-running the transfer is idempotent
-- (code-based ON CONFLICT, changed values only) and never deletes.

create extension if not exists pg_trgm;

create table public.geo_nodes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  parent_id uuid references public.geo_nodes (id) on delete restrict,
  level text not null check (level in
    ('country', 'state', 'city', 'district', 'town', 'neighborhood', 'street')),
  name text not null,
  country_code text,
  postal_code text,
  search text generated always as (lower(name)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index geo_nodes_code_full_uidx on public.geo_nodes (code);
create index geo_nodes_parent_idx on public.geo_nodes (parent_id);
create index geo_nodes_country_idx on public.geo_nodes (country_code);
create index geo_nodes_level_idx on public.geo_nodes (level);
create index geo_nodes_search_trgm on public.geo_nodes using gin (lower(name) gin_trgm_ops);
create index geo_nodes_roots_idx on public.geo_nodes (level) where parent_id is null;

revoke all on public.geo_nodes from anon, authenticated;
