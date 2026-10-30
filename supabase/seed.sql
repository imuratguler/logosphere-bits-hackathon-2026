-- Logosphere BITS — system-originated seed data.
--
-- Seeds are created by the system source, never by impersonating a real
-- user: no auth.users rows, no user ids, no personal data. Deterministic
-- UUIDs keep seeds stable across resets. Node seeds arrive with their own
-- steps; only the seed workspace and the eight numbered demo personas
-- (labels only, no personal data) are defined here.

insert into public.workspaces (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'System Seed Workspace')
on conflict (id) do nothing;

insert into public.demo_personas (id, display_name, sort_order) values
  ('10000000-0000-4000-8000-000000000001', 'Demo Persona 1', 0),
  ('10000000-0000-4000-8000-000000000002', 'Demo Persona 2', 1),
  ('10000000-0000-4000-8000-000000000003', 'Demo Persona 3', 2),
  ('10000000-0000-4000-8000-000000000004', 'Demo Persona 4', 3),
  ('10000000-0000-4000-8000-000000000005', 'Demo Persona 5', 4),
  ('10000000-0000-4000-8000-000000000006', 'Demo Persona 6', 5),
  ('10000000-0000-4000-8000-000000000007', 'Demo Persona 7', 6),
  ('10000000-0000-4000-8000-000000000008', 'Demo Persona 8', 7)
on conflict (id) do nothing;
