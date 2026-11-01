// Logosphere BITS — analysis run handler tests (Deno).
// The fake client serves run/image/stage tables plus storage
// downloads; Muse answers and broadcasts ride a stubbed
// fetch routed by URL. No network runs.

import { assertEquals } from '@std/assert';
import { fncRunHandleRequest } from './index.ts';

const fldStrRun = '22222222-2222-2222-2222-222222222222';
const fldStrImage = '11111111-1111-1111-1111-111111111111';

type fldObjServe = {
  fldStrRunStatus?: string;
  fldObjMergePayload?: unknown;
  fldObjStagePayload?: unknown;
  fldNumClaimVersion?: number | null;
  fldBooMuseFails?: boolean;
  fldBooVoice?: boolean;
};

function fncConvFakeClient(fldObjServe: fldObjServe) {
  const fldArrMarks: { values: Record<string, unknown> }[] = [];
  const fldArrErrors: { values: Record<string, unknown> }[] = [];
  const fncConvBuilder = (fldStrTable: string) => {
    const fldObjBuilder = {
      select: () => fldObjBuilder,
      eq: () => fldObjBuilder,
      order: () => fldObjBuilder,
      limit: () => fldObjBuilder,
      update: (fldObjValues: Record<string, unknown>) => {
        fldArrMarks.push({ values: { table: fldStrTable, ...fldObjValues } });
        const fldObjTerminal = {
          select: () => fldObjTerminal,
          eq: () => fldObjTerminal,
          order: () => fldObjTerminal,
          limit: () => fldObjTerminal,
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (
            fldObjResolve: (fldObjValue: unknown) => void,
            fldObjReject: (fldObjReason?: unknown) => void,
          ) =>
            Promise.resolve({ data: null, error: null }).then(
              fldObjResolve,
              fldObjReject,
            ),
        };
        return fldObjTerminal;
      },
      insert: (fldObjValues: Record<string, unknown>) => {
        fldArrErrors.push({ values: { table: fldStrTable, ...fldObjValues } });
        return Promise.resolve({ data: null, error: null });
      },
      maybeSingle: () => {
        if (fldStrTable === 'pipeline_runs') {
          return Promise.resolve({
            data: {
              id: fldStrRun,
              mode: 'singleProduct',
              status: fldObjServe.fldStrRunStatus ?? 'pending',
              target_collection_id: 'col-1',
              target_set_id: null,
            },
            error: null,
          });
        }
        if (fldStrTable === 'pipeline_stage_runs') {
          return Promise.resolve({
            data: fldObjServe.fldObjMergePayload !== undefined ||
                fldObjServe.fldObjStagePayload !== undefined
              ? {
                payload: fldObjServe.fldObjMergePayload ??
                  fldObjServe.fldObjStagePayload,
              }
              : null,
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [
            {
              id: fldStrImage,
              sort_order: 0,
              file_path: `product-photos/draft/${fldStrRun}/${fldStrImage}.jpg`,
              mime_type: 'image/jpeg',
              rotation_degrees: 0,
              voice_file_path: fldObjServe.fldBooVoice === true
                ? `voice-notes/draft/${fldStrRun}/${fldStrImage}.m4a`
                : null,
            },
          ],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    return fldObjBuilder;
  };
  const fldObjClient = {
    rpc: (fldStrFn: string) => {
      if (fldStrFn === 'demo_authorize') {
        return Promise.resolve({ data: 'persona-1', error: null });
      }
      return Promise.resolve({
        data: fldObjServe.fldNumClaimVersion ?? 1,
        error: null,
      });
    },
    from: fncConvBuilder,
    storage: {
      from: () => ({
        download: () =>
          Promise.resolve({
            data: new Blob([new Uint8Array([1, 2, 3])]),
            error: null,
          }),
      }),
    },
  } as unknown as Parameters<typeof fncRunHandleRequest>[1];
  return { fldObjClient, fldArrMarks, fldArrErrors };
}

function fncConvStubMuse(fldObjServe: fldObjServe) {
  const fldArrBroadcasts: unknown[] = [];
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string, fldObjInit?: RequestInit) => {
    if (fldStrUrl.includes('/realtime/v1/api/broadcast')) {
      fldArrBroadcasts.push(JSON.parse((fldObjInit?.body ?? '{}') as string));
      return Promise.resolve(new Response('ok'));
    }
    if (fldObjServe.fldBooMuseFails === true) {
      return Promise.resolve(new Response('bad', { status: 500 }));
    }
    const fldObjBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as {
      messages: { content: unknown }[];
    };
    const fldStrText = JSON.stringify(fldObjBody.messages);
    let fldStrContent = '{"results": []}';
    if (fldStrText.includes('image_url')) {
      fldStrContent = JSON.stringify({
        reads: [{ title: 'The Demo Codex', isbn13: '978-3-16-148410-0' }],
      });
    } else if (fldStrText.includes('MAJOR units')) {
      fldStrContent = JSON.stringify({
        replacement_new: 19.99,
        market_min: 5,
        market_max: 15,
        market_median: 8,
        market_recommended: 9,
        currency: 'USD',
      });
    } else {
      fldStrContent = JSON.stringify({
        results: [
          {
            title: 'The Demo Codex',
            publisher: 'Logosphere Press',
            confidence: 0.9,
            rationale: 'cover match',
          },
        ],
      });
    }
    return Promise.resolve(
      Response.json({ choices: [{ message: { content: fldStrContent } }] }),
    );
  }) as typeof fetch;
  return {
    fldArrBroadcasts,
    fncRunRestore: () => {
      globalThis.fetch = fldObjRealFetch;
    },
  };
}

function fncConvRequest(): Request {
  return new Request('https://test/run', {
    method: 'POST',
    body: JSON.stringify({ session_id: 'session-1', run_id: fldStrRun }),
  });
}

Deno.test('run completes a single photo end to end', async () => {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      results: {
        photo_ids: string[];
        biblio: { title: string | null };
        price: { replacement_new: number | null; currency: string };
      }[];
      sources: { source: string }[];
    };
    assertEquals(fldObjBody.status, 'ok');
    assertEquals(fldObjBody.results.length, 1);
    assertEquals(fldObjBody.results[0]!.photo_ids, [fldStrImage]);
    assertEquals(fldObjBody.results[0]!.biblio.title, 'The Demo Codex');
    assertEquals(fldObjBody.results[0]!.price.replacement_new, 1999);
    assertEquals(fldObjBody.results[0]!.price.currency, 'USD');
    assertEquals(
      fldObjBody.sources.map((fldObjSource) => fldObjSource.source),
      [
        'device-photo',
        'isbn-normalize',
        'muse-preread',
        'muse-finalize',
        'muse-price',
      ],
    );
    const fldArrStages = fldObjFake.fldArrMarks
      .filter((fldObjMark) =>
        fldObjMark.values['table'] === 'pipeline_stage_runs'
      )
      .map((fldObjMark) => fldObjMark.values['status']);
    assertEquals(
      fldArrStages.filter((fldObjStatus) => fldObjStatus === 'succeeded')
        .length,
      6,
    );
    assertEquals(
      fldArrStages.filter((fldObjStatus) => fldObjStatus === 'cancelled')
        .length,
      1,
    );
    assertEquals(fldObjMuse.fldArrBroadcasts.length > 0, true);
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('SUPABASE_URL');
    Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run replays succeeded runs without new calls', async () => {
  const fldObjMerge = {
    results: [{ photo_ids: [], biblio: {}, price: {} }],
    sources: [],
  };
  const fldObjFake = fncConvFakeClient({
    fldStrRunStatus: 'succeeded',
    fldObjMergePayload: fldObjMerge,
  });
  let fldNumFetches = 0;
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    fldNumFetches += 1;
    return Promise.resolve(new Response('ok'));
  }) as typeof fetch;
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      replayed: boolean;
    };
    assertEquals(fldObjBody.status, 'ok');
    assertEquals(fldObjBody.replayed, true);
    assertEquals(fldNumFetches, 0);
  } finally {
    globalThis.fetch = fldObjRealFetch;
  }
});

Deno.test('run marks retryable failure on muse errors', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({ fldBooMuseFails: true });
  const fldObjMuse = fncConvStubMuse({ fldBooMuseFails: true });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 500);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      failed_stage: string;
    };
    assertEquals(fldObjBody.status, 'error');
    assertEquals(fldObjBody.failed_stage, 'preRead');
    assertEquals(fldObjFake.fldArrErrors.length, 1);
    const fldArrRunMarks = fldObjFake.fldArrMarks.filter(
      (fldObjMark) => fldObjMark.values['table'] === 'pipeline_runs',
    );
    assertEquals(
      fldArrRunMarks[fldArrRunMarks.length - 1]!.values['status'],
      'failedRetryable',
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});
