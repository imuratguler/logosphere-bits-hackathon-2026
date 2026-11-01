// Logosphere BITS — analysis save handler tests (Deno).
// The fake client serves the run/merge/image rows, captures
// every insert, and records storage moves. No network runs.

import { assertEquals } from '@std/assert';
import { fncRunHandleRequest } from './index.ts';

const fldStrRun = '22222222-2222-2222-2222-222222222222';
const fldStrImage = '11111111-1111-1111-1111-111111111111';
const fldStrCollection = '33333333-3333-3333-3333-333333333333';

type fldObjServe = {
  fldStrRunStatus?: string;
  fldObjMergePayload?: unknown;
  fldNumClaimVersion?: number | null;
  fldObjReviewPayload?: unknown;
  fldBooVoice?: boolean;
};

function fncConvMerge() {
  return {
    results: [
      {
        photo_ids: [fldStrImage],
        biblio: {
          title: 'The Demo Codex',
          publisher: 'Logosphere Press',
          contributors: [{ name: 'Demo Author', role: null }],
        },
        price: {
          replacement_new: 1999,
          market_min: 500,
          market_max: 1500,
          market_median: 800,
          market_recommended: 900,
          currency: 'USD',
        },
      },
    ],
    sources: [],
  };
}

function fncConvFakeClient(fldObjServe: fldObjServe) {
  const fldArrInserts: { table: string; values: Record<string, unknown> }[] =
    [];
  const fldArrMoves: { bucket: string; from: string; to: string }[] = [];
  let fldNumIds = 0;
  let fldNumStageReads = 0;
  const fncConvBuilder = (fldStrTable: string) => {
    const fldObjBuilder = {
      select: () => fldObjBuilder,
      eq: () => fldObjBuilder,
      order: () => fldObjBuilder,
      limit: () => fldObjBuilder,
      update: () => {
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
        fldArrInserts.push({ table: fldStrTable, values: fldObjValues });
        return {
          select: () => ({
            maybeSingle: () => {
              fldNumIds += 1;
              return Promise.resolve({
                data: { id: `new-id-${fldNumIds}` },
                error: null,
              });
            },
          }),
        };
      },
      maybeSingle: () => {
        if (fldStrTable === 'pipeline_runs') {
          return Promise.resolve({
            data: {
              id: fldStrRun,
              mode: 'singleProduct',
              status: fldObjServe.fldStrRunStatus ?? 'succeeded',
              target_collection_id: fldStrCollection,
              target_set_id: null,
            },
            error: null,
          });
        }
        if (fldStrTable === 'pipeline_stage_runs') {
          fldNumStageReads += 1;
          const fldObjPayload = fldNumStageReads === 1
            ? fldObjServe.fldObjMergePayload ?? fncConvMerge()
            : fldObjServe.fldObjReviewPayload ?? null;
          if (fldObjPayload === null) {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({
            data: { payload: fldObjPayload },
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
  return {
    fldArrInserts,
    fldArrMoves,
    fldObjClient: {
      rpc: () => {
        if (fldObjServe.fldNumClaimVersion !== undefined) {
          return Promise.resolve({
            data: fldObjServe.fldNumClaimVersion,
            error: null,
          });
        }
        return Promise.resolve({ data: 'persona-1', error: null });
      },
      from: fncConvBuilder,
      storage: {
        from: (fldStrBucket: string) => ({
          move: (fldStrFrom: string, fldStrTo: string) => {
            fldArrMoves.push({
              bucket: fldStrBucket,
              from: fldStrFrom,
              to: fldStrTo,
            });
            return Promise.resolve({ data: null, error: null });
          },
        }),
      },
    } as unknown as Parameters<typeof fncRunHandleRequest>[1],
  };
}

function fncConvRequest(): Request {
  return new Request('https://test/save', {
    method: 'POST',
    body: JSON.stringify({ session_id: 'session-1', run_id: fldStrRun }),
  });
}

Deno.test('save writes products with bibliography and media', async () => {
  const fldObjFake = fncConvFakeClient({ fldBooVoice: true });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 200);
  const fldObjBody = (await fldObjResponse.json()) as {
    status: string;
    replayed: boolean;
    product_ids: string[];
  };
  assertEquals(fldObjBody.status, 'ok');
  assertEquals(fldObjBody.replayed, false);
  assertEquals(fldObjBody.product_ids.length, 1);
  const fldArrTables = fldObjFake.fldArrInserts.map(
    (fldObjInsert) => fldObjInsert.table,
  );
  for (
    const fldStrTable of [
      'products',
      'product_bibliography',
      'persons',
      'product_person_roles',
      'product_images',
      'product_voice_notes',
      'price_estimates',
    ]
  ) {
    assertEquals(fldArrTables.includes(fldStrTable), true);
  }
  const fldObjBiblio = fldObjFake.fldArrInserts.find(
    (fldObjInsert) => fldObjInsert.table === 'product_bibliography',
  )!.values;
  assertEquals(fldObjBiblio['title'], 'The Demo Codex');
  assertEquals(fldObjBiblio['publisher'], 'Logosphere Press');
  const fldObjRole = fldObjFake.fldArrInserts.find(
    (fldObjInsert) => fldObjInsert.table === 'product_person_roles',
  )!.values;
  assertEquals(fldObjRole['role'], 'contributor');
  const fldObjEstimate = fldObjFake.fldArrInserts.find(
    (fldObjInsert) => fldObjInsert.table === 'price_estimates',
  )!.values;
  assertEquals(fldObjEstimate['replacement_new'], 1999);
  assertEquals(fldObjEstimate['price_basis'], 'estimate');
  assertEquals(fldObjFake.fldArrMoves.length, 2);
  assertEquals(fldObjFake.fldArrMoves[0]!.bucket, 'product-photos');
  assertEquals(fldObjFake.fldArrMoves[1]!.bucket, 'voice-notes');
});

Deno.test('save replays without duplicate rows', async () => {
  const fldObjFake = fncConvFakeClient({
    fldNumClaimVersion: null,
    fldObjReviewPayload: { product_ids: ['saved-1'] },
  });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 200);
  const fldObjBody = (await fldObjResponse.json()) as {
    status: string;
    replayed: boolean;
    product_ids: string[];
  };
  assertEquals(fldObjBody.status, 'ok');
  assertEquals(fldObjBody.replayed, true);
  assertEquals(fldObjBody.product_ids, ['saved-1']);
  assertEquals(fldObjFake.fldArrInserts, []);
});

Deno.test('save refuses unfinished runs', async () => {
  const fldObjFake = fncConvFakeClient({ fldStrRunStatus: 'running' });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 409);
});
