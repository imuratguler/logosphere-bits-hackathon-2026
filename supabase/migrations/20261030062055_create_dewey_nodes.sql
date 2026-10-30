-- Logosphere BITS — dewey_nodes reference table.
--
-- Reference headings only. Rows land here solely through the curated
-- transfer (see supabase/transfers/dewey/); AI suggestions are never
-- inserted as verified reference headings — suggestion storage, when
-- it arrives, references these rows from its own table instead. Reads
-- must not present a suggestion row as a verified heading; the tables
-- keep the two apart by construction.
--
-- Shape notes: code is the stable identity (unique, stored verbatim —
-- never normalized on write); names stay nullable so unknown stays
-- null instead of a placeholder; the parent link is a self foreign
-- key resolved from the source during transfer. Source-only columns
-- (fixed numeric ids, digit, depth, dot_after, generation stamps) are
-- not carried over; depth is derivable by walking parents.
-- Deletes stay rejected while products reference a heading (the
-- product link arrives with its own step and holds a plain foreign
-- key here); the transfer itself never deletes.
-- Dataset note: the source file's origin and usage rights are
-- unverified (K73); load data only after clearance. Nothing here
-- claims this is a verified official Dewey catalog.
--
-- normalize_dewey_code strips trailing zeros from the fractional part
-- only ('001.40' -> '001.4', '123.00' -> '123'); integer codes with or
-- without zeros ('0', '00', '100') pass through untouched. It exists
-- for search-time matching, never for rewriting stored codes.

create table public.dewey_nodes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text,
  name_tr text,
  parent_id uuid references public.dewey_nodes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dewey_nodes_parent_id_idx on public.dewey_nodes (parent_id);

create or replace function public.normalize_dewey_code(p_code text)
returns text
language sql
immutable
as $$
  select
    case
      when p_code is null or position('.' in p_code) = 0 then p_code
      else regexp_replace(
        regexp_replace(p_code, '0+$', ''),
        '\.$',
        ''
      )
    end
$$;
