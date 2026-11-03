// Logosphere BITS — Muse answer mapping tests (Deno).
// Pure sanitizer checks: blanks become null, years/counts
// stay ranged, ISBNs normalize, prices convert major to
// minor, currencies fall back to USD.

import { assertEquals } from '@std/assert';
import {
  fncConvCleanContributors,
  fncConvCleanCount,
  fncConvCleanCurrency,
  fncConvCleanDuplicateGroups,
  fncConvCleanIsbn,
  fncConvCleanPhotoRead,
  fncConvCleanPriceBands,
  fncConvCleanResult,
  fncConvCleanText,
  fncConvCleanYear,
  fncConvMajorToMinor,
  fncConvMedianMinor,
} from './mapping.ts';

Deno.test('text cleaner blanks unknowns', () => {
  assertEquals(fncConvCleanText('  Title  '), 'Title');
  assertEquals(fncConvCleanText('   '), null);
  assertEquals(fncConvCleanText(42), null);
  assertEquals(fncConvCleanText(null), null);
});

Deno.test('year cleaner ranges centuries', () => {
  assertEquals(fncConvCleanYear(2026), 2026);
  assertEquals(fncConvCleanYear(999), null);
  assertEquals(fncConvCleanYear(2101), null);
  assertEquals(fncConvCleanYear(2026.5), null);
  assertEquals(fncConvCleanYear('2026'), null);
});

Deno.test('count cleaner ranges pages', () => {
  assertEquals(fncConvCleanCount(300), 300);
  assertEquals(fncConvCleanCount(-1), null);
  assertEquals(fncConvCleanCount(100001), null);
});

Deno.test('isbn cleaner keeps digit runs', () => {
  assertEquals(fncConvCleanIsbn('978-975-08-1234-5'), '9789750812345');
  assertEquals(fncConvCleanIsbn('975-08-1234-X'), '975081234X');
  assertEquals(fncConvCleanIsbn('no isbn here'), null);
  assertEquals(fncConvCleanIsbn('123'), null);
});

Deno.test('contributor cleaner drops nameless entries', () => {
  assertEquals(
    fncConvCleanContributors([
      { name: 'Demo Author', role: 'author' },
      { name: '  ', role: 'editor' },
      { name: null, role: 'editor' },
      'not-an-object',
    ]),
    [{ name: 'Demo Author', role: 'author' }],
  );
  assertEquals(fncConvCleanContributors('nope'), []);
});

Deno.test('photo read cleaner maps the full schema', () => {
  const fldObjRead = fncConvCleanPhotoRead({
    title: '  Codex ',
    isbn13: '978-975-08-1234-5',
    publication_year: 2026,
    page_count: 'many',
    contributors: [{ name: 'A', role: null }],
    unknown_field: 'dropped',
  });
  assertEquals(fldObjRead.title, 'Codex');
  assertEquals(fldObjRead.isbn13, '9789750812345');
  assertEquals(fldObjRead.publication_year, 2026);
  assertEquals(fldObjRead.page_count, null);
  assertEquals(fldObjRead.contributors, [{ name: 'A', role: null }]);
  assertEquals(fldObjRead.publisher, null);
});

Deno.test('result cleaner gates confidence to unit range', () => {
  assertEquals(
    fncConvCleanResult({ confidence: 0.8, rationale: '  lens  ' }).confidence,
    0.8,
  );
  assertEquals(fncConvCleanResult({ confidence: 2 }).confidence, null);
  assertEquals(
    fncConvCleanResult({ rationale: '  lens  ' }).rationale,
    'lens',
  );
});

Deno.test('currency cleaner falls back to USD', () => {
  assertEquals(fncConvCleanCurrency('eur'), 'EUR');
  assertEquals(fncConvCleanCurrency('TL'), 'TRY');
  assertEquals(fncConvCleanCurrency(''), 'USD');
  assertEquals(fncConvCleanCurrency('dollars'), 'USD');
  assertEquals(fncConvCleanCurrency(null), 'USD');
});

Deno.test('major converter rounds to minor cents', () => {
  assertEquals(fncConvMajorToMinor(19.99), 1999);
  assertEquals(fncConvMajorToMinor(19.995), 2000);
  assertEquals(fncConvMajorToMinor(-1), null);
  assertEquals(fncConvMajorToMinor('19.99'), null);
  assertEquals(fncConvMajorToMinor(null), null);
});

Deno.test('price bands cleaner maps every band', () => {
  assertEquals(
    fncConvCleanPriceBands({
      replacement_new: 19.99,
      market_min: null,
      market_max: 'high',
      market_median: 8,
      market_recommended: 9.5,
      currency: 'usd',
    }),
    {
      replacement_new: 1999,
      market_min: null,
      market_max: null,
      market_median: 800,
      market_recommended: 950,
      currency: 'USD',
      confidence: null,
      basis: 'ai-estimate',
    },
  );
});

Deno.test('price confidence caps knowledge estimates at half', () => {
  assertEquals(
    fncConvCleanPriceBands({ confidence: 0.9 }).confidence,
    0.5,
  );
  assertEquals(
    fncConvCleanPriceBands({ confidence: 0.3 }).confidence,
    0.3,
  );
  assertEquals(fncConvCleanPriceBands({}).confidence, null);
});

Deno.test('median keeps the middle of known bands', () => {
  assertEquals(fncConvMedianMinor([100, null, 300]), 200);
  assertEquals(fncConvMedianMinor([300, 100]), 200);
  assertEquals(fncConvMedianMinor([null, null]), null);
});

Deno.test('duplicate cleaner keeps valid groups only', () => {
  assertEquals(
    fncConvCleanDuplicateGroups(
      {
        groups: [
          { members: [1, 0], reason: 'same ISBN', confidence: 0.9 },
          { members: [0, 2], reason: 'reused index', confidence: 0.5 },
          { members: [5], reason: 'single', confidence: 0.5 },
          { members: 'nope', reason: 'bad shape', confidence: 0.5 },
        ],
      },
      3,
    ),
    [{ members: [0, 1], reason: 'same ISBN', confidence: 0.9 }],
  );
  assertEquals(fncConvCleanDuplicateGroups({}, 3), []);
});
