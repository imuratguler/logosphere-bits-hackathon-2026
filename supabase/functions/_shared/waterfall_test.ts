// Logosphere BITS — waterfall tests (Deno).
// Pure accept-rule checks plus adapter parsing over a
// URL-routed fetch stub. The fake client serves the cache
// row and captures attempt/source writes. No network runs.

import { assert, assertEquals } from '@std/assert';
import {
  fncConvAcceptCandidate,
  fncRunGoogleBooks,
  fncRunOpenLibraryByIsbn,
  fncRunWaterfall,
} from './waterfall.ts';
import type {
  fldObjSourceCandidate,
  fldObjWaterfallQuery,
} from './waterfall.ts';

function fncConvQuery(
  fldObjPart: Partial<fldObjWaterfallQuery>,
): fldObjWaterfallQuery {
  return {
    isbn10: null,
    isbn13: null,
    title: null,
    authors: [],
    publisher: null,
    language: null,
    edition: null,
    ...fldObjPart,
  };
}

function fncConvCandidate(
  fldObjPart: Partial<fldObjSourceCandidate>,
): fldObjSourceCandidate {
  return {
    source: 'openlibrary',
    source_key: 'edition:/books/OL1M',
    url: 'https://openlibrary.org/books/OL1M',
    level: 'edition',
    title: 'The Demo Codex',
    title_norm: 'the demo codex',
    authors: ['Ada Cataloger'],
    publisher: 'Logosphere Press',
    language: 'en',
    edition: null,
    publish_year: 2026,
    pages: 321,
    isbn10: null,
    isbn13: null,
    ...fldObjPart,
  };
}

Deno.test('waterfall accepts exact isbn matches', () => {
  const fldObjVerdict = fncConvAcceptCandidate(
    fncConvQuery({ isbn13: '9780306406157' }),
    fncConvCandidate({ isbn13: '9780306406157', title_norm: 'other book' }),
  );
  assertEquals(fldObjVerdict, { accepted: true, reason: 'isbn-match' });
});

Deno.test('waterfall rejects other-edition isbns', () => {
  const fldObjVerdict = fncConvAcceptCandidate(
    fncConvQuery({ isbn13: '9780306406157', title: 'The Demo Codex' }),
    fncConvCandidate({ isbn13: '9780804429573' }),
  );
  assertEquals(fldObjVerdict, { accepted: false, reason: 'isbn-mismatch' });
});

Deno.test('waterfall accepts strong title plus contributor', () => {
  const fldObjVerdict = fncConvAcceptCandidate(
    fncConvQuery({
      title: 'The Demo Codex',
      authors: ['Ada Cataloger'],
      language: 'en',
    }),
    fncConvCandidate({}),
  );
  assertEquals(fldObjVerdict, { accepted: true, reason: 'strong-title-match' });
});

Deno.test('waterfall rejects weak title similarity', () => {
  const fldObjVerdict = fncConvAcceptCandidate(
    fncConvQuery({ title: 'Codex', authors: ['Ada Cataloger'] }),
    fncConvCandidate({}),
  );
  assertEquals(fldObjVerdict, { accepted: false, reason: 'weak-title' });
});

Deno.test('waterfall rejects missing contributor overlap', () => {
  const fldObjVerdict = fncConvAcceptCandidate(
    fncConvQuery({ title: 'The Demo Codex', authors: ['Other Writer'] }),
    fncConvCandidate({ publisher: 'Elsewhere House' }),
  );
  assertEquals(fldObjVerdict, {
    accepted: false,
    reason: 'no-contributor-overlap',
  });
});

Deno.test('waterfall rejects language and edition conflicts', () => {
  assertEquals(
    fncConvAcceptCandidate(
      fncConvQuery({
        title: 'The Demo Codex',
        authors: ['Ada Cataloger'],
        language: 'tr',
      }),
      fncConvCandidate({}),
    ),
    { accepted: false, reason: 'language-mismatch' },
  );
  assertEquals(
    fncConvAcceptCandidate(
      fncConvQuery({
        title: 'The Demo Codex',
        authors: ['Ada Cataloger'],
        edition: 'first edition',
      }),
      fncConvCandidate({ edition: 'second edition' }),
    ),
    { accepted: false, reason: 'edition-mismatch' },
  );
});

type fldObjRoute = {
  fldStrMatch: string;
  fldNumStatus?: number;
  fldObjBody?: unknown;
  fldBooThrows?: boolean;
};

function fncConvStubFetch(fldArrRoutes: fldObjRoute[]) {
  const fldArrSeen: string[] = [];
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string) => {
    fldArrSeen.push(fldStrUrl);
    const fldObjRoute = fldArrRoutes.find((fldObjEntry) =>
      fldStrUrl.includes(fldObjEntry.fldStrMatch)
    );
    if (fldObjRoute === undefined || fldObjRoute.fldBooThrows === true) {
      return Promise.reject(new Error('net down'));
    }
    const fldNumStatus = fldObjRoute.fldNumStatus ?? 200;
    if (fldNumStatus !== 200) {
      return Promise.resolve(new Response('missing', { status: fldNumStatus }));
    }
    return Promise.resolve(Response.json(fldObjRoute.fldObjBody ?? {}));
  }) as typeof fetch;
  return {
    fldArrSeen: () => fldArrSeen,
    fncRunRestore: () => {
      globalThis.fetch = fldObjRealFetch;
    },
  };
}

function fncConvFakeClient(fldObjLocal: Record<string, unknown> | null) {
  const fldArrAttempts: Record<string, unknown>[] = [];
  const fldArrSources: Record<string, unknown>[] = [];
  const fldObjClient = {
    from: (fldStrTable: string) => ({
      select: () => ({
        eq: (_fldStrCol: string, _fldObjVal: unknown) => ({
          maybeSingle: () =>
            Promise.resolve({
              data: fldStrTable === 'catalog_records' ? fldObjLocal : null,
              error: null,
            }),
        }),
      }),
      insert: (fldObjValues: Record<string, unknown>) => {
        if (fldStrTable === 'catalog_attempts') {
          fldArrAttempts.push(fldObjValues);
        }
        return Promise.resolve({ data: null, error: null });
      },
      upsert: (
        fldObjValues: Record<string, unknown>,
        _fldObjOpts: Record<string, unknown>,
      ) => {
        if (fldStrTable === 'catalog_sources') {
          fldArrSources.push(fldObjValues);
        }
        return {
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: { id: 'src-1' }, error: null }),
          }),
        };
      },
    }),
  };
  return {
    fldObjClient: fldObjClient as never,
    fldArrAttempts,
    fldArrSources,
  };
}

Deno.test('openlibrary isbn parses editions and authors', async () => {
  const fldObjFetch = fncConvStubFetch([
    {
      fldStrMatch: '/isbn/9780306406157.json',
      fldObjBody: {
        key: '/books/OL1M',
        title: 'The Demo Codex',
        publishers: ['Logosphere Press'],
        publish_date: '2026',
        number_of_pages: 321,
        authors: [{ key: '/authors/OL1A' }],
        languages: [{ key: '/languages/eng' }],
      },
    },
    {
      fldStrMatch: '/authors/OL1A.json',
      fldObjBody: { name: 'Ada Cataloger' },
    },
  ]);
  try {
    const fldObjOut = await fncRunOpenLibraryByIsbn('9780306406157');
    assert(fldObjOut.candidate !== null);
    assertEquals(fldObjOut.candidate.title, 'The Demo Codex');
    assertEquals(fldObjOut.candidate.language, 'en');
    assertEquals(fldObjOut.candidate.authors, ['Ada Cataloger']);
    assertEquals(fldObjOut.candidate.publish_year, 2026);
    assertEquals(fldObjOut.candidate.isbn13, '9780306406157');
    assertEquals(fldObjOut.status, 200);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('googlebooks parses volumes and strict identifiers', async () => {
  const fldObjFetch = fncConvStubFetch([
    {
      fldStrMatch: 'googleapis.com',
      fldObjBody: {
        items: [
          {
            id: 'gb1',
            volumeInfo: {
              title: 'The Demo Codex',
              authors: ['Ada Cataloger'],
              publisher: 'Logosphere Press',
              publishedDate: '2026-03-01',
              pageCount: 321,
              language: 'en',
              infoLink: 'https://books.google.example/gb1',
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9780306406157' },
                { type: 'ISBN_10', identifier: '0306406153' },
              ],
            },
          },
        ],
      },
    },
  ]);
  try {
    const fldObjOut = await fncRunGoogleBooks('isbn:9780306406157');
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.isbn13, '9780306406157');
    assertEquals(fldObjOut.candidates[0]?.isbn10, null);
    assertEquals(fldObjOut.candidates[0]?.publish_year, 2026);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('waterfall serves cache hits without fetch', async () => {
  const fldObjFake = fncConvFakeClient({
    isbn: '9780306406157',
    source: 'openlibrary',
    record: { title: 'The Demo Codex', publishers: ['Logosphere Press'] },
  });
  const fldObjFetch = fncConvStubFetch([]);
  try {
    const fldObjHit = await fncRunWaterfall(
      fldObjFake.fldObjClient,
      'run-1',
      'img-1',
      fncConvQuery({ isbn13: '9780306406157' }),
    );
    assertEquals(fldObjHit.source, 'local-cache');
    assertEquals(fldObjHit.reason, null);
    assertEquals(fldObjFetch.fldArrSeen().length, 0);
    assertEquals(fldObjFake.fldArrAttempts.length, 1);
    assertEquals(fldObjFake.fldArrAttempts[0]?.['match_reason'], 'isbn-match');
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('waterfall falls through to the next source', async () => {
  const fldObjFake = fncConvFakeClient(null);
  const fldObjFetch = fncConvStubFetch([
    { fldStrMatch: '/isbn/9780306406157.json', fldNumStatus: 404 },
    {
      fldStrMatch: 'googleapis.com',
      fldObjBody: {
        items: [
          {
            id: 'gb1',
            volumeInfo: {
              title: 'The Demo Codex',
              authors: ['Ada Cataloger'],
              language: 'en',
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9780306406157' },
              ],
            },
          },
        ],
      },
    },
  ]);
  try {
    const fldObjHit = await fncRunWaterfall(
      fldObjFake.fldObjClient,
      'run-1',
      'img-1',
      fncConvQuery({ isbn13: '9780306406157' }),
    );
    assertEquals(fldObjHit.source, 'googlebooks');
    assertEquals(fldObjHit.rejected, [
      { source: 'openlibrary', reason: 'not-found' },
    ]);
    assertEquals(fldObjFake.fldArrAttempts.length, 2);
    assertEquals(fldObjFake.fldArrSources.length, 1);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('waterfall reports empty queries quietly', async () => {
  const fldObjFake = fncConvFakeClient(null);
  const fldObjFetch = fncConvStubFetch([]);
  try {
    const fldObjHit = await fncRunWaterfall(
      fldObjFake.fldObjClient,
      'run-1',
      'img-1',
      fncConvQuery({}),
    );
    assertEquals(fldObjHit.candidate, null);
    assertEquals(fldObjHit.reason, 'no-query');
    assertEquals(fldObjFetch.fldArrSeen().length, 0);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});
