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
    description: fncConvCleanText(fldObjRow.description),
    contributors: fncConvCleanContributors(fldObjRow.contributors),
    binding: fncConvCleanText(fldObjRow.binding),
    dust_jacket: fncConvCleanText(fldObjRow.dust_jacket),
    paper: fncConvCleanText(fldObjRow.paper),
    dimensions: fncConvCleanText(fldObjRow.dimensions),
    condition: fncConvCleanText(fldObjRow.condition),
    signature: fncConvCleanText(fldObjRow.signature),
    dedication: fncConvCleanText(fldObjRow.dedication),
  };
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
  };
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
