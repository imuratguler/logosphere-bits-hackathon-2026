-- Logosphere BITS — P4 Dewey storage + transcript detail columns.
--
-- Dewey keeps its code plus its source: 'reference' for a
-- dewey_nodes-verified code, 'ai-uncertain' for an unverified
-- AI suggestion that must never pose as a reference fact.
-- Transcripts keep language, failure text, and uncertain
-- spans next to the text (§05).
--
-- Additive only: existing tables and rows untouched.
--
-- No triggers: keys and checks only.

alter table public.product_bibliography
  add column dewey_code text,
  add column dewey_source text
    check (dewey_source is null or dewey_source in ('reference', 'ai-uncertain'));

comment on column public.product_bibliography.dewey_source is
  'Logosphere BITS: reference = dewey_nodes-verified; ai-uncertain = unverified AI suggestion.';

alter table public.voice_transcriptions
  add column language text,
  add column error text,
  add column uncertain_parts jsonb not null default '[]'::jsonb;

comment on column public.voice_transcriptions.uncertain_parts is
  'Logosphere BITS: unclear spans the transcriber flagged, never invented.';
