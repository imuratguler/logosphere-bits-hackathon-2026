// Logosphere BITS — catalog lookup tests (Deno).
// The fake client serves the local cache row; remote
// Open Library answers ride a stubbed fetch. No network runs.

import { assert, assertEquals } from '@std/assert';
import {
  fncConvNormalizeTitle,
  fncConvTitlesMatch,
  fncRunCatalogLookup,
} from './catalog.ts';

type fldObjServe = {
  fldObjLocal?: Record<string, unknown> | null;
  fldNumRemoteStatus?: number;
  fldObjRemoteBody?: unknown;
  fldBooRemoteThrows?: boolean;
};

function fncConvFakeClient(fldObjServe: fldObjServe) {
  const fldArrInserts: Record<string, unknown>[] = [];
  let fldBooLocalRead = false;
  const fldObjClient = {
    from: (fldStrTable: string) => {
      assertEquals(fldStrTable, 'catalog_records');
      return {
        select: () => ({
          eq: (_fldStrCol: string, _fldObjVal: unknown) => ({
            maybeSingle: () => {
              fldBooLocalRead = true;
              return Promise.resolve({
                data: fldObjServe.fldObjLocal ?? null,
                error: null,
              });
            },
          }),
        }),
        insert: (fldObjValues: Record<string, unknown>) => {
          fldArrInserts.push(fldObjValues);
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
  return {
    fldObjClient: fldObjClient as never,
    fldArrInserts,
    fldBooLocalRead: () => fldBooLocalRead,
  };
}

function fncConvStubRemote(fldObjServe: fldObjServe) {
  let fldNumFetches = 0;
  let fldStrSeenUrl = '';
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string) => {
    fldNumFetches += 1;
    fldStrSeenUrl = fldStrUrl;
    if (fldObjServe.fldBooRemoteThrows === true) {
      return Promise.reject(new Error('net down'));
    }
    const fldNumStatus = fldObjServe.fldNumRemoteStatus ?? 200;
    if (fldNumStatus !== 200) {
      return Promise.resolve(new Response('missing', { status: fldNumStatus }));
    }
    return Promise.resolve(
      Response.json(
        fldObjServe.fldObjRemoteBody ?? {
          title: 'The Demo Codex',
          publishers: ['Logosphere Press'],
          publish_date: '2026',
          number_of_pages: 321,
        },
      ),
    );
  }) as typeof fetch;
  return {
    fldNumFetches: () => fldNumFetches,
    fldStrSeenUrl: () => fldStrSeenUrl,
    fncRunRestore: () => {
      globalThis.fetch = fldObjRealFetch;
    },
  };
}

Deno.test('titles match on normalized containment', () => {
  assert(fncConvTitlesMatch('The Demo Codex!', 'the demo codex'));
  assert(fncConvTitlesMatch('Codex', 'The Demo Codex, 2nd ed.'));
  assert(!fncConvTitlesMatch('Codex', 'Unrelated Atlas'));
  assert(!fncConvTitlesMatch('', 'The Demo Codex'));
});

Deno.test('catalog serves exact local matches without fetch', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjLocal: {
      isbn: '9783161484100',
      source: 'openlibrary',
      record: { title: 'Cached Codex' },
    },
  });
  const fldObjRemote = fncConvStubRemote({});
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '9783161484100',
      'Cached Codex',
    );
    assertEquals(fldObjHit.source, 'local-cache');
    assertEquals(fldObjHit.reason, null);
    assertEquals(fldObjHit.record?.title, 'Cached Codex');
    assertEquals(fldObjRemote.fldNumFetches(), 0);
    assertEquals(fldObjFake.fldArrInserts.length, 0);
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('catalog caches remote hits', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjLocal: null });
  const fldObjRemote = fncConvStubRemote({});
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '9783161484100',
      'The Demo Codex',
    );
    assertEquals(fldObjHit.source, 'openlibrary');
    assertEquals(fldObjHit.reason, null);
    assertEquals(fldObjHit.record?.publish_year, 2026);
    assertEquals(fldObjHit.record?.pages, 321);
    assert(fldObjRemote.fldStrSeenUrl().includes('/isbn/9783161484100.json'));
    assertEquals(fldObjFake.fldArrInserts.length, 1);
    assertEquals(fldObjFake.fldArrInserts[0]!['isbn'], '9783161484100');
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('catalog returns null with reason on misses', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjLocal: null });
  const fldObjRemote = fncConvStubRemote({ fldNumRemoteStatus: 404 });
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '9783161484100',
      'The Demo Codex',
    );
    assertEquals(fldObjHit.record, null);
    assertEquals(fldObjHit.source, null);
    assertEquals(fldObjHit.reason, 'not-found');
    assertEquals(fldObjFake.fldArrInserts.length, 0);
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('catalog rejects title mismatches but caches facts', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjLocal: null });
  const fldObjRemote = fncConvStubRemote({
    fldObjRemoteBody: { title: 'Unrelated Atlas', publishers: ['Other'] },
  });
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '9783161484100',
      'The Demo Codex',
    );
    assertEquals(fldObjHit.record, null);
    assertEquals(fldObjHit.reason, 'title-mismatch');
    assertEquals(fldObjFake.fldArrInserts.length, 1);
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('catalog reports unreachable remotes', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjLocal: null });
  const fldObjRemote = fncConvStubRemote({ fldBooRemoteThrows: true });
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '9783161484100',
      'The Demo Codex',
    );
    assertEquals(fldObjHit.record, null);
    assertEquals(fldObjHit.reason, 'catalog-unreachable');
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('catalog skips empty ISBNs quietly', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjLocal: null });
  const fldObjRemote = fncConvStubRemote({});
  try {
    const fldObjHit = await fncRunCatalogLookup(
      fldObjFake.fldObjClient,
      '',
      'The Demo Codex',
    );
    assertEquals(fldObjHit.record, null);
    assertEquals(fldObjHit.reason, 'no-isbn');
    assertEquals(fldObjRemote.fldNumFetches(), 0);
    assertEquals(fldObjFake.fldBooLocalRead(), false);
  } finally {
    fldObjRemote.fncRunRestore();
  }
});

Deno.test('title normalization keeps turkish letters', () => {
  assertEquals(
    fncConvNormalizeTitle('Çalıkuşu: Reşat Nuri Güntekin'),
    'çalıkuşu reşat nuri güntekin',
  );
  assertEquals(
    fncConvNormalizeTitle('Çağdaş Türk Öykücülüğü!'),
    'çağdaş türk öykücülüğü',
  );
});

Deno.test('title normalization never collapses distinct titles', () => {
  const fldStrLeft = fncConvNormalizeTitle('Şahin Kuşu');
  const fldStrRight = fncConvNormalizeTitle('Sahin Kusu');
  assertEquals(fldStrLeft, 'şahin kuşu');
  assertEquals(fldStrRight, 'sahin kusu');
  assertEquals(fldStrLeft === fldStrRight, false);
  assertEquals(fncConvTitlesMatch('Şahin Kuşu', 'Sahin Kusu'), false);
});
