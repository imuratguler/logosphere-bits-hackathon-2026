-- P5: price observation provenance.
--
-- price_observations rows already carry the normalized leg
-- (amount/currency), the as-seen leg (source_price /
-- source_currency), the rate date, and the URL. This step
-- adds where the sighting came from and which market it
-- describes, so the review screen can show the basis of the
-- rayic per observation. No data moves; existing rows keep
-- null provenance until a fresh pipeline run saves them.

alter table public.price_observations
  add column if not exists source text;

alter table public.price_observations
  add column if not exists market text
    check (market is null or market in ('new', 'used'));

comment on column public.price_observations.source is
  'Catalog source that showed the price (googlebooks, amazon_tr, kitapyurdu, ...).';
comment on column public.price_observations.market is
  'Which market the sighting describes: new, used, or null when the page says nothing.';
