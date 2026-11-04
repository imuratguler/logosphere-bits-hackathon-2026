// Logosphere BITS — Muse prompt builder tests (Deno).
// Shape checks: the pre-read carries one image part per
// photo, the finalizer embeds the reads, and the price
// prompt summarizes the result — all demanding JSON only.

import { assert, assertEquals } from '@std/assert';
import {
  fldObjMuseResult,
  fncConvDuplicateMessages,
  fncConvFinalMessages,
  fncConvPreReadMessages,
  fncConvPricePrompt,
  fncConvTranscribeMessages,
} from './prompts.ts';
import { fldObjMuseAudioPart, fldObjMuseImagePart } from './muse.ts';

function fncConvSeedResult(): fldObjMuseResult {
  return {
    title: 'The Demo Codex',
    subtitle: null,
    isbn10: null,
    isbn13: null,
    publisher: 'Logosphere Press',
    publication_language: 'en',
    edition: null,
    printing: null,
    publication_year: 2026,
    original_publication_year: null,
    page_count: null,
    publication_type: null,
    publication_type_code: null,
    description: 'A demo codex.',
    contributors: [{ name: 'Demo Author', role: 'author', role_code: 1 }],
    binding: null,
    cover_code: null,
    packaging: null,
    packaging_code: null,
    dust_jacket: null,
    dust_jacket_flag: null,
    paper: null,
    paper_code: null,
    dimensions: null,
    condition: 'good',
    condition_code: 3,
    signature: null,
    dedication: null,
    regions: [],
    subjects: [],
    conflicts: [],
    description_tr: null,
    description_en: null,
    confidence: null,
    rationale: null,
    dewey: null,
    dewey_verified: false,
    dewey_title_en: null,
    dewey_parent: null,
    dewey_path: [],
    dewey_path_broken: null,
  };
}

Deno.test('pre-read carries one image part per photo', () => {
  const fldArrMessages = fncConvPreReadMessages(
    ['AAA', 'BBB'],
    'singleProduct',
  );
  assertEquals(fldArrMessages.length, 2);
  const fldObjUser = fldArrMessages[1]!;
  assert(Array.isArray(fldObjUser.content));
  const fldArrImages = (fldObjUser.content as unknown[]).filter(
    (fldObjPart): fldObjPart is fldObjMuseImagePart =>
      typeof fldObjPart === 'object' &&
      fldObjPart !== null &&
      (fldObjPart as { type: string }).type === 'image_url',
  );
  assertEquals(fldArrImages.length, 2);
  assertEquals(
    fldArrImages[0]!.image_url.url,
    'data:image/jpeg;base64,AAA',
  );
});

Deno.test('pre-read separates bulk photos', () => {
  const fldArrMessages = fncConvPreReadMessages(['AAA'], 'multiProduct');
  const fldObjUser = fldArrMessages[1]!;
  const fldStrText = (fldObjUser.content as { text: string }[])[0]!.text;
  assert(fldStrText.includes('OWN publication'));
});

Deno.test('finalizer embeds reads and demands results', () => {
  const fldArrMessages = fncConvFinalMessages(
    [
      {
        title: 'Codex',
        subtitle: null,
        isbn10: null,
        isbn13: null,
        publisher: null,
        publication_language: null,
        edition: null,
        printing: null,
        publication_year: null,
        original_publication_year: null,
        page_count: null,
        publication_type: null,
        publication_type_code: null,
        description: null,
        contributors: [],
        binding: null,
        cover_code: null,
        packaging: null,
        packaging_code: null,
        dust_jacket: null,
        dust_jacket_flag: null,
        paper: null,
        paper_code: null,
        dimensions: null,
        condition: null,
        condition_code: null,
        signature: null,
        dedication: null,
        regions: [],
        subjects: [],
        conflicts: [],
      },
    ],
    'singleProduct',
  );
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('Codex'));
  assert(fldStrText.includes('confidence'));
  assert(fldStrText.includes('JSON'));
});

Deno.test('pre-read asks for regions subjects and conflicts', () => {
  const fldArrMessages = fncConvPreReadMessages(['AAA'], 'singleProduct');
  const fldObjUser = fldArrMessages[1]!;
  const fldStrText = (fldObjUser.content as { text: string }[])[0]!.text;
  assert(fldStrText.includes('regions'));
  assert(fldStrText.includes('subjects'));
  assert(fldStrText.includes('conflicts'));
  assert(fldStrText.includes('never guess an ISBN'));
});

Deno.test('finalizer embeds the catalog packet and dewey', () => {
  const fldArrMessages = fncConvFinalMessages([], 'singleProduct', [], {
    imageOrder: [],
    catalog: [
      {
        image_id: 'img-1',
        record: { title: 'The Demo Codex' },
        source: 'openlibrary',
        reason: null,
        rejected: [{ source: 'googlebooks', reason: 'not-found' }],
      },
    ],
    origins: { title: 'photo_read' },
    emptyFields: ['dewey'],
    conflicts: [],
  });
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('Accepted catalog facts'));
  assert(fldStrText.includes('Rejected/conflicting'));
  assert(fldStrText.includes('Still-empty fields'));
  assert(fldStrText.includes('dewey'));
  assert(fldStrText.includes('never invent an ISBN'));
});

Deno.test('transcribe asks for language and uncertain spans', () => {
  const fldArrMessages = fncConvTranscribeMessages([
    'https://example.test/a.m4a',
  ]);
  const fldObjUser = fldArrMessages[1]!;
  const fldArrParts = fldObjUser.content as { text: string }[];
  const fldStrText = fldArrParts[0]!.text;
  assert(fldStrText.includes('language'));
  assert(fldStrText.includes('uncertain_parts'));
});

Deno.test('transcribe carries one audio part per recording', () => {
  const fldArrMessages = fncConvTranscribeMessages([
    'https://example.test/a.m4a',
    'https://example.test/b.m4a',
  ]);
  assertEquals(fldArrMessages.length, 2);
  const fldObjUser = fldArrMessages[1]!;
  assert(Array.isArray(fldObjUser.content));
  const fldArrParts = fldObjUser.content as unknown[];
  const fldArrAudio = fldArrParts.filter(
    (fldObjPart): fldObjPart is fldObjMuseAudioPart =>
      typeof fldObjPart === 'object' &&
      fldObjPart !== null &&
      (fldObjPart as { type: string }).type === 'audio_url',
  );
  assertEquals(fldArrAudio.length, 2);
  assertEquals(
    fldArrAudio[1]!.audio_url.url,
    'https://example.test/b.m4a',
  );
  const fldStrText = (fldArrParts[0] as { text: string }).text;
  assert(fldStrText.includes('transcripts'));
  assert(fldStrText.includes('null'));
  assert(fldStrText.includes('never invent'));
});

Deno.test('finalizer labels voice text as user declaration', () => {
  const fldArrMessages = fncConvFinalMessages([], 'singleProduct', [
    { image_id: 'img-1', text: 'no pencil marks' },
  ]);
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('User declarations'));
  assert(fldStrText.includes('no pencil marks'));
  assert(fldStrText.includes('unverified'));
});

Deno.test('price prompt summarizes the result in major units', () => {
  const fldArrMessages = fncConvPricePrompt(fncConvSeedResult());
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('The Demo Codex'));
  assert(fldStrText.includes('MAJOR units'));
  assert(fldStrText.includes('US dollars'));
  assert(fldStrText.includes('confidence'));
});

Deno.test('duplicate prompt merges one copy, never two stock items', () => {
  const fldArrMessages = fncConvDuplicateMessages([
    {
      index: 0,
      title: 'Codex',
      isbn13: null,
      publisher: null,
      publication_year: null,
      edition: null,
      binding: null,
      condition: null,
      signature: null,
      dedication: null,
      currency: 'USD',
    },
  ]);
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('SAME physical copy'));
  assert(fldStrText.includes('two stock products'));
  assert(fldStrText.includes('different currencies'));
  assert(fldStrText.includes('signature'));
  assert(fldStrText.includes('Uncertain'));
  assert(fldStrText.includes('groups'));
});
