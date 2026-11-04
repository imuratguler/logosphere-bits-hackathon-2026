// Logosphere BITS — HTML source adapters (shared).
// JSON-LD first, then meta tags, then detail tables and
// label/value pairs, visible text last. No DOM engine: small
// bounded extractors only. Prices are never read here —
// catalog matching must not mistake another product's price,
// menu, ad, or script text for the record. Blocked pages
// (401/403/429/captcha markers) mark the source failed; no
// header spoofing, no rotation, no bypass attempt. Fetch
// uses the default client identity with an 8s timeout.
// Identifiers follow D6.

import {
  fncConvCleanIsbnStrict,
  fncConvCleanText,
  fncConvCleanYear,
} from './mapping.ts';
import { fncConvNormalizeTitle } from './catalog.ts';
import { fncConvCleanLanguage } from './waterfall.ts';
import type { fldObjSourceCandidate } from './waterfall.ts';

export const fldNumHtmlTimeoutMs = 8000;

export type fldObjHtmlFetch = {
  url: string;
  status: number | null;
  html: string | null;
};

export async function fncRunFetchHtml(
  fldStrUrl: string,
): Promise<fldObjHtmlFetch> {
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(fldStrUrl, {
      signal: AbortSignal.timeout(fldNumHtmlTimeoutMs),
    });
  } catch {
    return { url: fldStrUrl, status: null, html: null };
  }
  if (!fldObjResponse.ok) {
    return { url: fldStrUrl, status: fldObjResponse.status, html: null };
  }
  const fldStrType = fldObjResponse.headers.get('content-type') ?? '';
  if (!fldStrType.includes('text/html') && !fldStrType.includes('text/plain')) {
    return { url: fldStrUrl, status: fldObjResponse.status, html: null };
  }
  try {
    const fldStrHtml = await fldObjResponse.text();
    return {
      url: fldStrUrl,
      status: fldObjResponse.status,
      html: fldStrHtml.slice(0, 500000),
    };
  } catch {
    return { url: fldStrUrl, status: fldObjResponse.status, html: null };
  }
}

const fldObjEntityMap: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function fncConvDecodeEntities(fldStrText: string): string {
  return fldStrText
    .replace(/&#(\d+);/g, (_fldStrAll, fldStrNum: string) => {
      const fldNumCode = Number(fldStrNum);
      return Number.isSafeInteger(fldNumCode)
        ? String.fromCodePoint(Math.min(fldNumCode, 0x10ffff))
        : _fldStrAll;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_fldStrAll, fldStrHex: string) => {
      const fldNumCode = Number.parseInt(fldStrHex, 16);
      return Number.isSafeInteger(fldNumCode)
        ? String.fromCodePoint(Math.min(fldNumCode, 0x10ffff))
        : _fldStrAll;
    })
    .replace(
      /&([a-zA-Z]+);/g,
      (fldStrAll, fldStrName: string) =>
        fldObjEntityMap[fldStrName] ?? fldStrAll,
    );
}

export function fncConvStripTags(fldStrHtml: string): string {
  return fncConvDecodeEntities(
    fldStrHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

function fncConvJsonLdBlocks(fldStrHtml: string): unknown[] {
  const fldArrOut: unknown[] = [];
  const fldObjScript =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (;;) {
    const fldObjFound = fldObjScript.exec(fldStrHtml);
    if (fldObjFound === null || fldArrOut.length >= 5) {
      break;
    }
    try {
      fldArrOut.push(JSON.parse((fldObjFound[1] ?? '').trim()));
    } catch {
      // A broken block never blocks the next one.
    }
  }
  return fldArrOut;
}

function fncConvLdGraph(fldObjValue: unknown): Record<string, unknown>[] {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return [];
  }
  if (Array.isArray(fldObjValue)) {
    return fldObjValue.flatMap((fldObjEntry) => fncConvLdGraph(fldObjEntry));
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldObjGraph = fldObjRow['@graph'];
  if (fldObjGraph !== undefined) {
    return fncConvLdGraph(fldObjGraph);
  }
  return [fldObjRow];
}

function fncConvLdType(fldObjRow: Record<string, unknown>): string {
  const fldObjType = fldObjRow['@type'];
  if (typeof fldObjType === 'string') {
    return fldObjType.toLowerCase();
  }
  if (Array.isArray(fldObjType)) {
    for (const fldObjEntry of fldObjType) {
      if (typeof fldObjEntry === 'string') {
        return fldObjEntry.toLowerCase();
      }
    }
  }
  return '';
}

function fncConvLdPersonNames(fldObjValue: unknown): string[] {
  const fldArrItems = Array.isArray(fldObjValue) ? fldObjValue : [fldObjValue];
  const fldArrOut: string[] = [];
  for (const fldObjEntry of fldArrItems) {
    if (typeof fldObjEntry === 'string') {
      const fldStrText = fncConvCleanText(fldObjEntry);
      if (fldStrText !== null) {
        fldArrOut.push(fldStrText);
      }
      continue;
    }
    if (typeof fldObjEntry === 'object' && fldObjEntry !== null) {
      const fldStrName = fncConvCleanText(
        (fldObjEntry as Record<string, unknown>)['name'],
      );
      if (fldStrName !== null) {
        fldArrOut.push(fldStrName);
      }
    }
  }
  return fldArrOut;
}

export type fldObjParsedDetail = {
  title: string | null;
  authors: string[];
  publisher: string | null;
  language: string | null;
  publish_year: number | null;
  pages: number | null;
  isbn10: string | null;
  isbn13: string | null;
  edition: string | null;
};

function fncConvEmptyDetail(): fldObjParsedDetail {
  return {
    title: null,
    authors: [],
    publisher: null,
    language: null,
    publish_year: null,
    pages: null,
    isbn10: null,
    isbn13: null,
    edition: null,
  };
}

function fncConvIsbnPair(
  fldObjDetail: fldObjParsedDetail,
  fldObjValue: unknown,
): void {
  const fldStrStrict = fncConvCleanIsbnStrict(fldObjValue);
  if (fldStrStrict === null) {
    return;
  }
  if (fldStrStrict.length === 10 && fldObjDetail.isbn10 === null) {
    fldObjDetail.isbn10 = fldStrStrict;
  } else if (fldStrStrict.length === 13 && fldObjDetail.isbn13 === null) {
    fldObjDetail.isbn13 = fldStrStrict;
  }
}

function fncRunFillFromLd(
  fldObjDetail: fldObjParsedDetail,
  fldStrHtml: string,
): void {
  for (const fldObjBlock of fncConvJsonLdBlocks(fldStrHtml)) {
    for (const fldObjRow of fncConvLdGraph(fldObjBlock)) {
      const fldStrType = fncConvLdType(fldObjRow);
      if (fldStrType !== 'book' && fldStrType !== 'product') {
        continue;
      }
      if (fldObjDetail.title === null) {
        fldObjDetail.title = fncConvCleanText(fldObjRow['name']);
      }
      if (fldObjDetail.authors.length === 0) {
        fldObjDetail.authors = fncConvLdPersonNames(fldObjRow['author']);
      }
      if (fldObjDetail.publisher === null) {
        const fldObjPub = fldObjRow['publisher'];
        fldObjDetail.publisher = typeof fldObjPub === 'string'
          ? fncConvCleanText(fldObjPub)
          : fncConvLdPersonNames(fldObjPub)[0] ?? null;
      }
      if (fldObjDetail.language === null) {
        fldObjDetail.language = fncConvCleanLanguage(
          fldObjRow['inLanguage'],
        );
      }
      if (fldObjDetail.publish_year === null) {
        const fldStrDate = fncConvCleanText(fldObjRow['datePublished']);
        const fldObjFound = fldStrDate === null
          ? null
          : fldStrDate.match(/\d{4}/);
        fldObjDetail.publish_year = fldObjFound === null
          ? null
          : fncConvCleanYear(Number(fldObjFound[0]));
      }
      if (fldObjDetail.pages === null) {
        fldObjDetail.pages = typeof fldObjRow['numberOfPages'] === 'number' &&
            Number.isInteger(fldObjRow['numberOfPages']) &&
            (fldObjRow['numberOfPages'] as number) > 0
          ? (fldObjRow['numberOfPages'] as number)
          : null;
      }
      fncConvIsbnPair(fldObjDetail, fldObjRow['isbn']);
      if (fldObjDetail.edition === null) {
        fldObjDetail.edition = fncConvCleanText(
          fldObjRow['bookEdition'] ?? fldObjRow['edition'],
        );
      }
    }
  }
}

function fncConvMetaContent(
  fldStrHtml: string,
  fldStrKey: string,
): string | null {
  const fldObjTag = new RegExp(
    `<meta[^>]+(?:property|name)=["']${fldStrKey}["'][^>]*>`,
    'i',
  )
    .exec(fldStrHtml);
  if (fldObjTag === null) {
    return null;
  }
  const fldObjContent = /content=["']([^"']*)["']/i.exec(fldObjTag[0]);
  if (fldObjContent === null) {
    return null;
  }
  return fncConvCleanText(fncConvDecodeEntities(fldObjContent[1] ?? ''));
}

function fncRunFillFromMeta(
  fldObjDetail: fldObjParsedDetail,
  fldStrHtml: string,
): void {
  if (fldObjDetail.title === null) {
    fldObjDetail.title = fncConvMetaContent(fldStrHtml, 'og:title');
  }
  if (fldObjDetail.authors.length === 0) {
    for (
      const fldStrKey of ['book:author', 'author', 'article:author']
    ) {
      const fldStrAuthor = fncConvMetaContent(fldStrHtml, fldStrKey);
      if (fldStrAuthor !== null) {
        fldObjDetail.authors = [fldStrAuthor];
        break;
      }
    }
  }
  if (fldObjDetail.language === null) {
    fldObjDetail.language = fncConvCleanLanguage(
      fncConvMetaContent(fldStrHtml, 'og:locale')?.split('_')[0] ?? null,
    );
  }
  fncConvIsbnPair(
    fldObjDetail,
    fncConvMetaContent(fldStrHtml, 'books:isbn') ??
      fncConvMetaContent(fldStrHtml, 'book:isbn'),
  );
}

const fldArrLabelPublishers = [
  'publisher',
  'yayinevi',
  'yayınevi',
  'editor',
  'editore',
];
const fldArrLabelAuthors = [
  'author',
  'yazar',
  'escritor',
  'auteur',
  'autore',
  'schriftsteller',
];
const fldArrLabelIsbn = ['isbn', 'ean', 'asin'];
const fldArrLabelPages = ['pages', 'page count', 'sayfa', 'seiten', 'pagine'];
const fldArrLabelLanguage = ['language', 'dil', 'sprache', 'langue', 'lingua'];
const fldArrLabelEdition = [
  'edition',
  'baski',
  'baskı',
  'edicion',
  'edition',
  'auflage',
  'edizione',
];
const fldArrLabelYear = [
  'publication date',
  'publish date',
  'yayin tarihi',
  'yayın tarihi',
  'erscheinungsjahr',
  'date de publication',
];

function fncConvTablePairs(fldStrHtml: string): [string, string][] {
  const fldArrOut: [string, string][] = [];
  const fldObjRow =
    /<(?:tr|li|dt)[^>]*>([\s\S]*?)<\/(?:tr|li)>|<(dt)[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (;;) {
    const fldObjFound = fldObjRow.exec(fldStrHtml);
    if (fldObjFound === null || fldArrOut.length >= 60) {
      break;
    }
    const fldStrChunk = fldObjFound[1] ?? '';
    if (fldStrChunk !== '') {
      const fldArrCells: string[] = [];
      const fldObjCell =
        /<(?:td|th|span|div|b)[^>]*>([\s\S]*?)<\/(?:td|th|span|div|b)>/gi;
      for (;;) {
        const fldObjCellFound = fldObjCell.exec(fldStrChunk);
        if (fldObjCellFound === null || fldArrCells.length >= 4) {
          break;
        }
        fldArrCells.push(fncConvStripTags(fldObjCellFound[1] ?? ''));
      }
      if (fldArrCells.length >= 2) {
        fldArrOut.push([fldArrCells[0]!, fldArrCells.slice(1).join(' ')]);
      }
      continue;
    }
    const fldStrTerm = fncConvStripTags(fldObjFound[3] ?? '');
    const fldStrDef = fncConvStripTags(fldObjFound[4] ?? '');
    if (fldStrTerm !== '' && fldStrDef !== '') {
      fldArrOut.push([fldStrTerm, fldStrDef]);
    }
  }
  return fldArrOut;
}

function fncConvLabelHit(fldStrLabel: string, fldArrKeys: string[]): boolean {
  const fldStrNorm = fncConvNormalizeTitle(fldStrLabel);
  return fldArrKeys.some((fldStrKey) => fldStrNorm.includes(fldStrKey));
}

function fncRunFillFromTables(
  fldObjDetail: fldObjParsedDetail,
  fldStrHtml: string,
): void {
  for (const [fldStrLabel, fldStrValue] of fncConvTablePairs(fldStrHtml)) {
    if (
      fldObjDetail.publisher === null &&
      fncConvLabelHit(fldStrLabel, fldArrLabelPublishers)
    ) {
      fldObjDetail.publisher = fncConvCleanText(fldStrValue);
    } else if (
      fldObjDetail.authors.length === 0 &&
      fncConvLabelHit(fldStrLabel, fldArrLabelAuthors)
    ) {
      const fldStrAuthor = fncConvCleanText(fldStrValue);
      if (fldStrAuthor !== null) {
        fldObjDetail.authors = [fldStrAuthor];
      }
    } else if (fncConvLabelHit(fldStrLabel, fldArrLabelIsbn)) {
      fncConvIsbnPair(fldObjDetail, fldStrValue);
    } else if (
      fldObjDetail.pages === null &&
      fncConvLabelHit(fldStrLabel, fldArrLabelPages)
    ) {
      const fldObjFound = fldStrValue.match(/[\d.]+/);
      if (fldObjFound !== null) {
        const fldNumPages = Number(fldObjFound[0].replace(/\./g, ''));
        if (Number.isInteger(fldNumPages) && fldNumPages > 0) {
          fldObjDetail.pages = fldNumPages;
        }
      }
    } else if (
      fldObjDetail.language === null &&
      fncConvLabelHit(fldStrLabel, fldArrLabelLanguage)
    ) {
      fldObjDetail.language = fncConvCleanLanguage(fldStrValue);
    } else if (
      fldObjDetail.edition === null &&
      fncConvLabelHit(fldStrLabel, fldArrLabelEdition)
    ) {
      fldObjDetail.edition = fncConvCleanText(fldStrValue);
    } else if (
      fldObjDetail.publish_year === null &&
      fncConvLabelHit(fldStrLabel, fldArrLabelYear)
    ) {
      const fldObjFound = fldStrValue.match(/\d{4}/);
      fldObjDetail.publish_year = fldObjFound === null
        ? null
        : fncConvCleanYear(Number(fldObjFound[0]));
    }
  }
}

function fncRunFillFromText(
  fldObjDetail: fldObjParsedDetail,
  fldStrHtml: string,
): void {
  if (fldObjDetail.title !== null) {
    return;
  }
  const fldObjH1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(fldStrHtml);
  const fldStrH1 = fldObjH1 === null
    ? null
    : fncConvCleanText(fncConvStripTags(fldObjH1[1] ?? ''));
  if (fldStrH1 !== null && fldStrH1 !== '') {
    fldObjDetail.title = fldStrH1;
    return;
  }
  const fldObjTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(fldStrHtml);
  fldObjDetail.title = fldObjTitle === null ? null : fncConvCleanText(
    fncConvStripTags((fldObjTitle[1] ?? '').split('|')[0] ?? ''),
  );
}

export function fncConvParseDetail(
  fldStrHtml: string,
): fldObjParsedDetail {
  const fldObjDetail = fncConvEmptyDetail();
  fncRunFillFromLd(fldObjDetail, fldStrHtml);
  fncRunFillFromMeta(fldObjDetail, fldStrHtml);
  fncRunFillFromTables(fldObjDetail, fldStrHtml);
  fncRunFillFromText(fldObjDetail, fldStrHtml);
  return fldObjDetail;
}

export type fldObjHtmlOut = {
  candidates: fldObjSourceCandidate[];
  status: number | null;
  blocked: boolean;
  searchUrl: string | null;
};

const fldArrBlockMarkers = [
  'captch',
  'robot check',
  'enter the characters you see',
  'automated access',
  'bot detection',
  'verify you are a human',
];

export function fncConvPageBlocked(fldStrHtml: string): boolean {
  const fldStrLower = fldStrHtml.toLowerCase().slice(0, 20000);
  return fldArrBlockMarkers.some((fldStrMark) =>
    fldStrLower.includes(fldStrMark)
  );
}

function fncConvPageLinks(
  fldStrHtml: string,
  fldStrBase: string,
  fldObjPattern: RegExp,
  fldNumMax: number,
): string[] {
  const fldArrOut: string[] = [];
  const fldObjSeen = new Set<string>();
  const fldObjHref = /<a[^>]+href=["']([^"']+)["']/gi;
  for (;;) {
    const fldObjFound = fldObjHref.exec(fldStrHtml);
    if (fldObjFound === null || fldArrOut.length >= fldNumMax) {
      break;
    }
    const fldStrRaw = fncConvDecodeEntities(fldObjFound[1] ?? '').replace(
      /&amp;/g,
      '&',
    );
    if (fldStrRaw === '' || fldStrRaw.startsWith('#')) {
      continue;
    }
    let fldStrAbs: string;
    try {
      fldStrAbs = new URL(fldStrRaw, fldStrBase).toString();
    } catch {
      continue;
    }
    if (fldObjSeen.has(fldStrAbs) || !fldObjPattern.test(fldStrAbs)) {
      continue;
    }
    fldObjSeen.add(fldStrAbs);
    fldArrOut.push(fldStrAbs);
  }
  return fldArrOut;
}

function fncConvCandidateFromDetail(
  fldStrSource: string,
  fldStrKey: string,
  fldStrUrl: string,
  fldObjDetail: fldObjParsedDetail,
): fldObjSourceCandidate | null {
  if (fldObjDetail.title === null) {
    return null;
  }
  return {
    source: fldStrSource,
    source_key: fldStrKey,
    url: fldStrUrl,
    level: 'edition',
    title: fldObjDetail.title,
    title_norm: fncConvNormalizeTitle(fldObjDetail.title),
    authors: fldObjDetail.authors,
    publisher: fldObjDetail.publisher,
    language: fldObjDetail.language,
    edition: fldObjDetail.edition,
    publish_year: fldObjDetail.publish_year,
    pages: fldObjDetail.pages,
    isbn10: fldObjDetail.isbn10,
    isbn13: fldObjDetail.isbn13,
  };
}

async function fncRunDetails(
  fldStrSource: string,
  fldArrUrls: string[],
  fncConvKey: (fldStrUrl: string) => string,
): Promise<
  {
    candidates: fldObjSourceCandidate[];
    status: number | null;
    blocked: boolean;
  }
> {
  const fldArrOut: fldObjSourceCandidate[] = [];
  let fldNumStatus: number | null = null;
  for (const fldStrUrl of fldArrUrls) {
    const fldObjPage = await fncRunFetchHtml(fldStrUrl);
    fldNumStatus = fldObjPage.status;
    if (fldObjPage.html === null) {
      continue;
    }
    if (fncConvPageBlocked(fldObjPage.html)) {
      return { candidates: fldArrOut, status: fldNumStatus, blocked: true };
    }
    const fldObjDetail = fncConvParseDetail(fldObjPage.html);
    const fldObjCandidate = fncConvCandidateFromDetail(
      fldStrSource,
      fncConvKey(fldStrUrl),
      fldStrUrl,
      fldObjDetail,
    );
    if (fldObjCandidate !== null) {
      fldArrOut.push(fldObjCandidate);
    }
  }
  return { candidates: fldArrOut, status: fldNumStatus, blocked: false };
}

export const fldObjAmazonTlds: Record<string, string> = {
  tr: 'com.tr',
  us: 'com',
  uk: 'co.uk',
  jp: 'co.jp',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  nl: 'nl',
  pl: 'pl',
  se: 'se',
  ca: 'ca',
  br: 'com.br',
  ae: 'ae',
};

function fncConvAmazonAsin(fldStrUrl: string): string | null {
  const fldObjFound = /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/.exec(fldStrUrl);
  return fldObjFound === null ? null : (fldObjFound[1] ?? null);
}

export async function fncRunAmazon(
  fldStrCountry: string,
  fldStrIsbn10: string | null,
  fldStrTitle: string | null,
  fldStrAuthor: string | null,
): Promise<fldObjHtmlOut> {
  const fldStrTld = fldObjAmazonTlds[fldStrCountry] ?? 'com';
  const fldStrSource = `amazon_${fldStrCountry}`;
  const fldStrBase = `https://www.amazon.${fldStrTld}`;
  if (fldStrIsbn10 !== null) {
    const fldStrUrl = `${fldStrBase}/dp/${fldStrIsbn10}`;
    const fldObjOut = await fncRunDetails(
      fldStrSource,
      [fldStrUrl],
      (fldStrFound) => `asin:${fncConvAmazonAsin(fldStrFound) ?? fldStrIsbn10}`,
    );
    for (const fldObjCandidate of fldObjOut.candidates) {
      const fldStrAsin = fncConvAmazonAsin(fldObjCandidate.url);
      const fldStrStrict = fncConvCleanIsbnStrict(fldStrAsin);
      if (
        fldStrStrict !== null && fldStrStrict.length === 10 &&
        fldObjCandidate.isbn10 === null
      ) {
        fldObjCandidate.isbn10 = fldStrStrict;
      }
    }
    return { ...fldObjOut, searchUrl: null };
  }
  if (fldStrTitle === null) {
    return { candidates: [], status: null, blocked: false, searchUrl: null };
  }
  const fldStrQuery = fldStrAuthor === null
    ? fldStrTitle
    : `${fldStrTitle} ${fldStrAuthor}`;
  const fldStrSearch = `${fldStrBase}/s?k=${encodeURIComponent(fldStrQuery)}`;
  const fldObjSearch = await fncRunFetchHtml(fldStrSearch);
  if (fldObjSearch.html === null) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: false,
      searchUrl: fldStrSearch,
    };
  }
  if (fncConvPageBlocked(fldObjSearch.html)) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: true,
      searchUrl: fldStrSearch,
    };
  }
  const fldArrLinks = fncConvPageLinks(
    fldObjSearch.html,
    fldStrBase,
    /\/dp\/[A-Z0-9]{10}(?:[/?]|$)/,
    2,
  );
  const fldObjOut = await fncRunDetails(
    fldStrSource,
    fldArrLinks,
    (fldStrFound) => `asin:${fncConvAmazonAsin(fldStrFound) ?? 'unknown'}`,
  );
  for (const fldObjCandidate of fldObjOut.candidates) {
    const fldStrAsin = fncConvAmazonAsin(fldObjCandidate.url);
    const fldStrStrict = fncConvCleanIsbnStrict(fldStrAsin);
    if (
      fldStrStrict !== null && fldStrStrict.length === 10 &&
      fldObjCandidate.isbn10 === null
    ) {
      fldObjCandidate.isbn10 = fldStrStrict;
    }
  }
  return { ...fldObjOut, searchUrl: fldStrSearch };
}

export async function fncRunKitapyurdu(
  fldStrTerm: string,
): Promise<fldObjHtmlOut> {
  const fldStrBase = 'https://www.kitapyurdu.com';
  const fldStrSearch =
    `${fldStrBase}/index.php?route=product/list&filter_name=${
      encodeURIComponent(fldStrTerm)
    }`;
  const fldObjSearch = await fncRunFetchHtml(fldStrSearch);
  if (fldObjSearch.html === null) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: false,
      searchUrl: fldStrSearch,
    };
  }
  if (fncConvPageBlocked(fldObjSearch.html)) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: true,
      searchUrl: fldStrSearch,
    };
  }
  const fldArrLinks = fncConvPageLinks(
    fldObjSearch.html,
    fldStrBase,
    /\/kitap\/[^"']*\/\d+\.html/i,
    2,
  );
  const fldObjOut = await fncRunDetails(
    'kitapyurdu',
    fldArrLinks,
    (fldStrFound) => {
      const fldObjId = /\/(\d+)\.html/i.exec(fldStrFound);
      if (fldObjId !== null) {
        return `id:${fldObjId[1]}`;
      }
      const fldObjLegacy = /product_id=(\d+)/i.exec(fldStrFound);
      if (fldObjLegacy !== null) {
        return `product:${fldObjLegacy[1]}`;
      }
      return `slug:${fldStrFound}`;
    },
  );
  return { ...fldObjOut, searchUrl: fldStrSearch };
}

export async function fncRunNadirkitap(
  fldStrTerm: string,
): Promise<fldObjHtmlOut> {
  const fldStrBase = 'https://www.nadirkitap.com';
  const fldStrSearch = `${fldStrBase}/kitapara.php?ara=${
    encodeURIComponent(fldStrTerm)
  }`;
  const fldObjSearch = await fncRunFetchHtml(fldStrSearch);
  if (fldObjSearch.html === null) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: false,
      searchUrl: fldStrSearch,
    };
  }
  if (fncConvPageBlocked(fldObjSearch.html)) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: true,
      searchUrl: fldStrSearch,
    };
  }
  const fldArrLinks = fncConvPageLinks(
    fldObjSearch.html,
    fldStrBase,
    /-kitap\d+\.html$/i,
    2,
  );
  const fldObjOut = await fncRunDetails(
    'nadirkitap',
    fldArrLinks,
    (fldStrFound) => {
      const fldObjId = /-kitap(\d+)\.html$/i.exec(fldStrFound);
      return `book:${fldObjId?.[1] ?? fldStrFound}`;
    },
  );
  return { ...fldObjOut, searchUrl: fldStrSearch };
}

export type fldObjOrderedSource =
  | { kind: 'amazon'; country: string }
  | { kind: 'kitapyurdu' }
  | { kind: 'nadirkitap' }
  | { kind: 'openlibrary' }
  | { kind: 'googlebooks' }
  | { kind: 'abebooks' };

export function fncConvSourceOrder(
  fldStrLanguage: string | null,
): fldObjOrderedSource[] {
  const fldStrLang = (fldStrLanguage ?? '').toLowerCase();
  if (fldStrLang === 'tr') {
    return [
      { kind: 'amazon', country: 'tr' },
      { kind: 'amazon', country: 'us' },
      { kind: 'kitapyurdu' },
      { kind: 'openlibrary' },
      { kind: 'googlebooks' },
    ];
  }
  if (fldStrLang === 'en') {
    return [
      { kind: 'amazon', country: 'us' },
      { kind: 'amazon', country: 'uk' },
      { kind: 'openlibrary' },
      { kind: 'googlebooks' },
      { kind: 'amazon', country: 'ca' },
      { kind: 'nadirkitap' },
    ];
  }
  if (fldStrLang === 'ja') {
    return [
      { kind: 'amazon', country: 'jp' },
      { kind: 'amazon', country: 'us' },
      { kind: 'openlibrary' },
      { kind: 'googlebooks' },
    ];
  }
  const fldObjLocalAmazon: Record<string, string> = {
    de: 'de',
    fr: 'fr',
    es: 'es',
    ar: 'ae',
    it: 'it',
    pt: 'br',
    nl: 'nl',
    pl: 'pl',
    sv: 'se',
    se: 'se',
  };
  const fldStrLocal = fldObjLocalAmazon[fldStrLang];
  if (fldStrLocal !== undefined) {
    return [
      { kind: 'amazon', country: fldStrLocal },
      { kind: 'amazon', country: 'us' },
      { kind: 'openlibrary' },
      { kind: 'googlebooks' },
      { kind: 'abebooks' },
    ];
  }
  return [
    { kind: 'amazon', country: 'us' },
    { kind: 'openlibrary' },
    { kind: 'googlebooks' },
    { kind: 'nadirkitap' },
  ];
}

export async function fncRunAbebooks(
  fldStrTerm: string,
): Promise<fldObjHtmlOut> {
  const fldStrBase = 'https://www.abebooks.com';
  const fldStrSearch = `${fldStrBase}/servlet/SearchResults?kn=${
    encodeURIComponent(fldStrTerm)
  }`;
  const fldObjSearch = await fncRunFetchHtml(fldStrSearch);
  if (fldObjSearch.html === null) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: false,
      searchUrl: fldStrSearch,
    };
  }
  if (fncConvPageBlocked(fldObjSearch.html)) {
    return {
      candidates: [],
      status: fldObjSearch.status,
      blocked: true,
      searchUrl: fldStrSearch,
    };
  }
  const fldArrLinks = fncConvPageLinks(
    fldObjSearch.html,
    fldStrBase,
    /BookDetailsPL\?bi=/i,
    2,
  );
  const fldObjOut = await fncRunDetails(
    'abebooks',
    fldArrLinks,
    (fldStrFound) => {
      const fldObjId = /[?&]bi=(\d+)/i.exec(fldStrFound);
      return `bi:${fldObjId?.[1] ?? fldStrFound}`;
    },
  );
  return { ...fldObjOut, searchUrl: fldStrSearch };
}
