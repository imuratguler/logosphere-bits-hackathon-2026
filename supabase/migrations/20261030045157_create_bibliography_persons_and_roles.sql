-- Logosphere BITS — bibliography, persons, and product-person roles.
--
-- Normalizes fldObjBibliographicData out of a single record shape into
-- three tables; nothing is squashed into one free-text field:
-- product_bibliography carries the publication facts as individual
-- nullable columns (unknown stays null, never a placeholder);
-- description keeps its four parts (text, original language, TR/EN
-- translations) as separate columns; edition and printing stay
-- separate (baski/nusha readings both survive); condition, signature,
-- and dedication each keep their own column.
--
-- Rules enforced:
-- 1. One bibliography per product: product_id is both primary key and
--    foreign key to products (1:1). Product deletes stay rejected
--    while a bibliography row exists (SCOPE section 6.4 still open).
-- 2. Persons are first-class records reused across products; the name
--    is deliberately not unique (homonyms exist, disambiguation
--    arrives with its own step).
-- 3. Roles ride on the junction: composite primary key
--    (product_id, person_id, role) lets one person take different
--    roles in different products — and several roles in one product.
--    Role stays a free string (open vocabulary, matching the mobile
--    models). Contributor sequence rides on sort_order (lower first).
-- No triggers: all three rules are primary-key, foreign-key, and
-- nullability constraints, so no locking or isolation analysis applies.

create table public.product_bibliography (
  product_id uuid primary key references public.products (id),
  title text,
  subtitle text,
  isbn10 text,
  isbn13 text,
  publisher text,
  publication_language text,
  edition text,
  printing text,
  publication_year integer,
  original_publication_year integer,
  page_count integer,
  publication_type text,
  description_text text,
  description_original_language text,
  description_text_tr text,
  description_text_en text,
  binding text,
  dust_jacket text,
  paper text,
  dimensions text,
  condition text,
  signature text,
  dedication text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_person_roles (
  product_id uuid not null references public.products (id),
  person_id uuid not null references public.persons (id),
  role text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_person_roles_pkey primary key (product_id, person_id, role)
);

create index persons_name_idx on public.persons (name);
create index product_person_roles_person_id_idx on public.product_person_roles (person_id);
