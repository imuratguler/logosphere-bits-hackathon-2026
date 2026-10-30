-- Logosphere BITS — system-originated seed data.
--
-- Seeds are created by the system source, never by impersonating a real
-- user: no auth.users rows, no user ids, no personal data, no emails,
-- no passwords. Deterministic UUIDs keep seeds stable across resets.
-- Ten fictional personas share one demo workspace and the same sample
-- catalog (library, sub-collection, set, publications). Persona order
-- is the selection-screen order. Senior Citizen and CV Meta Hackathon
-- 2026 are demo labels only: no age, account, membership, privilege,
-- or API row is created for any persona. Re-running this file updates
-- names and ordering without duplicating rows.

insert into public.workspaces (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Demo Workspace')
on conflict (id) do update set name = excluded.name;

insert into public.demo_personas (id, display_name, sort_order) values
  ('10000000-0000-4000-8000-000000000001', 'Public Library', 0),
  ('10000000-0000-4000-8000-000000000002', 'High School', 1),
  ('10000000-0000-4000-8000-000000000003', 'University College', 2),
  ('10000000-0000-4000-8000-000000000004', 'Bookstore Company', 3),
  ('10000000-0000-4000-8000-000000000005', 'Second-hand Bookshop', 4),
  ('10000000-0000-4000-8000-000000000006', 'Auction House', 5),
  ('10000000-0000-4000-8000-000000000007', 'Book Collector', 6),
  ('10000000-0000-4000-8000-000000000008', 'Senior Citizen', 7),
  ('10000000-0000-4000-8000-000000000009', 'Any Student', 8),
  ('10000000-0000-4000-8000-000000000010', 'CV Meta Hackathon 2026', 9)
on conflict (id) do update set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order;

insert into public.nodes (id, workspace_id, parent_id, kind, name) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', null, 'library', 'Demo Library'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'collection', 'Rare Books')
on conflict (id) do update set name = excluded.name;

insert into public.sets (id, collection_id, name) values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'First Editions')
on conflict (id) do update set name = excluded.name;

insert into public.products (id, collection_id, set_id, name) values
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'The Demo Codex'),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Atlas of Examples'),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333333', null, 'Loose Leaf Poems')
on conflict (id) do update set name = excluded.name;

insert into public.product_bibliography (product_id, title, publisher, publication_year) values
  ('55555555-5555-5555-5555-555555555501', 'The Demo Codex', 'Logosphere Press', 2026),
  ('55555555-5555-5555-5555-555555555502', 'Atlas of Examples', 'Logosphere Press', 2025),
  ('55555555-5555-5555-5555-555555555503', 'Loose Leaf Poems', 'Logosphere Press', 2024)
on conflict (product_id) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  publication_year = excluded.publication_year;
