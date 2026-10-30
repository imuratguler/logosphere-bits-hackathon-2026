-- Logosphere BITS — real accounts and demo personas.
--
-- Hidden real-account infrastructure (SCOPE F11): individual and
-- corporate profile types, organizations, and memberships. Row-level
-- policies arrive with their own step; this migration builds the
-- tables and the structural separations only.
--
-- Rules enforced:
-- 1. Every real-side row chains to an authenticated user: profiles.id
--    is both primary key and foreign key to auth.users, and
--    memberships hang under profiles. A profile without an auth user
--    cannot exist. (auth.users is real on Supabase; throwaway local
--    harnesses stub the table to apply this migration.)
-- 2. Admin rights live only in organization_memberships.role, whose
--    vocabulary is closed to member/admin — no privilege escalation
--    through free text, and no admin flag anywhere else.
-- 3. Demo personas are structurally separate: demo_personas carries no
--    user, membership, role, or contact columns and no foreign key in
--    either direction. Selecting a persona is client-local (D1) and
--    touches no database row, so it cannot create an account,
--    a corporate membership, or admin rights by construction.
-- 4. The demo seed carries no real personal data: eight fixed rows
--    with numbered labels, no names, emails, phones, or auth rows
--    (see seed.sql).
-- No triggers: all four rules are key, nullability, check, and
-- absence-of-link constraints, so no locking analysis applies.

create table public.profiles (
  id uuid primary key references auth.users (id),
  profile_type text not null check (profile_type in ('individual', 'corporate')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations (id),
  profile_id uuid not null references public.profiles (id),
  role text not null check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_pkey primary key (organization_id, profile_id)
);

create table public.demo_personas (
  id uuid primary key,
  display_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_memberships_profile_id_idx on public.organization_memberships (profile_id);
