-- Logosphere BITS — RLS with common demo read policy.
--
-- Demo-phase posture (D1 anonymous demo): row-level security is on
-- for all 26 tables. The shared catalog — workspace, nodes, sets,
-- products, bibliography, persons and their roles, images, voice,
-- transcriptions, estimates, observations, sale transactions, demo
-- personas, and the policy tables themselves — reads open to anon
-- and authenticated with deliberately no ownership filter, so all
-- eight personas see the same demo data. No client role gets
-- insert/update/delete anywhere; user-level writes arrive with the
-- abuse-policy step, per-owner scoping with the full RLS step.
--
-- Closed by absence of policy and grant: real profiles,
-- organizations, memberships, all four pipeline tables (job data may
-- carry user uploads), dewey_nodes, and geo_nodes. Geo readability
-- is a separate future decision gated on verified rights plus a
-- completed load (read-only then, via the transfer's own policy);
-- it never implies general read access elsewhere. Dewey access gets
-- its own decision once its usage rights verify. Service_role keeps
-- full grants as the server path; table owners bypass RLS as usual.
-- The effective-permissions view runs as invoker so client reads
-- through it obey the same policies.

alter table public.workspaces enable row level security;
alter table public.nodes enable row level security;
alter table public.sets enable row level security;
alter table public.products enable row level security;
alter table public.product_bibliography enable row level security;
alter table public.persons enable row level security;
alter table public.product_person_roles enable row level security;
alter table public.product_images enable row level security;
alter table public.product_voice_notes enable row level security;
alter table public.voice_transcriptions enable row level security;
alter table public.price_estimates enable row level security;
alter table public.price_observations enable row level security;
alter table public.sale_transactions enable row level security;
alter table public.demo_personas enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.demo_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.pipeline_run_images enable row level security;
alter table public.pipeline_stage_runs enable row level security;
alter table public.pipeline_stage_errors enable row level security;
alter table public.dewey_nodes enable row level security;
alter table public.geo_nodes enable row level security;

drop policy if exists workspaces_demo_read on public.workspaces;
create policy workspaces_demo_read on public.workspaces
  for select to anon, authenticated using (true);
drop policy if exists nodes_demo_read on public.nodes;
create policy nodes_demo_read on public.nodes
  for select to anon, authenticated using (true);
drop policy if exists sets_demo_read on public.sets;
create policy sets_demo_read on public.sets
  for select to anon, authenticated using (true);
drop policy if exists products_demo_read on public.products;
create policy products_demo_read on public.products
  for select to anon, authenticated using (true);
drop policy if exists product_bibliography_demo_read on public.product_bibliography;
create policy product_bibliography_demo_read on public.product_bibliography
  for select to anon, authenticated using (true);
drop policy if exists persons_demo_read on public.persons;
create policy persons_demo_read on public.persons
  for select to anon, authenticated using (true);
drop policy if exists product_person_roles_demo_read on public.product_person_roles;
create policy product_person_roles_demo_read on public.product_person_roles
  for select to anon, authenticated using (true);
drop policy if exists product_images_demo_read on public.product_images;
create policy product_images_demo_read on public.product_images
  for select to anon, authenticated using (true);
drop policy if exists product_voice_notes_demo_read on public.product_voice_notes;
create policy product_voice_notes_demo_read on public.product_voice_notes
  for select to anon, authenticated using (true);
drop policy if exists voice_transcriptions_demo_read on public.voice_transcriptions;
create policy voice_transcriptions_demo_read on public.voice_transcriptions
  for select to anon, authenticated using (true);
drop policy if exists price_estimates_demo_read on public.price_estimates;
create policy price_estimates_demo_read on public.price_estimates
  for select to anon, authenticated using (true);
drop policy if exists price_observations_demo_read on public.price_observations;
create policy price_observations_demo_read on public.price_observations
  for select to anon, authenticated using (true);
drop policy if exists sale_transactions_demo_read on public.sale_transactions;
create policy sale_transactions_demo_read on public.sale_transactions
  for select to anon, authenticated using (true);
drop policy if exists demo_personas_demo_read on public.demo_personas;
create policy demo_personas_demo_read on public.demo_personas
  for select to anon, authenticated using (true);
drop policy if exists roles_demo_read on public.roles;
create policy roles_demo_read on public.roles
  for select to anon, authenticated using (true);
drop policy if exists role_permissions_demo_read on public.role_permissions;
create policy role_permissions_demo_read on public.role_permissions
  for select to anon, authenticated using (true);
drop policy if exists demo_permissions_demo_read on public.demo_permissions;
create policy demo_permissions_demo_read on public.demo_permissions
  for select to anon, authenticated using (true);

revoke all on public.workspaces, public.nodes, public.sets, public.products,
  public.product_bibliography, public.persons, public.product_person_roles,
  public.product_images, public.product_voice_notes, public.voice_transcriptions,
  public.price_estimates, public.price_observations, public.sale_transactions,
  public.demo_personas, public.roles, public.role_permissions, public.demo_permissions,
  public.profiles, public.organizations, public.organization_memberships,
  public.pipeline_runs, public.pipeline_run_images, public.pipeline_stage_runs,
  public.pipeline_stage_errors, public.dewey_nodes, public.geo_nodes
  from anon, authenticated;
grant select on public.workspaces, public.nodes, public.sets, public.products,
  public.product_bibliography, public.persons, public.product_person_roles,
  public.product_images, public.product_voice_notes, public.voice_transcriptions,
  public.price_estimates, public.price_observations, public.sale_transactions,
  public.demo_personas, public.roles, public.role_permissions, public.demo_permissions
  to anon, authenticated;

grant all on public.workspaces, public.nodes, public.sets, public.products,
  public.product_bibliography, public.persons, public.product_person_roles,
  public.product_images, public.product_voice_notes, public.voice_transcriptions,
  public.price_estimates, public.price_observations, public.sale_transactions,
  public.demo_personas, public.roles, public.role_permissions, public.demo_permissions,
  public.profiles, public.organizations, public.organization_memberships,
  public.pipeline_runs, public.pipeline_run_images, public.pipeline_stage_runs,
  public.pipeline_stage_errors, public.dewey_nodes, public.geo_nodes
  to service_role;

alter view public.real_effective_permissions set (security_invoker = true);
