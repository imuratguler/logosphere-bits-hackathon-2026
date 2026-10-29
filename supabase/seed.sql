-- Logosphere BITS — system-originated seed data.
--
-- Seeds are created by the system source, never by impersonating a real
-- user: no auth.users rows, no user ids, no personal data. Deterministic
-- UUIDs keep seeds stable across resets. Node seeds arrive with their own
-- steps; only the seed workspace is defined here.

insert into public.workspaces (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'System Seed Workspace')
on conflict (id) do nothing;
