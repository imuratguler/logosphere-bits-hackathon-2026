// Logosphere BITS — provider chain tests (Deno).
// The network is stubbed per test; keys are fake values
// set and deleted around each case. Values are never
// asserted — only routing order, fall-through, and the
// attempt log.

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  fldObjChainAttempt,
  fldStrDeepseekFastModel,
  fldStrDeepseekModel,
  fldStrMuseApiSparkOpen,
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

function fncRunSetKeys(fldBooDeepseek: boolean, fldBooMuseApi: boolean): void {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-baseten');
  if (fldBooDeepseek) {
    Deno.env.set('LOGOSPHERE_BITS_DEEPSEEK_API_KEY', 'test-deepseek');
  } else {
    Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  }
  if (fldBooMuseApi) {
    Deno.env.set('LOGOSPHERE_BITS_MUSE_API_KEY', 'test-muse');
    Deno.env.set('LOGOSPHERE_BITS_MUSE_API_BASE_URL', 'https://muse.test');
  } else {
    Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
    Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_BASE_URL');
  }
}

function fncRunClearKeys(): void {
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_BASE_URL');
}

function fncConvSeenModel(fldObjInit?: RequestInit): string {
  const fldObjBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as {
    model?: unknown;
  };
  return typeof fldObjBody.model === 'string' ? fldObjBody.model : '';
}

Deno.test('chain builds the fixed order with audio skipping deepseek', () => {
  fncRunSetKeys(true, true);
  try {
    const fldArrText = fncConvChainSteps('text').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrText, [
      `deepseek:${fldStrDeepseekFastModel}`,
      `deepseek:${fldStrDeepseekModel}`,
      `muse-api:${fldStrMuseApiSparkOpen}`,
      `muse-baseten:${fldStrMuseModel}`,
    ]);
    const fldArrVision = fncConvChainSteps('vision').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrVision, fldArrText);
    const fldArrAudio = fncConvChainSteps('audio').map((fldObjStep) =>
      `${fldObjStep.provider}:${fldObjStep.model}`
    );
    assertEquals(fldArrAudio, [
      `muse-api:${fldStrMuseApiSparkOpen}`,
      `muse-baseten:${fldStrMuseModel}`,
    ]);
  } finally {
    fncRunClearKeys();
  }
});

Deno.test('chain falls through failures to the first winner', async () => {
  fncRunSetKeys(true, true);
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
    assertEquals(fldArrSeen.length, 3);
    assert(fldArrSeen[0]!.includes('api.deepseek.com'));
    assert(fldArrSeen[0]!.includes(fldStrDeepseekFastModel));
    assert(fldArrSeen[1]!.includes(fldStrDeepseekModel));
    assert(fldArrSeen[2]!.includes('muse.test'));
    const fldArrAttempts: fldObjChainAttempt[] = fncConvChainAttemptsAfter(
      fldNumBefore,
    );
    assertEquals(
      fldArrAttempts.map((fldObjAttempt) => fldObjAttempt.ok),
      [false, false, true],
    );
    assert(fldArrAttempts[0]!.error!.includes('HTTP 500'));
    assert(fldArrAttempts[1]!.error!.includes('HTTP 429'));
    assertEquals(fldArrAttempts[2]!.error, null);
    assertEquals(fldArrAttempts[2]!.provider, 'muse-api');
    for (const fldObjAttempt of fldArrAttempts) {
      assert(fldObjAttempt.latencyMs >= 0);
    }
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain falls through unparsable answers', async () => {
  fncRunSetKeys(true, false);
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

Deno.test('chain runs baseten-only without optional keys', async () => {
  fncRunSetKeys(false, false);
  const fldArrSeen: string[] = [];
  const fncRunRestore = fncConvStubFetch((_fldStrUrl, fldObjInit) => {
    fldArrSeen.push(fncConvSeenModel(fldObjInit));
    return Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    });
  });
  try {
    const fldNumBefore = fncConvChainLastSeq();
    await fncRunChainJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      100,
      'text',
    );
    assertEquals(fldArrSeen, [fldStrMuseModel]);
    const fldArrAttempts = fncConvChainAttemptsAfter(fldNumBefore);
    assertEquals(fldArrAttempts.length, 4);
    assertEquals(
      fldArrAttempts.map((fldObjAttempt) => fldObjAttempt.ok),
      [false, false, false, true],
    );
    assert(fldArrAttempts[0]!.error!.includes('not configured'));
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain works without the baseten key when deepseek answers', async () => {
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  Deno.env.set('LOGOSPHERE_BITS_DEEPSEEK_API_KEY', 'test-deepseek');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_BASE_URL');
  const fncRunRestore = fncConvStubFetch(() =>
    Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    })
  );
  try {
    const fldObjAnswer = await fncRunChainJson<{ ok: boolean }>(
      [{ role: 'user', content: 'hi' }],
      100,
      'text',
    );
    assertEquals(fldObjAnswer, { ok: true });
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain throws the last error when every step fails', async () => {
  fncRunSetKeys(true, true);
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
      'muse-baseten HTTP 503',
    );
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});
