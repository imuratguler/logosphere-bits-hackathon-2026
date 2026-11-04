// Logosphere BITS — deterministic catalog waterfall (shared).
// Every source is tried separately and every try is logged:
// term, URL, time, HTTP status, candidate, match reason,
// parsed fields, reject reason. A record is accepted only on
// an ISBN match or a strong title + contributor + language +
// edition match; a valid ISBN from another edition never binds
// to the copy at hand. Timeouts are short, sources run in
// order with a polite gap, and 401/403/429 answers mark the
// source failed without any bypass attempt. Identifiers
// follow D6.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fncConvNormalizeTitle } from './catalog.ts';
import {
  fncConvCleanIsbnStrict,
  fncConvCleanText,
  fncConvCleanYear,
} from './mapping.ts';

export const fldNumWaterfallTimeoutMs = 10000;
export const fldNumWaterfallGapMs = 400;
export const fldNumWaterfallMaxCandidates = 5;

export type fldObjWaterfallQuery = {
  isbn10: string | null;
  isbn13: string | null;
  title: string | null;
  authors: string[];
  publisher: string | null;
  language: string | null;
  edition: string | null;
};

export type fldObjSourceCandidate = {
  source: string;
  source_key: string;
  url: string;
  level: 'edition' | 'work';
  title: string | null;
  title_norm: string;
  authors: string[];
  publisher: string | null;
  language: string | null;
  edition: string | null;
  publish_year: number | null;
  pages: number | null;
  isbn10: string | null;
  isbn13: string | null;
};

export type fldObjWaterfallReject = {
  source: string;
  reason: string;
};

export type fldObjWaterfallHit = {
  candidate: fldObjSourceCandidate | null;
  source: string | null;
  reason: string | null;
  rejected: fldObjWaterfallReject[];
};

const fldObjLang3To2: Record<string, string> = {
  eng: 'en',
  tur: 'tr',
  deu: 'de',
  fra: 'fr',
  spa: 'es',
  jpn: 'ja',
  ita: 'it',
  por: 'pt',
  nld: 'nl',
  pol: 'pl',
  swe: 'sv',
  ara: 'ar',
};

export function fncConvCleanLanguage(fldObjValue: unknown): string | null {
  const fldStrText = fncConvCleanText(fldObjValue);
  if (fldStrText === null) {
    return null;
  }
  const fldStrLower = fldStrText.toLowerCase();
  return fldObjLang3To2[fldStrLower] ?? fldStrLower;
}

function fncConvNamesOverlap(
  fldArrLeft: string[],
  fldArrRight: string[],
): boolean {
  for (const fldStrLeft of fldArrLeft) {
    const fldStrLeftNorm = fncConvNormalizeTitle(fldStrLeft);
    if (fldStrLeftNorm === '') {
      continue;
    }
    for (const fldStrRight of fldArrRight) {
      const fldStrRightNorm = fncConvNormalizeTitle(fldStrRight);
      if (fldStrRightNorm === '') {
        continue;
      }
      if (
        fldStrLeftNorm === fldStrRightNorm ||
        fldStrLeftNorm.includes(fldStrRightNorm) ||
        fldStrRightNorm.includes(fldStrLeftNorm)
      ) {
        return true;
      }
    }
  }
  return false;
}

function fncConvStrongTitle(fldStrLeft: string, fldStrRight: string): boolean {
  if (fldStrLeft === '' || fldStrRight === '') {
    return false;
  }
  if (fldStrLeft === fldStrRight) {
    return true;
  }
  const fldNumShort = Math.min(fldStrLeft.length, fldStrRight.length);
  if (fldNumShort < 12) {
    return false;
  }
  return fldStrLeft.includes(fldStrRight) || fldStrRight.includes(fldStrLeft);
}

export function fncConvAcceptCandidate(
  fldObjQuery: fldObjWaterfallQuery,
  fldObjCandidate: fldObjSourceCandidate,
): { accepted: boolean; reason: string } {
  const fldArrQueryIsbn = [fldObjQuery.isbn10, fldObjQuery.isbn13].filter(
    (fldStrIsbn): fldStrIsbn is string => fldStrIsbn !== null,
  );
  const fldArrCandIsbn = [
    fldObjCandidate.isbn10,
    fldObjCandidate.isbn13,
  ].filter(
    (fldStrIsbn): fldStrIsbn is string => fldStrIsbn !== null,
  );
  if (
    fldArrQueryIsbn.some((fldStrIsbn) => fldArrCandIsbn.includes(fldStrIsbn))
  ) {
    return { accepted: true, reason: 'isbn-match' };
  }
  if (fldArrQueryIsbn.length > 0 && fldArrCandIsbn.length > 0) {
    return { accepted: false, reason: 'isbn-mismatch' };
  }
  const fldStrQueryTitle = fncConvNormalizeTitle(fldObjQuery.title);
  if (!fncConvStrongTitle(fldStrQueryTitle, fldObjCandidate.title_norm)) {
    return { accepted: false, reason: 'weak-title' };
  }
  const fldStrQueryPublisher = fncConvNormalizeTitle(fldObjQuery.publisher);
  const fldStrCandPublisher = fncConvNormalizeTitle(fldObjCandidate.publisher);
  const fldBooPublisher = fldStrQueryPublisher !== '' &&
    fldStrQueryPublisher === fldStrCandPublisher;
  if (
    !fldBooPublisher &&
    !fncConvNamesOverlap(fldObjQuery.authors, fldObjCandidate.authors)
  ) {
    return { accepted: false, reason: 'no-contributor-overlap' };
  }
  const fldStrQueryLang = fncConvCleanLanguage(fldObjQuery.language);
  const fldStrCandLang = fncConvCleanLanguage(fldObjCandidate.language);
  if (
    fldStrQueryLang !== null && fldStrCandLang !== null &&
    fldStrQueryLang !== fldStrCandLang
  ) {
    return { accepted: false, reason: 'language-mismatch' };
  }
  const fldStrQueryEdition = fncConvNormalizeTitle(fldObjQuery.edition);
  const fldStrCandEdition = fncConvNormalizeTitle(fldObjCandidate.edition);
  if (
    fldStrQueryEdition !== '' && fldStrCandEdition !== '' &&
    !fldStrQueryEdition.includes(fldStrCandEdition) &&
    !fldStrCandEdition.includes(fldStrQueryEdition)
  ) {
    return { accepted: false, reason: 'edition-mismatch' };
  }
  return {
    accepted: true,
    reason: fldObjCandidate.level === 'work'
      ? 'strong-title-match-work-level'
      : 'strong-title-match',
  };
}

export type fldObjFetchOutcome = {
  status: number | null;
  body: unknown;
};

export async function fncRunFetchJson(
  fldStrUrl: string,
): Promise<fldObjFetchOutcome> {
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(fldStrUrl, {
      signal: AbortSignal.timeout(fldNumWaterfallTimeoutMs),
    });
  } catch {
    return { status: null, body: null };
  }
  if (!fldObjResponse.ok) {
    return { status: fldObjResponse.status, body: null };
  }
  try {
    return { status: fldObjResponse.status, body: await fldObjResponse.json() };
  } catch {
    return { status: fldObjResponse.status, body: null };
  }
}

export function fncRunWaterfallGap(): Promise<void> {
  return new Promise((fldObjResolve) =>
    setTimeout(fldObjResolve, fldNumWaterfallGapMs)
  );
}

function fncConvCleanStringList(fldObjValue: unknown): string[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrOut: string[] = [];
  for (const fldObjEntry of fldObjValue) {
    const fldStrText = fncConvCleanText(fldObjEntry);
    if (fldStrText !== null) {
      fldArrOut.push(fldStrText);
    }
  }
  return fldArrOut;
}

function fncConvCleanYearText(fldObjValue: unknown): number | null {
  const fldStrText = fncConvCleanText(fldObjValue);
  if (fldStrText === null) {
    return null;
  }
  const fldObjFound = fldStrText.match(/\d{4}/);
  return fldObjFound === null ? null : fncConvCleanYear(Number(fldObjFound[0]));
}

const fldStrOpenLibrary = 'https://openlibrary.org';

function fncConvAuthorKeys(fldObjValue: unknown): string[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrOut: string[] = [];
  for (const fldObjEntry of fldObjValue) {
    if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
      continue;
    }
    const fldStrKey = fncConvCleanText(
      (fldObjEntry as Record<string, unknown>)['key'],
    );
    if (fldStrKey !== null && fldStrKey.startsWith('/authors/')) {
      fldArrOut.push(fldStrKey);
    }
  }
  return fldArrOut;
}

async function fncRunOpenLibraryAuthor(
  fldStrKey: string,
): Promise<string | null> {
  const fldObjOutcome = await fncRunFetchJson(
    `${fldStrOpenLibrary}${fldStrKey}.json`,
  );
  if (typeof fldObjOutcome.body !== 'object' || fldObjOutcome.body === null) {
    return null;
  }
  return fncConvCleanText(
    (fldObjOutcome.body as Record<string, unknown>)['name'],
  );
}

function fncConvOpenLibraryEdition(
  fldObjValue: unknown,
  fldStrIsbn: string,
  fldArrAuthors: string[],
): fldObjSourceCandidate | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldStrTitle = fncConvCleanText(fldObjRow['title']);
  if (fldStrTitle === null) {
    return null;
  }
  const fldStrKey = fncConvCleanText(fldObjRow['key']) ?? `/isbn/${fldStrIsbn}`;
  let fldStrLang: string | null = null;
  if (Array.isArray(fldObjRow['languages'])) {
    for (const fldObjLang of fldObjRow['languages']) {
      const fldStrLangKey =
        typeof fldObjLang === 'object' && fldObjLang !== null
          ? fncConvCleanText((fldObjLang as Record<string, unknown>)['key'])
          : null;
      if (fldStrLangKey !== null) {
        fldStrLang = fncConvCleanLanguage(
          fldStrLangKey.split('/').pop() ?? fldStrLangKey,
        );
        break;
      }
    }
  }
  return {
    source: 'openlibrary',
    source_key: `edition:${fldStrKey}`,
    url: `${fldStrOpenLibrary}${fldStrKey}`,
    level: 'edition',
    title: fldStrTitle,
    title_norm: fncConvNormalizeTitle(fldStrTitle),
    authors: fldArrAuthors,
    publisher: fncConvCleanStringList(fldObjRow['publishers'])[0] ?? null,
    language: fldStrLang,
    edition: fncConvCleanText(fldObjRow['edition_name']),
    publish_year: fncConvCleanYearText(fldObjRow['publish_date']),
    pages: typeof fldObjRow['number_of_pages'] === 'number' &&
        Number.isInteger(fldObjRow['number_of_pages']) &&
        (fldObjRow['number_of_pages'] as number) > 0
      ? (fldObjRow['number_of_pages'] as number)
      : null,
    isbn10: null,
    isbn13: fldStrIsbn.length === 13 ? fldStrIsbn : null,
  };
}

export async function fncRunOpenLibraryByIsbn(
  fldStrIsbn: string,
): Promise<{ candidate: fldObjSourceCandidate | null; status: number | null }> {
  const fldStrUrl = `${fldStrOpenLibrary}/isbn/${fldStrIsbn}.json`;
  const fldObjOutcome = await fncRunFetchJson(fldStrUrl);
  const fldObjRow = (typeof fldObjOutcome.body === 'object' &&
      fldObjOutcome.body !== null
    ? fldObjOutcome.body
    : null) as Record<string, unknown> | null;
  if (fldObjRow === null) {
    return { candidate: null, status: fldObjOutcome.status };
  }
  const fldArrNames: string[] = [];
  for (const fldStrKey of fncConvAuthorKeys(fldObjRow['authors']).slice(0, 2)) {
    const fldStrName = await fncRunOpenLibraryAuthor(fldStrKey);
    if (fldStrName !== null) {
      fldArrNames.push(fldStrName);
    }
  }
  return {
    candidate: fncConvOpenLibraryEdition(
      fldObjRow,
      fldStrIsbn,
      fldArrNames,
    ),
    status: fldObjOutcome.status,
  };
}

function fncConvOpenLibraryDoc(
  fldObjValue: unknown,
): fldObjSourceCandidate | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldStrTitle = fncConvCleanText(fldObjRow['title']);
  const fldStrKey = fncConvCleanText(fldObjRow['key']);
  if (fldStrTitle === null || fldStrKey === null) {
    return null;
  }
  let fldStrIsbn13: string | null = null;
  for (
    const fldObjIsbn of Array.isArray(fldObjRow['isbn'])
      ? fldObjRow['isbn']
      : []
  ) {
    const fldStrStrict = fncConvCleanIsbnStrict(fldObjIsbn);
    if (fldStrStrict !== null && fldStrStrict.length === 13) {
      fldStrIsbn13 = fldStrStrict;
      break;
    }
  }
  const fldArrLang = fncConvCleanStringList(fldObjRow['language']);
  return {
    source: 'openlibrary',
    source_key: `work:${fldStrKey}`,
    url: `${fldStrOpenLibrary}${fldStrKey}`,
    level: 'work',
    title: fldStrTitle,
    title_norm: fncConvNormalizeTitle(fldStrTitle),
    authors: fncConvCleanStringList(fldObjRow['author_name']),
    publisher: fncConvCleanStringList(fldObjRow['publisher'])[0] ?? null,
    language: fldArrLang.length > 0
      ? fncConvCleanLanguage(fldArrLang[0])
      : null,
    edition: null,
    publish_year: fncConvCleanYear(fldObjRow['first_publish_year']),
    pages: null,
    isbn10: null,
    isbn13: fldStrIsbn13,
  };
}

export async function fncRunOpenLibraryByTitle(
  fldStrTitle: string,
  fldStrAuthor: string | null,
): Promise<{ candidates: fldObjSourceCandidate[]; status: number | null }> {
  const fldObjParams = new URLSearchParams({
    title: fldStrTitle,
    limit: String(fldNumWaterfallMaxCandidates),
    fields: 'key,title,author_name,first_publish_year,publisher,language,isbn',
  });
  if (fldStrAuthor !== null && fldStrAuthor !== '') {
    fldObjParams.set('author', fldStrAuthor);
  }
  const fldObjOutcome = await fncRunFetchJson(
    `${fldStrOpenLibrary}/search.json?${fldObjParams.toString()}`,
  );
  if (typeof fldObjOutcome.body !== 'object' || fldObjOutcome.body === null) {
    return { candidates: [], status: fldObjOutcome.status };
  }
  const fldObjDocs = (fldObjOutcome.body as Record<string, unknown>)['docs'];
  if (!Array.isArray(fldObjDocs)) {
    return { candidates: [], status: fldObjOutcome.status };
  }
  const fldArrOut: fldObjSourceCandidate[] = [];
  for (const fldObjDoc of fldObjDocs.slice(0, fldNumWaterfallMaxCandidates)) {
    const fldObjCandidate = fncConvOpenLibraryDoc(fldObjDoc);
    if (fldObjCandidate !== null) {
      fldArrOut.push(fldObjCandidate);
    }
  }
  return { candidates: fldArrOut, status: fldObjOutcome.status };
}

const fldStrGoogleBooks = 'https://www.googleapis.com/books/v1/volumes';

function fncConvGoogleBookItem(
  fldObjValue: unknown,
): fldObjSourceCandidate | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldStrId = fncConvCleanText(fldObjRow['id']);
  const fldObjInfo = fldObjRow['volumeInfo'];
  if (
    fldStrId === null || typeof fldObjInfo !== 'object' || fldObjInfo === null
  ) {
    return null;
  }
  const fldObjVolume = fldObjInfo as Record<string, unknown>;
  const fldStrTitle = fncConvCleanText(fldObjVolume['title']);
  if (fldStrTitle === null) {
    return null;
  }
  let fldStrIsbn10: string | null = null;
  let fldStrIsbn13: string | null = null;
  const fldObjIds = fldObjVolume['industryIdentifiers'];
  if (Array.isArray(fldObjIds)) {
    for (const fldObjEntry of fldObjIds) {
      if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
        continue;
      }
      const fldObjIdRow = fldObjEntry as Record<string, unknown>;
      const fldStrType = fncConvCleanText(fldObjIdRow['type']);
      const fldStrStrict = fncConvCleanIsbnStrict(fldObjIdRow['identifier']);
      if (fldStrType === 'ISBN_10' && fldStrIsbn10 === null) {
        fldStrIsbn10 = fldStrStrict;
      } else if (fldStrType === 'ISBN_13' && fldStrIsbn13 === null) {
        fldStrIsbn13 = fldStrStrict;
      }
    }
  }
  if (fldStrIsbn10 !== null && fldStrIsbn10.length !== 10) {
    fldStrIsbn10 = null;
  }
  if (fldStrIsbn13 !== null && fldStrIsbn13.length !== 13) {
    fldStrIsbn13 = null;
  }
  return {
    source: 'googlebooks',
    source_key: `volume:${fldStrId}`,
    url: fncConvCleanText(fldObjVolume['infoLink']) ??
      fncConvCleanText(fldObjVolume['canonicalVolumeLink']) ??
      `${fldStrGoogleBooks}/${fldStrId}`,
    level: 'edition',
    title: fldStrTitle,
    title_norm: fncConvNormalizeTitle(fldStrTitle),
    authors: fncConvCleanStringList(fldObjVolume['authors']),
    publisher: fncConvCleanText(fldObjVolume['publisher']),
    language: fncConvCleanLanguage(fldObjVolume['language']),
    edition: null,
    publish_year: fncConvCleanYearText(fldObjVolume['publishedDate']),
    pages: typeof fldObjVolume['pageCount'] === 'number' &&
        Number.isInteger(fldObjVolume['pageCount']) &&
        (fldObjVolume['pageCount'] as number) > 0
      ? (fldObjVolume['pageCount'] as number)
      : null,
    isbn10: fldStrIsbn10,
    isbn13: fldStrIsbn13,
  };
}

export async function fncRunGoogleBooks(
  fldStrQuery: string,
): Promise<{ candidates: fldObjSourceCandidate[]; status: number | null }> {
  const fldObjParams = new URLSearchParams({
    q: fldStrQuery,
    maxResults: String(fldNumWaterfallMaxCandidates),
  });
  const fldObjOutcome = await fncRunFetchJson(
    `${fldStrGoogleBooks}?${fldObjParams.toString()}`,
  );
  if (typeof fldObjOutcome.body !== 'object' || fldObjOutcome.body === null) {
    return { candidates: [], status: fldObjOutcome.status };
  }
  const fldObjItems = (fldObjOutcome.body as Record<string, unknown>)['items'];
  if (!Array.isArray(fldObjItems)) {
    return { candidates: [], status: fldObjOutcome.status };
  }
  const fldArrOut: fldObjSourceCandidate[] = [];
  for (const fldObjItem of fldObjItems.slice(0, fldNumWaterfallMaxCandidates)) {
    const fldObjCandidate = fncConvGoogleBookItem(fldObjItem);
    if (fldObjCandidate !== null) {
      fldArrOut.push(fldObjCandidate);
    }
  }
  return { candidates: fldArrOut, status: fldObjOutcome.status };
}

export type fldObjAttemptRow = {
  source: string;
  term_type: 'isbn' | 'title';
  term: string;
  url: string | null;
  http_status: number | null;
  candidate_id: string | null;
  match_reason: string | null;
  parsed_fields: Record<string, unknown>;
  reject_reason: string | null;
};

async function fncRunLogAttempt(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrImageId: string,
  fldObjAttempt: fldObjAttemptRow,
): Promise<void> {
  try {
    await fldObjClient.from('catalog_attempts').insert({
      run_id: fldStrRunId,
      image_id: fldStrImageId,
      source: fldObjAttempt.source,
      term_type: fldObjAttempt.term_type,
      term: fldObjAttempt.term,
      url: fldObjAttempt.url,
      http_status: fldObjAttempt.http_status,
      candidate_id: fldObjAttempt.candidate_id,
      match_reason: fldObjAttempt.match_reason,
      parsed_fields: fldObjAttempt.parsed_fields,
      reject_reason: fldObjAttempt.reject_reason,
    });
  } catch {
    // A lost audit row never blocks the verified record.
  }
}

async function fncRunKeepSource(
  fldObjClient: SupabaseClient,
  fldObjCandidate: fldObjSourceCandidate,
): Promise<string | null> {
  try {
    const { data } = await fldObjClient
      .from('catalog_sources')
      .upsert(
        {
          source: fldObjCandidate.source,
          source_key: fldObjCandidate.source_key,
          url: fldObjCandidate.url,
          title: fldObjCandidate.title,
          title_norm: fldObjCandidate.title_norm,
          authors: fldObjCandidate.authors,
          publisher: fldObjCandidate.publisher,
          language: fldObjCandidate.language,
          edition: fldObjCandidate.edition,
          publish_year: fldObjCandidate.publish_year,
          pages: fldObjCandidate.pages,
          isbn10: fldObjCandidate.isbn10,
          isbn13: fldObjCandidate.isbn13,
          record: fldObjCandidate,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'source,source_key' },
      )
      .select('id')
      .maybeSingle();
    const fldObjRow = data as { id?: unknown } | null;
    return typeof fldObjRow?.id === 'string' ? fldObjRow.id : null;
  } catch {
    return null;
  }
}

async function fncRunCacheLookup(
  fldObjClient: SupabaseClient,
  fldStrIsbn: string,
): Promise<fldObjSourceCandidate | null> {
  try {
    const { data, error } = await fldObjClient
      .from('catalog_records')
      .select('record')
      .eq('isbn', fldStrIsbn)
      .maybeSingle();
    if (error || data === null) {
      return null;
    }
    const fldObjRecord = (data as { record?: unknown }).record;
    if (typeof fldObjRecord !== 'object' || fldObjRecord === null) {
      return null;
    }
    const fldObjRow = fldObjRecord as Record<string, unknown>;
    const fldStrTitle = fncConvCleanText(fldObjRow['title']);
    if (fldStrTitle === null) {
      return null;
    }
    return {
      source: 'local-cache',
      source_key: `isbn:${fldStrIsbn}`,
      url: '',
      level: 'edition',
      title: fldStrTitle,
      title_norm: fncConvNormalizeTitle(fldStrTitle),
      authors: [],
      publisher: fncConvCleanText(fldObjRow['publishers']) ??
        (Array.isArray(fldObjRow['publishers'])
          ? fncConvCleanStringList(fldObjRow['publishers'])[0] ?? null
          : null),
      language: null,
      edition: null,
      publish_year: fncConvCleanYear(fldObjRow['publish_year']),
      pages: typeof fldObjRow['pages'] === 'number' &&
          Number.isInteger(fldObjRow['pages'])
        ? (fldObjRow['pages'] as number)
        : null,
      isbn10: fldStrIsbn.length === 10 ? fldStrIsbn : null,
      isbn13: fldStrIsbn.length === 13 ? fldStrIsbn : null,
    };
  } catch {
    return null;
  }
}

async function fncRunCacheKeep(
  fldObjClient: SupabaseClient,
  fldStrIsbn: string,
  fldObjCandidate: fldObjSourceCandidate,
): Promise<void> {
  try {
    await fldObjClient.from('catalog_records').upsert(
      {
        isbn: fldStrIsbn,
        source: fldObjCandidate.source,
        record: {
          title: fldObjCandidate.title,
          publishers: fldObjCandidate.publisher === null
            ? []
            : [fldObjCandidate.publisher],
          publish_year: fldObjCandidate.publish_year,
          pages: fldObjCandidate.pages,
        },
      },
      { onConflict: 'isbn' },
    );
  } catch {
    // A lost cache write never blocks the verified record.
  }
}

function fncConvParsedFields(
  fldObjCandidate: fldObjSourceCandidate,
): Record<string, unknown> {
  return {
    title: fldObjCandidate.title,
    authors: fldObjCandidate.authors,
    publisher: fldObjCandidate.publisher,
    language: fldObjCandidate.language,
    edition: fldObjCandidate.edition,
    publish_year: fldObjCandidate.publish_year,
    pages: fldObjCandidate.pages,
    isbn10: fldObjCandidate.isbn10,
    isbn13: fldObjCandidate.isbn13,
  };
}

export async function fncRunWaterfall(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrImageId: string,
  fldObjQuery: fldObjWaterfallQuery,
): Promise<fldObjWaterfallHit> {
  const fldArrRejected: fldObjWaterfallReject[] = [];
  const fldStrIsbn = fldObjQuery.isbn13 ?? fldObjQuery.isbn10;
  if (fldStrIsbn !== null) {
    const fldObjCached = await fncRunCacheLookup(fldObjClient, fldStrIsbn);
    if (fldObjCached !== null) {
      const fldObjVerdict = fncConvAcceptCandidate(fldObjQuery, fldObjCached);
      if (fldObjVerdict.accepted) {
        await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
          source: 'local-cache',
          term_type: 'isbn',
          term: fldStrIsbn,
          url: null,
          http_status: null,
          candidate_id: null,
          match_reason: fldObjVerdict.reason,
          parsed_fields: fncConvParsedFields(fldObjCached),
          reject_reason: null,
        });
        return {
          candidate: fldObjCached,
          source: 'local-cache',
          reason: null,
          rejected: fldArrRejected,
        };
      }
      fldArrRejected.push({
        source: 'local-cache',
        reason: fldObjVerdict.reason,
      });
    }
    const fldObjOl = await fncRunOpenLibraryByIsbn(fldStrIsbn);
    await fncRunWaterfallGap();
    if (fldObjOl.candidate !== null) {
      const fldObjVerdict = fncConvAcceptCandidate(
        fldObjQuery,
        fldObjOl.candidate,
      );
      const fldStrKept = await fncRunKeepSource(
        fldObjClient,
        fldObjOl.candidate,
      );
      await fncRunCacheKeep(fldObjClient, fldStrIsbn, fldObjOl.candidate);
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'openlibrary',
        term_type: 'isbn',
        term: fldStrIsbn,
        url: fldObjOl.candidate.url,
        http_status: fldObjOl.status,
        candidate_id: fldStrKept,
        match_reason: fldObjVerdict.accepted ? fldObjVerdict.reason : null,
        parsed_fields: fncConvParsedFields(fldObjOl.candidate),
        reject_reason: fldObjVerdict.accepted ? null : fldObjVerdict.reason,
      });
      if (fldObjVerdict.accepted) {
        return {
          candidate: fldObjOl.candidate,
          source: 'openlibrary',
          reason: null,
          rejected: fldArrRejected,
        };
      }
      fldArrRejected.push({
        source: 'openlibrary',
        reason: fldObjVerdict.reason,
      });
    } else {
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'openlibrary',
        term_type: 'isbn',
        term: fldStrIsbn,
        url: `${fldStrOpenLibrary}/isbn/${fldStrIsbn}.json`,
        http_status: fldObjOl.status,
        candidate_id: null,
        match_reason: null,
        parsed_fields: {},
        reject_reason: fldObjOl.status === 404 ? 'not-found' : 'source-failed',
      });
      fldArrRejected.push({
        source: 'openlibrary',
        reason: fldObjOl.status === 404 ? 'not-found' : 'source-failed',
      });
    }
    const fldObjGb = await fncRunGoogleBooks(`isbn:${fldStrIsbn}`);
    await fncRunWaterfallGap();
    for (const fldObjCandidate of fldObjGb.candidates) {
      const fldObjVerdict = fncConvAcceptCandidate(
        fldObjQuery,
        fldObjCandidate,
      );
      const fldStrKept = await fncRunKeepSource(fldObjClient, fldObjCandidate);
      await fncRunCacheKeep(fldObjClient, fldStrIsbn, fldObjCandidate);
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'googlebooks',
        term_type: 'isbn',
        term: fldStrIsbn,
        url: fldObjCandidate.url,
        http_status: fldObjGb.status,
        candidate_id: fldStrKept,
        match_reason: fldObjVerdict.accepted ? fldObjVerdict.reason : null,
        parsed_fields: fncConvParsedFields(fldObjCandidate),
        reject_reason: fldObjVerdict.accepted ? null : fldObjVerdict.reason,
      });
      if (fldObjVerdict.accepted) {
        return {
          candidate: fldObjCandidate,
          source: 'googlebooks',
          reason: null,
          rejected: fldArrRejected,
        };
      }
      fldArrRejected.push({
        source: 'googlebooks',
        reason: fldObjVerdict.reason,
      });
    }
    if (fldObjGb.candidates.length === 0) {
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'googlebooks',
        term_type: 'isbn',
        term: fldStrIsbn,
        url: null,
        http_status: fldObjGb.status,
        candidate_id: null,
        match_reason: null,
        parsed_fields: {},
        reject_reason: fldObjGb.status === null ? 'source-failed' : 'not-found',
      });
      fldArrRejected.push({
        source: 'googlebooks',
        reason: fldObjGb.status === null ? 'source-failed' : 'not-found',
      });
    }
  }
  const fldStrTitle = fncConvCleanText(fldObjQuery.title);
  if (fldStrTitle !== null) {
    const fldStrAuthor = fldObjQuery.authors[0] ?? null;
    const fldObjOl = await fncRunOpenLibraryByTitle(fldStrTitle, fldStrAuthor);
    await fncRunWaterfallGap();
    for (const fldObjCandidate of fldObjOl.candidates) {
      const fldObjVerdict = fncConvAcceptCandidate(
        fldObjQuery,
        fldObjCandidate,
      );
      const fldStrKept = await fncRunKeepSource(fldObjClient, fldObjCandidate);
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'openlibrary',
        term_type: 'title',
        term: fldStrTitle,
        url: fldObjCandidate.url,
        http_status: fldObjOl.status,
        candidate_id: fldStrKept,
        match_reason: fldObjVerdict.accepted ? fldObjVerdict.reason : null,
        parsed_fields: fncConvParsedFields(fldObjCandidate),
        reject_reason: fldObjVerdict.accepted ? null : fldObjVerdict.reason,
      });
      if (fldObjVerdict.accepted) {
        return {
          candidate: fldObjCandidate,
          source: 'openlibrary',
          reason: null,
          rejected: fldArrRejected,
        };
      }
      fldArrRejected.push({
        source: 'openlibrary',
        reason: fldObjVerdict.reason,
      });
    }
    const fldStrGbQuery = fldStrAuthor === null
      ? `intitle:${fldStrTitle}`
      : `intitle:${fldStrTitle}+inauthor:${fldStrAuthor}`;
    const fldObjGb = await fncRunGoogleBooks(fldStrGbQuery);
    await fncRunWaterfallGap();
    for (const fldObjCandidate of fldObjGb.candidates) {
      const fldObjVerdict = fncConvAcceptCandidate(
        fldObjQuery,
        fldObjCandidate,
      );
      const fldStrKept = await fncRunKeepSource(fldObjClient, fldObjCandidate);
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'googlebooks',
        term_type: 'title',
        term: fldStrGbQuery,
        url: fldObjCandidate.url,
        http_status: fldObjGb.status,
        candidate_id: fldStrKept,
        match_reason: fldObjVerdict.accepted ? fldObjVerdict.reason : null,
        parsed_fields: fncConvParsedFields(fldObjCandidate),
        reject_reason: fldObjVerdict.accepted ? null : fldObjVerdict.reason,
      });
      if (fldObjVerdict.accepted) {
        return {
          candidate: fldObjCandidate,
          source: 'googlebooks',
          reason: null,
          rejected: fldArrRejected,
        };
      }
      fldArrRejected.push({
        source: 'googlebooks',
        reason: fldObjVerdict.reason,
      });
    }
    if (fldObjOl.candidates.length === 0 && fldObjGb.candidates.length === 0) {
      await fncRunLogAttempt(fldObjClient, fldStrRunId, fldStrImageId, {
        source: 'waterfall',
        term_type: 'title',
        term: fldStrTitle,
        url: null,
        http_status: null,
        candidate_id: null,
        match_reason: null,
        parsed_fields: {},
        reject_reason: 'no-source-found',
      });
    }
  }
  return {
    candidate: null,
    source: null,
    reason: fldStrIsbn === null && fldStrTitle === null
      ? 'no-query'
      : 'no-source-found',
    rejected: fldArrRejected,
  };
}
