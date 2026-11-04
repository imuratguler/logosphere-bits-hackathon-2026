// Logosphere BITS — Muse answer mapping tests (Deno).
// Pure sanitizer checks: blanks become null, years/counts
// stay ranged, ISBNs normalize, prices convert major to
// minor, currencies fall back to USD.

import { assertEquals } from '@std/assert';
import {
  fncConvCleanCode,
  fncConvCleanContributors,
  fncConvCleanCount,
  fncConvCleanCurrency,
  fncConvCleanDuplicateGroups,
  fncConvCleanIsbn,
  fncConvCleanIsbnStrict,
  fncConvCleanPhotoRead,
  fncConvCleanPriceBands,
  fncConvCleanResult,
  fncConvCleanText,
  fncConvCleanTranscriptRow,
  fncConvCleanYear,
  fncConvFieldOrigins,
  fncConvIsbn10To13,
  fncConvIsbn13To10,
  fncConvIsbnChecksumValid,
  fncConvMajorToMinor,
  fncConvMedianMinor,
  fncConvValidateResultCount,
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
    [{ name: 'Demo Author', role: 'author', role_code: 1 }],
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
  assertEquals(fldObjRead.contributors, [{
    name: 'A',
    role: null,
    role_code: null,
  }]);
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

Deno.test('isbn checksum validates mod-11 and mod-10', () => {
  assertEquals(fncConvIsbnChecksumValid('0306406152'), true);
  assertEquals(fncConvIsbnChecksumValid('080442957X'), true);
  assertEquals(fncConvIsbnChecksumValid('9780306406157'), true);
  assertEquals(fncConvIsbnChecksumValid('0306406153'), false);
  assertEquals(fncConvIsbnChecksumValid('9780306406158'), false);
  assertEquals(fncConvIsbnChecksumValid(''), false);
  assertEquals(fncConvIsbnChecksumValid('123'), false);
});

Deno.test('strict isbn rejects bad checksums', () => {
  assertEquals(fncConvCleanIsbnStrict('978-0-306-40615-7'), '9780306406157');
  assertEquals(fncConvCleanIsbnStrict('9780306406158'), null);
  assertEquals(fncConvCleanIsbnStrict('0-8044-2957-X'), '080442957X');
  assertEquals(fncConvCleanIsbnStrict('not-an-isbn'), null);
});

Deno.test('isbn conversions verify before mapping', () => {
  assertEquals(fncConvIsbn10To13('0306406152'), '9780306406157');
  assertEquals(fncConvIsbn10To13('080442957X'), '9780804429573');
  assertEquals(fncConvIsbn10To13('0306406153'), null);
  assertEquals(fncConvIsbn13To10('9780306406157'), '0306406152');
  assertEquals(fncConvIsbn13To10('9780804429573'), '080442957X');
  assertEquals(fncConvIsbn13To10('9791092732115'), null);
  assertEquals(fncConvIsbn13To10('9780306406158'), null);
});

Deno.test('code cleaner keeps zero and ranges the rest', () => {
  assertEquals(fncConvCleanCode(0, 0, 5), 0);
  assertEquals(fncConvCleanCode(5, 0, 5), 5);
  assertEquals(fncConvCleanCode(6, 0, 5), null);
  assertEquals(fncConvCleanCode(-1, 0, 5), null);
  assertEquals(fncConvCleanCode(1.5, 0, 5), null);
  assertEquals(fncConvCleanCode('3', 0, 5), null);
  assertEquals(fncConvCleanCode(null, 0, 5), null);
});

Deno.test('transcript rows accept objects and legacy strings', () => {
  assertEquals(
    fncConvCleanTranscriptRow({
      text: 'small scratch',
      language: 'en',
      uncertain_parts: ['scratch?', 7],
    }),
    { text: 'small scratch', language: 'en', uncertain_parts: ['scratch?'] },
  );
  assertEquals(fncConvCleanTranscriptRow('plain note'), {
    text: 'plain note',
    language: null,
    uncertain_parts: [],
  });
  assertEquals(fncConvCleanTranscriptRow(null), {
    text: null,
    language: null,
    uncertain_parts: [],
  });
});

Deno.test('photo reads whitelist regions and cap lists', () => {
  const fldObjRead = fncConvCleanPhotoRead({
    regions: ['front_cover', 'cover', 'spine'],
    subjects: ['a', 'b'],
    conflicts: 'glare?',
  });
  assertEquals(fldObjRead.regions, ['front_cover', 'spine']);
  assertEquals(fldObjRead.subjects, ['a', 'b']);
  assertEquals(fldObjRead.conflicts, []);
  assertEquals(fncConvCleanPhotoRead({}).regions, []);
});

Deno.test('results normalize dewey and start unverified', () => {
  const fldObjResult = fncConvCleanResult({ dewey: '813.5400' });
  assertEquals(fldObjResult.dewey, '813.54');
  assertEquals(fldObjResult.dewey_verified, false);
  assertEquals(fncConvCleanResult({ dewey: 'junk' }).dewey, null);
});

Deno.test('result count validation rejects shape drift', () => {
  assertEquals(fncConvValidateResultCount([{ a: 1 }], 1), [{ a: 1 }]);
  let fldStrError = '';
  try {
    fncConvValidateResultCount([{ a: 1 }, { b: 2 }], 1);
  } catch (fldObjError: unknown) {
    fldStrError = (fldObjError as Error).message;
  }
  assertEquals(fldStrError.includes('result count mismatch'), true);
});

Deno.test('photo reads carry contract codes with zero kept', () => {
  const fldObjRead = fncConvCleanPhotoRead({
    publication_type: 'Dergi',
    binding: 'Hardcover',
    dust_jacket: 'present',
    paper: 'Newsprint',
    condition: 'New',
    contributors: [{ name: 'Çevirmen', role: 'Translator' }],
  });
  assertEquals(fldObjRead.publication_type_code, 2);
  assertEquals(fldObjRead.cover_code, 2);
  assertEquals(fldObjRead.dust_jacket_flag, 1);
  assertEquals(fldObjRead.paper_code, 3);
  assertEquals(fldObjRead.condition_code, 0);
  assertEquals(fldObjRead.contributors[0]!.role_code, 8);
  const fldObjUnknown = fncConvCleanPhotoRead({
    publication_type: 'Zine',
    binding: 'comic binding',
    dust_jacket: null,
    paper: null,
    condition: 'worn cover',
  });
  assertEquals(fldObjUnknown.publication_type_code, null);
  assertEquals(fldObjUnknown.cover_code, null);
  assertEquals(fldObjUnknown.dust_jacket_flag, null);
  assertEquals(fldObjUnknown.paper_code, null);
  assertEquals(fldObjUnknown.condition_code, null);
});

Deno.test('field origins separate lens catalog voice and fill', () => {
  const fldObjRead = fncConvCleanPhotoRead({
    title: 'The Demo Codex',
    contributors: [{ name: 'Ada Cataloger', role: 'author' }],
  });
  const fldObjResult = fncConvCleanResult({
    title: 'The Demo Codex',
    publisher: 'Logosphere Press',
    condition: 'worn cover',
    contributors: [{ name: 'Ada Cataloger', role: 'author' }],
  });
  const fldArrOrigins = fncConvFieldOrigins(
    fldObjRead,
    {
      title: null,
      publishers: ['Logosphere Press'],
      publish_year: null,
      pages: null,
    },
    'cover is worn',
    fldObjResult,
  );
  const fldObjByField = Object.fromEntries(
    fldArrOrigins.map((fldObjEntry) => [fldObjEntry.field, fldObjEntry.origin]),
  );
  assertEquals(fldObjByField['title'], 'photo_read');
  assertEquals(fldObjByField['publisher'], 'catalog_record');
  assertEquals(fldObjByField['condition'], 'voice_claim');
  assertEquals(fldObjByField['contributors'], 'photo_read');
});
