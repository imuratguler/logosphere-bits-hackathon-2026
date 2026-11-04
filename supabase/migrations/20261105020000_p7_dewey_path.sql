-- Logosphere BITS: keep the verified Dewey root-to-leaf path with the
-- saved bibliography so the reopened product shows the same code and path.

alter table public.product_bibliography
  add column if not exists dewey_path jsonb not null default '[]'::jsonb;

comment on column public.product_bibliography.dewey_path is
  'Logosphere BITS: verified Dewey path nodes [{code, name_en}] root first; empty when unverified.';
