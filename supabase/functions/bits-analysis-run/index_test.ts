// Logosphere BITS — analysis run handler tests (Deno).
// The fake client serves run/image/stage tables plus storage
// downloads and signed URLs; Muse answers and broadcasts
// ride a stubbed fetch routed by URL. Voice downloads serve
// a minimal synthetic M4A. No network runs.

import { assert, assertEquals } from '@std/assert';
import { fncRunHandleRequest } from './index.ts';

const fldStrRun = '22222222-2222-2222-2222-222222222222';
const fldStrImage = '11111111-1111-1111-1111-111111111111';

type fldObjServe = {
  fldStrRunStatus?: string;
  fldStrMode?: 'singleProduct' | 'multiProduct';
  fldNumImages?: number;
  fldObjMergePayload?: unknown;
  fldObjStagePayload?: unknown;
  fldNumClaimVersion?: number | null;
  fldBooMuseFails?: boolean;
  fldBooMuseTimeout?: boolean;
  fldBooVoice?: boolean;
  fldBooBadVoice?: boolean;
  fldBooBigVoice?: boolean;
  fldBooSignFails?: boolean;
  fldArrScriptTexts?: (string | null)[];
  fldObjLocalCatalog?: Record<string, unknown> | null;
  fldNumCatalogStatus?: number;
  fldObjCatalogBody?: unknown;
  fldObjFinalAnswer?: unknown;
  fldArrFinalAnswers?: unknown[];
  fldArrDeweyCodes?: string[];
  fldBooPriceFails?: boolean;
  fldStrPriceFailMarker?: string;
  fldArrPriceCurrency?: string[];
  fldObjDuplicateAnswer?: unknown;
  fldArrStagePayloads?: unknown[];
};

function fncConvImageId(fldNumIndex: number): string {
  if (fldNumIndex === 0) {
    return fldStrImage;
  }
  return `10000000-0000-0000-0000-00000000000${fldNumIndex}`;
}

function fncConvJoin(fldArrParts: Uint8Array[]): Uint8Array {
  let fldNumTotal = 0;
  for (const fldObjPart of fldArrParts) {
    fldNumTotal += fldObjPart.length;
  }
  const fldObjOut = new Uint8Array(fldNumTotal);
  let fldNumAt = 0;
  for (const fldObjPart of fldArrParts) {
    fldObjOut.set(fldObjPart, fldNumAt);
    fldNumAt += fldObjPart.length;
  }
  return fldObjOut;
}

function fncConvM4a(): Uint8Array {
  const fldObjFtyp = new Uint8Array([
    0x00,
    0x00,
    0x00,
    0x14,
    0x66,
    0x74,
    0x79,
    0x70,
    0x4d,
    0x34,
    0x41,
    0x20,
    0x00,
    0x00,
    0x00,
    0x00,
    0x4d,
    0x34,
    0x41,
    0x20,
  ]);
  const fldObjMdhd = new Uint8Array(32);
  const fldObjMdhdView = new DataView(fldObjMdhd.buffer);
  fldObjMdhdView.setUint32(0, 32);
  fldObjMdhd.set([0x6d, 0x64, 0x68, 0x64], 4);
  fldObjMdhdView.setUint32(20, 44100);
  fldObjMdhdView.setUint32(24, 44100 * 7);
  const fldObjMp4a = new Uint8Array(36);
  const fldObjMp4aView = new DataView(fldObjMp4a.buffer);
  fldObjMp4aView.setUint32(0, 36);
  fldObjMp4a.set([0x6d, 0x70, 0x34, 0x61], 4);
  fldObjMp4aView.setUint32(32, 44100 * 65536);
  const fldObjStsdHead = new Uint8Array(16);
  const fldObjStsdView = new DataView(fldObjStsdHead.buffer);
  fldObjStsdView.setUint32(0, 16 + 36);
  fldObjStsdHead.set([0x73, 0x74, 0x73, 0x64], 4);
  fldObjStsdView.setUint32(12, 1);
  const fldObjStblHead = new Uint8Array(8);
  new DataView(fldObjStblHead.buffer).setUint32(0, 8 + 16 + 36);
  fldObjStblHead.set([0x73, 0x74, 0x62, 0x6c], 4);
  const fldObjMinfHead = new Uint8Array(8);
  new DataView(fldObjMinfHead.buffer).setUint32(0, 8 + 8 + 16 + 36);
  fldObjMinfHead.set([0x6d, 0x69, 0x6e, 0x66], 4);
  const fldObjMdiaHead = new Uint8Array(8);
  new DataView(fldObjMdiaHead.buffer).setUint32(0, 8 + 32 + 8 + 8 + 16 + 36);
  fldObjMdiaHead.set([0x6d, 0x64, 0x69, 0x61], 4);
  const fldObjTrakHead = new Uint8Array(8);
  new DataView(fldObjTrakHead.buffer).setUint32(
    0,
    8 + 8 + 32 + 8 + 8 + 16 + 36,
  );
  fldObjTrakHead.set([0x74, 0x72, 0x61, 0x6b], 4);
  const fldObjMoovHead = new Uint8Array(8);
  new DataView(fldObjMoovHead.buffer).setUint32(
    0,
    8 + 8 + 8 + 32 + 8 + 8 + 16 + 36,
  );
  fldObjMoovHead.set([0x6d, 0x6f, 0x6f, 0x76], 4);
  return fncConvJoin([
    fldObjFtyp,
    fldObjMoovHead,
    fldObjTrakHead,
    fldObjMdiaHead,
    fldObjMdhd,
    fldObjMinfHead,
    fldObjStblHead,
    fldObjStsdHead,
    fldObjMp4a,
  ]);
}

function fncConvBigVoice(): Uint8Array {
  const fldObjOut = new Uint8Array(2000000);
  fldObjOut.set(
    [
      0x00,
      0x00,
      0x00,
      0x14,
      0x66,
      0x74,
      0x79,
      0x70,
      0x4d,
      0x34,
      0x41,
      0x20,
    ],
    0,
  );
  return fldObjOut;
}

function fncConvFakeClient(fldObjServe: fldObjServe) {
  const fldArrMarks: { values: Record<string, unknown> }[] = [];
  const fldArrErrors: { values: Record<string, unknown> }[] = [];
  const fldArrCatalogInserts: Record<string, unknown>[] = [];
  let fldNumStageReads = 0;
  const fldNumImages = fldObjServe.fldNumImages ?? 1;
  const fncConvBuilder = (fldStrTable: string) => {
    if (fldStrTable === 'dewey_nodes') {
      return {
        select: () => ({
          like: () =>
            Promise.resolve({
              data: (fldObjServe.fldArrDeweyCodes ?? []).map((fldStrCode) => ({
                code: fldStrCode,
              })),
              error: null,
            }),
        }),
      };
    }
    if (fldStrTable === 'catalog_records') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: fldObjServe.fldObjLocalCatalog ?? null,
                error: null,
              }),
          }),
        }),
        insert: (fldObjValues: Record<string, unknown>) => {
          fldArrCatalogInserts.push(fldObjValues);
          return Promise.resolve({ data: null, error: null });
        },
      };
    }
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
      insert: (
        fldObjValues: Record<string, unknown> | Record<string, unknown>[],
      ) => {
        if (Array.isArray(fldObjValues)) {
          for (const fldObjRow of fldObjValues) {
            fldArrErrors.push({ values: { table: fldStrTable, ...fldObjRow } });
          }
        } else {
          fldArrErrors.push({
            values: { table: fldStrTable, ...fldObjValues },
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      maybeSingle: () => {
        if (fldStrTable === 'pipeline_runs') {
          return Promise.resolve({
            data: {
              id: fldStrRun,
              mode: fldObjServe.fldStrMode ?? 'singleProduct',
              status: fldObjServe.fldStrRunStatus ?? 'pending',
              target_collection_id: 'col-1',
              target_set_id: null,
            },
            error: null,
          });
        }
        if (fldStrTable === 'pipeline_stage_runs') {
          if (fldObjServe.fldArrStagePayloads !== undefined) {
            const fldObjPayload =
              fldObjServe.fldArrStagePayloads[fldNumStageReads] ?? null;
            fldNumStageReads += 1;
            return Promise.resolve({
              data: fldObjPayload === null ? null : { payload: fldObjPayload },
              error: null,
            });
          }
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
      ) => {
        const fldArrRows = [];
        for (let fldNumAt = 0; fldNumAt < fldNumImages; fldNumAt += 1) {
          const fldStrId = fncConvImageId(fldNumAt);
          fldArrRows.push({
            id: fldStrId,
            sort_order: fldNumAt,
            file_path: `product-photos/draft/${fldStrRun}/${fldStrId}.jpg`,
            mime_type: 'image/jpeg',
            rotation_degrees: 0,
            voice_file_path: fldObjServe.fldBooVoice === true
              ? `voice-notes/draft/${fldStrRun}/${fldStrId}.m4a`
              : null,
          });
        }
        return Promise.resolve({ data: fldArrRows, error: null }).then(
          fldObjResolve,
          fldObjReject,
        );
      },
    };
    return fldObjBuilder;
  };
  const fldObjClient = {
    rpc: (fldStrFn: string) => {
      if (fldStrFn === 'demo_authorize') {
        return Promise.resolve({ data: 'persona-1', error: null });
      }
      return Promise.resolve({
        data: fldObjServe.fldNumClaimVersion === undefined
          ? 1
          : fldObjServe.fldNumClaimVersion,
        error: null,
      });
    },
    from: fncConvBuilder,
    storage: {
      from: () => ({
        download: (fldStrName: string) => {
          if (fldStrName.endsWith('.m4a')) {
            if (fldObjServe.fldBooBadVoice === true) {
              return Promise.resolve({
                data: new Blob([new Uint8Array([1, 2, 3, 4])]),
                error: null,
              });
            }
            if (fldObjServe.fldBooBigVoice === true) {
              return Promise.resolve({
                data: new Blob([fncConvBigVoice() as BlobPart]),
                error: null,
              });
            }
            return Promise.resolve({
              data: new Blob([fncConvM4a() as BlobPart]),
              error: null,
            });
          }
          return Promise.resolve({
            data: new Blob([new Uint8Array([1, 2, 3])]),
            error: null,
          });
        },
        createSignedUrl: (fldStrName: string) => {
          if (fldObjServe.fldBooSignFails === true) {
            return Promise.resolve({
              data: null,
              error: { message: 'sign down' },
            });
          }
          return Promise.resolve({
            data: {
              signedUrl: `https://signed.test/${fldStrName}?token=signed-token`,
            },
            error: null,
          });
        },
      }),
    },
  } as unknown as Parameters<typeof fncRunHandleRequest>[1];
  return { fldObjClient, fldArrMarks, fldArrErrors, fldArrCatalogInserts };
}

function fncConvStubMuse(fldObjServe: fldObjServe) {
  const fldArrBroadcasts: unknown[] = [];
  const fldArrAudioBodies: string[] = [];
  const fldArrFinalizeBodies: string[] = [];
  let fldNumPreReadCalls = 0;
  let fldNumAudioCalls = 0;
  let fldNumPriceCalls = 0;
  let fldNumDuplicateCalls = 0;
  let fldNumCatalogFetches = 0;
  let fldNumScripts = 0;
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string, fldObjInit?: RequestInit) => {
    if (fldStrUrl.includes('/realtime/v1/api/broadcast')) {
      fldArrBroadcasts.push(JSON.parse((fldObjInit?.body ?? '{}') as string));
      return Promise.resolve(new Response('ok'));
    }
    if (fldStrUrl.includes('openlibrary.org')) {
      fldNumCatalogFetches += 1;
      const fldNumStatus = fldObjServe.fldNumCatalogStatus ?? 200;
      if (fldNumStatus !== 200) {
        return Promise.resolve(
          new Response('missing', { status: fldNumStatus }),
        );
      }
      return Promise.resolve(
        Response.json(
          fldObjServe.fldObjCatalogBody ?? {
            title: 'The Demo Codex',
            publishers: ['Logosphere Press'],
            publish_date: '2026',
            number_of_pages: 321,
          },
        ),
      );
    }
    if (fldStrUrl.includes('googleapis.com')) {
      return Promise.resolve(Response.json({ items: [] }));
    }
    if (fldObjServe.fldBooMuseFails === true) {
      return Promise.resolve(new Response('bad', { status: 500 }));
    }
    if (fldObjServe.fldBooMuseTimeout === true) {
      throw new DOMException('Signal timed out.', 'TimeoutError');
    }
    const fldObjBody = JSON.parse((fldObjInit?.body ?? '{}') as string) as {
      messages: { content: unknown }[];
    };
    const fldStrText = JSON.stringify(fldObjBody.messages);
    if (fldStrText.includes('audio_url')) {
      fldNumAudioCalls += 1;
      fldArrAudioBodies.push(fldStrText);
      const fldNumParts =
        (fldStrText.match(/"type":"audio_url"/g) ?? []).length;
      const fldArrOut: (string | null)[] = [];
      for (let fldNumAt = 0; fldNumAt < fldNumParts; fldNumAt += 1) {
        const fldArrScript = fldObjServe.fldArrScriptTexts;
        fldArrOut.push(
          fldArrScript !== undefined && fldNumScripts < fldArrScript.length
            ? fldArrScript[fldNumScripts++]!
            : `note ${fldNumScripts++}`,
        );
      }
      return Promise.resolve(
        Response.json({
          choices: [
            {
              message: { content: JSON.stringify({ transcripts: fldArrOut }) },
            },
          ],
        }),
      );
    }
    let fldStrContent = '{"results": []}';
    if (fldStrText.includes('image_url')) {
      fldNumPreReadCalls += 1;
      const fldNumParts =
        (fldStrText.match(/"type":"image_url"/g) ?? []).length;
      const fldArrReads = [];
      for (let fldNumAt = 0; fldNumAt < fldNumParts; fldNumAt += 1) {
        fldArrReads.push(
          fldNumAt === 0
            ? { title: 'The Demo Codex', isbn13: '978-3-16-148410-0' }
            : { title: `Photo ${fldNumAt + 1}` },
        );
      }
      fldStrContent = JSON.stringify({ reads: fldArrReads });
    } else if (fldStrText.includes('MAJOR units')) {
      if (
        fldObjServe.fldBooPriceFails === true ||
        (fldObjServe.fldStrPriceFailMarker !== undefined &&
          fldStrText.includes(fldObjServe.fldStrPriceFailMarker))
      ) {
        return Promise.resolve(new Response('bad', { status: 500 }));
      }
      const fldArrScript = fldObjServe.fldArrPriceCurrency;
      const fldStrCurrency = fldArrScript === undefined
        ? 'USD'
        : fldArrScript[fldNumPriceCalls++] ?? 'USD';
      fldNumPriceCalls += fldArrScript === undefined ? 1 : 0;
      fldStrContent = JSON.stringify({
        replacement_new: 19.99,
        market_min: 5,
        market_max: 15,
        market_median: 8,
        market_recommended: 9,
        currency: fldStrCurrency,
        confidence: 0.8,
      });
    } else if (fldStrText.includes('SAME edition')) {
      fldNumDuplicateCalls += 1;
      return Promise.resolve(
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify(
                  fldObjServe.fldObjDuplicateAnswer ?? { groups: [] },
                ),
              },
            },
          ],
        }),
      );
    } else {
      fldArrFinalizeBodies.push(fldStrText);
      const fldArrAnswers = fldObjServe.fldArrFinalAnswers;
      const fldObjAnswer = fldArrAnswers !== undefined
        ? (fldArrAnswers[fldArrFinalizeBodies.length - 1] ??
          fldArrAnswers[fldArrAnswers.length - 1])
        : fldObjServe.fldObjFinalAnswer;
      fldStrContent = JSON.stringify(
        fldObjAnswer ?? {
          results: [
            {
              title: 'The Demo Codex',
              publisher: 'Logosphere Press',
              confidence: 0.9,
              rationale: 'cover match',
            },
          ],
        },
      );
    }
    return Promise.resolve(
      Response.json({ choices: [{ message: { content: fldStrContent } }] }),
    );
  }) as typeof fetch;
  return {
    fldArrBroadcasts,
    fldArrAudioBodies,
    fldArrFinalizeBodies,
    fldNumAudioCalls: () => fldNumAudioCalls,
    fldNumPreReadCalls: () => fldNumPreReadCalls,
    fldNumPriceCalls: () => fldNumPriceCalls,
    fldNumDuplicateCalls: () => fldNumDuplicateCalls,
    fldNumCatalogFetches: () => fldNumCatalogFetches,
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

function fncConvEvents(fldArrBroadcasts: unknown[]): string[] {
  return fldArrBroadcasts.map((fldObjEntry) => {
    const fldObjBody = fldObjEntry as {
      messages: { payload: { stage: string; event: string } }[];
    };
    const fldObjPayload = fldObjBody.messages[0]!.payload;
    return `${fldObjPayload.stage}:${fldObjPayload.event}`;
  });
}

function fncConvStagePayload(
  fldArrMarks: { values: Record<string, unknown> }[],
  fldNumPick: number,
): Record<string, unknown> {
  const fldArrStages = fldArrMarks.filter((fldObjMark) =>
    fldObjMark.values['table'] === 'pipeline_stage_runs'
  );
  return fldArrStages[fldNumPick]!.values['payload'] as Record<string, unknown>;
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
        price: {
          replacement_new: number | null;
          currency: string;
          confidence: number | null;
          basis: string;
        };
      }[];
      sources: { source: string }[];
    };
    assertEquals(fldObjBody.status, 'ok');
    assertEquals(fldObjBody.results.length, 1);
    assertEquals(fldObjBody.results[0]!.photo_ids, [fldStrImage]);
    assertEquals(fldObjBody.results[0]!.biblio.title, 'The Demo Codex');
    assertEquals(fldObjBody.results[0]!.price.replacement_new, 1999);
    assertEquals(fldObjBody.results[0]!.price.currency, 'USD');
    assertEquals(fldObjBody.results[0]!.price.confidence, 0.5);
    assertEquals(fldObjBody.results[0]!.price.basis, 'ai-estimate');
    assertEquals(
      fldObjBody.sources.map((fldObjSource) => fldObjSource.source),
      [
        'device-photo',
        'isbn-normalize',
        'muse-preread',
        'catalog-waterfall',
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
      2,
    );
    assertEquals(fldObjMuse.fldNumDuplicateCalls(), 0);
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

Deno.test('run marks timeout failure retryable for resume', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({ fldBooMuseTimeout: true });
  const fldObjMuse = fncConvStubMuse({ fldBooMuseTimeout: true });
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

Deno.test('run transcribes voice before the first image query', async () => {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldArrScriptTexts: ['cover has no pencil marks'],
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrScriptTexts: ['cover has no pencil marks'],
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      sources: { source: string }[];
    };
    assertEquals(fldObjBody.status, 'ok');
    assert(
      fldObjBody.sources.some(
        (fldObjSource) => fldObjSource.source === 'muse-transcribe',
      ),
    );
    assertEquals(fldObjMuse.fldNumAudioCalls(), 1);
    assert(fldObjMuse.fldArrAudioBodies[0]!.includes('signed-token'));
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    const fldArrTranscripts = fldObjPayload['transcripts'] as {
      image_id: string;
      voice_version: number;
      text: string | null;
      status: string;
      duration_sec: number | null;
    }[];
    assertEquals(fldArrTranscripts.length, 1);
    assertEquals(fldArrTranscripts[0]!.image_id, fldStrImage);
    assertEquals(fldArrTranscripts[0]!.voice_version, 1);
    assertEquals(fldArrTranscripts[0]!.text, 'cover has no pencil marks');
    assertEquals(fldArrTranscripts[0]!.status, 'ready');
    assertEquals(fldArrTranscripts[0]!.duration_sec, 7);
    const fldArrEvents = fncConvEvents(fldObjMuse.fldArrBroadcasts);
    assert(
      fldArrEvents.indexOf('transcribe:ok') <
        fldArrEvents.indexOf('preRead:start'),
    );
    assert(
      fldObjMuse.fldArrFinalizeBodies[0]!.includes('cover has no pencil marks'),
    );
    const fldStrAll = JSON.stringify(fldObjMuse.fldArrBroadcasts);
    assert(!fldStrAll.includes('signed-token'));
    assert(!fldStrAll.includes('cover has no pencil marks'));
    assert(!fldStrAll.includes('test-key'));
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('SUPABASE_URL');
    Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run skips transcribe with no call when voiceless', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 0);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    assertEquals(fldObjPayload['skipped'], 'no-voice');
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run stores null for empty recordings', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldArrScriptTexts: [null],
  });
  const fldObjMuse = fncConvStubMuse({ fldArrScriptTexts: [null] });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    const fldArrTranscripts = fldObjPayload['transcripts'] as {
      text: string | null;
      status: string;
    }[];
    assertEquals(fldArrTranscripts[0]!.text, null);
    assertEquals(fldArrTranscripts[0]!.status, 'empty');
    assert(
      !fldObjMuse.fldArrFinalizeBodies[0]!.includes('User declarations'),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run batches nine photos into two pre-read calls', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({ fldNumImages: 9 });
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumPreReadCalls(), 2);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 2);
    const fldArrReads = fldObjPayload['reads'] as { title: string | null }[];
    assertEquals(fldArrReads.length, 9);
    assertEquals(fldArrReads[0]!.title, 'The Demo Codex');
    assertEquals(fldArrReads[1]!.title, 'Photo 2');
    assertEquals(fldArrReads[8]!.title, 'The Demo Codex');
    const fldObjBody = (await fldObjResponse.json()) as {
      results: { photo_ids: string[] }[];
    };
    assertEquals(fldObjBody.results[0]!.photo_ids.length, 9);
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run continues photo flow on invalid voice', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldBooBadVoice: true,
  });
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 0);
    assertEquals(fldObjMuse.fldNumPreReadCalls(), 1);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    const fldArrTranscripts = fldObjPayload['transcripts'] as {
      status: string;
      error: string | null;
      text: string | null;
    }[];
    assertEquals(fldArrTranscripts.length, 1);
    assertEquals(fldArrTranscripts[0]!.status, 'failed');
    assertEquals(fldArrTranscripts[0]!.text, null);
    assert(fldArrTranscripts[0]!.error!.includes('unsupported voice format'));
    assert(
      !fldObjMuse.fldArrFinalizeBodies[0]!.includes('User declarations'),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run falls back to a data URL when signing fails', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldBooSignFails: true,
    fldArrScriptTexts: ['small note'],
  });
  const fldObjMuse = fncConvStubMuse({ fldArrScriptTexts: ['small note'] });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 1);
    assert(
      fldObjMuse.fldArrAudioBodies[0]!.includes('data:audio/mp4;base64,'),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run keeps photo flow when a voice link fails', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldBooBigVoice: true,
    fldBooSignFails: true,
  });
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 0);
    assertEquals(fldObjMuse.fldNumPreReadCalls(), 1);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    const fldArrTranscripts = fldObjPayload['transcripts'] as {
      status: string;
      error: string | null;
      text: string | null;
    }[];
    assertEquals(fldArrTranscripts.length, 1);
    assertEquals(fldArrTranscripts[0]!.status, 'failed');
    assert(fldArrTranscripts[0]!.error!.includes('voice link failed'));
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run transcribes each multi voice before its image query', async () => {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
    fldBooVoice: true,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrScriptTexts: ['first note', 'second note'],
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 1);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 1);
    const fldArrTranscripts = fldObjPayload['transcripts'] as {
      image_id: string;
      text: string | null;
    }[];
    assertEquals(fldArrTranscripts.length, 2);
    assertEquals(fldArrTranscripts[0]!.image_id, fncConvImageId(0));
    assertEquals(fldArrTranscripts[1]!.image_id, fncConvImageId(1));
    assertEquals(fldArrTranscripts[0]!.text, 'first note');
    assertEquals(fldArrTranscripts[1]!.text, 'second note');
    const fldArrEvents = fncConvEvents(fldObjMuse.fldArrBroadcasts);
    const fldNumDone = fldArrEvents.indexOf('transcribe:ok');
    assert(fldNumDone >= 0);
    fldArrEvents.forEach((fldStrEvent, fldNumIndex) => {
      if (fldStrEvent.startsWith('preRead:')) {
        assert(fldNumDone < fldNumIndex);
      }
    });
    assertEquals(fldObjMuse.fldArrFinalizeBodies.length, 2);
    assert(fldObjMuse.fldArrFinalizeBodies[0]!.includes('first note'));
    assert(!fldObjMuse.fldArrFinalizeBodies[0]!.includes('second note'));
    assert(fldObjMuse.fldArrFinalizeBodies[1]!.includes('second note'));
    assert(!fldObjMuse.fldArrFinalizeBodies[1]!.includes('first note'));
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('SUPABASE_URL');
    Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run verifies dewey suggestions and traces origins', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({ fldArrDeweyCodes: ['813', '813.54'] });
  const fldObjMuse = fncConvStubMuse({
    fldObjFinalAnswer: {
      results: [
        {
          title: 'The Demo Codex',
          confidence: 0.9,
          rationale: 'cover match',
          dewey: '813.5400',
        },
      ],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      results: { biblio: { dewey: string | null; dewey_verified: boolean } }[];
    };
    assertEquals(fldObjBody.results[0]!.biblio.dewey, '813.54');
    assertEquals(fldObjBody.results[0]!.biblio.dewey_verified, true);
    const fldArrEvidence = fldObjFake.fldArrErrors.filter(
      (fldObjEntry) => fldObjEntry.values['table'] === 'field_evidence',
    );
    assert(fldArrEvidence.length > 0);
    assert(
      fldArrEvidence.some(
        (fldObjEntry) =>
          fldObjEntry.values['field_name'] === 'dewey' &&
          fldObjEntry.values['origin'] === 'ai_fill',
      ),
    );
    assert(
      fldArrEvidence.some(
        (fldObjEntry) =>
          fldObjEntry.values['field_name'] === 'title' &&
          fldObjEntry.values['origin'] === 'photo_read',
      ),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run nulls unseen isbns with a rejected trace', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({
    fldObjFinalAnswer: {
      results: [
        {
          title: 'The Demo Codex',
          isbn13: '9780804429573',
          confidence: 0.9,
          rationale: 'cover match',
        },
      ],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      results: { biblio: { isbn13: string | null } }[];
    };
    assertEquals(fldObjBody.results[0]!.biblio.isbn13, null);
    assert(
      fldObjFake.fldArrErrors.some(
        (fldObjEntry) =>
          fldObjEntry.values['table'] === 'field_evidence' &&
          fldObjEntry.values['field_name'] === 'isbn13' &&
          fldObjEntry.values['origin'] === 'catalog_rejected',
      ),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run fails finalDiagnose on result count mismatch', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({
    fldObjFinalAnswer: {
      results: [
        { title: 'Alpha', confidence: 0.9, rationale: 'x' },
        { title: 'Beta', confidence: 0.8, rationale: 'y' },
      ],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 500);
    const fldObjBody = (await fldObjResponse.json()) as {
      failed_stage: string;
      error: string;
    };
    assertEquals(fldObjBody.failed_stage, 'finalDiagnose');
    assert(fldObjBody.error.includes('result count mismatch'));
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

function fncConvFinalSingle(
  fldStrTitle: string,
  fldStrIsbn: string | null,
): unknown {
  return {
    results: [
      {
        title: fldStrTitle,
        isbn13: fldStrIsbn,
        publisher: 'Logosphere Press',
        publication_year: 2026,
        confidence: 0.9,
        rationale: 'cover match',
      },
    ],
  };
}

function fncConvFinalSingles(
  fldStrTitleA: string,
  fldStrTitleB: string,
  fldStrIsbn: string | null,
): unknown[] {
  return [
    fncConvFinalSingle(fldStrTitleA, fldStrIsbn),
    fncConvFinalSingle(fldStrTitleB, fldStrIsbn),
  ];
}

Deno.test('run serves catalog hits from the local cache', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldObjLocalCatalog: {
      isbn: '9783161484100',
      source: 'openlibrary',
      record: { title: 'The Demo Codex', publishers: [], publish_year: 2026 },
    },
  });
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumCatalogFetches(), 0);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 3);
    const fldArrRecords = fldObjPayload['records'] as {
      source: string | null;
      reason: string | null;
    }[];
    assertEquals(fldArrRecords[0]!.source, 'local-cache');
    assertEquals(fldArrRecords[0]!.reason, null);
    const fldObjBody = (await fldObjResponse.json()) as {
      sources: { source: string }[];
    };
    assert(
      fldObjBody.sources.some(
        (fldObjSource) => fldObjSource.source === 'catalog-cache',
      ),
    );
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run stores null with reason on catalog misses', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({ fldNumCatalogStatus: 404 });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 3);
    const fldArrRecords = fldObjPayload['records'] as {
      record: unknown;
      reason: string | null;
    }[];
    assertEquals(fldArrRecords[0]!.record, null);
    assertEquals(fldArrRecords[0]!.reason, 'no-source-found');
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run keeps nulls for one failed price candidate', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrFinalAnswers: fncConvFinalSingles('Alpha Keep', 'Beta Drop', null),
    fldStrPriceFailMarker: 'Beta Drop',
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 5);
    const fldArrPrices = fldObjPayload['prices'] as {
      replacement_new: number | null;
      error: string | null;
    }[];
    assertEquals(fldArrPrices[0]!.replacement_new, 1999);
    assertEquals(fldArrPrices[0]!.error, null);
    assertEquals(fldArrPrices[1]!.replacement_new, null);
    assert(fldArrPrices[1]!.error!.includes('Muse call failed'));
    const fldObjBody = (await fldObjResponse.json()) as {
      results: unknown[];
    };
    assertEquals(fldObjBody.results.length, 2);
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run fails the price stage when every candidate fails', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({});
  const fldObjMuse = fncConvStubMuse({ fldBooPriceFails: true });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 500);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      error: string;
      failed_stage: string;
    };
    assertEquals(fldObjBody.failed_stage, 'price');
    assert(fldObjBody.error.includes('Muse call failed'));
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

Deno.test('run merges multi duplicates with a rationale', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrFinalAnswers: fncConvFinalSingles(
      'The Demo Codex',
      'The Demo Codex',
      '9783161484100',
    ),
    fldObjDuplicateAnswer: {
      groups: [{ members: [0, 1], reason: 'same ISBN', confidence: 0.9 }],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    assertEquals(fldObjMuse.fldNumDuplicateCalls(), 1);
    const fldObjBody = (await fldObjResponse.json()) as {
      results: {
        photo_ids: string[];
        biblio: { title: string | null };
        price: { replacement_new: number | null };
        evidence: { photo_id: string }[];
        duplicate: {
          merged_from: number[];
          reason: string | null;
        } | null;
      }[];
    };
    assertEquals(fldObjBody.results.length, 1);
    assertEquals(fldObjBody.results[0]!.photo_ids, [
      fncConvImageId(0),
      fncConvImageId(1),
    ]);
    assertEquals(fldObjBody.results[0]!.biblio.title, 'The Demo Codex');
    assertEquals(fldObjBody.results[0]!.price.replacement_new, 1999);
    assertEquals(fldObjBody.results[0]!.evidence.length, 2);
    assertEquals(fldObjBody.results[0]!.duplicate!.merged_from, [0, 1]);
    assertEquals(fldObjBody.results[0]!.duplicate!.reason, 'same ISBN');
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run splits duplicate groups across currencies', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrFinalAnswers: fncConvFinalSingles(
      'The Demo Codex',
      'The Demo Codex',
      '9783161484100',
    ),
    fldArrPriceCurrency: ['USD', 'EUR'],
    fldObjDuplicateAnswer: {
      groups: [{ members: [0, 1], reason: 'same ISBN', confidence: 0.9 }],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 6);
    const fldArrGroups = fldObjPayload['groups'] as {
      action: string;
      note: string | null;
    }[];
    assertEquals(fldArrGroups[0]!.action, 'split');
    assertEquals(fldArrGroups[0]!.note, 'currency-mismatch');
    const fldObjBody = (await fldObjResponse.json()) as {
      results: unknown[];
    };
    assertEquals(fldObjBody.results.length, 2);
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run splits duplicate groups across editions', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrFinalAnswers: [
      {
        results: [
          {
            title: 'The Demo Codex',
            isbn13: '9783161484100',
            confidence: 0.9,
            rationale: 'cover match',
          },
        ],
      },
      {
        results: [
          {
            title: 'Unrelated Atlas',
            isbn13: '9780000000000',
            confidence: 0.8,
            rationale: 'spine match',
          },
        ],
      },
    ],
    fldObjDuplicateAnswer: {
      groups: [{ members: [0, 1], reason: 'looks alike', confidence: 0.4 }],
    },
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjPayload = fncConvStagePayload(fldObjFake.fldArrMarks, 6);
    const fldArrGroups = fldObjPayload['groups'] as {
      action: string;
      note: string | null;
    }[];
    assertEquals(fldArrGroups[0]!.action, 'split');
    assertEquals(fldArrGroups[0]!.note, 'edition-mismatch');
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run proves the voice-first waterfall order by events', async () => {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldStrMode: 'multiProduct',
    fldNumImages: 2,
    fldBooVoice: true,
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrScriptTexts: ['first note', 'second note'],
    fldArrFinalAnswers: fncConvFinalSingles('Alpha', 'Beta', null),
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldArrSteps = fldObjMuse.fldArrBroadcasts.map((fldObjEntry) => {
      const fldObjBody = fldObjEntry as {
        messages: {
          payload: { stage: string; event: string; seq: number; ts: number };
        }[];
      };
      return fldObjBody.messages[0]!.payload;
    });
    const fldNumSeq = (fldStrStage: string, fldStrEvent: string): number =>
      fldArrSteps.find(
        (fldObjStep) =>
          fldObjStep.stage === fldStrStage && fldObjStep.event === fldStrEvent,
      )?.seq ?? -1;
    const fldArrChain: [string, string][] = [
      ['transcribe', 'ok'],
      ['preRead', 'ok'],
      ['catalog', 'ok'],
      ['finalDiagnose', 'ok'],
      ['price', 'ok'],
      ['duplicate', 'ok'],
      ['merge', 'ok'],
    ];
    let fldNumPrev = -1;
    for (const [fldStrStage, fldStrEvent] of fldArrChain) {
      const fldNumNext = fldNumSeq(fldStrStage, fldStrEvent);
      assert(fldNumNext > fldNumPrev);
      fldNumPrev = fldNumNext;
    }
    let fldNumPrevTs = -1;
    for (const fldObjStep of fldArrSteps) {
      assert(fldObjStep.ts >= fldNumPrevTs);
      fldNumPrevTs = fldObjStep.ts;
    }
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('SUPABASE_URL');
    Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run resumes every stage without new paid calls', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjMerge = {
    results: [
      {
        photo_ids: [fldStrImage],
        biblio: { title: 'The Demo Codex' },
        price: { replacement_new: 1999, currency: 'USD' },
        evidence: [],
        duplicate: null,
      },
    ],
    sources: [{ source: 'device-photo', detail: '1 draft photos' }],
  };
  const fldObjFake = fncConvFakeClient({
    fldStrRunStatus: 'running',
    fldNumClaimVersion: null,
    fldArrStagePayloads: [
      { sizes: [3] },
      { transcripts: [] },
      { reads: [{ title: 'The Demo Codex' }] },
      {
        records: [
          {
            image_id: fldStrImage,
            isbn10: null,
            isbn13: null,
            record: null,
            source: null,
            reason: 'no-isbn',
          },
        ],
      },
      { results: [{ title: 'The Demo Codex', confidence: 0.9 }] },
      {
        prices: [
          {
            replacement_new: 1999,
            market_min: 500,
            market_max: 1500,
            market_median: 800,
            market_recommended: 900,
            currency: 'USD',
            confidence: 0.5,
            basis: 'ai-estimate',
            error: null,
          },
        ],
      },
      { groups: [] },
      fldObjMerge,
    ],
  });
  const fldObjMuse = fncConvStubMuse({});
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      replayed: boolean;
      results: { photo_ids: string[] }[];
    };
    assertEquals(fldObjBody.status, 'ok');
    assertEquals(fldObjBody.replayed, false);
    assertEquals(fldObjBody.results[0]!.photo_ids, [fldStrImage]);
    assertEquals(fldObjMuse.fldNumAudioCalls(), 0);
    assertEquals(fldObjMuse.fldNumPreReadCalls(), 0);
    assertEquals(fldObjMuse.fldNumPriceCalls(), 0);
    assertEquals(fldObjMuse.fldNumDuplicateCalls(), 0);
    assertEquals(fldObjMuse.fldNumCatalogFetches(), 0);
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('run attaches read catalog and voice evidence per photo', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjFake = fncConvFakeClient({
    fldBooVoice: true,
    fldArrScriptTexts: ['no pencil marks'],
  });
  const fldObjMuse = fncConvStubMuse({
    fldArrScriptTexts: ['no pencil marks'],
  });
  try {
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest(),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      results: {
        evidence: {
          photo_id: string;
          read: { title: string | null };
          catalog: { source: string | null } | null;
          voice_text: string | null;
        }[];
      }[];
    };
    const fldObjEvidence = fldObjBody.results[0]!.evidence[0]!;
    assertEquals(fldObjEvidence.photo_id, fldStrImage);
    assertEquals(fldObjEvidence.read.title, 'The Demo Codex');
    assertEquals(fldObjEvidence.catalog!.source, 'openlibrary');
    assertEquals(fldObjEvidence.voice_text, 'no pencil marks');
  } finally {
    fldObjMuse.fncRunRestore();
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});
