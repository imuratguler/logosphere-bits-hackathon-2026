// Logosphere BITS — price research handler tests (Deno).
// The fake client serves the product/seed rows and captures
// the estimate insert; Muse answers ride a stubbed fetch.

import { assertEquals } from '@std/assert';
import { fncRunHandleRequest } from './index.ts';

const fldStrProduct = '55555555-5555-5555-5555-555555555501';

function fncConvFakeClient() {
  const fldArrInserts: { table: string; values: Record<string, unknown> }[] =
    [];
  const fncConvBuilder = (fldStrTable: string) => {
    const fldObjBuilder = {
      select: () => fldObjBuilder,
      eq: () => fldObjBuilder,
      order: () => fldObjBuilder,
      insert: (fldObjValues: Record<string, unknown>) => {
        fldArrInserts.push({ table: fldStrTable, values: fldObjValues });
        return {
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: fldObjValues, error: null }),
          }),
        };
      },
      maybeSingle: () => {
        if (fldStrTable === 'products') {
          return Promise.resolve({
            data: { id: fldStrProduct, name: 'The Demo Codex' },
            error: null,
          });
        }
        return Promise.resolve({
          data: {
            title: 'The Demo Codex',
            publisher: 'Logosphere Press',
            publication_year: 2026,
            edition: null,
            condition: 'good',
            binding: null,
          },
          error: null,
        });
      },
      then: (
        fldObjResolve: (fldObjValue: unknown) => void,
        fldObjReject: (fldObjReason?: unknown) => void,
      ) =>
        Promise.resolve({
          data: [{ role: 'author', persons: { name: 'Demo Author' } }],
          error: null,
        }).then(fldObjResolve, fldObjReject),
    };
    return fldObjBuilder;
  };
  return {
    fldArrInserts,
    fldObjClient: {
      rpc: () => Promise.resolve({ data: 'persona-1', error: null }),
      from: fncConvBuilder,
    } as unknown as Parameters<typeof fncRunHandleRequest>[1],
  };
}

function fncConvRequest(fldObjBody: unknown): Request {
  return new Request('https://test/research', {
    method: 'POST',
    body: JSON.stringify(fldObjBody),
  });
}

Deno.test('research appends an estimate row', async () => {
  Deno.env.set('LOGOSPHERE_BITS_BASETEN_API_KEY', 'test-key');
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replacement_new: 25,
                market_min: 6,
                market_max: 18,
                market_median: 10,
                market_recommended: 12,
                currency: 'USD',
              }),
            },
          },
        ],
      }),
    )) as typeof fetch;
  try {
    const fldObjFake = fncConvFakeClient();
    const fldObjResponse = await fncRunHandleRequest(
      fncConvRequest({ session_id: 'session-1', product_id: fldStrProduct }),
      fldObjFake.fldObjClient,
    );
    assertEquals(fldObjResponse.status, 200);
    const fldObjBody = (await fldObjResponse.json()) as {
      status: string;
      estimate: Record<string, unknown>;
    };
    assertEquals(fldObjBody.status, 'ok');
    assertEquals(fldObjBody.estimate['market_median'], 1000);
    assertEquals(fldObjFake.fldArrInserts.length, 1);
    assertEquals(fldObjFake.fldArrInserts[0]!.table, 'price_estimates');
    assertEquals(
      fldObjFake.fldArrInserts[0]!.values['price_basis'],
      'estimate',
    );
    assertEquals(
      fldObjFake.fldArrInserts[0]!.values['replacement_new'],
      2500,
    );
  } finally {
    globalThis.fetch = fldObjRealFetch;
    Deno.env.delete('LOGOSPHERE_BITS_BASETEN_API_KEY');
  }
});

Deno.test('research rejects blank products', async () => {
  const fldObjFake = fncConvFakeClient();
  const fldObjResponse = await fncRunHandleRequest(
    fncConvRequest({ session_id: 'session-1', product_id: '  ' }),
    fldObjFake.fldObjClient,
  );
  assertEquals(fldObjResponse.status, 400);
});
