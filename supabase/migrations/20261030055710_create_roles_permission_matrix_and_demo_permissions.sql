-- Logosphere BITS — roles, permission matrix, demo permissions.
--
-- Real authorization source: roles plus a 7-action by 3-scope matrix
-- (view/create/delete/sell_toggle/price/buy/sell over
-- item/collection/library; item means product). Presence of a row
-- grants, absence denies (closed world). Demo authorization resolves
-- from a separate table, never from this matrix.
--
-- Seeded doctrine (policy starting point, open to correction):
-- account_manager holds all 21 cells (account omnipotent, the admin
-- successor); authorized holds view/create/sell_toggle/price on all
-- scopes (daily operations, no destruction, no commitments);
-- signatory holds view/buy/sell on all scopes (commitment authority
-- only; listings and prices come from the other roles). Scopes seed
-- uniformly; per-scope exceptions are future policy rows.
--
-- Rules enforced:
-- 1. Membership roles evolve to the matrix vocabulary: the old
--    member/admin check is replaced by a foreign key to roles, so no
--    membership can name a role the matrix does not know. (No
--    production rows exist; throwaway databases rebuild.)
-- 2. Demo personas cannot change the matrix: anon/authenticated keep
--    read-only grants (countering Supabase auto-exposure); writes go
--    through service_role only. Row-level policies layer on later.
-- 3. Real and demo sources stay apart: real sessions resolve through
--    real_effective_permissions (memberships joined to the matrix);
--    demo sessions resolve only through demo_permissions, which
--    carries no role, profile, or user columns. The demo policy seeds
--    as a full 21-cell sandbox.
-- No triggers: grants are plain rows, so no locking analysis applies.

create table public.roles (
  code text primary key,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_permissions (
  role_code text not null references public.roles (code),
  action text not null
    check (action in ('view', 'create', 'delete', 'sell_toggle', 'price', 'buy', 'sell')),
  scope text not null check (scope in ('item', 'collection', 'library')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_permissions_pkey primary key (role_code, action, scope)
);

create table public.demo_permissions (
  action text not null
    check (action in ('view', 'create', 'delete', 'sell_toggle', 'price', 'buy', 'sell')),
  scope text not null check (scope in ('item', 'collection', 'library')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_permissions_pkey primary key (action, scope)
);

create view public.real_effective_permissions as
  select
    m.profile_id,
    m.organization_id,
    m.role as role_code,
    p.action,
    p.scope
  from public.organization_memberships as m
  join public.role_permissions as p on p.role_code = m.role;

alter table public.organization_memberships drop constraint organization_memberships_role_check;

alter table public.organization_memberships add constraint organization_memberships_role_fk
  foreign key (role) references public.roles (code);

insert into public.roles (code, description) values
  ('account_manager', 'Account manager'),
  ('authorized', 'Authorized member'),
  ('signatory', 'Authorized signatory');

insert into public.role_permissions (role_code, action, scope) values
  ('account_manager', 'view', 'item'),
  ('account_manager', 'view', 'collection'),
  ('account_manager', 'view', 'library'),
  ('account_manager', 'create', 'item'),
  ('account_manager', 'create', 'collection'),
  ('account_manager', 'create', 'library'),
  ('account_manager', 'delete', 'item'),
  ('account_manager', 'delete', 'collection'),
  ('account_manager', 'delete', 'library'),
  ('account_manager', 'sell_toggle', 'item'),
  ('account_manager', 'sell_toggle', 'collection'),
  ('account_manager', 'sell_toggle', 'library'),
  ('account_manager', 'price', 'item'),
  ('account_manager', 'price', 'collection'),
  ('account_manager', 'price', 'library'),
  ('account_manager', 'buy', 'item'),
  ('account_manager', 'buy', 'collection'),
  ('account_manager', 'buy', 'library'),
  ('account_manager', 'sell', 'item'),
  ('account_manager', 'sell', 'collection'),
  ('account_manager', 'sell', 'library'),
  ('authorized', 'view', 'item'),
  ('authorized', 'view', 'collection'),
  ('authorized', 'view', 'library'),
  ('authorized', 'create', 'item'),
  ('authorized', 'create', 'collection'),
  ('authorized', 'create', 'library'),
  ('authorized', 'sell_toggle', 'item'),
  ('authorized', 'sell_toggle', 'collection'),
  ('authorized', 'sell_toggle', 'library'),
  ('authorized', 'price', 'item'),
  ('authorized', 'price', 'collection'),
  ('authorized', 'price', 'library'),
  ('signatory', 'view', 'item'),
  ('signatory', 'view', 'collection'),
  ('signatory', 'view', 'library'),
  ('signatory', 'buy', 'item'),
  ('signatory', 'buy', 'collection'),
  ('signatory', 'buy', 'library'),
  ('signatory', 'sell', 'item'),
  ('signatory', 'sell', 'collection'),
  ('signatory', 'sell', 'library');

insert into public.demo_permissions (action, scope) values
  ('view', 'item'),
  ('view', 'collection'),
  ('view', 'library'),
  ('create', 'item'),
  ('create', 'collection'),
  ('create', 'library'),
  ('delete', 'item'),
  ('delete', 'collection'),
  ('delete', 'library'),
  ('sell_toggle', 'item'),
  ('sell_toggle', 'collection'),
  ('sell_toggle', 'library'),
  ('price', 'item'),
  ('price', 'collection'),
  ('price', 'library'),
  ('buy', 'item'),
  ('buy', 'collection'),
  ('buy', 'library'),
  ('sell', 'item'),
  ('sell', 'collection'),
  ('sell', 'library');

revoke all on public.roles, public.role_permissions, public.demo_permissions,
  public.real_effective_permissions from anon, authenticated;

grant select on public.roles, public.role_permissions, public.demo_permissions,
  public.real_effective_permissions to anon, authenticated;

grant all on public.roles, public.role_permissions, public.demo_permissions to service_role;
