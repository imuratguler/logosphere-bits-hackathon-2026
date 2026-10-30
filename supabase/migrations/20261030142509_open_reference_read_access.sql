-- Logosphere BITS — open reference reads to anonymous clients.
--
-- User decision D9 (2026-10-30): unauthenticated app users may read
-- every row of dewey_nodes and geo_nodes. Data responsibility for the
-- loaded reference rows rests with the user (operator-loaded on
-- 2026-10-30; the project transfer gates B1/B2 loaded nothing).
-- RLS stays enabled; each table gets exactly one SELECT policy for
-- anon. No INSERT/UPDATE/DELETE or other grant is opened for anon;
-- authenticated gains nothing here (no auth flows exist yet).
-- Other tables' grants, reference rows, and postal values are
-- untouched. Pre-checked 2026-10-30: neither table carried a policy,
-- so nothing is duplicated or replaced.

grant select on public.dewey_nodes to anon;

grant select on public.geo_nodes to anon;

create policy dewey_nodes_anon_read on public.dewey_nodes
  for select to anon
  using (true);

create policy geo_nodes_anon_read on public.geo_nodes
  for select to anon
  using (true);
