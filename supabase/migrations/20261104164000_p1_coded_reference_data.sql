-- Logosphere BITS — P1 coded reference data (AI pipeline contract §03).
--
-- Coded fields stop living as free text only. English labels are the
-- contract; Turkish labels ride along for the kept TR infrastructure.
-- Codes are NEVER reordered: the numbers below are the contract.
--
-- Rules enforced:
-- 1. publication_types is its own table (code 0-19); every other coded
--    value lives in code_dictionary with (category, code) unique.
-- 2. Zero is a VALID value (condition 0 = New); unknown is NULL. No
--    column below carries a default, so nothing silently becomes 0.
-- 3. Additive only: no table/column is dropped, no data deleted. The
--    legacy free-text columns stay until the app reads codes.
-- 4. Backfill maps only confident exact matches (lowercased); anything
--    else stays NULL and is reported, never guessed.
--
-- No triggers: keys, checks, and nullability only.

create table public.publication_types (
  code smallint primary key,
  label_en text not null,
  label_tr text not null
);

comment on table public.publication_types is
  'Logosphere BITS: publication type codes 0-19 (§03 contract, never reordered).';

insert into public.publication_types (code, label_en, label_tr) values
  (0, 'Book', 'Kitap'),
  (1, 'Academic Journal', 'Akademik Dergi'),
  (2, 'Magazine', 'Dergi'),
  (3, 'Periodical', 'Süreli Yayın'),
  (4, 'Encyclopedia', 'Ansiklopedi'),
  (5, 'Dictionary', 'Sözlük'),
  (6, 'Newspaper', 'Gazete'),
  (7, 'Newsletter', 'Bülten'),
  (8, 'Almanac', 'Almanak'),
  (9, 'Fascicle', 'Fasikül'),
  (10, 'Catalog', 'Katalog'),
  (11, 'Thesis', 'Tez'),
  (12, 'Report', 'Rapor'),
  (13, 'Brochure', 'Broşür'),
  (14, 'Booklet', 'Kitapçık'),
  (15, 'Proceedings', 'Bildiriler'),
  (16, 'Album', 'Albüm'),
  (17, 'Atlas', 'Atlas'),
  (18, 'Planner', 'Planlayıcı'),
  (19, 'Set-in-Set', 'Set-içi Set');

create table public.code_dictionary (
  category text not null,
  code smallint not null,
  label_en text not null,
  label_tr text not null,
  constraint code_dictionary_pkey primary key (category, code)
);

comment on table public.code_dictionary is
  'Logosphere BITS: coded reference values by category (§03 contract, never reordered).';

insert into public.code_dictionary (category, code, label_en, label_tr) values
  ('collection_group', 0, 'Single', 'Tekil Yayın'),
  ('collection_group', 1, 'Book Set', 'Kitap Seti'),
  ('collection_group', 2, 'Serial Set', 'Süreli Yayın Seti'),
  ('collection_group', 3, 'Special Set', 'Özel Set'),
  ('person_role', 0, 'Contributor', 'Katkıda Bulunan'),
  ('person_role', 1, 'Author', 'Yazar'),
  ('person_role', 2, 'Prepared', 'Hazırlayan'),
  ('person_role', 3, 'Compiled', 'Derleyen'),
  ('person_role', 4, 'Editor', 'Editör'),
  ('person_role', 5, 'Foreword', 'Önsöz Yazarı'),
  ('person_role', 6, 'Illustrator', 'Resimleyen'),
  ('person_role', 7, 'Photographer', 'Fotoğrafçı'),
  ('person_role', 8, 'Translator', 'Çevirmen'),
  ('person_role', 9, 'Cover Art', 'Kapak Sanatçısı'),
  ('packaging', 0, 'None', 'Yok'),
  ('packaging', 1, 'Shrink Wrap', 'Shrink Ambalaj'),
  ('packaging', 2, 'Slipcase', 'Kaydırmalı Kılıf'),
  ('packaging', 3, 'Clamshell', 'Clamshell Kutu'),
  ('packaging', 4, 'Leather Case', 'Deri Kutu'),
  ('packaging', 5, 'Wooden Box', 'Ahşap Kutu'),
  ('packaging', 6, 'Cloth Box', 'Bez Kutu'),
  ('packaging', 7, 'Acetate Sleeve', 'Asetat Kılıf'),
  ('packaging', 8, 'Presentation Case', 'Sunum Kutusu'),
  ('cover', 0, 'None', 'Yok'),
  ('cover', 1, 'Paperback', 'Karton Kapak'),
  ('cover', 2, 'Hardcover', 'Sert Kapak'),
  ('cover', 3, 'Greyboard', 'Gri Mukavva'),
  ('cover', 4, 'Flexibound', 'Esnek Kapak'),
  ('cover', 5, 'Clothbound', 'Bez Ciltli'),
  ('cover', 6, 'Leatherbound', 'Deri Ciltli'),
  ('cover', 7, 'Spiralbound', 'Spiralli'),
  ('cover', 8, 'Smyth Sewn', 'Smyth Dikişli'),
  ('cover', 9, 'Saddle Stitched', 'Tel Dikişli'),
  ('cover', 10, 'Mounted', 'Monte'),
  ('paper', 0, 'Unspecified', 'Belirtilmemiş'),
  ('paper', 1, 'Premium Offset', 'Premium Ofset'),
  ('paper', 2, 'Bookprint', 'Kitap Baskı Kağıdı'),
  ('paper', 3, 'Newsprint', 'Gazete Kağıdı'),
  ('paper', 4, 'Glossy Coated', 'Parlak Kuşe'),
  ('paper', 5, 'Matte Coated', 'Mat Kuşe'),
  ('paper', 6, 'Bristol Board', 'Bristol Karton'),
  ('paper', 7, 'Tracing', 'Aydınger'),
  ('paper', 8, 'Textured', 'Dokulu'),
  ('paper', 9, 'BOPP Lamination', 'BOPP Kaplama'),
  ('paper', 10, 'Kraft', 'Kraft'),
  ('condition', 0, 'New', 'Yeni'),
  ('condition', 1, 'Poor', 'Kötü'),
  ('condition', 2, 'Fair', 'Orta'),
  ('condition', 3, 'Good', 'İyi'),
  ('condition', 4, 'Very Good', 'Çok İyi'),
  ('condition', 5, 'Like New', 'Yeni Gibi'),
  ('flag', 0, 'False', 'Hayır'),
  ('flag', 1, 'True', 'Evet');

alter table public.product_bibliography
  add column publication_type_code smallint
    references public.publication_types (code),
  add column packaging_code smallint
    check (packaging_code is null or (packaging_code >= 0 and packaging_code <= 8)),
  add column cover_code smallint
    check (cover_code is null or (cover_code >= 0 and cover_code <= 10)),
  add column paper_code smallint
    check (paper_code is null or (paper_code >= 0 and paper_code <= 10)),
  add column condition_code smallint
    check (condition_code is null or (condition_code >= 0 and condition_code <= 5)),
  add column dust_jacket_flag smallint
    check (dust_jacket_flag is null or (dust_jacket_flag >= 0 and dust_jacket_flag <= 1));

comment on column public.product_bibliography.condition_code is
  'Logosphere BITS: 0 = New (valid), NULL = unknown; never default, never guess.';

alter table public.product_person_roles
  add column role_code smallint
    check (role_code is null or (role_code >= 0 and role_code <= 9));

alter table public.collection_details
  add column collection_group_code smallint
    check (collection_group_code is null or (collection_group_code >= 0 and collection_group_code <= 3));

alter table public.product_images
  add column content_tags integer
    check (content_tags is null or content_tags >= 0);

comment on column public.product_images.content_tags is
  'Logosphere BITS: bitmask sum: 1 front cover, 2 boxed set, 4 serial set, 8 special set, 16 back cover, 32 spine, 64 title page, 128 colophon, 256 dedication, 512 music, 1024 video, 2048 other.';

-- Confident exact-match backfill only (snapshot 2026-11-04: 10 rows).
update public.product_bibliography
  set publication_type_code = 0
  where lower(publication_type) = 'book'
    and publication_type_code is null;

update public.product_bibliography
  set cover_code = 2
  where lower(binding) = 'hardcover'
    and cover_code is null;

update public.product_bibliography
  set cover_code = 1
  where lower(binding) = 'paperback'
    and cover_code is null;

alter table public.publication_types enable row level security;
alter table public.code_dictionary enable row level security;

revoke all on public.publication_types from anon, authenticated;
revoke all on public.code_dictionary from anon, authenticated;

grant all on public.publication_types to service_role;
grant all on public.code_dictionary to service_role;

grant select on public.publication_types to anon;
grant select on public.code_dictionary to anon;

drop policy if exists publication_types_anon_read on public.publication_types;
create policy publication_types_anon_read on public.publication_types
  for select to anon
  using (true);

drop policy if exists code_dictionary_anon_read on public.code_dictionary;
create policy code_dictionary_anon_read on public.code_dictionary
  for select to anon
  using (true);
