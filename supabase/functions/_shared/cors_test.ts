// Logosphere BITS — CORS envelope tests (Deno).

import { assertEquals } from '@std/assert';
import { fncConvJsonResponse, fncRunPreflightResponse } from './cors.ts';

Deno.test('json response wraps bodies with cors', async () => {
  const fldObjResponse = fncConvJsonResponse({ status: 'ok' }, 201);
  assertEquals(fldObjResponse.status, 201);
  assertEquals(fldObjResponse.headers.get('Access-Control-Allow-Origin'), '*');
  assertEquals(await fldObjResponse.json(), { status: 'ok' });
});

Deno.test('preflight answers ok with cors', async () => {
  const fldObjResponse = fncRunPreflightResponse();
  assertEquals(fldObjResponse.status, 200);
  assertEquals(fldObjResponse.headers.get('Access-Control-Allow-Origin'), '*');
  assertEquals(await fldObjResponse.text(), 'ok');
});
