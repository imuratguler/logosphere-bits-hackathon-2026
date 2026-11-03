// Logosphere BITS — Muse prompt builder tests (Deno).
// Shape checks: the pre-read carries one image part per
// photo, the finalizer embeds the reads, and the price
// prompt summarizes the result — all demanding JSON only.

import { assert, assertEquals } from '@std/assert';
import {
  fldObjMuseResult,
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
    description: 'A demo codex.',
    contributors: [{ name: 'Demo Author', role: 'author' }],
    binding: null,
    dust_jacket: null,
    paper: null,
    dimensions: null,
    condition: 'good',
    signature: null,
    dedication: null,
    description_tr: null,
    description_en: null,
    confidence: null,
    rationale: null,
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
        description: null,
        contributors: [],
        binding: null,
        dust_jacket: null,
        paper: null,
        dimensions: null,
        condition: null,
        signature: null,
        dedication: null,
      },
    ],
    'singleProduct',
  );
  const fldStrText = fldArrMessages[1]!.content as string;
  assert(fldStrText.includes('Codex'));
  assert(fldStrText.includes('confidence'));
  assert(fldStrText.includes('JSON'));
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
  assert(fldStrText.includes('currency'));
});
