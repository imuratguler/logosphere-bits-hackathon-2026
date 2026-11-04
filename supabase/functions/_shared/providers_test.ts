// Logosphere BITS — provider chain tests (Deno).
// The network is stubbed per test; keys are fake values
// set and deleted around each case. Values are never
// asserted — only routing order, fall-through, request
// shapes, and the attempt log.

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  fldObjChainAttempt,
  fldStrDeepseekProModel,
  fldStrDeepseekSentModel,
  fldStrMetaApiAudioModel,
  fldStrMetaApiSparkModel,
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
  Deno.env.set('LOGOSPHERE_BITS_GEMINI_API_KEY', 'test-gemini');
}

function fncRunClearKeys(): void {
  Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_META_API_BASE_URL');
  Deno.env.delete('LOGOSPHERE_BITS_GEMINI_API_KEY');
}

function fncConvSeenBody(fldObjInit?: RequestInit): Record<string, unknown> {
  return JSON.parse((fldObjInit?.body ?? '{}') as string) as Record<
    string,
    unknown
  >;
}

Deno.test('chain builds the fixed order per kind', () => {
  fncRunSetKeys();
  try {
    const fldArrText = fncConvChainSteps('text').map((fldObjStep) =>
      `${fldObjStep.label}:${fldObjStep.model}`
    );
    assertEquals(fldArrText, [
      `deepseek-flash-vision-fast:${fldStrDeepseekSentModel}`,
      `deepseek-flash-vision:${fldStrDeepseekSentModel}`,
      `baseten-1026:${fldStrMuseModel}`,
      `meta-spark-1.3:${fldStrMetaApiSparkModel}`,
      `deepseek-v4-pro:${fldStrDeepseekProModel}`,
    ]);
    assertEquals(
      fncConvChainSteps('vision').map((fldObjStep) => fldObjStep.label),
      fncConvChainSteps('text').map((fldObjStep) => fldObjStep.label),
    );
    assertEquals(
      fncConvChainSteps('final').map((fldObjStep) => fldObjStep.label),
      fncConvChainSteps('text').map((fldObjStep) => fldObjStep.label),
    );
    const fldArrAudio = fncConvChainSteps('audio').map((fldObjStep) =>
      `${fldObjStep.label}:${fldObjStep.model}`
    );
    assertEquals(fldArrAudio, [
      `baseten-1026:${fldStrMuseModel}`,
      `meta-spark-1.2:${fldStrMetaApiAudioModel}`,
    ]);
  } finally {
    fncRunClearKeys();
  }
});

Deno.test('chain falls through failures to the first winner', async () => {
  fncRunSetKeys();
  const fldArrSeen: string[] = [];
  const fncRunRestore = fncConvStubFetch((fldStrUrl, fldObjInit) => {
    const fldObjBody = fncConvSeenBody(fldObjInit);
    fldArrSeen.push(`${fldStrUrl} ${fldObjBody['model']}`);
    if (fldStrUrl.includes('api.deepseek.com')) {
      return new Response('boom', { status: 500 });
    }
    if (fldStrUrl.includes('baseten')) {
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
    assertEquals(fldArrSeen.length, 4);
    assert(fldArrSeen[3]!.includes('api.meta.ai'));
    const fldArrAttempts: fldObjChainAttempt[] = fncConvChainAttemptsAfter(
      fldNumBefore,
    );
    assertEquals(
      fldArrAttempts.map((fldObjAttempt) => fldObjAttempt.ok),
      [false, false, false, true],
    );
    assertEquals(fldArrAttempts[0]!.errorKind, 'http-other');
    assertEquals(fldArrAttempts[0]!.httpStatus, 500);
    assertEquals(fldArrAttempts[2]!.errorKind, 'http-other');
    assertEquals(fldArrAttempts[3]!.provider, 'meta-api');
    assertEquals(fldArrAttempts[3]!.model, fldStrMetaApiSparkModel);
    assertEquals(fldArrAttempts[3]!.errorKind, 'none');
    for (const fldObjAttempt of fldArrAttempts) {
      assert(fldObjAttempt.latencyMs >= 0);
    }
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain sends per-provider request shapes', async () => {
  fncRunSetKeys();
  const fldArrBodies: Record<string, unknown>[] = [];
  const fldArrHeaders: Record<string, string>[] = [];
  const fncRunRestore = fncConvStubFetch((_fldStrUrl, fldObjInit) => {
    fldArrBodies.push(fncConvSeenBody(fldObjInit));
    fldArrHeaders.push(fldObjInit?.headers as Record<string, string>);
    return new Response('down', { status: 503 });
  });
  try {
    await assertRejects(() =>
      fncRunChainJson<{ ok: boolean }>(
        [{ role: 'user', content: 'hi' }],
        100,
        'text',
      )
    );
    assertEquals(fldArrBodies.length, 5);
    assertEquals(fldArrBodies[0]!['model'], fldStrDeepseekSentModel);
    assertEquals(fldArrBodies[0]!['reasoning_effort'], 'none');
    assertEquals(fldArrBodies[1]!['model'], fldStrDeepseekSentModel);
    assertEquals('reasoning_effort' in fldArrBodies[1]!, false);
    assertEquals(fldArrBodies[3]!['model'], fldStrMetaApiSparkModel);
    assertEquals(
      fldArrHeaders[4]!['Authorization'],
      'Bearer test-deepseek',
    );
    assertEquals(
      fldArrBodies[4]!['model'],
      fldStrDeepseekProModel,
    );
    assertEquals(
      fldArrHeaders[0]!['Authorization'],
      'Bearer test-deepseek',
    );
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain treats truncation as failure and continues', async () => {
  fncRunSetKeys();
  const fncRunRestore = fncConvStubFetch((fldStrUrl) => {
    if (fldStrUrl.includes('api.deepseek.com')) {
      return Response.json({
        choices: [{
          message: { content: '{"ok": tru' },
          finish_reason: 'length',
        }],
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
    assertEquals(fldArrAttempts[0]!.errorKind, 'truncated');
    assertEquals(fldArrAttempts[2]!.ok, true);
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain treats schema rejection as failure and continues', async () => {
  fncRunSetKeys();
  const fncRunRestore = fncConvStubFetch(() =>
    Response.json({
      choices: [{ message: { content: '{"ok": true}' } }],
    })
  );
  try {
    const fldNumBefore = fncConvChainLastSeq();
    await assertRejects(() =>
      fncRunChainJson<{ ok: boolean }>(
        [{ role: 'user', content: 'hi' }],
        100,
        'text',
        () => false,
      )
    );
    const fldArrAttempts = fncConvChainAttemptsAfter(fldNumBefore);
    assertEquals(fldArrAttempts.length, 5);
    assert(
      fldArrAttempts.every((fldObjAttempt) =>
        fldObjAttempt.errorKind === 'schema'
      ),
    );
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain accepts array content blocks', async () => {
  fncRunSetKeys();
  const fncRunRestore = fncConvStubFetch(() =>
    Response.json({
      choices: [{
        message: {
          content: [{ type: 'text', text: '{"ok":' }, { text: ' true}' }],
        },
      }],
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

Deno.test('audio legs get native shapes, never the raw block', async () => {
  fncRunSetKeys();
  const fldArrSeen: { url: string; part: unknown }[] = [];
  const fncRunRestore = fncConvStubFetch((fldStrUrl, fldObjInit) => {
    const fldObjBody = fncConvSeenBody(fldObjInit);
    const fldArrMessages = fldObjBody['messages'] as {
      content: unknown[];
    }[];
    fldArrSeen.push({
      url: fldStrUrl,
      part: fldArrMessages[0]!.content[1],
    });
    return new Response('down', { status: 503 });
  });
  try {
    await assertRejects(() =>
      fncRunChainJson<{ transcripts: unknown }>(
        [{
          role: 'user',
          content: [
            { type: 'text', text: 'transcribe' },
            {
              type: 'audio_url',
              audio_url: { url: 'data:audio/wav;base64,AAAA' },
            },
          ],
        }],
        2000,
        'audio',
      )
    );
    assertEquals(fldArrSeen.length, 2);
    const fldObjBaseten = fldArrSeen[0]!.part as {
      type: string;
      audio_url: { url: string };
    };
    assert(fldArrSeen[0]!.url.includes('baseten'));
    assertEquals(fldObjBaseten.type, 'audio_url');
    assertEquals(
      fldObjBaseten.audio_url.url,
      'data:audio/wav;base64,AAAA',
    );
    const fldObjMeta = fldArrSeen[1]!.part as {
      type: string;
      input_audio: { data: string; format: string };
    };
    assert(fldArrSeen[1]!.url.includes('api.meta.ai'));
    assertEquals(fldObjMeta.type, 'input_audio');
    assertEquals(fldObjMeta.input_audio.format, 'wav');
    assertEquals(fldObjMeta.input_audio.data, 'AAAA');
  } finally {
    fncRunRestore();
    fncRunClearKeys();
  }
});

Deno.test('chain reports the real failure past unconfigured legs', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-baseten');
  Deno.env.delete('LOGOSPHERE_BITS_DEEPSEEK_API_KEY');
  Deno.env.delete('LOGOSPHERE_BITS_MUSE_API_KEY');
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
