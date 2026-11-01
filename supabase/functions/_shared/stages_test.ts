// Logosphere BITS — stage helper tests (Deno).
// A fake client records the lease RPC plus the terminal
// marking updates; error rows ride alongside failures.

import { assertEquals } from '@std/assert';
import {
  fncRunClaimStage,
  fncRunMarkRun,
  fncRunMarkStage,
  fncRunReadStagePayload,
} from './stages.ts';

type fldObjFakeClient = {
  rpc: (...fldArrArgs: unknown[]) => Promise<unknown>;
  from: (fldStrTable: string) => unknown;
  fldArrRpcCalls: unknown[][];
  fldArrUpdates: Record<string, unknown>[];
  fldArrInserts: Record<string, unknown>[];
};

function fncConvFakeClient(fldObjServe: {
  fldObjRpcData?: unknown;
  fldObjSingle?: unknown;
}): fldObjFakeClient {
  const fldObjFake = {
    fldArrRpcCalls: [] as unknown[][],
    fldArrUpdates: [] as Record<string, unknown>[],
    fldArrInserts: [] as Record<string, unknown>[],
  };
  const fncConvBuilder = (fldStrTable: string) => {
    const fldObjBuilder = {
      select: () => fldObjBuilder,
      update: (fldObjValues: Record<string, unknown>) => {
        fldObjFake.fldArrUpdates.push({
          table: fldStrTable,
          values: fldObjValues,
        });
        return fldObjBuilder;
      },
      insert: (fldObjValues: Record<string, unknown>) => {
        fldObjFake.fldArrInserts.push({
          table: fldStrTable,
          values: fldObjValues,
        });
        return Promise.resolve({ data: null, error: null });
      },
      eq: () => fldObjBuilder,
      order: () => fldObjBuilder,
      limit: () => fldObjBuilder,
      maybeSingle: () =>
        Promise.resolve({
          data: fldObjServe.fldObjSingle ?? null,
          error: null,
        }),
    };
    return fldObjBuilder;
  };
  return {
    ...fldObjFake,
    rpc: (...fldArrArgs: unknown[]) => {
      fldObjFake.fldArrRpcCalls.push(fldArrArgs);
      return Promise.resolve({
        data: fldObjServe.fldObjRpcData ?? null,
        error: null,
      });
    },
    from: fncConvBuilder,
  };
}

Deno.test('claim passes lease terms through', async () => {
  const fldObjFake = fncConvFakeClient({ fldObjRpcData: 3 });
  const fldNumVersion = await fncRunClaimStage(
    fldObjFake as unknown as Parameters<typeof fncRunClaimStage>[0],
    'run-1',
    'price',
    'worker-1',
  );
  assertEquals(fldNumVersion, 3);
  assertEquals(fldObjFake.fldArrRpcCalls, [
    [
      'claim_pipeline_stage',
      {
        p_run_id: 'run-1',
        p_stage: 'price',
        p_worker_id: 'worker-1',
        p_lease_seconds: 300,
      },
    ],
  ]);
});

Deno.test('mark clears the lease and stores payload', async () => {
  const fldObjFake = fncConvFakeClient({});
  await fncRunMarkStage(
    fldObjFake as unknown as Parameters<typeof fncRunMarkStage>[0],
    'run-1',
    'price',
    1,
    'succeeded',
    { prices: [] },
  );
  assertEquals(fldObjFake.fldArrUpdates, [
    {
      table: 'pipeline_stage_runs',
      values: {
        status: 'succeeded',
        payload: { prices: [] },
        worker_id: null,
        lease_expires_at: null,
      },
    },
  ]);
  assertEquals(fldObjFake.fldArrInserts, []);
});

Deno.test('mark writes the error row alongside failures', async () => {
  const fldObjFake = fncConvFakeClient({});
  await fncRunMarkStage(
    fldObjFake as unknown as Parameters<typeof fncRunMarkStage>[0],
    'run-1',
    'price',
    2,
    'failedRetryable',
    null,
    { fldStrCode: 'stage-failed', fldStrMessage: 'boom' },
  );
  assertEquals(fldObjFake.fldArrInserts, [
    {
      table: 'pipeline_stage_errors',
      values: {
        run_id: 'run-1',
        stage: 'price',
        version: 2,
        code: 'stage-failed',
        message: 'boom',
      },
    },
  ]);
});

Deno.test('payload read returns the stored object', async () => {
  const fldObjFake = fncConvFakeClient({
    fldObjSingle: { payload: { reads: [] } },
  });
  const fldObjPayload = await fncRunReadStagePayload<{ reads: unknown[] }>(
    fldObjFake as unknown as Parameters<typeof fncRunReadStagePayload>[0],
    'run-1',
    'preRead',
  );
  assertEquals(fldObjPayload, { reads: [] });
});

Deno.test('run mark updates the run status', async () => {
  const fldObjFake = fncConvFakeClient({});
  await fncRunMarkRun(
    fldObjFake as unknown as Parameters<typeof fncRunMarkRun>[0],
    'run-1',
    'succeeded',
  );
  assertEquals(fldObjFake.fldArrUpdates, [
    { table: 'pipeline_runs', values: { status: 'succeeded' } },
  ]);
});
