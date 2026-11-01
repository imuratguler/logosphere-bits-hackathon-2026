// Logosphere BITS — pipeline create handler tests (Deno).
// A fake client serves the target/run/image tables and
// captures inserts; no network runs.

import { assertEquals } from '@std/assert';
import { fncRunHandleRequest } from './index.ts';

type fldObjServe = {
  fldObjRpcData?: unknown;
  fldObjRpcError?: { message: string } | null;
  fldObjNodesSingle?: unknown;
  fldObjSetsSingle?: unknown;
  fldObjRunSingle?: unknown;
  fldArrImages?: unknown[];
};

function fncConvFakeClient(fldObjServe: fldObjServe) {
  const fldArrUpserts: { table: string; values: unknown }[] = [];
  const fldArrInserts: { table: string; values: unknown }[] = [];
  const fldArrUpdates: { table: string; values: unknown }[] = [];
  const fncConvBuilder = (fldStrTable: string) => {
    const fldObjBuilder = {
      select: () => fldObjBuilder,
      eq: () => fldObjBuilder,
      order: () => fldObjBuilder,
      upsert: (fldObjValues: unknown) => {
        fldArrUpserts.push({ table: fldStrTable, values: fldObjValues });
        return Promise.resolve({ data: null, error: null });
      },
      insert: (fldObjValues: unknown) => {
        fldArrInserts.push({ table: fldStrTable, values: fldObjValues });
        return Promise.resolve({ data: null, error: null });
      },
      update: (fldObjValues: unknown) => {
        fldArrUpdates.push({ table: fldStrTable, values: fldObjValues });
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
      maybeSingle: () => {
        if (fldStrTable === 'nodes') {
          return Promise.resolve({
            data: fldObjServe.fldObjNodesSingle ?? null,
            error: null,
          });
        }
        if (fldStrTable === 'sets') {
          return Promise.resolve({
            data: fldObjServe.fldObjSetsSingle ?? null,
            error: null,
          });
        }
        return Promise.resolve({
          data: fldObjServe.fldObjRunSingle ?? null,
          error: null,
        });
      },
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: fldObjServe.fldArrImages ?? [],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    return fldObjBuilder;
  };
  return {
    fldArrUpserts,
    fldArrInserts,
    fldArrUpdates,
    fldObjClient: {
      rpc: () =>
        Promise.resolve({
          data: fldObjServe.fldObjRpcData ?? 'persona-1',
          error: fldObjServe.fldObjRpcError ?? null,
        }),
      from: fncConvBuilder,
    } as unknown as Parameters<typeof fncRunHandleRequest>[1],
  };
}

const fldStrCollection = '33333333-3333-3333-3333-333333333333';
const fldStrImage = '11111111-1111-1111-1111-111111111111';
const fldStrRun = '22222222-2222-2222-2222-222222222222';

function fncConvRequest(fldObjBody: unknown): Request {
  return new Request('https://test/create', {
    method: 'POST',
    body: JSON.stringify(fldObjBody),
  });
}

function fncConvBody() {
  return {
    session_id: 'session-1',
    idempotency_key: 'key-1',
    mode: 'singleProduct',
    target_collection_id: fldStrCollection,
    target_set_id: null,
    images: [
      {
        client_image_id: fldStrImage,
        sort_order: 0,
        mime_type: 'image/jpeg',
        rotation_degrees: 0,
        has_voice: true,
      },
    ],
  };
}

Deno.test('create registers the run with deterministic paths', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjNodesSingle: { id: fldStrCollection },
    fldObjRunSingle: {
      id: fldStrRun,
      mode: 'singleProduct',
      status: 'pending',
    },
    fldArrImages: [],
  });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(fncConvBody()),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 200);
  const fldObjBody = (await fldObjResponse.json()) as {
    status: string;
    run_id: string;
    replayed: boolean;
    images: { file_path: string; voice_file_path: string | null }[];
  };
  assertEquals(fldObjBody.status, 'ok');
  assertEquals(fldObjBody.run_id, fldStrRun);
  assertEquals(fldObjBody.replayed, false);
  assertEquals(
    fldObjBody.images[0]!.file_path,
    `product-photos/draft/${fldStrRun}/${fldStrImage}.jpg`,
  );
  assertEquals(
    fldObjBody.images[0]!.voice_file_path,
    `voice-notes/draft/${fldStrRun}/${fldStrImage}.m4a`,
  );
  assertEquals(fldObjFake.fldArrUpserts[0]!.table, 'pipeline_runs');
});

Deno.test('create replays keys without new rows', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjNodesSingle: { id: fldStrCollection },
    fldObjRunSingle: {
      id: fldStrRun,
      mode: 'singleProduct',
      status: 'pending',
    },
    fldArrImages: [{ id: fldStrImage }],
  });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(fncConvBody()),
    fldObjFake.fldObjClient,
  );
  const fldObjBody = (await fldObjResponse.json()) as {
    status: string;
    replayed: boolean;
  };
  assertEquals(fldObjBody.status, 'ok');
  assertEquals(fldObjBody.replayed, true);
  assertEquals(fldObjFake.fldArrInserts, []);
});

Deno.test('create rejects invalid payloads', async () => {
  const fldObjFake = fncConvFakeClient({});
  const fldObjBody = fncConvBody() as unknown as Record<string, unknown>;
  fldObjBody.mode = 'bulk';
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(fldObjBody),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 400);
});

Deno.test('create rejects unknown targets', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjNodesSingle: null,
  });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(fncConvBody()),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 400);
});

Deno.test('create rejects revoked sessions', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjNodesSingle: { id: fldStrCollection },
    fldObjRpcError: { message: 'expired' },
  });
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest(fncConvBody()),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 403);
});
