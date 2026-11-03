// Logosphere BITS — Muse prompt builders (shared).
// Full-schema prompts: the pre-read extracts what the lens
// sees per photo, the finalizer merges photo reads into
// per-item results with translations plus confidence and
// rationale, and the price call estimates used-market bands
// in MAJOR units (the caller converts to minor). Every prompt
// demands JSON only — never prose. Identifiers follow D6.

import type { fldObjMuseMessage, fldObjMusePart } from './muse.ts';

export type fldObjMuseContributor = {
  name: string | null;
  role: string | null;
};

export type fldObjMusePhotoRead = {
  title: string | null;
  subtitle: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher: string | null;
  publication_language: string | null;
  edition: string | null;
  printing: string | null;
  publication_year: number | null;
  original_publication_year: number | null;
  page_count: number | null;
  publication_type: string | null;
  description: string | null;
  contributors: fldObjMuseContributor[];
  binding: string | null;
  dust_jacket: string | null;
  paper: string | null;
  dimensions: string | null;
  condition: string | null;
  signature: string | null;
  dedication: string | null;
};

export type fldObjMuseResult = fldObjMusePhotoRead & {
  description_tr: string | null;
  description_en: string | null;
  confidence: number | null;
  rationale: string | null;
};

export type fldObjMusePriceBands = {
  replacement_new: number | null;
  market_min: number | null;
  market_max: number | null;
  market_median: number | null;
  market_recommended: number | null;
  currency: string | null;
};

const fldStrJsonOnly =
  'Return ONLY a single JSON object, no prose, no fences, no commentary. ' +
  'Unknown fields stay null — never invent values.';

const fldStrSchemaHint =
  'Field names: title, subtitle, isbn10, isbn13, publisher, ' +
  'publication_language (lowercase code such as "en"), edition, printing, ' +
  'publication_year (number), original_publication_year (number), ' +
  'page_count (number), publication_type, description, contributors ' +
  '(array of {name, role}), binding, dust_jacket, paper, dimensions, ' +
  'condition, signature, dedication.';

export function fncConvPreReadMessages(
  fldArrPhotoBase64: string[],
  fldStrMode: 'singleProduct' | 'multiProduct',
): fldObjMuseMessage[] {
  const fldStrTask = fldStrMode === 'singleProduct'
    ? 'All photos show ONE publication from different angles. Read every photo.'
    : 'Each photo shows its OWN publication, in order. Read every photo separately.';
  const fldArrParts: fldObjMusePart[] = [
    {
      type: 'text',
      text:
        `${fldStrTask} Extract exactly what the lens sees. ${fldStrSchemaHint} ` +
        `Answer {"reads": [<one object per photo, same order>]}. ${fldStrJsonOnly}`,
    },
  ];
  for (const fldStrBase64 of fldArrPhotoBase64) {
    fldArrParts.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${fldStrBase64}` },
    });
  }
  return [
    {
      role: 'system',
      content:
        'You are a bibliographic cataloguer for second-hand books and periodicals.',
    },
    { role: 'user', content: fldArrParts },
  ];
}

export type fldObjVoiceDeclaration = {
  image_id: string;
  text: string;
};

export function fncConvFinalMessages(
  fldArrReads: fldObjMusePhotoRead[],
  fldStrMode: 'singleProduct' | 'multiProduct',
  fldArrDeclarations?: fldObjVoiceDeclaration[],
): fldObjMuseMessage[] {
  const fldStrTask = fldStrMode === 'singleProduct'
    ? 'Merge the photo reads into ONE result for the single publication.'
    : 'Turn each photo read into its OWN result, keeping the photo order.';
  const fldStrVoices =
    fldArrDeclarations !== undefined && fldArrDeclarations.length > 0
      ? ` User declarations (unverified speech from the photographer, ` +
        `per image id): ${JSON.stringify(fldArrDeclarations)}. Treat ` +
        `them as claims, not as observed facts.`
      : '';
  return [
    {
      role: 'system',
      content:
        'You are a bibliographic cataloguer for second-hand books and periodicals.',
    },
    {
      role: 'user',
      content: `${fldStrTask} ${fldStrSchemaHint} Add description_tr and ` +
        'description_en (translations of description, null when the ' +
        'description itself is null), confidence (0-1 for the whole ' +
        'result), and rationale (one sentence on what identified the ' +
        `item). Photo reads: ${JSON.stringify(fldArrReads)}.${fldStrVoices} ` +
        `Answer {"results": [<result objects>]}. ${fldStrJsonOnly}`,
    },
  ];
}

export function fncConvTranscribeMessages(
  fldArrAudioUrls: string[],
): fldObjMuseMessage[] {
  const fldArrParts: fldObjMusePart[] = [
    {
      type: 'text',
      text: 'Transcribe the speech in each attached recording, in order, ' +
        'exactly as spoken (user declaration, not a verified fact). ' +
        'Answer {"transcripts": [<one string per recording, same order>]}. ' +
        'An empty or unintelligible recording stays null, never invent ' +
        `words. ${fldStrJsonOnly}`,
    },
  ];
  for (const fldStrUrl of fldArrAudioUrls) {
    fldArrParts.push({ type: 'audio_url', audio_url: { url: fldStrUrl } });
  }
  return [
    {
      role: 'system',
      content: 'You are a verbatim speech transcriber.',
    },
    { role: 'user', content: fldArrParts },
  ];
}

export function fncConvPricePrompt(
  fldObjResult: fldObjMuseResult,
): fldObjMuseMessage[] {
  const fldStrSummary = JSON.stringify({
    title: fldObjResult.title,
    contributors: fldObjResult.contributors,
    publisher: fldObjResult.publisher,
    publication_year: fldObjResult.publication_year,
    edition: fldObjResult.edition,
    condition: fldObjResult.condition,
    binding: fldObjResult.binding,
  });
  return [
    {
      role: 'system',
      content: 'You are a second-hand book pricing assistant.',
    },
    {
      role: 'user',
      content:
        'Estimate second-hand market bands for this publication from your own ' +
        `knowledge (no web access): ${fldStrSummary}. Amounts in MAJOR units ` +
        '(for example 19.99 means nineteen ninety-nine), currency as a ' +
        'three-letter code. Answer {"replacement_new": <new-copy price or null>, ' +
        '"market_min": <low or null>, "market_max": <high or null>, ' +
        '"market_median": <median or null>, "market_recommended": ' +
        `<listing suggestion or null>, "currency": <code>}. ${fldStrJsonOnly}`,
    },
  ];
}
