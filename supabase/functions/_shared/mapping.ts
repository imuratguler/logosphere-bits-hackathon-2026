// Logosphere BITS — Muse answer mapping (shared).
// Pure sanitizers from Muse JSON to BITS rows: blank strings
// become null (unknown is never an empty placeholder), years
// stay in a sane range, ISBNs normalize to digits/X, prices
// convert major to minor units, and currencies normalize to
// three-letter codes with USD fallback. Identifiers follow D6.

import type {
  fldObjMuseContributor,
  fldObjMusePhotoRead,
  fldObjMusePriceBands,
  fldObjMuseResult,
} from './prompts.ts';
import {
  fncConvConditionCode,
  fncConvCoverCode,
  fncConvFlagCode,
  fncConvPackagingCode,
  fncConvPaperCode,
  fncConvPersonRoleCode,
  fncConvPublicationTypeCode,
} from './codes.ts';
import { fncConvNormalizeDewey } from './dewey.ts';

export function fncConvCleanText(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrTrimmed = fldObjValue.trim();
  return fldStrTrimmed === '' ? null : fldStrTrimmed;
}

export function fncConvCleanYear(fldObjValue: unknown): number | null {
  if (typeof fldObjValue !== 'number' || !Number.isInteger(fldObjValue)) {
    return null;
  }
  if (fldObjValue < 1000 || fldObjValue > 2100) {
    return null;
  }
  return fldObjValue;
}

export function fncConvCleanCount(fldObjValue: unknown): number | null {
  if (typeof fldObjValue !== 'number' || !Number.isInteger(fldObjValue)) {
    return null;
  }
  if (fldObjValue < 0 || fldObjValue > 100000) {
    return null;
  }
  return fldObjValue;
}

export function fncConvCleanTranscript(fldObjValue: unknown): string | null {
  return fncConvCleanText(fldObjValue);
}

export type fldObjTranscriptRow = {
  text: string | null;
  language: string | null;
  uncertain_parts: string[];
};

export function fncConvCleanTranscriptRow(
  fldObjValue: unknown,
): fldObjTranscriptRow {
  if (typeof fldObjValue === 'string' || fldObjValue === null) {
    return {
      text: fncConvCleanText(fldObjValue),
      language: null,
      uncertain_parts: [],
    };
  }
  if (typeof fldObjValue !== 'object') {
    return { text: null, language: null, uncertain_parts: [] };
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldArrUncertain: string[] = [];
  if (Array.isArray(fldObjRow.uncertain_parts)) {
    for (const fldObjPart of fldObjRow.uncertain_parts.slice(0, 12)) {
      const fldStrPart = fncConvCleanText(fldObjPart);
      if (fldStrPart !== null) {
        fldArrUncertain.push(fldStrPart);
      }
    }
  }
  return {
    text: fncConvCleanText(fldObjRow.text),
    language: fncConvCleanText(fldObjRow.language),
    uncertain_parts: fldArrUncertain,
  };
}

export function fncConvCleanIsbn(fldObjValue: unknown): string | null {
  const fldStrText = fncConvCleanText(fldObjValue);
  if (fldStrText === null) {
    return null;
  }
  const fldStrDigits = fldStrText.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (
    fldStrDigits !== '' &&
    (fldStrDigits.length === 10 || fldStrDigits.length === 13)
  ) {
    return fldStrDigits;
  }
  return null;
}

export function fncConvIsbnChecksumValid(fldStrIsbn: string): boolean {
  if (/^\d{13}$/.test(fldStrIsbn)) {
    let fldNumSum = 0;
    for (let fldNumAt = 0; fldNumAt < 12; fldNumAt += 1) {
      fldNumSum += Number(fldStrIsbn[fldNumAt]) * (fldNumAt % 2 === 0 ? 1 : 3);
    }
    return (10 - (fldNumSum % 10)) % 10 === Number(fldStrIsbn[12]);
  }
  if (/^\d{9}[\dX]$/.test(fldStrIsbn)) {
    let fldNumSum = 0;
    for (let fldNumAt = 0; fldNumAt < 9; fldNumAt += 1) {
      fldNumSum += Number(fldStrIsbn[fldNumAt]) * (10 - fldNumAt);
    }
    fldNumSum += fldStrIsbn[9] === 'X' ? 10 : Number(fldStrIsbn[9]);
    return fldNumSum % 11 === 0;
  }
  return false;
}

export function fncConvCleanIsbnStrict(fldObjValue: unknown): string | null {
  const fldStrIsbn = fncConvCleanIsbn(fldObjValue);
  if (fldStrIsbn === null || !fncConvIsbnChecksumValid(fldStrIsbn)) {
    return null;
  }
  return fldStrIsbn;
}

export function fncConvIsbn10To13(fldStrIsbn10: string): string | null {
  if (
    !/^\d{9}[\dX]$/.test(fldStrIsbn10) ||
    !fncConvIsbnChecksumValid(fldStrIsbn10)
  ) {
    return null;
  }
  const fldStrCore = `978${fldStrIsbn10.slice(0, 9)}`;
  let fldNumSum = 0;
  for (let fldNumAt = 0; fldNumAt < 12; fldNumAt += 1) {
    fldNumSum += Number(fldStrCore[fldNumAt]) * (fldNumAt % 2 === 0 ? 1 : 3);
  }
  return `${fldStrCore}${(10 - (fldNumSum % 10)) % 10}`;
}

export function fncConvIsbn13To10(fldStrIsbn13: string): string | null {
  if (
    !/^\d{13}$/.test(fldStrIsbn13) || !fldStrIsbn13.startsWith('978') ||
    !fncConvIsbnChecksumValid(fldStrIsbn13)
  ) {
    return null;
  }
  const fldStrCore = fldStrIsbn13.slice(3, 12);
  let fldNumSum = 0;
  for (let fldNumAt = 0; fldNumAt < 9; fldNumAt += 1) {
    fldNumSum += Number(fldStrCore[fldNumAt]) * (10 - fldNumAt);
  }
  const fldNumCheck = (11 - (fldNumSum % 11)) % 11;
  return `${fldStrCore}${fldNumCheck === 10 ? 'X' : fldNumCheck}`;
}

export function fncConvCleanCode(
  fldObjValue: unknown,
  fldNumMin: number,
  fldNumMax: number,
): number | null {
  if (
    typeof fldObjValue !== 'number' || !Number.isInteger(fldObjValue) ||
    fldObjValue < fldNumMin || fldObjValue > fldNumMax
  ) {
    return null;
  }
  return fldObjValue;
}

export function fncConvCleanContributors(
  fldObjValue: unknown,
): fldObjMuseContributor[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrClean: fldObjMuseContributor[] = [];
  for (const fldObjEntry of fldObjValue) {
    if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
      continue;
    }
    const fldObjRow = fldObjEntry as Record<string, unknown>;
    const fldStrName = fncConvCleanText(fldObjRow.name);
    if (fldStrName === null) {
      continue;
    }
    fldArrClean.push({
      name: fldStrName,
      role: fncConvCleanText(fldObjRow.role),
      role_code: fncConvPersonRoleCode(fldObjRow.role),
    });
  }
  return fldArrClean;
}

export function fncConvCleanPhotoRead(
  fldObjValue: unknown,
): fldObjMusePhotoRead {
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : {};
  return {
    title: fncConvCleanText(fldObjRow.title),
    subtitle: fncConvCleanText(fldObjRow.subtitle),
    isbn10: fncConvCleanIsbn(fldObjRow.isbn10),
    isbn13: fncConvCleanIsbn(fldObjRow.isbn13),
    publisher: fncConvCleanText(fldObjRow.publisher),
    publication_language: fncConvCleanText(fldObjRow.publication_language),
    edition: fncConvCleanText(fldObjRow.edition),
    printing: fncConvCleanText(fldObjRow.printing),
    publication_year: fncConvCleanYear(fldObjRow.publication_year),
    original_publication_year: fncConvCleanYear(
      fldObjRow.original_publication_year,
    ),
    page_count: fncConvCleanCount(fldObjRow.page_count),
    publication_type: fncConvCleanText(fldObjRow.publication_type),
    publication_type_code: fncConvPublicationTypeCode(
      fldObjRow.publication_type,
    ),
    description: fncConvCleanText(fldObjRow.description),
    contributors: fncConvCleanContributors(fldObjRow.contributors),
    binding: fncConvCleanText(fldObjRow.binding),
    cover_code: fncConvCoverCode(fldObjRow.binding),
    packaging: fncConvCleanText(fldObjRow.packaging),
    packaging_code: fncConvPackagingCode(fldObjRow.packaging),
    dust_jacket: fncConvCleanText(fldObjRow.dust_jacket),
    dust_jacket_flag: fncConvFlagCode(fldObjRow.dust_jacket),
    paper: fncConvCleanText(fldObjRow.paper),
    paper_code: fncConvPaperCode(fldObjRow.paper),
    dimensions: fncConvCleanText(fldObjRow.dimensions),
    condition: fncConvCleanText(fldObjRow.condition),
    condition_code: fncConvConditionCode(fldObjRow.condition),
    signature: fncConvCleanText(fldObjRow.signature),
    dedication: fncConvCleanText(fldObjRow.dedication),
    regions: fncConvCleanRegions(fldObjRow.regions),
    subjects: fncConvCleanTextList(fldObjRow.subjects, 8),
    conflicts: fncConvCleanTextList(fldObjRow.conflicts, 8),
  };
}

const fldArrRegionZones = [
  'front_cover',
  'back_cover',
  'spine',
  'title_page',
  'colophon',
  'dedication',
  'other',
];

export function fncConvCleanTextList(
  fldObjValue: unknown,
  fldNumMax: number,
): string[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrOut: string[] = [];
  for (const fldObjEntry of fldObjValue.slice(0, fldNumMax)) {
    const fldStrText = fncConvCleanText(fldObjEntry);
    if (fldStrText !== null) {
      fldArrOut.push(fldStrText);
    }
  }
  return fldArrOut;
}

export function fncConvCleanRegions(fldObjValue: unknown): string[] {
  return fncConvCleanTextList(fldObjValue, 12).filter((fldStrZone) =>
    fldArrRegionZones.includes(fldStrZone)
  );
}

export function fncConvCleanResult(fldObjValue: unknown): fldObjMuseResult {
  const fldObjRead = fncConvCleanPhotoRead(fldObjValue);
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : {};
  const fldObjConfidence = fldObjRow.confidence;
  return {
    ...fldObjRead,
    description_tr: fncConvCleanText(fldObjRow.description_tr),
    description_en: fncConvCleanText(fldObjRow.description_en),
    confidence: typeof fldObjConfidence === 'number' &&
        fldObjConfidence >= 0 &&
        fldObjConfidence <= 1
      ? fldObjConfidence
      : null,
    rationale: fncConvCleanText(fldObjRow.rationale),
    dewey: fncConvNormalizeDewey(fldObjRow.dewey),
    dewey_verified: false,
    dewey_title_en: null,
    dewey_parent: null,
    dewey_path: [],
    dewey_path_broken: null,
  };
}

export function fncConvValidateResultCount(
  fldObjValue: unknown,
  fldNumExpected: number,
): Record<string, unknown>[] {
  if (!Array.isArray(fldObjValue) || fldObjValue.length !== fldNumExpected) {
    throw new Error(
      `Logosphere BITS: result count mismatch (expected ${fldNumExpected}).`,
    );
  }
  return fldObjValue as Record<string, unknown>[];
}

export type fldObjFieldOrigin = {
  field: string;
  origin:
    | 'photo_read'
    | 'voice_claim'
    | 'voice_transcript'
    | 'catalog_record'
    | 'catalog_rejected'
    | 'ai_fill'
    | 'user_note';
  detail: Record<string, unknown>;
};

const fldArrCopyFields = [
  'condition',
  'signature',
  'dedication',
  'dust_jacket',
];

export function fncConvFieldOrigins(
  fldObjRead: fldObjMusePhotoRead,
  fldObjCatalog: {
    title: string | null;
    publishers: string[];
    publish_year: number | null;
    pages: number | null;
  } | null,
  fldStrVoiceText: string | null,
  fldObjResult: fldObjMuseResult,
): fldObjFieldOrigin[] {
  const fldArrOut: fldObjFieldOrigin[] = [];
  const fldArrFields: (keyof fldObjMusePhotoRead)[] = [
    'title',
    'subtitle',
    'isbn10',
    'isbn13',
    'publisher',
    'publication_language',
    'edition',
    'printing',
    'publication_year',
    'original_publication_year',
    'page_count',
    'publication_type',
    'description',
    'binding',
    'dust_jacket',
    'paper',
    'dimensions',
    'condition',
    'signature',
    'dedication',
  ];
  for (const fldStrField of fldArrFields) {
    const fldObjValue = fldObjResult[fldStrField];
    if (
      fldObjValue === null || fldObjValue === undefined || fldObjValue === ''
    ) {
      continue;
    }
    if (fldObjRead[fldStrField] === fldObjValue) {
      fldArrOut.push({ field: fldStrField, origin: 'photo_read', detail: {} });
      continue;
    }
    if (
      fldObjCatalog !== null &&
      ((fldStrField === 'title' && fldObjCatalog.title === fldObjValue) ||
        (fldStrField === 'publisher' &&
          fldObjCatalog.publishers.includes(fldObjValue as string)) ||
        (fldStrField === 'publication_year' &&
          fldObjCatalog.publish_year === fldObjValue) ||
        (fldStrField === 'page_count' && fldObjCatalog.pages === fldObjValue))
    ) {
      fldArrOut.push({
        field: fldStrField,
        origin: 'catalog_record',
        detail: {},
      });
      continue;
    }
    if (
      fldStrVoiceText !== null && fldStrVoiceText !== '' &&
      fldArrCopyFields.includes(fldStrField)
    ) {
      fldArrOut.push({
        field: fldStrField,
        origin: 'voice_claim',
        detail: {},
      });
      continue;
    }
    fldArrOut.push({ field: fldStrField, origin: 'ai_fill', detail: {} });
  }
  if (fldObjResult.contributors.length > 0) {
    const fldArrReadNames = fldObjRead.contributors.map(
      (fldObjPerson) => fldObjPerson.name,
    );
    const fldBooAllRead = fldObjResult.contributors.every((fldObjPerson) =>
      fldObjPerson.name !== null && fldArrReadNames.includes(fldObjPerson.name)
    );
    fldArrOut.push({
      field: 'contributors',
      origin: fldBooAllRead ? 'photo_read' : 'ai_fill',
      detail: {},
    });
  }
  return fldArrOut;
}

export function fncConvCleanCurrency(fldObjValue: unknown): string {
  const fldStrText = fncConvCleanText(fldObjValue);
  if (fldStrText === null) {
    return 'USD';
  }
  const fldStrUpper = fldStrText.toUpperCase();
  if (fldStrUpper === 'TL') {
    return 'TRY';
  }
  if (/^[A-Z]{3}$/.test(fldStrUpper)) {
    return fldStrUpper;
  }
  return 'USD';
}

export function fncConvMajorToMinor(fldObjValue: unknown): number | null {
  if (typeof fldObjValue !== 'number' || !Number.isFinite(fldObjValue)) {
    return null;
  }
  if (fldObjValue < 0 || fldObjValue > 100000000) {
    return null;
  }
  return Math.round(fldObjValue * 100);
}

export type fldObjMinorPriceBands = {
  replacement_new: number | null;
  market_min: number | null;
  market_max: number | null;
  market_median: number | null;
  market_recommended: number | null;
  currency: string;
  confidence: number | null;
  basis: 'ai-estimate';
};

export function fncConvCleanConfidence(
  fldObjValue: unknown,
  fldNumCap = 1,
): number | null {
  if (
    typeof fldObjValue !== 'number' || !Number.isFinite(fldObjValue) ||
    fldObjValue < 0 || fldObjValue > 1
  ) {
    return null;
  }
  return Math.min(fldObjValue, fldNumCap);
}

export function fncConvCleanPriceBands(
  fldObjValue: unknown,
): fldObjMinorPriceBands {
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : ({} as Record<string, unknown>);
  const fldObjBands = fldObjRow as Partial<fldObjMusePriceBands> & {
    currency?: unknown;
    confidence?: unknown;
  };
  return {
    replacement_new: fncConvMajorToMinor(fldObjBands.replacement_new),
    market_min: fncConvMajorToMinor(fldObjBands.market_min),
    market_max: fncConvMajorToMinor(fldObjBands.market_max),
    market_median: fncConvMajorToMinor(fldObjBands.market_median),
    market_recommended: fncConvMajorToMinor(fldObjBands.market_recommended),
    currency: fncConvCleanCurrency(fldObjBands.currency),
    confidence: fncConvCleanConfidence(fldObjBands.confidence, 0.5),
    basis: 'ai-estimate',
  };
}

export function fncConvMedianMinor(
  fldArrValues: (number | null)[],
): number | null {
  const fldArrKnown = fldArrValues.filter(
    (fldObjValue): fldObjValue is number => typeof fldObjValue === 'number',
  ).sort((fldNumLeft, fldNumRight) => fldNumLeft - fldNumRight);
  if (fldArrKnown.length === 0) {
    return null;
  }
  const fldNumMid = Math.floor(fldArrKnown.length / 2);
  if (fldArrKnown.length % 2 === 1) {
    return fldArrKnown[fldNumMid]!;
  }
  return Math.round(
    (fldArrKnown[fldNumMid - 1]! + fldArrKnown[fldNumMid]!) / 2,
  );
}

export type fldObjDuplicateGroup = {
  members: number[];
  reason: string | null;
  confidence: number | null;
};

export function fncConvCleanDuplicateGroups(
  fldObjValue: unknown,
  fldNumCandidates: number,
): fldObjDuplicateGroup[] {
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : {};
  const fldObjGroups = fldObjRow['groups'];
  if (!Array.isArray(fldObjGroups)) {
    return [];
  }
  const fldArrOut: fldObjDuplicateGroup[] = [];
  const fldObjSeen = new Set<number>();
  for (const fldObjEntry of fldObjGroups) {
    if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
      continue;
    }
    const fldObjGroup = fldObjEntry as Record<string, unknown>;
    const fldObjMembers = fldObjGroup['members'];
    if (!Array.isArray(fldObjMembers)) {
      continue;
    }
    const fldArrMembers: number[] = [];
    for (const fldObjIndex of fldObjMembers) {
      if (
        typeof fldObjIndex !== 'number' ||
        !Number.isInteger(fldObjIndex) ||
        fldObjIndex < 0 ||
        fldObjIndex >= fldNumCandidates ||
        fldObjSeen.has(fldObjIndex)
      ) {
        continue;
      }
      fldObjSeen.add(fldObjIndex);
      fldArrMembers.push(fldObjIndex);
    }
    if (fldArrMembers.length < 2) {
      for (const fldNumIndex of fldArrMembers) {
        fldObjSeen.delete(fldNumIndex);
      }
      continue;
    }
    fldArrOut.push({
      members: fldArrMembers.sort((fldNumLeft, fldNumRight) =>
        fldNumLeft - fldNumRight
      ),
      reason: fncConvCleanText(fldObjGroup['reason']),
      confidence: fncConvCleanConfidence(fldObjGroup['confidence']),
    });
  }
  return fldArrOut;
}
