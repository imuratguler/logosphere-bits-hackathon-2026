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
  role_code: number | null;
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
  publication_type_code: number | null;
  description: string | null;
  contributors: fldObjMuseContributor[];
  binding: string | null;
  cover_code: number | null;
  packaging: string | null;
  packaging_code: number | null;
  dust_jacket: string | null;
  dust_jacket_flag: number | null;
  paper: string | null;
  paper_code: number | null;
  dimensions: string | null;
  condition: string | null;
  condition_code: number | null;
  signature: string | null;
  dedication: string | null;
  regions: string[];
  subjects: string[];
  conflicts: string[];
};

export type fldObjMuseResult = fldObjMusePhotoRead & {
  description_tr: string | null;
  description_en: string | null;
  confidence: number | null;
  rationale: string | null;
  dewey: string | null;
  dewey_verified: boolean;
  dewey_title_en: string | null;
  dewey_parent: string | null;
  dewey_path: { code: string; name_en: string }[];
  dewey_path_broken: 'missing-parent' | 'cycle' | null;
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
  'condition, packaging, signature, dedication.';

// §03 coded fields must use these exact English labels (or
// null when the evidence does not support any of them).
const fldStrCodeHint =
  'Coded labels (exact text or null): publication_type is one of Book, ' +
  'Academic Journal, Magazine, Periodical, Encyclopedia, Dictionary, ' +
  'Newspaper, Newsletter, Almanac, Fascicle, Catalog, Thesis, Report, ' +
  'Brochure, Booklet, Proceedings, Album, Atlas, Planner, Set-in-Set; ' +
  'contributor role is one of Contributor, Author, Prepared, Compiled, ' +
  'Editor, Foreword, Illustrator, Photographer, Translator, Cover Art; ' +
  'binding is one of None, Paperback, Hardcover, Greyboard, Flexibound, ' +
  'Clothbound, Leatherbound, Spiralbound, Smyth Sewn, Saddle Stitched, ' +
  'Mounted; paper is one of Unspecified, Premium Offset, Bookprint, ' +
  'Newsprint, Glossy Coated, Matte Coated, Bristol Board, Tracing, ' +
  'Textured, BOPP Lamination, Kraft; condition is one of New, Poor, ' +
  'Fair, Good, Very Good, Like New; packaging is one of None, Shrink Wrap, ' +
  'Slipcase, Clamshell, Leather Case, Wooden Box, Cloth Box, Acetate ' +
  'Sleeve, Presentation Case.';

const fldStrRegionHint =
  'Also return regions (evidence zones actually visible, each one of: ' +
  'front_cover, back_cover, spine, title_page, colophon, dedication, other), ' +
  'subjects (one short description per DISTINCT publication visible in the ' +
  'photo — more than one when several publications share the frame, with ' +
  'the region each belongs to), and conflicts (what the catalog step must ' +
  'verify: uncertain readings, contradictions between zones, glare or ' +
  'shadow doubt). Never report camera glare, shadow, or dust as damage; ' +
  'never fill an unseen condition with a firm value; never guess an ISBN.';

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
        `${fldStrRegionHint} ` +
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

export type fldObjFinalPacket = {
  imageOrder: {
    image_id: string;
    sort_order: number;
    mime_type: string;
    has_voice: boolean;
  }[];
  catalog: {
    image_id: string;
    record: unknown;
    source: string | null;
    reason: string | null;
    rejected: { source: string; reason: string }[];
  }[];
  origins: Record<string, string>;
  emptyFields: string[];
  conflicts: { image_id: string; conflicts: string[] }[];
};

export function fncConvFinalMessages(
  fldArrReads: fldObjMusePhotoRead[],
  fldStrMode: 'singleProduct' | 'multiProduct',
  fldArrDeclarations?: fldObjVoiceDeclaration[],
  fldObjPacket?: fldObjFinalPacket,
): fldObjMuseMessage[] {
  const fldStrTask = fldStrMode === 'singleProduct'
    ? 'Merge the photo reads into ONE result for the single publication.'
    : 'Turn each photo read into its OWN result, keeping the photo order.';
  const fldStrVoices =
    fldArrDeclarations !== undefined && fldArrDeclarations.length > 0
      ? ` User declarations (unverified speech from the photographer, ` +
        `per image id): ${JSON.stringify(fldArrDeclarations)}. Treat ` +
        `them as claims, not as observed facts: condition claims ` +
        `(scratches, pencil marks, cleanliness) inform the condition ` +
        `field only, and the rationale must label them as user claims. ` +
        `A declaration NEVER overrides a visible ISBN or colophon text, ` +
        `and NEVER applies to another image's product.`
      : '';
  const fldStrPacket = fldObjPacket === undefined
    ? ''
    : ` Accepted catalog facts (verified web records, per image): ` +
      `${JSON.stringify(fldObjPacket.catalog)}. ` +
      `Rejected/conflicting candidates are listed per image with reasons; ` +
      `explain in the rationale which source won and why. ` +
      `Per-field origins so far: ${JSON.stringify(fldObjPacket.origins)}. ` +
      `Still-empty fields to complete when evidence allows: ` +
      `${JSON.stringify(fldObjPacket.emptyFields)}. ` +
      `Photo order and capture: ${JSON.stringify(fldObjPacket.imageOrder)}. ` +
      `Open verification conflicts: ${
        JSON.stringify(fldObjPacket.conflicts)
      }. ` +
      `Fill only empty fields, keep copy-specific details (condition, ` +
      `signature, dedication, dust_jacket) separate from catalog facts, ` +
      `and never invent an ISBN, a URL, or a firm price. ` +
      `When a catalog record carries dewey, binding, paper, or dimensions, ` +
      `use those hints for the same fields (a catalog dewey is still ` +
      `reference-checked server-side; keep an unverifiable suggestion in ` +
      `dewey and null when nothing supports it).`;
  return [
    {
      role: 'system',
      content:
        'You are a bibliographic cataloguer for second-hand books and periodicals.',
    },
    {
      role: 'user',
      content:
        `${fldStrTask} ${fldStrSchemaHint} ${fldStrCodeHint} Add description_tr and ` +
        'description_en (translations of description, null when the ' +
        'description itself is null), confidence (0-1 for the whole ' +
        'result), rationale (one sentence on what identified the ' +
        'item), and dewey (a Dewey Decimal suggestion such as "813.54", ' +
        'null when unsure — it is verified separately and never ' +
        `counts as a reference fact). Photo reads: ${
          JSON.stringify(fldArrReads)
        }.` +
        `${fldStrVoices}${fldStrPacket} ` +
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
        'Answer {"transcripts": [<one object per recording, same order: ' +
        '{text (string or null), language (lowercase code or null), ' +
        'uncertain_parts (unclear spans, never invented words)}>]}. ' +
        'An empty or unintelligible recording stays {text: null}, never ' +
        `invent words. ${fldStrJsonOnly}`,
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

export type fldObjDuplicateCandidate = {
  index: number;
  title: string | null;
  isbn13: string | null;
  publisher: string | null;
  publication_year: number | null;
  edition: string | null;
  binding: string | null;
  condition: string | null;
  signature: string | null;
  dedication: string | null;
  currency: string;
};

export function fncConvDuplicateMessages(
  fldArrCandidates: fldObjDuplicateCandidate[],
): fldObjMuseMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a second-hand cataloguer merging duplicate listings.',
    },
    {
      role: 'user',
      content: 'Group the candidates that are the SAME physical copy ' +
        'photographed more than once (complementary views — cover, ' +
        'spine, back, colophon — of one item). The same ISBN on two ' +
        'separately photographed items means two stock products: ' +
        'never group them. Never group different editions, ' +
        'different currencies, or copies whose signature or ' +
        'dedication disagree. Uncertain candidates stay ungrouped. ' +
        `Candidates: ${JSON.stringify(fldArrCandidates)}. ` +
        'Answer {"groups": [{"members": [<candidate indexes>], ' +
        '"reason": <one sentence>, "confidence": <0-1>}]}. ' +
        `${fldStrJsonOnly}`,
    },
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
        `knowledge (no web access, no live sales source): ${fldStrSummary}. ` +
        'Amounts in MAJOR units in US dollars (for example 19.99 means ' +
        'nineteen ninety-nine dollars); currency is always USD. Answer ' +
        '{"replacement_new": <new-copy price or null>, "market_min": ' +
        '<low or null>, "market_max": <high or null>, "market_median": ' +
        '<median or null>, "market_recommended": <listing suggestion or ' +
        'null>, "currency": "USD", "confidence": <0-1 for this knowledge ' +
        `estimate>}. ${fldStrJsonOnly}`,
    },
  ];
}
