// Logosphere BITS — price sighting tests (Deno).

import { assertStrictEquals } from '@std/assert';
import {
  type fldObjPriceObservation,
  fncConvAmountToMinor,
  fncConvFxDate,
  fncConvParseOffers,
  fncConvRayic,
} from './prices.ts';

function fncTstObservation(
  fldNumUsd: number | null,
  fldStrMarket: 'new' | 'used' | null,
): fldObjPriceObservation {
  return {
    amount_minor: 100,
    currency: 'USD',
    usd_minor: fldNumUsd,
    source: 's',
    url: 'https://example.test/p',
    market: fldStrMarket,
    observed_at: '2026-11-04T00:00:00.000Z',
    rate: 1,
    rate_date: '2026-11-04',
  };
}

Deno.test('price: parses single JSON-LD offer with new condition', () => {
  const fldArrOffers = fncConvParseOffers(
    '<script type="application/ld+json">' +
      '{"@type":"Book","offers":{"@type":"Offer","price":19.99,' +
      '"priceCurrency":"USD","itemCondition":' +
      '"https://schema.org/NewCondition"}}</script>',
  );
  assertStrictEquals(fldArrOffers.length, 1);
  assertStrictEquals(fldArrOffers[0]!.amountMajor, 19.99);
  assertStrictEquals(fldArrOffers[0]!.currency, 'USD');
  assertStrictEquals(fldArrOffers[0]!.market, 'new');
});

Deno.test('price: parses offers inside @graph and used condition', () => {
  const fldArrOffers = fncConvParseOffers(
    '<script type="application/ld+json">{"@graph":[' +
      '{"@type":"Product","offers":[{"@type":"Offer","price":"434,70",' +
      '"priceCurrency":"try","itemCondition":' +
      '"https://schema.org/UsedCondition"}]}]}</script>',
  );
  assertStrictEquals(fldArrOffers.length, 1);
  assertStrictEquals(fldArrOffers[0]!.amountMajor, 434.7);
  assertStrictEquals(fldArrOffers[0]!.currency, 'TRY');
  assertStrictEquals(fldArrOffers[0]!.market, 'used');
});

Deno.test('price: skips aggregate offers and loose page numbers', () => {
  const fldArrOffers = fncConvParseOffers(
    '<script type="application/ld+json">' +
      '{"@type":"Product","offers":{"@type":"AggregateOffer",' +
      '"lowPrice":5,"priceCurrency":"USD"}}</script>' +
      '<p>Only 12 left, was 99.99 elsewhere</p>',
  );
  assertStrictEquals(fldArrOffers.length, 0);
});

Deno.test('price: meta price tags are fallback only', () => {
  const fldArrOffers = fncConvParseOffers(
    '<meta property="product:price:amount" content="1,234.56">' +
      '<meta property="product:price:currency" content="usd">',
  );
  assertStrictEquals(fldArrOffers.length, 1);
  assertStrictEquals(fldArrOffers[0]!.amountMajor, 1234.56);
  assertStrictEquals(fldArrOffers[0]!.currency, 'USD');
  assertStrictEquals(fldArrOffers[0]!.market, null);
});

Deno.test('price: TR thousands format parses as major units', () => {
  const fldArrOffers = fncConvParseOffers(
    '<meta property="product:price:amount" content="1.234,56">' +
      '<meta property="product:price:currency" content="TRY">',
  );
  assertStrictEquals(fldArrOffers[0]!.amountMajor, 1234.56);
});

Deno.test('price: zero or missing price is not an offer', () => {
  assertStrictEquals(
    fncConvParseOffers(
      '<script type="application/ld+json">{"@type":"Offer","price":0,' +
        '"priceCurrency":"USD"}</script>',
    ).length,
    0,
  );
  assertStrictEquals(
    fncConvParseOffers(
      '<script type="application/ld+json">{"@type":"Offer","price":9,' +
        '"priceCurrency":""}</script>',
    ).length,
    0,
  );
});

Deno.test('price: minor conversion rounds and honors zero-decimal', () => {
  assertStrictEquals(fncConvAmountToMinor(19.99, 'USD'), 1999);
  assertStrictEquals(fncConvAmountToMinor(19.995, 'USD'), 2000);
  assertStrictEquals(fncConvAmountToMinor(1500, 'JPY'), 1500);
  assertStrictEquals(fncConvAmountToMinor(0, 'USD'), null);
  assertStrictEquals(fncConvAmountToMinor(-5, 'USD'), null);
});

Deno.test('price: FX dates land as YYYY-MM-DD or today', () => {
  assertStrictEquals(
    fncConvFxDate('Wed, 04 Nov 2026 00:00:01 +0000'),
    '2026-11-04',
  );
  assertStrictEquals(
    fncConvFxDate('not a date'),
    new Date().toISOString().slice(0, 10),
  );
  assertStrictEquals(
    fncConvFxDate(null),
    new Date().toISOString().slice(0, 10),
  );
});

Deno.test('price: empty sightings leave every rayic leg null', () => {
  const fldObjRayic = fncConvRayic([], 'Good');
  assertStrictEquals(fldObjRayic.min, null);
  assertStrictEquals(fldObjRayic.max, null);
  assertStrictEquals(fldObjRayic.median, null);
  assertStrictEquals(fldObjRayic.recommended, null);
  assertStrictEquals(fldObjRayic.count, 0);
});

Deno.test('price: FX-less sightings never poison the rayic', () => {
  const fldObjRayic = fncConvRayic(
    [fncTstObservation(null, 'new'), fncTstObservation(1000, 'new')],
    null,
  );
  assertStrictEquals(fldObjRayic.min, 1000);
  assertStrictEquals(fldObjRayic.count, 1);
});

Deno.test('price: rayic is deterministic min/max/upper-median', () => {
  const fldObjRayic = fncConvRayic(
    [
      fncTstObservation(3000, 'new'),
      fncTstObservation(1000, 'used'),
      fncTstObservation(2000, 'used'),
    ],
    null,
  );
  assertStrictEquals(fldObjRayic.min, 1000);
  assertStrictEquals(fldObjRayic.max, 3000);
  assertStrictEquals(fldObjRayic.median, 2000);
  assertStrictEquals(fldObjRayic.recommended, 2000);
  assertStrictEquals(fldObjRayic.count, 3);
});

Deno.test('price: used copy prices used sightings only', () => {
  const fldObjRayic = fncConvRayic(
    [
      fncTstObservation(5000, 'new'),
      fncTstObservation(1000, 'used'),
      fncTstObservation(1500, 'used'),
    ],
    'Good, pencil marks',
  );
  assertStrictEquals(fldObjRayic.min, 1000);
  assertStrictEquals(fldObjRayic.max, 1500);
  assertStrictEquals(fldObjRayic.count, 2);
});

Deno.test('price: new copy keeps the full pool', () => {
  const fldObjRayic = fncConvRayic(
    [
      fncTstObservation(5000, 'new'),
      fncTstObservation(1000, 'used'),
    ],
    'Like New',
  );
  assertStrictEquals(fldObjRayic.min, 1000);
  assertStrictEquals(fldObjRayic.max, 5000);
  assertStrictEquals(fldObjRayic.count, 2);
});

Deno.test('price: used copy without used sightings falls back', () => {
  const fldObjRayic = fncConvRayic(
    [fncTstObservation(5000, 'new')],
    'Fair',
  );
  assertStrictEquals(fldObjRayic.min, 5000);
  assertStrictEquals(fldObjRayic.count, 1);
});
