-- Logosphere BITS — enforce nodes hierarchy placement in SQL.
--
-- Mirrors src/validation/hierarchy.ts so placement never relies on the
-- mobile client alone: every INSERT and every UPDATE of (workspace_id,
-- parent_id, kind) is validated by a BEFORE trigger. Mapping note: the
-- mobile 'workspace' kind lives in public.workspaces, not in
-- public.nodes; a library is therefore a top-level node
-- (parent_id IS NULL) whose workspace link is authoritative.
--
-- Rules enforced (each violation aborts the statement):
-- 1. Parent-kind placement: library has no parent; collection hangs
--    under library/collection; set under collection; product under
--    collection/set. Anything else (including a non-library top-level
--    row) is rejected. A missing parent row is left to the foreign key.
-- 2. Workspace consistency: a child shares its parent's workspace_id;
--    cross-workspace links are rejected, including children orphaned by
--    a parent's kind/workspace change.
-- 3. Cycles: self-parent rows and ancestor chains looping back to the
--    row are rejected.
-- 4. Level purity: one parent never mixes collection children with
--    set/product children.
--
-- Concurrency (no special isolation needed; callers use the default
-- READ COMMITTED): sibling checks race when two transactions add
-- different content groups under the same parent at once, because each
-- sees only its own row. The trigger therefore locks the parent row
-- (SELECT ... FOR UPDATE) before checking siblings, so the second
-- writer blocks until the first commits or rolls back, then sees its
-- row and is rejected. Bulk restructures moving several levels at once
-- should run in one transaction so every move is validated against the
-- same snapshot plus its own writes. Opposite concurrent moves can
-- deadlock; Postgres then aborts one writer and the hierarchy stays
-- valid, so the caller retries.

create or replace function public.validate_nodes_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_kind text;
  parent_workspace_id uuid;
  sibling_conflict boolean;
  ancestor_hit boolean;
  child_row record;
begin
  if NEW.parent_id is null then
    -- Top level: only a library may have no parent.
    if NEW.kind <> 'library' then
      raise exception 'invalid parent: kind "%" requires a parent', NEW.kind;
    end if;
  else
    -- Quick self-parent reject (also covered by the ancestor walk).
    if NEW.parent_id = NEW.id then
      raise exception 'invalid parent: node cannot be its own parent';
    end if;

    -- Lock the parent row: serializes concurrent sibling writes so two
    -- transactions adding different content groups cannot both pass.
    select n.kind, n.workspace_id
      into parent_kind, parent_workspace_id
      from public.nodes as n
      where n.id = NEW.parent_id
      for update;

    if not found then
      -- No parent row: let the foreign key raise the missing-parent error.
      return NEW;
    end if;

    -- Workspace consistency.
    if parent_workspace_id is distinct from NEW.workspace_id then
      raise exception 'cross-workspace link rejected';
    end if;

    -- Parent-kind placement.
    if NEW.kind = 'library' then
      raise exception 'invalid parent: library must be top-level';
    elsif NEW.kind = 'collection'
      and parent_kind not in ('library', 'collection') then
      raise exception 'invalid parent: collection requires a library or collection parent';
    elsif NEW.kind = 'set'
      and parent_kind <> 'collection' then
      raise exception 'invalid parent: set requires a collection parent';
    elsif NEW.kind = 'product'
      and parent_kind not in ('collection', 'set') then
      raise exception 'invalid parent: product requires a collection or set parent';
    end if;

    -- Cycle: the ancestor chain from the parent must not reach this row.
    with recursive ancestors(id, parent_id) as (
      select n.id, n.parent_id
        from public.nodes as n
        where n.id = NEW.parent_id
      union all
      select n.id, n.parent_id
        from public.nodes as n
        join ancestors as a on n.id = a.parent_id
    )
    select exists (select 1 from ancestors where id = NEW.id)
      into ancestor_hit;

    if ancestor_hit then
      raise exception 'cycle rejected: parent chain loops back to this node';
    end if;

    -- Level purity: collections never mix with sets/products under one parent.
    if NEW.kind = 'collection' then
      select exists (
        select 1
          from public.nodes as s
          where s.parent_id = NEW.parent_id
            and s.id is distinct from NEW.id
            and s.kind in ('set', 'product')
      ) into sibling_conflict;
    elsif NEW.kind in ('set', 'product') then
      select exists (
        select 1
          from public.nodes as s
          where s.parent_id = NEW.parent_id
            and s.id is distinct from NEW.id
            and s.kind = 'collection'
      ) into sibling_conflict;
    else
      sibling_conflict := false;
    end if;

    if sibling_conflict then
      raise exception 'mixed content rejected: collections cannot mix with sets/products under one parent';
    end if;
  end if;

  -- A changed kind/workspace must keep existing children valid.
  if TG_OP = 'UPDATE'
    and (NEW.kind is distinct from OLD.kind
      or NEW.workspace_id is distinct from OLD.workspace_id) then
    for child_row in
      select c.kind, c.workspace_id
        from public.nodes as c
        where c.parent_id = NEW.id
    loop
      if child_row.workspace_id is distinct from NEW.workspace_id then
        raise exception 'cross-workspace link rejected';
      end if;
      if child_row.kind = 'library'
        or (child_row.kind = 'collection'
          and NEW.kind not in ('library', 'collection'))
        or (child_row.kind = 'set'
          and NEW.kind <> 'collection')
        or (child_row.kind = 'product'
          and NEW.kind not in ('collection', 'set')) then
        raise exception 'invalid parent: child kind "%" cannot hang under "%"', child_row.kind, NEW.kind;
      end if;
    end loop;
  end if;

  return NEW;
end;
$$;

drop trigger if exists nodes_hierarchy_before_write on public.nodes;

create trigger nodes_hierarchy_before_write
  before insert or update of workspace_id, parent_id, kind on public.nodes
  for each row
  execute function public.validate_nodes_hierarchy();
