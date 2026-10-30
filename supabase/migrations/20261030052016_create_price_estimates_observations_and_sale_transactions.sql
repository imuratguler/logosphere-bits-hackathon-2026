-- Logosphere BITS — price estimates, observations, sale transactions.
--
-- Pricing facts stay separated the way the mobile types do: AI
-- suggestions in price_estimates, grounded market sightings in
-- price_observations, and the user's own listing moves in
-- sale_transactions. Nothing is squashed into a shared row or a
-- free-text blob — a tag change is a new ledger row, so it cannot
-- touch AI advice by construction.
--
-- Rules enforced:
-- 1. One subject per row: every table links to exactly one of
--    product/set/collection (num_nonnulls = 1). Collection links reuse
--    the collection-kind trigger (must point at collection-kind nodes).
-- 2. Money matches the types: minor-unit bigint amounts, unknown is
--    null, zero and negatives are rejected by check constraints.
--    Base currency is required on estimates; the observed currency is
--    required on observations. Conversion audit rides on
--    source_price/source_currency/rate_date, mirroring the mobile
--    pricing group (partial trails stay allowed, as in the types).
-- 3. Traceable effects: sale_transactions is append-only; each row
--    snapshots the resulting listing state (tag price, active flag,
--    scope, time), so the full effect history per subject reads back
--    in time order. Current listing means the latest row.
-- 4. AI advice survives user edits: estimates live in their own
--    append-only table; tag changes land in the ledger and share no
--    row with them.
-- No lease analysis applies: all three tables are insert-only in
-- practice (no per-subject unique row to race on).

create table public.price_estimates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id),
  set_id uuid references public.sets (id),
  collection_id uuid references public.nodes (id),
  replacement_new bigint check (replacement_new is null or replacement_new > 0),
  market_min bigint check (market_min is null or market_min > 0),
  market_max bigint check (market_max is null or market_max > 0),
  market_recommended bigint check (market_recommended is null or market_recommended > 0),
  market_median bigint check (market_median is null or market_median > 0),
  currency text not null,
  price_basis text check (price_basis in ('estimate', 'evidence')),
  source_price bigint check (source_price is null or source_price > 0),
  source_currency text,
  rate_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_estimates_single_subject check (
    num_nonnulls(product_id, set_id, collection_id) = 1
  )
);

create table public.price_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id),
  set_id uuid references public.sets (id),
  collection_id uuid references public.nodes (id),
  amount bigint not null check (amount > 0),
  currency text not null,
  observed_at timestamptz,
  url text,
  source_price bigint check (source_price is null or source_price > 0),
  source_currency text,
  rate_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_observations_single_subject check (
    num_nonnulls(product_id, set_id, collection_id) = 1
  )
);

create table public.sale_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id),
  set_id uuid references public.sets (id),
  collection_id uuid references public.nodes (id),
  tag_price bigint check (tag_price is null or tag_price > 0),
  is_active boolean not null,
  transaction_scope text,
  transaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_transactions_single_subject check (
    num_nonnulls(product_id, set_id, collection_id) = 1
  )
);

create index price_estimates_product_id_idx on public.price_estimates (product_id);
create index price_estimates_set_id_idx on public.price_estimates (set_id);
create index price_estimates_collection_id_idx on public.price_estimates (collection_id);
create index price_observations_product_id_idx on public.price_observations (product_id);
create index price_observations_set_id_idx on public.price_observations (set_id);
create index price_observations_collection_id_idx on public.price_observations (collection_id);
create index sale_transactions_product_id_idx on public.sale_transactions (product_id);
create index sale_transactions_set_id_idx on public.sale_transactions (set_id);
create index sale_transactions_collection_id_idx on public.sale_transactions (collection_id);

drop trigger if exists price_estimates_collection_before_write on public.price_estimates;

create trigger price_estimates_collection_before_write
  before insert or update of collection_id on public.price_estimates
  for each row
  execute function public.validate_collection_link('price estimate');

drop trigger if exists price_observations_collection_before_write on public.price_observations;

create trigger price_observations_collection_before_write
  before insert or update of collection_id on public.price_observations
  for each row
  execute function public.validate_collection_link('price observation');

drop trigger if exists sale_transactions_collection_before_write on public.sale_transactions;

create trigger sale_transactions_collection_before_write
  before insert or update of collection_id on public.sale_transactions
  for each row
  execute function public.validate_collection_link('sale transaction');
