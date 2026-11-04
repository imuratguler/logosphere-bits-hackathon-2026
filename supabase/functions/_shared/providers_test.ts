// Logosphere BITS — provider chain tests (Deno).
// The network is stubbed per test; keys are fake values
// set and deleted around each case. Values are never
// asserted — only routing order, fall-through, auth
// headers, and the attempt log.

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  fldObjChainAttempt,
  fldStrDeepseekFastModel,
  fldStrDeepseekModel,
  fldStrGeminiFastModel,
  fldStrGeminiModel,
  fldStrMetaApiSparkOpen,
  fncConvChainAttemptsAfter,
  fncConvChainLastSeq,
  fncConvChainSteps,
  fncRunChainJson,
} from './providers.ts';
import { fldStrMuseModel } from './muse.ts';

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

function fncRunSetKeys(): void {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-baseten');
  Deno.env.set('LOGOSPHERE_BITS_DEEPSEEK_API_KEY', 'test-deepseek');
  Deno.env.set('LOGOSPHERE_BITS_MUSE_API_KEY', 'test-meta');
  Deno.env.set('LOGOSPHERE_BITS_META_API_BASE_URL', 'https://meta.test');
  Deno.env.set('LOGOSPHERE_BITS_GEMINI_API_KEY', 'test-gemini');
}

function fncRunClearKeys(): void {
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_META_API_BASE_URL');
  Deno.env.delete('LOGOSPHERE_BITS_GEMINI_API_KEY');
}

function fncConvSeenModel(fldObjInit?: RequestInit): string {
  const fldObjBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as {
    model?: unknown;
  };
  return typeof fldObjBody.model === 'string' ? fldObjBody.model : '';
}

Deno.test('chain builds the fixed order with audio skipping deepseek', () => {
  fncRunSetKeys();
  try {
    const fldArrText = fncConvChainSteps('text').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrText, [
      `deepseek:${fldStrDeepseekFastModel}`,
      `deepseek:${fldStrDeepseekModel}`,
      `muse-baseten:${fldStrMuseModel}`,
      `meta-api:${fldStrMetaApiSparkOpen}`,
      `gemini:${fldStrGeminiFastModel}`,
      `gemini:${fldStrGeminiModel}`,
    ]);
    const fldArrVision = fncConvChainSteps('vision').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrVision, fldArrText);
    const fldArrAudio = fncConvChainSteps('audio').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrAudio, [
      `muse-baseten:${fldStrMuseModel}`,
      `meta-api:${fldStrMetaApiSparkOpen}`,
      `gemini:${fldStrGeminiFastModel}`,
      `gemini:${fldStrGeminiModel}`,
    ]);
  } finally {
    fncRunClearKeys();
  }
});

Deno.test('chain falls through failures to the first winner', async () => {
  fncRunSetKeys();
  const fldArrSeen: string[] = [];
  const fncRunRestore = fncConvStubFetch((fldStrUrl, fldObjInit) => {
    const fldStrModel = fncConvSeenModel(fldObjInit);
    fldArrSeen.push(`${fldStrUrl} ${fldStrModel}`);
    if (fldStrModel === fldStrDeepseekFastModel) {
      return new Response('boom', { status: 500 });
    }
    if (fldStrModel === fldStrDeepseekModel) {
      return new Response('slow down', { status: 429 });
    }
    if (fldStrModel === fldStrMuseModel) {
      return new Response('down', { status: 503 });
    }
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldNumBefore = fncConvChainLastSeq();
    const fldObjAnswer = await fncRunChainJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      100,
      'text',
    );
    assertEquals(fldObjAnswer, { ok: true });
    assertEquals(fldArrSeen.length, 4);
    assert(fldArrSeen[0]!.includes('api.deepseek.com'));
    assert(fldArrSeen[0]!.includes(fldStrDeepseekFastModel));
    assert(fldArrSeen[1]!.includes(fldStrDeepseekModel));
    assert(fldArrSeen[2]!.includes('baseten'));
    assert(fldArrSeen[3]!.includes('meta.test'));
    const fldArrAttempts: fldObjChainAttempt[] = fncConvChainAttemptsAfter(
      fldNumBefore,
    );
    assertEquals(
      fldArrAttempts.map((fldObjAttempt) => fldObjAttempt.ok),
      [false, false, false, true],
    );
    assert(fldArrAttempts[0]!.error!.includes('HTTP 500'));
    assert(fldArrAttempts[2]!.error!.includes('HTTP 503'));
    assertEquals(fldArrAttempts[3]!.error, null);
    assertEquals(fldArrAttempts[3]!.provider, 'meta-api');
    for (const fldObjAttempt of fldArrAttempts) {
      assert(fldObjAttempt.latencyMs >= 0);
    }
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain sends the goog key header on gemini steps', async () => {
  fncRunSetKeys();
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_META_API_BASE_URL');
  let fldStrSeenGoog = '';
  let fldStrSeenAuth = '';
  const fncRunRestore = fncConvStubFetch((fldStrUrl, fldObjInit) => {
    const fldObjHeaders = fldObjInit?.headers as Record<string, string>;
    fldStrSeenGoog = fldObjHeaders['x-goog-api-key'] ?? '';
    fldStrSeenAuth = fldObjHeaders['Authorization'] ?? '';
    assert(fldStrUrl.includes('generativelanguage.googleapis.com'));
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldObjAnswer = await fncRunChainJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      100,
      'text',
    );
    assertEquals(fldObjAnswer, { ok: true });
    assertEquals(fldStrSeenGoog, 'test-gemini');
    assertEquals(fldStrSeenAuth, '');
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain falls through unparsable answers', async () => {
  fncRunSetKeys();
  const fncRunRestore = fncConvStubFetch((_fldStrUrl, fldObjInit) => {
    const fldStrModel = fncConvSeenModel(fldObjInit);
    if (fldStrModel === fldStrDeepseekFastModel) {
      return Response.json({
        choices: [{ message: { content: 'not json at all' } }],
      });
    }
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldNumBefore = fncConvChainLastSeq();
    const fldObjAnswer = await fncRunChainJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      100,
      'text',
    );
    assertEquals(fldObjAnswer, { ok: true });
    const fldArrAttempts = fncConvChainAttemptsAfter(fldNumBefore);
    assertEquals(
      fldArrAttempts.map((fldObjAttempt) => fldObjAttempt.model),
      [fldStrDeepseekFastModel, fldStrDeepseekModel],
    );
    assert(fldArrAttempts[0]!.error!.includes('unparsable'));
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain reports the real failure past unconfigured legs', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-baseten');
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_META_API_BASE_URL');
  Deno.env.delete('LOGOSPHERE_BITS_GEMINI_API_KEY');
  const fncRunRestore = fncConvStubFetch(() =>
    new Response('down', { status: 500 })
  );
  try {
    await assertRejects(
      () =>
        fncRunChainJson<{ ok: boolean }>(
          [{ role: 'user', content: 'hi' }],
          100,
          'text',
        ),
      Error,
      'muse-baseten HTTP 500',
    );
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain throws the last error when every step fails', async () => {
  fncRunSetKeys();
  const fncRunRestore = fncConvStubFetch(() =>
    new Response('down', { status: 503 })
  );
  try {
    await assertRejects(
      () =>
        fncRunChainJson<{ ok: boolean }>(
          [{ role: 'user', content: 'hi' }],
          100,
          'audio',
        ),
      Error,
      'gemini HTTP 503',
    );
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});
