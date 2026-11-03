// Logosphere BITS — catalog lookup (shared).
// Exact local ISBN matches come first; on a miss the
// stage queries one accessible remote catalog (Open
// Library, keyless JSON, 10s timeout) and caches the fact
// for the next run. The lens title guards the edition: a
// remote record whose title contradicts the lens stays
// cached but returns null with a mismatch reason, and an
// unreachable catalog never fails the run. Identifiers
// follow D6.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const fldStrCatalogRemote = 'https://openlibrary.org';

const fldNumCatalogTimeoutMs = 10000;

export type fldObjCatalogEntry = {
  title: string | null;
  publishers: string[];
  publish_year: number | null;
  pages: number | null;
};

export type fldObjCatalogHit = {
  isbn: string;
  record: fldObjCatalogEntry | null;
  source: 'local-cache' | 'openlibrary' | null;
  reason: string | null;
};

export function fncConvNormalizeTitle(fldObjValue: unknown): string {
  if (typeof fldObjValue !== 'string') {
    return '';
  }
  return fldObjValue
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fncConvTitlesMatch(
  fldStrLens: string,
  fldStrRemote: string,
): boolean {
  const fldStrLeft = fncConvNormalizeTitle(fldStrLens);
  const fldStrRight = fncConvNormalizeTitle(fldStrRemote);
  if (fldStrLeft === '' || fldStrRight === '') {
    return false;
  }
  return fldStrLeft.includes(fldStrRight) || fldStrRight.includes(fldStrLeft);
}

function fncConvCleanText(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrTrimmed = fldObjValue.trim();
  return fldStrTrimmed === '' ? null : fldStrTrimmed;
}

function fncConvCleanYear(fldObjValue: unknown): number | null {
  if (typeof fldObjValue !== 'number' || !Number.isInteger(fldObjValue)) {
    return null;
  }
  if (fldObjValue < 1000 || fldObjValue > 2100) {
    return null;
  }
  return fldObjValue;
}

export function fncConvCleanCatalogEntry(
  fldObjValue: unknown,
): fldObjCatalogEntry {
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : {};
  const fldObjPublishers = fldObjRow['publishers'];
  const fldArrPublishers: string[] = [];
  if (Array.isArray(fldObjPublishers)) {
    for (const fldObjEntry of fldObjPublishers) {
      const fldStrName = fncConvCleanText(fldObjEntry);
      if (fldStrName !== null) {
        fldArrPublishers.push(fldStrName);
      }
    }
  }
  const fldObjPages = fldObjRow['pages'];
  return {
    title: fncConvCleanText(fldObjRow['title']),
    publishers: fldArrPublishers,
    publish_year: fncConvCleanYear(fldObjRow['publish_year']),
    pages: typeof fldObjPages === 'number' && Number.isInteger(fldObjPages) &&
        fldObjPages > 0
      ? fldObjPages
      : null,
  };
}

function fncConvParseOpenLibrary(
  fldObjValue: unknown,
): fldObjCatalogEntry | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldStrTitle = fncConvCleanText(fldObjRow['title']);
  if (fldStrTitle === null) {
    return null;
  }
  const fldStrDate = fncConvCleanText(fldObjRow['publish_date']);
  const fldObjYear = fldStrDate === null ? null : fldStrDate.match(/\d{4}/);
  return fncConvCleanCatalogEntry({
    title: fldStrTitle,
    publishers: fldObjRow['publishers'] ?? [],
    publish_year: fldObjYear === null ? null : Number(fldObjYear[0]),
    pages: fldObjRow['number_of_pages'] ?? null,
  });
}

export async function fncRunCatalogLookup(
  fldObjClient: SupabaseClient,
  fldStrIsbn: string,
  fldStrLensTitle: string,
): Promise<fldObjCatalogHit> {
  if (fldStrIsbn === '') {
    return { isbn: '', record: null, source: null, reason: 'no-isbn' };
  }
  try {
    const { data: fldObjRow, error: fldObjError } = await fldObjClient
      .from('catalog_records')
      .select('isbn, source, record')
      .eq('isbn', fldStrIsbn)
      .maybeSingle();
    if (!fldObjError && fldObjRow !== null) {
      const fldObjCached = (fldObjRow as { record?: unknown }).record ?? null;
      return {
        isbn: fldStrIsbn,
        record: fncConvCleanCatalogEntry(fldObjCached),
        source: 'local-cache',
        reason: null,
      };
    }
  } catch {
    // A sick cache falls through to the remote source.
  }
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(
      `${fldStrCatalogRemote}/isbn/${fldStrIsbn}.json`,
      { signal: AbortSignal.timeout(fldNumCatalogTimeoutMs) },
    );
  } catch {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'catalog-unreachable',
    };
  }
  if (fldObjResponse.status === 404) {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'not-found',
    };
  }
  if (!fldObjResponse.ok) {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'catalog-unreachable',
    };
  }
  let fldObjBody: unknown;
  try {
    fldObjBody = await fldObjResponse.json();
  } catch {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'catalog-error',
    };
  }
  const fldObjEntry = fncConvParseOpenLibrary(fldObjBody);
  if (fldObjEntry === null) {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'catalog-error',
    };
  }
  try {
    await fldObjClient.from('catalog_records').insert({
      isbn: fldStrIsbn,
      source: 'openlibrary',
      record: fldObjEntry,
    });
  } catch {
    // A lost cache write never blocks the verified record.
  }
  if (
    fldStrLensTitle !== '' && fldObjEntry.title !== null &&
    !fncConvTitlesMatch(fldStrLensTitle, fldObjEntry.title)
  ) {
    return {
      isbn: fldStrIsbn,
      record: null,
      source: null,
      reason: 'title-mismatch',
    };
  }
  return {
    isbn: fldStrIsbn,
    record: fldObjEntry,
    source: 'openlibrary',
    reason: null,
  };
}
