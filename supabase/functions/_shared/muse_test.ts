// Logosphere BITS — Muse client tests (Deno).
// The network is stubbed: request shape (pins, bearer auth,
// JSON-only answers) plus every failure path. Values are
// never asserted — only the header presence.

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  fldStrMuseBaseUrl,
  fldStrMuseModel,
  fncConvMuseJson,
  fncConvMuseUsage,
  fncRunMuseJson,
  fncRunMuseUsageReset,
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

Deno.test('muse call wraps timeouts as retryable failures', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fncRunRestore = fncConvStubFetch(() => {
    throw new DOMException('Signal timed out.', 'TimeoutError');
  });
  try {
    await assertRejects(
      () => fncRunMuseJson([{ role: 'user', content: 'hi' }]),
      Error,
      'Muse call failed (Signal timed out.)',
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

Deno.test('muse usage counter tracks requests and tokens', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  fncRunMuseUsageReset();
  const fncRunRestore = fncConvStubFetch(() =>
    Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    })
  );
  try {
    await fncRunMuseJson<{ ok: boolean }>([
      { role: 'user', content: 'hi' },
    ]);
    const fldObjUsage = fncConvMuseUsage();
    assertEquals(fldObjUsage.fldNumRequests, 1);
    assertEquals(fldObjUsage.fldNumRetries, 0);
    assertEquals(fldObjUsage.fldNumPromptTokens, 10);
    assertEquals(fldObjUsage.fldNumCompletionTokens, 5);
    assertEquals(fldObjUsage.fldNumTotalTokens, 15);
    assertEquals(fldObjUsage.fldBooTokensSeen, true);
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
    fncRunMuseUsageReset();
  }
});

Deno.test('muse call retries a 500 then succeeds', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  fncRunMuseUsageReset();
  let fldNumCalls = 0;
  const fncRunRestore = fncConvStubFetch(() => {
    fldNumCalls += 1;
    if (fldNumCalls === 1) {
      return new Response('bad', { status: 500 });
    }
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldObjAnswer = await fncRunMuseJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      4000,
      { fldNumRetries: 2, fldNumRetryDelayMs: 1 },
    );
    assertEquals(fldObjAnswer, { ok: true });
    assertEquals(fldNumCalls, 2);
    const fldObjUsage = fncConvMuseUsage();
    assertEquals(fldObjUsage.fldNumRequests, 2);
    assertEquals(fldObjUsage.fldNumRetries, 1);
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
    fncRunMuseUsageReset();
  }
});

Deno.test('muse call does not retry a 400', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  fncRunMuseUsageReset();
  let fldNumCalls = 0;
  const fncRunRestore = fncConvStubFetch(() => {
    fldNumCalls += 1;
    return new Response('bad', { status: 400 });
  });
  try {
    await assertRejects(
      () =>
        fncRunMuseJson([{ role: 'user', content: 'hi' }], 4000, {
          fldNumRetries: 2,
          fldNumRetryDelayMs: 1,
        }),
      Error,
      'HTTP 400',
    );
    assertEquals(fldNumCalls, 1);
    assertEquals(fncConvMuseUsage().fldNumRetries, 0);
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
    fncRunMuseUsageReset();
  }
});

Deno.test('muse audio part rides the official audio_url shape', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  let fldObjSeenBody: Record<string, unknown> = {};
  const fncRunRestore = fncConvStubFetch((_, fldObjInit) => {
    fldObjSeenBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as Record<
      string,
      unknown
    >;
    return Response.json({
      choices: [{ message: { content: '{"transcripts": ["hi"]}' } }],
    });
  });
  try {
    await fncRunMuseJson<{ transcripts: (string | null)[] }>([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'transcribe' },
          {
            type: 'audio_url',
            audio_url: { url: 'https://example.test/note.m4a?token=x' },
          },
        ],
      },
    ]);
    const fldStrBody = JSON.stringify(fldObjSeenBody);
    assert(fldStrBody.includes('"type":"audio_url"'));
    assert(fldStrBody.includes('"audio_url":{"url":'));
    assertEquals(fldObjSeenBody['model'], fldStrMuseModel);
  } finally {
    fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});
