-- Logosphere BITS — first migration: workspaces and nodes.
--
-- Runs on an empty PostgreSQL database (extension guarded). Two tables
-- only; no other tables presumed. Workspaces are account-scope roots
-- (no parent, no kind, no sort — same as fldObjWorkspace). Nodes carry
-- library/collection/set/product rows with a workspace link, a nullable
-- self parent link, a kind, and a sort order (lower first). The kind
-- vocabulary matches fldStrHierarchyKind in src/validation/hierarchy.ts.
-- Names ride on both levels (SCOPE F2 renames, D7 set names). Delete
-- behavior is intentionally absent (SCOPE section 6.4 still open).

create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  parent_id uuid references public.nodes (id),
  kind text not null check (kind in ('library', 'collection', 'set', 'product')),
  sort_order integer not null default 0,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nodes_workspace_id_idx on public.nodes (workspace_id);
create index nodes_parent_id_idx on public.nodes (parent_id);
