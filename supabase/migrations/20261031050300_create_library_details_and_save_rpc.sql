-- Logosphere BITS — library details storage plus demo save RPC.
--
-- Anonymous demo sessions may save the settings form of a shared
-- library — but only through demo_save_library_details. No direct
-- table write grant is added for anon/authenticated, RLS stays
-- enabled, and the RPC verifies session identity plus the
-- (create, library) scope on the server before touching a row
-- (renames and detail saves ride the create cell: the matrix
-- vocabulary has no update action).
--
-- Storage: public.library_details holds one row per library node
-- (node_id PK/FK with cascade). Only code is NOT NULL besides the
-- key; every other detail column stays nullable so partial settings
-- and NULL postal codes persist as-is. Missing values are NULL, never
-- fabricated placeholders: the upsert is a full replace, so clearing
-- a field in the form clears it in the row. Older libraries simply
-- have no details row (clients treat that as a blank form). Names
-- live on public.nodes and are renamed by the same RPC call.
--
-- Rules enforced:
-- 1. Subject must be a library node: unknown ids raise 'unknown node',
--    non-library kinds raise 'demo library expected'.
-- 2. Client identity is never authority: the RPC takes a session id
--    only and demo_authorize resolves plus gates (create, library).
-- 3. Code and name are required on the server too (fail closed for any
--    caller, not just the validated form); type, date, address parts,
--    postal code, and website stay optional.
-- 4. Reads stay open: anon keeps SELECT on the details table (shared
--    demo scope, same as nodes), so settings forms can prefill.
--
-- Client error contract additions: 'demo library expected',
-- 'demo library name required', 'demo library code required'
-- (plus the demo_write_policy contract: session invalid/expired/
-- revoked, operation not permitted, unknown node).

create table public.library_details (
  node_id uuid primary key references public.nodes (id) on delete cascade,
  code text not null,
  library_type text,
  founded_date date,
  country_code text,
  country_text text,
  state_code text,
  state_text text,
  city_code text,
  city_text text,
  district_code text,
  district_text text,
  town_code text,
  town_text text,
  neighborhood_code text,
  neighborhood_text text,
  street_code text,
  street_text text,
  extra_description text,
  postal_code text,
  building text,
  floor text,
  apartment text,
  website text,
  updated_at timestamptz not null default now()
);

alter table public.library_details enable row level security;

revoke all on public.library_details from anon, authenticated;

grant all on public.library_details to service_role;

grant select on public.library_details to anon;

create policy library_details_anon_read on public.library_details
  for select to anon
  using (true);

create or replace function public.demo_save_library_details(
  p_session_id uuid,
  p_node_id uuid,
  p_name text,
  p_code text,
  p_library_type text,
  p_founded_date date,
  p_country_code text,
  p_country_text text,
  p_state_code text,
  p_state_text text,
  p_city_code text,
  p_city_text text,
  p_district_code text,
  p_district_text text,
  p_town_code text,
  p_town_text text,
  p_neighborhood_code text,
  p_neighborhood_text text,
  p_street_code text,
  p_street_text text,
  p_extra_description text,
  p_postal_code text,
  p_building text,
  p_floor text,
  p_apartment text,
  p_website text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  node_kind text;
begin
  select n.kind
    into node_kind
    from public.nodes as n
    where n.id = p_node_id;

  if not found then
    raise exception 'unknown node';
  end if;

  if node_kind <> 'library' then
    raise exception 'demo library expected';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'library');

  if p_name is null or btrim(p_name) = '' then
    raise exception 'demo library name required';
  end if;

  if p_code is null or btrim(p_code) = '' then
    raise exception 'demo library code required';
  end if;

  update public.nodes
    set name = btrim(p_name),
        updated_at = now()
    where id = p_node_id;

  insert into public.library_details (
    node_id, code, library_type, founded_date,
    country_code, country_text,
    state_code, state_text,
    city_code, city_text,
    district_code, district_text,
    town_code, town_text,
    neighborhood_code, neighborhood_text,
    street_code, street_text,
    extra_description, postal_code, building, floor, apartment, website,
    updated_at
  )
  values (
    p_node_id, btrim(p_code), p_library_type, p_founded_date,
    p_country_code, p_country_text,
    p_state_code, p_state_text,
    p_city_code, p_city_text,
    p_district_code, p_district_text,
    p_town_code, p_town_text,
    p_neighborhood_code, p_neighborhood_text,
    p_street_code, p_street_text,
    p_extra_description, p_postal_code, p_building, p_floor, p_apartment, p_website,
    now()
  )
  on conflict (node_id)
  do update set
    code = excluded.code,
    library_type = excluded.library_type,
    founded_date = excluded.founded_date,
    country_code = excluded.country_code,
    country_text = excluded.country_text,
    state_code = excluded.state_code,
    state_text = excluded.state_text,
    city_code = excluded.city_code,
    city_text = excluded.city_text,
    district_code = excluded.district_code,
    district_text = excluded.district_text,
    town_code = excluded.town_code,
    town_text = excluded.town_text,
    neighborhood_code = excluded.neighborhood_code,
    neighborhood_text = excluded.neighborhood_text,
    street_code = excluded.street_code,
    street_text = excluded.street_text,
    extra_description = excluded.extra_description,
    postal_code = excluded.postal_code,
    building = excluded.building,
    floor = excluded.floor,
    apartment = excluded.apartment,
    website = excluded.website,
    updated_at = now();

  return p_node_id;
end;
$$;

grant execute on function public.demo_save_library_details(
  uuid, uuid, text, text, text, date,
  text, text, text, text, text, text, text, text,
  text, text, text, text, text, text,
  text, text, text, text, text, text
) to anon, authenticated;
