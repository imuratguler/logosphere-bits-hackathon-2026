// Logosphere BITS — Muse client tests (Deno).
// The network is stubbed: request shape (pins, bearer auth,
// JSON-only answers) plus every failure path. Values are
// never asserted — only the header presence.

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  fldStrMuseBaseUrl,
  fldStrMuseModel,
  fncConvMuseJson,
  fncRunMuseJson,
} from './muse.ts';

function fncConvStubFetch(
  fldObjHandler: (fldStrUrl: string, fldObjInit?: RequestInit) => Response,
): () => void {
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch =
    ((fldStrUrl: string, fldObjInit?: RequestInit) =>
      Promise.resolve(fldObjHandler(fldStrUrl, fldObjInit))) as typeof fetch;
  return () => {
    globalThis.fetch = fldObjRealFetch;
  };
}

Deno.test('muse json parser strips fences', () => {
  assertEquals(fncConvMuseJson<{ a: number }>('{"a": 1}'), { a: 1 });
  assertEquals(
    fncConvMuseJson<{ a: number }>('```json\n{"a": 1}\n```'),
    { a: 1 },
  );
  assertEquals(fncConvMuseJson<{ a: number }>('```\n{"a": 1}\n```'), { a: 1 });
});

Deno.test('muse json parser rejects prose', () => {
  let fldBooThrew = false;
  try {
    fncConvMuseJson('not json at all');
  } catch {
    fldBooThrew = true;
  }
  assert(fldBooThrew);
});

Deno.test('muse call posts pins with bearer auth', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  let fldStrSeenUrl = '';
  let fldObjSeenBody: Record<string, unknown> = {};
  let fldStrSeenAuth = '';
  const fncRunRestore = fncConvStubFetch((fldStrUrl, fldObjInit) => {
    fldStrSeenUrl = fldStrUrl;
    fldObjSeenBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as Record<
      string,
      unknown
    >;
    fldStrSeenAuth = (fldObjInit?.headers as Record<string, string>)[
      'Authorization'
    ] as string;
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldObjAnswer = await fncRunMuseJson<{ ok: boolean }>([
      { role: 'user', content: 'hi' },
    ]);
    assertEquals(fldObjAnswer, { ok: true });
    assertEquals(fldStrSeenUrl, `${fldStrMuseBaseUrl}/chat/completions`);
    assertEquals(fldObjSeenBody['model'], fldStrMuseModel);
    assert(fldStrSeenAuth.startsWith('Bearer '));
    assert(fldStrSeenAuth.length > 'Bearer '.length);
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('muse call fails without a key', async () => {
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  await assertRejects(
    () => fncRunMuseJson([{ role: 'user', content: 'hi' }]),
    Error,
    'not configured',
  );
});

Deno.test('muse call surfaces http failures', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fncRunRestore = fncConvStubFetch(
    () => new Response('bad', { status: 500 }),
  );
  try {
    await assertRejects(
      () => fncRunMuseJson([{ role: 'user', content: 'hi' }]),
      Error,
      'HTTP 500',
    );
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('muse call rejects empty answers', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fncRunRestore = fncConvStubFetch(() =>
    Response.json({ choices: [{ message: { content: '  ' } }] })
  );
  try {
    await assertRejects(
      () => fncRunMuseJson([{ role: 'user', content: 'hi' }]),
      Error,
      'empty answer',
    );
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});
