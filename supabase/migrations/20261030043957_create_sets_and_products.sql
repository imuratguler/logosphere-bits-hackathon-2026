-- Logosphere BITS — separate sets/products tables (D7 table step).
--
-- D7 decided: a set is a first-class container attached to one
-- collection; a product links to one collection plus optionally one
-- set (1:N). This migration builds that shape as skeletons: identity,
-- collection/set links, name, ordering, and timestamps only.
-- Bibliographic, pricing, sale, and photo columns arrive with their
-- own steps; the stable UUID primary keys are the anchors photo
-- relations will reference (no dangling photo columns).
--
-- Reconciliation with K61: set/product kinds leave public.nodes, which
-- now holds library/collection only; the hierarchy trigger narrows
-- accordingly (level purity is structural now — only collections can
-- hang under a collection). Assumes no set/product rows exist in nodes
-- (no production database yet; throwaway databases are rebuilt).
--
-- Rules enforced:
-- 1. Attachment: a set hangs under exactly one collection; a product
--    hangs under exactly one collection plus optionally one set
--    (null set means direct-to-collection). No set-in-set or
--    collection-in-set exists: neither table carries a child link.
-- 2. Collection-kind: both links must point at collection-kind nodes;
--    missing rows are left to the foreign keys.
-- 3. Same-collection: a product's set must belong to the product's own
--    collection, enforced declaratively by a composite foreign key
--    (no trigger needed; a null set passes).
-- No workspace columns: workspace derives via the collection join, so
-- there is no duplicated value to drift. Collection deletes stay
-- rejected while referenced (SCOPE section 6.4 still open).
-- Concurrency: the collection-kind check locks the nodes row
-- (SELECT ... FOR UPDATE), serializing with concurrent kind changes
-- the same way the hierarchy trigger does (see its header).

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.nodes (id),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sets_id_collection_key unique (id, collection_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.nodes (id),
  set_id uuid,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_set_collection_fk foreign key (set_id, collection_id)
    references public.sets (id, collection_id)
);

create index sets_collection_id_idx on public.sets (collection_id);
create index products_collection_id_idx on public.products (collection_id);
create index products_set_id_idx on public.products (set_id);

create or replace function public.validate_collection_link()
returns trigger
language plpgsql
as $$
declare
  linked_kind text;
begin
  select n.kind
    into linked_kind
    from public.nodes as n
    where n.id = NEW.collection_id
    for update;

  if not found then
    -- No linked row: let the foreign key raise the missing-link error.
    return NEW;
  end if;

  if linked_kind <> 'collection' then
    raise exception 'invalid collection link: % attaches to collections only', TG_ARGV[0];
  end if;

  return NEW;
end;
$$;

drop trigger if exists sets_collection_before_write on public.sets;

create trigger sets_collection_before_write
  before insert or update of collection_id on public.sets
  for each row
  execute function public.validate_collection_link('set');

drop trigger if exists products_collection_before_write on public.products;

create trigger products_collection_before_write
  before insert or update of collection_id on public.products
  for each row
  execute function public.validate_collection_link('product');

alter table public.nodes drop constraint nodes_kind_check;

alter table public.nodes add constraint nodes_kind_check
  check (kind in ('library', 'collection'));

create or replace function public.validate_nodes_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_kind text;
  parent_workspace_id uuid;
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

    -- Lock the parent row: serializes concurrent sibling writes (see
    -- the sets/products migration header for the locking pattern).
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

    -- Parent-kind placement (library/collection only; sets and products
    -- live in their own tables).
    if NEW.kind = 'library' then
      raise exception 'invalid parent: library must be top-level';
    elsif parent_kind not in ('library', 'collection') then
      raise exception 'invalid parent: collection requires a library or collection parent';
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
          and NEW.kind not in ('library', 'collection')) then
        raise exception 'invalid parent: child kind "%" cannot hang under "%"', child_row.kind, NEW.kind;
      end if;
    end loop;
    -- Sets and products attach to collections only: a collection that
    -- gains another kind must not strand them (workspace moves carry
    -- them along via the join).
    if NEW.kind <> 'collection'
      and (exists (select 1 from public.sets as s where s.collection_id = NEW.id)
        or exists (select 1 from public.products as p where p.collection_id = NEW.id)) then
      raise exception 'invalid collection link: collections with sets or products cannot change kind';
    end if;
  end if;

  return NEW;
end;
$$;
