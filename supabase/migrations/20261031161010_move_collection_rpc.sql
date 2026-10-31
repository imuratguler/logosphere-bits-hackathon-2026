-- Logosphere BITS — collection move: reparent one collection atomically.
--
-- demo_move_collection relocates a single collection under another
-- library or collection in the same workspace. Contents ride along:
-- sub-collections keep their parent links and sets/products keep
-- their collection links, so only the moved row's parent_id changes.
-- The move follows the atomic-operations contract (versions,
-- single-statement write, fresh {id, version} return):
-- - The target must be a library or a collection in the same
--   workspace; anything else (including a set id) is rejected.
-- - The target must sit outside the moved subtree: the collection
--   cannot move under itself or one of its descendants (walked
--   upward from the target, so a cycle is impossible).
-- - The write is a single UPDATE ... WHERE id AND version; a
--   concurrent change reports a version conflict, a vanished row
--   reports unknown-subject.
-- - The (create, collection) demo cell fronts the call; no direct
--   table write grant is added.
--
-- Client error contract additions: 'unknown collection',
-- 'demo move target must be a library or collection',
-- 'demo move target inside moved collection',
-- 'demo version conflict: node <id> expected <e> but found <c>'.

create function public.demo_move_collection(
  p_session_id uuid,
  p_collection_id uuid,
  p_expected_version integer,
  p_target_parent_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  collection_workspace uuid;
  target_kind text;
  target_workspace uuid;
  walk_id uuid;
  walk_parent uuid;
  current_version integer;
  new_version integer;
  changed integer;
begin
  perform public.demo_authorize(p_session_id, 'create', 'collection');

  select n.workspace_id
    into collection_workspace
    from public.nodes as n
    where n.id = p_collection_id
      and n.kind = 'collection';

  if not found then
    raise exception 'unknown collection';
  end if;

  select n.kind, n.workspace_id
    into target_kind, target_workspace
    from public.nodes as n
    where n.id = p_target_parent_id;

  if not found then
    raise exception 'unknown node';
  end if;

  if target_kind <> 'library' and target_kind <> 'collection' then
    raise exception 'demo move target must be a library or collection';
  end if;

  if target_workspace is distinct from collection_workspace then
    raise exception 'cross-workspace link rejected';
  end if;

  walk_id := p_target_parent_id;

  loop
    if walk_id = p_collection_id then
      raise exception 'demo move target inside moved collection';
    end if;

    select n.parent_id
      into walk_parent
      from public.nodes as n
      where n.id = walk_id;

    if not found or walk_parent is null then
      exit;
    end if;

    walk_id := walk_parent;
  end loop;

  update public.nodes
    set parent_id = p_target_parent_id
    where id = p_collection_id
      and version = p_expected_version
    returning version into new_version;

  get diagnostics changed = row_count;

  if changed = 0 then
    select n.version
      into current_version
      from public.nodes as n
      where n.id = p_collection_id;

    if not found then
      raise exception 'unknown collection';
    end if;

    raise exception 'demo version conflict: node % expected % but found %',
      p_collection_id, p_expected_version, current_version;
  end if;

  return jsonb_build_object('id', p_collection_id, 'version', new_version);
end;
$$;

grant execute on function public.demo_move_collection(uuid, uuid, integer, uuid) to anon, authenticated;
