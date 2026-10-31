-- Logosphere BITS — collection details columns plus demo save RPC.
--
-- Anonymous demo sessions may save the settings form of a shared
-- collection — but only through demo_save_collection_details. No
-- direct table write grant is added for anon/authenticated, RLS stays
-- enabled, and the RPC verifies session identity plus the
-- (create, collection) scope on the server before touching a row
-- (renames and detail saves ride the create cell: the matrix
-- vocabulary has no update action).
--
-- Storage: the shortcut migration created public.collection_details
-- with the formed date only; this step adds the five physical
-- location parts (hall/room, cabinet face, block, row, shelf) and the
-- website as free text. Every detail column stays nullable so partial
-- settings persist as-is. Missing values are NULL, never fabricated
-- placeholders: the upsert is a full replace, so clearing a field in
-- the form clears it in the row. Older collections simply have no
-- details row (clients treat that as a blank form). Names live on
-- public.nodes and are renamed by the same RPC call. The anon SELECT
-- grant and read policy from the shortcut step already cover the new
-- columns, so settings forms can prefill.
--
-- Rules enforced:
-- 1. Subject must be a collection node: unknown ids raise 'unknown
--    node', non-collection kinds raise 'demo collection expected'.
-- 2. Client identity is never authority: the RPC takes a session id
--    only and demo_authorize resolves plus gates (create, collection).
-- 3. Name is required on the server too (fail closed for any caller,
--    not just the validated form); the formed date, location parts,
--    and website stay optional.
--
-- Client error contract additions: 'demo collection expected',
-- 'demo collection name required' (plus the demo_write_policy
-- contract: session invalid/expired/revoked, operation not permitted,
-- unknown node).

alter table public.collection_details
  add column hall_room text,
  add column cabinet_face text,
  add column block text,
  add column shelf_row text,
  add column shelf text,
  add column website text;

create or replace function public.demo_save_collection_details(
  p_session_id uuid,
  p_node_id uuid,
  p_name text,
  p_formed_date date,
  p_hall_room text,
  p_cabinet_face text,
  p_block text,
  p_shelf_row text,
  p_shelf text,
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

  if node_kind <> 'collection' then
    raise exception 'demo collection expected';
  end if;

  perform public.demo_authorize(p_session_id, 'create', 'collection');

  if p_name is null or btrim(p_name) = '' then
    raise exception 'demo collection name required';
  end if;

  update public.nodes
    set name = btrim(p_name),
        updated_at = now()
    where id = p_node_id;

  insert into public.collection_details (
    node_id, formed_date,
    hall_room, cabinet_face, block, shelf_row, shelf, website,
    updated_at
  )
  values (
    p_node_id, p_formed_date,
    p_hall_room, p_cabinet_face, p_block, p_shelf_row, p_shelf, p_website,
    now()
  )
  on conflict (node_id)
  do update set
    formed_date = excluded.formed_date,
    hall_room = excluded.hall_room,
    cabinet_face = excluded.cabinet_face,
    block = excluded.block,
    shelf_row = excluded.shelf_row,
    shelf = excluded.shelf,
    website = excluded.website,
    updated_at = now();

  return p_node_id;
end;
$$;

grant execute on function public.demo_save_collection_details(
  uuid, uuid, text, date, text, text, text, text, text, text
) to anon, authenticated;
