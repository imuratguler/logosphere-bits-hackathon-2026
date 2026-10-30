-- Logosphere BITS — product images, voice notes, transcriptions.
--
-- Persistent product media only. Draft analysis media lives outside
-- these tables: drafts are file-backed and pipeline-scoped, their
-- stage outputs land with the pipeline-run storage (its own step),
-- and promotion creates new persistent rows — never a flag flip on a
-- shared row (the lifecycle split is structural, not a type column).
--
-- Rules enforced:
-- 1. Images attach to exactly one product (ordering rides on
--    sort_order, lower first). Image deletes stay rejected while a
--    voice note exists (SCOPE section 6.4 still open).
-- 2. One current voice note per photo, guarded by a unique constraint
--    on the image link: re-recording updates the same row and bumps
--    the version (currency is the version), it never inserts a second
--    row. Status vocabulary mirrors the mobile transcription states.
-- 3. Transcription text keys to (voice_note_id, version): one text per
--    version, history preserved. Inserts attach to the current voice
--    version only; a transcription's identity never moves.
-- 4. A re-recorded voice never serves its old text: the transition
--    trigger forces status to stale on any version bump, a file change
--    without a version bump is rejected, and versions only move
--    forward. "Current transcription" therefore means the row matching
--    the voice's own version while status is ready; older rows are
--    recognizably stale by version mismatch.
-- Concurrency: the transcription check locks the voice row
-- (SELECT ... FOR UPDATE), so a re-record racing a late text insert
-- serializes and the late insert sees the bumped version.

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  sort_order integer not null default 0,
  file_path text not null,
  mime_type text not null,
  rotation_degrees integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_voice_notes (
  id uuid primary key default gen_random_uuid(),
  product_image_id uuid not null unique references public.product_images (id),
  version integer not null default 1 check (version > 0),
  file_path text not null,
  mime_type text not null,
  duration_sec integer,
  transcription_status text not null default 'none'
    check (transcription_status in ('none', 'pending', 'ready', 'stale', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.voice_transcriptions (
  voice_note_id uuid not null references public.product_voice_notes (id),
  version integer not null,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint voice_transcriptions_pkey primary key (voice_note_id, version)
);

create index product_images_product_id_idx on public.product_images (product_id);

create or replace function public.validate_voice_currency()
returns trigger
language plpgsql
as $$
begin
  if NEW.version < OLD.version then
    raise exception 'voice versions only move forward';
  end if;
  if NEW.file_path is distinct from OLD.file_path
    and NEW.version is not distinct from OLD.version then
    raise exception 're-record must bump version';
  end if;
  if NEW.version is distinct from OLD.version then
    NEW.transcription_status := 'stale';
  end if;
  return NEW;
end;
$$;

drop trigger if exists voice_currency_before_update on public.product_voice_notes;

create trigger voice_currency_before_update
  before update on public.product_voice_notes
  for each row
  execute function public.validate_voice_currency();

create or replace function public.validate_transcription_version()
returns trigger
language plpgsql
as $$
declare
  current_version integer;
begin
  if TG_OP = 'UPDATE' then
    if NEW.voice_note_id is distinct from OLD.voice_note_id
      or NEW.version is distinct from OLD.version then
      raise exception 'transcription identity is immutable; insert a new row';
    end if;
    -- Text corrections stay free at any version.
    return NEW;
  end if;

  select v.version
    into current_version
    from public.product_voice_notes as v
    where v.id = NEW.voice_note_id
    for update;

  if not found then
    -- No voice row: let the foreign key raise the missing-link error.
    return NEW;
  end if;

  if NEW.version <> current_version then
    raise exception 'transcription attaches to the current voice version only';
  end if;

  return NEW;
end;
$$;

drop trigger if exists transcription_version_before_write on public.voice_transcriptions;

create trigger transcription_version_before_write
  before insert or update on public.voice_transcriptions
  for each row
  execute function public.validate_transcription_version();
