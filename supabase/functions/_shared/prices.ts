// Logosphere BITS — price observation gathering (shared).
// Real sightings only: Google Books sale info plus the
// detail pages of already-accepted catalog candidates,
// parsed from schema.org Offer nodes (meta price tags as
// fallback). Search-result snippets, ads, shipping fees,
// and other products' prices never qualify. Foreign
// amounts convert through one dated public rate per
// currency; when the rate is unreachable the observation
// stays in its own currency with no USD leg. The rayic is
// a deterministic min/max/median over valid USD legs.
// Identifiers follow D6.

import { fncConvCleanText, fncConvMedianMinor } from './mapping.ts';

export type fldObjPriceOffer = {
  amountMajor: number;
  currency: string;
  market: 'new' | 'used' | null;
};

function fncConvLdNodes(fldObjValue: unknown): Record<string, unknown>[] {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return [];
  }
  if (Array.isArray(fldObjValue)) {
    return fldObjValue.flatMap((fldObjEntry) => fncConvLdNodes(fldObjEntry));
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldObjGraph = fldObjRow['@graph'];
  if (fldObjGraph !== undefined) {
    return fncConvLdNodes(fldObjGraph);
  }
  return [fldObjRow];
}

function fncConvOfferMarket(fldObjValue: unknown): 'new' | 'used' | null {
  const fldStrText = typeof fldObjValue === 'string' ? fldObjValue : null;
  if (fldStrText === null) {
    return null;
  }
  if (/NewCondition/i.test(fldStrText)) {
    return 'new';
  }
  if (/UsedCondition|RefurbishedCondition/i.test(fldStrText)) {
    return 'used';
  }
  return null;
}

function fncConvOfferAmount(fldObjValue: unknown): number | null {
  if (typeof fldObjValue === 'number' && Number.isFinite(fldObjValue)) {
    return fldObjValue > 0 ? fldObjValue : null;
  }
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrText = fldObjValue.replace(/[^\d.,]/g, '');
  if (fldStrText === '') {
    return null;
  }
  const fldNumLastDot = fldStrText.lastIndexOf('.');
  const fldNumLastComma = fldStrText.lastIndexOf(',');
  let fldStrNorm = fldStrText;
  if (fldNumLastDot >= 0 && fldNumLastComma >= 0) {
    const fldStrDec = fldNumLastDot > fldNumLastComma ? '.' : ',';
    const fldStrGrp = fldStrDec === '.' ? ',' : '.';
    fldStrNorm = fldStrText.split(fldStrGrp).join('').replace(fldStrDec, '.');
  } else if (fldNumLastComma >= 0) {
    fldStrNorm = fldStrText.replace(',', '.');
  }
  const fldNumOut = Number(fldStrNorm);
  return Number.isFinite(fldNumOut) && fldNumOut > 0 ? fldNumOut : null;
}

function fncConvOfferNode(
  fldObjValue: unknown,
): fldObjPriceOffer | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  const fldObjRow = fldObjValue as Record<string, unknown>;
  const fldStrType = typeof fldObjRow['@type'] === 'string'
    ? (fldObjRow['@type'] as string).toLowerCase()
    : '';
  if (fldStrType !== '' && fldStrType !== 'offer') {
    return null;
  }
  const fldNumAmount = fncConvOfferAmount(fldObjRow['price']);
  const fldStrCurrency = fncConvCleanText(fldObjRow['priceCurrency']);
  if (fldNumAmount === null || fldStrCurrency === null) {
    return null;
  }
  return {
    amountMajor: fldNumAmount,
    currency: fldStrCurrency.toUpperCase(),
    market: fncConvOfferMarket(fldObjRow['itemCondition']),
  };
}

function fncConvMetaPrice(
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
  return fldObjContent === null ? null : (fldObjContent[1] ?? null);
}

export function fncConvParseOffers(fldStrHtml: string): fldObjPriceOffer[] {
  const fldArrOut: fldObjPriceOffer[] = [];
  const fldObjScript =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (;;) {
    const fldObjFound = fldObjScript.exec(fldStrHtml);
    if (fldObjFound === null || fldArrOut.length >= 4) {
      break;
    }
    let fldObjJson: unknown;
    try {
      fldObjJson = JSON.parse((fldObjFound[1] ?? '').trim());
    } catch {
      continue;
    }
    for (const fldObjNode of fncConvLdNodes(fldObjJson)) {
      const fldObjOffers = fldObjNode['offers'];
      const fldArrOffers = Array.isArray(fldObjOffers)
        ? fldObjOffers
        : [fldObjOffers];
      for (const fldObjOffer of fldArrOffers) {
        const fldObjParsed = fncConvOfferNode(fldObjOffer);
        if (fldObjParsed !== null && fldArrOut.length < 4) {
          fldArrOut.push(fldObjParsed);
        }
      }
    }
  }
  if (fldArrOut.length === 0) {
    const fldNumAmount = fncConvOfferAmount(
      fncConvMetaPrice(fldStrHtml, 'product:price:amount') ??
        fncConvMetaPrice(fldStrHtml, 'og:price:amount'),
    );
    const fldStrCurrency = fncConvCleanText(
      fncConvMetaPrice(fldStrHtml, 'product:price:currency') ??
        fncConvMetaPrice(fldStrHtml, 'og:price:currency'),
    );
    if (fldNumAmount !== null && fldStrCurrency !== null) {
      fldArrOut.push({
        amountMajor: fldNumAmount,
        currency: fldStrCurrency.toUpperCase(),
        market: null,
      });
    }
  }
  return fldArrOut;
}

const fldArrZeroDecimal = [
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'PYG',
  'RWF',
  'UGX',
  'XAF',
  'XOF',
  'XPF',
];

export function fncConvAmountToMinor(
  fldNumMajor: number,
  fldStrCurrency: string,
): number | null {
  if (!Number.isFinite(fldNumMajor) || fldNumMajor <= 0) {
    return null;
  }
  const fldStrCode = fldStrCurrency.toUpperCase();
  const fldNumMinor = fldArrZeroDecimal.includes(fldStrCode)
    ? Math.round(fldNumMajor)
    : Math.round(fldNumMajor * 100);
  return fldNumMinor > 0 ? fldNumMinor : null;
}

export type fldObjFxRate = {
  rate: number;
  date: string;
};

export function fncConvFxDate(fldObjValue: unknown): string {
  const fldStrToday = new Date().toISOString().slice(0, 10);
  if (typeof fldObjValue !== 'string' || fldObjValue.trim() === '') {
    return fldStrToday;
  }
  const fldNumTime = Date.parse(fldObjValue);
  if (!Number.isFinite(fldNumTime)) {
    return fldStrToday;
  }
  return new Date(fldNumTime).toISOString().slice(0, 10);
}

export async function fncRunFxToUsd(
  fldStrCurrency: string,
  fldObjCache: Map<string, fldObjFxRate | null>,
): Promise<fldObjFxRate | null> {
  const fldStrCode = fldStrCurrency.toUpperCase();
  if (fldStrCode === 'USD') {
    return { rate: 1, date: new Date().toISOString().slice(0, 10) };
  }
  if (fldObjCache.has(fldStrCode)) {
    return fldObjCache.get(fldStrCode) ?? null;
  }
  try {
    const fldObjResponse = await fetch(
      `https://open.er-api.com/v6/latest/${fldStrCode}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!fldObjResponse.ok) {
      fldObjCache.set(fldStrCode, null);
      return null;
    }
    const fldObjBody = await fldObjResponse.json() as {
      result?: unknown;
      rates?: Record<string, unknown>;
      time_last_update_utc?: unknown;
    };
    const fldNumRate = fldObjBody.rates?.['USD'];
    const fldStrDate = fncConvFxDate(fldObjBody.time_last_update_utc);
    if (
      fldObjBody.result !== 'success' || typeof fldNumRate !== 'number' ||
      !Number.isFinite(fldNumRate) || fldNumRate <= 0
    ) {
      fldObjCache.set(fldStrCode, null);
      return null;
    }
    const fldObjOut = { rate: fldNumRate, date: fldStrDate };
    fldObjCache.set(fldStrCode, fldObjOut);
    return fldObjOut;
  } catch {
    fldObjCache.set(fldStrCode, null);
    return null;
  }
}

export type fldObjPriceObservation = {
  amount_minor: number;
  currency: string;
  usd_minor: number | null;
  source: string;
  url: string;
  market: 'new' | 'used' | null;
  observed_at: string;
  rate: number | null;
  rate_date: string | null;
};

async function fncRunFetchText(fldStrUrl: string): Promise<string | null> {
  try {
    const fldObjResponse = await fetch(fldStrUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!fldObjResponse.ok) {
      return null;
    }
    return await fldObjResponse.text();
  } catch {
    return null;
  }
}

export async function fncRunGbSaleInfo(
  fldStrIsbn: string,
): Promise<fldObjPriceOffer[]> {
  const fldStrUrl =
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${fldStrIsbn}&maxResults=1`;
  let fldObjBody: unknown;
  try {
    const fldObjResponse = await fetch(fldStrUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!fldObjResponse.ok) {
      return [];
    }
    fldObjBody = await fldObjResponse.json();
  } catch {
    return [];
  }
  if (typeof fldObjBody !== 'object' || fldObjBody === null) {
    return [];
  }
  const fldObjItems = (fldObjBody as Record<string, unknown>)['items'];
  if (!Array.isArray(fldObjItems) || fldObjItems.length === 0) {
    return [];
  }
  const fldObjFirst = fldObjItems[0];
  if (typeof fldObjFirst !== 'object' || fldObjFirst === null) {
    return [];
  }
  const fldObjSale = (fldObjFirst as Record<string, unknown>)['saleInfo'];
  if (typeof fldObjSale !== 'object' || fldObjSale === null) {
    return [];
  }
  const fldObjSaleRow = fldObjSale as Record<string, unknown>;
  if (fldObjSaleRow['saleability'] !== 'FOR_SALE') {
    return [];
  }
  for (const fldStrKey of ['retailPrice', 'listPrice']) {
    const fldObjPrice = fldObjSaleRow[fldStrKey];
    if (typeof fldObjPrice !== 'object' || fldObjPrice === null) {
      continue;
    }
    const fldObjRow = fldObjPrice as Record<string, unknown>;
    const fldNumAmount = fncConvOfferAmount(fldObjRow['amount']);
    const fldStrCurrency = fncConvCleanText(fldObjRow['currencyCode']);
    if (fldNumAmount !== null && fldStrCurrency !== null) {
      return [{
        amountMajor: fldNumAmount,
        currency: fldStrCurrency.toUpperCase(),
        market: 'new',
      }];
    }
  }
  return [];
}

export async function fncRunGatherObservations(
  fldStrIsbn: string | null,
  fldArrDetailUrls: { source: string; url: string }[],
  fldObjFxCache: Map<string, fldObjFxRate | null>,
): Promise<fldObjPriceObservation[]> {
  const fldArrFound: (fldObjPriceOffer & { source: string; url: string })[] =
    [];
  if (fldStrIsbn !== null) {
    for (const fldObjOffer of await fncRunGbSaleInfo(fldStrIsbn)) {
      fldArrFound.push({
        ...fldObjOffer,
        source: 'googlebooks',
        url: `https://www.googleapis.com/books/v1/volumes?q=isbn:${fldStrIsbn}`,
      });
    }
  }
  for (
    const fldObjTarget of fldArrDetailUrls.slice(0, 3)
  ) {
    const fldStrHtml = await fncRunFetchText(fldObjTarget.url);
    if (fldStrHtml === null) {
      continue;
    }
    const fldArrOffers = fncConvParseOffers(fldStrHtml);
    if (fldArrOffers.length > 0) {
      fldArrFound.push({
        ...fldArrOffers[0]!,
        source: fldObjTarget.source,
        url: fldObjTarget.url,
      });
    }
  }
  const fldArrOut: fldObjPriceObservation[] = [];
  const fldStrNow = new Date().toISOString();
  for (const fldObjFound of fldArrFound) {
    const fldNumMinor = fncConvAmountToMinor(
      fldObjFound.amountMajor,
      fldObjFound.currency,
    );
    if (fldNumMinor === null) {
      continue;
    }
    const fldObjFx = await fncRunFxToUsd(fldObjFound.currency, fldObjFxCache);
    const fldNumDecimals = fldArrZeroDecimal.includes(fldObjFound.currency)
      ? 0
      : 2;
    const fldNumUsd = fldObjFx === null ? null : Math.round(
      (fldNumMinor / (10 ** fldNumDecimals)) * fldObjFx.rate * 100,
    );
    fldArrOut.push({
      amount_minor: fldNumMinor,
      currency: fldObjFound.currency,
      usd_minor: fldNumUsd === null || fldNumUsd <= 0 ? null : fldNumUsd,
      source: fldObjFound.source,
      url: fldObjFound.url,
      market: fldObjFound.market,
      observed_at: fldStrNow,
      rate: fldObjFx?.rate ?? null,
      rate_date: fldObjFx?.date ?? null,
    });
  }
  return fldArrOut;
}

export function fncConvNewMedian(
  fldArrObservations: fldObjPriceObservation[],
): number | null {
  return fncConvMedianMinor(
    fldArrObservations
      .filter((fldObjOb) => fldObjOb.market === 'new')
      .map((fldObjOb) => fldObjOb.usd_minor),
  );
}

export type fldObjRayic = {
  min: number | null;
  max: number | null;
  median: number | null;
  recommended: number | null;
  count: number;
};

export function fncConvRayic(
  fldArrObservations: fldObjPriceObservation[],
  fldStrCondition: string | null,
): fldObjRayic {
  const fldArrValid = fldArrObservations.filter(
    (fldObjOb) => fldObjOb.usd_minor !== null && fldObjOb.usd_minor > 0,
  );
  if (fldArrValid.length === 0) {
    return { min: null, max: null, median: null, recommended: null, count: 0 };
  }
  const fldBooCopyNew = fldStrCondition === null || fldStrCondition === '' ||
    /\bnew\b/i.test(fldStrCondition);
  const fldArrUsed = fldArrValid.filter((fldObjOb) =>
    fldObjOb.market === 'used'
  );
  const fldArrPool = !fldBooCopyNew && fldArrUsed.length > 0
    ? fldArrUsed
    : fldArrValid;
  const fldArrLegs = fldArrPool.map((fldObjOb) => fldObjOb.usd_minor!);
  const fldNumMedian = fncConvMedianMinor(fldArrLegs);
  return {
    min: Math.min(...fldArrLegs),
    max: Math.max(...fldArrLegs),
    median: fldNumMedian,
    recommended: fldNumMedian,
    count: fldArrPool.length,
  };
}
