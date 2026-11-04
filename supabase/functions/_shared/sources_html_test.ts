// Logosphere BITS — HTML adapter tests (Deno).
// Fixture pages drive the parse order (JSON-LD, meta,
// tables, text), block markers, link extraction, and the
// language/market order. No network runs.

import { assert, assertEquals } from '@std/assert';
import {
  fncConvDecodeEntities,
  fncConvPageBlocked,
  fncConvParseDetail,
  fncConvSourceOrder,
  fncRunAbebooks,
  fncRunAmazon,
  fncRunKitapyurdu,
  fncRunNadirkitap,
} from './sources_html.ts';

Deno.test('entities decode numeric and named forms', () => {
  assertEquals(
    fncConvDecodeEntities('Re&#351;at &amp; &#xC7;etin'),
    'Reşat & Çetin',
  );
  assertEquals(fncConvDecodeEntities('&lt;tag&gt;'), '<tag>');
});

Deno.test('block markers catch captcha pages', () => {
  assert(
    fncConvPageBlocked(
      '<html><body>Enter the characters you see</body></html>',
    ),
  );
  assert(fncConvPageBlocked('<div>Robot Check</div>'));
  assert(
    !fncConvPageBlocked('<html><body><h1>The Demo Codex</h1></body></html>'),
  );
});

Deno.test('detail parse prefers json-ld over tables', () => {
  const fldObjDetail = fncConvParseDetail(`<html><head>
<script type="application/ld+json">{"@type": "Book", "name": "The Demo Codex",
"author": {"name": "Ada Cataloger"}, "publisher": {"name": "Logosphere Press"},
"inLanguage": "en", "datePublished": "2026", "numberOfPages": 321,
"isbn": "9780306406157"}</script></head>
<body><table><tr><td>Publisher</td><td>Wrong House</td></tr></table></body></html>`);
  assertEquals(fldObjDetail.title, 'The Demo Codex');
  assertEquals(fldObjDetail.authors, ['Ada Cataloger']);
  assertEquals(fldObjDetail.publisher, 'Logosphere Press');
  assertEquals(fldObjDetail.language, 'en');
  assertEquals(fldObjDetail.publish_year, 2026);
  assertEquals(fldObjDetail.pages, 321);
  assertEquals(fldObjDetail.isbn13, '9780306406157');
});

Deno.test('detail parse falls back to meta and tables', () => {
  const fldObjDetail = fncConvParseDetail(`<html><head>
<meta property="og:title" content="Çalıkuşu" />
<meta property="og:locale" content="tr_TR" /></head>
<body><table>
<tr><td>Yazar</td><td>Reşat Nuri Güntekin</td></tr>
<tr><td>Yayınevi</td><td>Inkılap Kitabevi</td></tr>
<tr><td>Sayfa</td><td>544</td></tr>
<tr><td>ISBN</td><td>9789751013873</td></tr>
</table></body></html>`);
  assertEquals(fldObjDetail.title, 'Çalıkuşu');
  assertEquals(fldObjDetail.authors, ['Reşat Nuri Güntekin']);
  assertEquals(fldObjDetail.publisher, 'Inkılap Kitabevi');
  assertEquals(fldObjDetail.language, 'tr');
  assertEquals(fldObjDetail.pages, 544);
  assertEquals(fldObjDetail.isbn13, '9789751013873');
});

Deno.test('detail parse rejects bad identifier checksums', () => {
  const fldObjDetail = fncConvParseDetail(
    '<html><body><table><tr><td>ISBN</td><td>9780306406158</td></tr></table></body></html>',
  );
  assertEquals(fldObjDetail.isbn13, null);
  assertEquals(fldObjDetail.isbn10, null);
});

Deno.test('source order follows the language contract', () => {
  assertEquals(
    fncConvSourceOrder('tr').map((fldObjSrc) =>
      fldObjSrc.kind === 'amazon'
        ? `amazon_${fldObjSrc.country}`
        : fldObjSrc.kind
    ),
    ['amazon_tr', 'amazon_us', 'kitapyurdu', 'openlibrary', 'googlebooks'],
  );
  assertEquals(
    fncConvSourceOrder('en').map((fldObjSrc) =>
      fldObjSrc.kind === 'amazon'
        ? `amazon_${fldObjSrc.country}`
        : fldObjSrc.kind
    ),
    [
      'amazon_us',
      'amazon_uk',
      'openlibrary',
      'googlebooks',
      'amazon_ca',
      'nadirkitap',
    ],
  );
  assertEquals(
    fncConvSourceOrder(null).map((fldObjSrc) =>
      fldObjSrc.kind === 'amazon'
        ? `amazon_${fldObjSrc.country}`
        : fldObjSrc.kind
    ),
    ['amazon_us', 'openlibrary', 'googlebooks', 'nadirkitap'],
  );
  assertEquals(fncConvSourceOrder('de')[0], { kind: 'amazon', country: 'de' });
  assertEquals(fncConvSourceOrder('ja')[0], { kind: 'amazon', country: 'jp' });
});

function fncConvStubPages(
  fldObjPages: Record<string, { status?: number; html: string }>,
) {
  const fldArrSeen: string[] = [];
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string) => {
    fldArrSeen.push(fldStrUrl);
    const fldObjFound = Object.entries(fldObjPages).find(([fldStrMatch]) =>
      fldStrUrl.includes(fldStrMatch)
    );
    if (fldObjFound === undefined) {
      return Promise.reject(new Error('net down'));
    }
    const fldNumStatus = fldObjFound[1].status ?? 200;
    if (fldNumStatus !== 200) {
      return Promise.resolve(new Response('missing', { status: fldNumStatus }));
    }
    return Promise.resolve(
      new Response(fldObjFound[1].html, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
  }) as typeof fetch;
  return {
    fldArrSeen: () => fldArrSeen,
    fncRunRestore: () => {
      globalThis.fetch = fldObjRealFetch;
    },
  };
}

const fldStrDetailPage = `<html><head>
<script type="application/ld+json">{"@type": "Book", "name": "The Demo Codex",
"author": [{"name": "Ada Cataloger"}], "publisher": "Logosphere Press",
"inLanguage": "en"}</script></head><body><h1>The Demo Codex</h1></body></html>`;

Deno.test('amazon title flow opens the first detail page', async () => {
  const fldObjFetch = fncConvStubPages({
    '/s?k=': {
      html: '<html><body><a href="/dp/0306406152/ref=x">buy</a></body></html>',
    },
    '/dp/0306406152': { html: fldStrDetailPage },
  });
  try {
    const fldObjOut = await fncRunAmazon('us', null, 'The Demo Codex', null);
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.source, 'amazon_us');
    assertEquals(fldObjOut.candidates[0]?.source_key, 'asin:0306406152');
    assertEquals(fldObjOut.candidates[0]?.isbn10, '0306406152');
    assert(fldObjOut.searchUrl !== null);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('amazon isbn flow reads the dp page directly', async () => {
  const fldObjFetch = fncConvStubPages({
    '/dp/0306406152': { html: fldStrDetailPage },
  });
  try {
    const fldObjOut = await fncRunAmazon('tr', '0306406152', null, null);
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.source, 'amazon_tr');
    assertEquals(fldObjOut.searchUrl, null);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('kitapyurdu follows search links', async () => {
  const fldObjFetch = fncConvStubPages({
    'product/list': {
      html:
        '<html><body><a href="https://www.kitapyurdu.com/kitap/demo-codex/12345.html?filter_name=x">x</a><a href="https://www.kitapyurdu.com/kategori/cesitli-kitap-hediye-karti/1727.html">gift</a></body></html>',
    },
    'demo-codex': { html: fldStrDetailPage },
  });
  try {
    const fldObjOut = await fncRunKitapyurdu('The Demo Codex');
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.source, 'kitapyurdu');
    assertEquals(fldObjOut.candidates[0]?.source_key, 'id:12345');
  } finally {
    fldObjFetch.fncRunRestore();
  }
});

Deno.test('nadirkitap and abebooks follow their link shapes', async () => {
  const fldObjNadir = fncConvStubPages({
    'kitapara.php': {
      html:
        '<html><body><a href="https://www.nadirkitap.com/demo-codex-kitap12345.html">x</a></body></html>',
    },
    '-kitap12345.html': { html: fldStrDetailPage },
  });
  try {
    const fldObjOut = await fncRunNadirkitap('The Demo Codex');
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.source_key, 'book:12345');
  } finally {
    fldObjNadir.fncRunRestore();
  }
  const fldObjAbe = fncConvStubPages({
    'SearchResults': {
      html:
        '<html><body><a href="https://www.abebooks.com/servlet/BookDetailsPL?bi=999">x</a></body></html>',
    },
    'BookDetailsPL': { html: fldStrDetailPage },
  });
  try {
    const fldObjOut = await fncRunAbebooks('The Demo Codex');
    assertEquals(fldObjOut.candidates.length, 1);
    assertEquals(fldObjOut.candidates[0]?.source_key, 'bi:999');
  } finally {
    fldObjAbe.fncRunRestore();
  }
});

Deno.test('blocked pages mark the source without candidates', async () => {
  const fldObjFetch = fncConvStubPages({
    '/s?k=': { html: '<html><body>Robot Check: enter captcha</body></html>' },
  });
  try {
    const fldObjOut = await fncRunAmazon('us', null, 'The Demo Codex', null);
    assertEquals(fldObjOut.candidates.length, 0);
    assertEquals(fldObjOut.blocked, true);
  } finally {
    fldObjFetch.fncRunRestore();
  }
});
