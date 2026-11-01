// Logosphere BITS â€” demo authorization tests (Deno).
// The client is faked: session presence plus the RPC
// contract, never a live database.

import { assertEquals, assertRejects } from '@std/assert';
import { fncRunAuthorizeDemo } from './auth.ts';

function fncConvFakeClient(
  fldObjRpc: (fldStrFn: string, fldObjArgs: unknown) => Promise<unknown>,
) {
  return { rpc: fldObjRpc } as unknown as Parameters<
    typeof fncRunAuthorizeDemo
  >[0];
}

Deno.test('authorize passes persona through', async () => {
  let fldObjSeenArgs: unknown = null;
  const fldObjClient = fncConvFakeClient((_fldStrFn, fldObjArgs) => {
    fldObjSeenArgs = fldObjArgs;
    return Promise.resolve({ data: 'persona-1', error: null });
  });
  const fldStrPersona = await fncRunAuthorizeDemo(
    fldObjClient,
    'session-1',
    'create',
    'collection',
  );
  assertEquals(fldStrPersona, 'persona-1');
  assertEquals(fldObjSeenArgs, {
    p_session_id: 'session-1',
    p_action: 'create',
    p_scope: 'collection',
  });
});

Deno.test('authorize rejects blank sessions', async () => {
  const fldObjClient = fncConvFakeClient(() =>
    Promise.resolve({ data: null, error: null })
  );
  await assertRejects(
    () => fncRunAuthorizeDemo(fldObjClient, '  ', 'create', 'collection'),
    Error,
    'missing',
  );
});

Deno.test('authorize surfaces rpc rejection', async () => {
  const fldObjClient = fncConvFakeClient(() =>
    Promise.resolve({ data: null, error: { message: 'expired' } })
  );
  await assertRejects(
    () =>
      fncRunAuthorizeDemo(fldObjClient, 'session-1', 'create', 'collection'),
    Error,
    'rejected (expired)',
  );
});
