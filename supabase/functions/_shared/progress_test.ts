// Logosphere BITS — progress reporter tests (Deno).
// The broadcast POST is captured through a stubbed fetch;
// without env the reporter stays console-only and silent.

import { assert, assertEquals } from '@std/assert';
import { fncConvProgress } from './progress.ts';

Deno.test('progress broadcasts steps to the run topic', async () => {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  const fldArrSeen: { url: string; body: Record<string, unknown> }[] = [];
  const fldObjRealFetch = globalThis.fetch;
  globalThis.fetch = ((fldStrUrl: string, fldObjInit?: RequestInit) => {
    fldArrSeen.push({
      url: fldStrUrl,
      body: JSON.parse((fldObjInit?.body ?? '{}') as string) as Record<
        string,
        unknown
      >,
    });
    return Promise.resolve(new Response('ok'));
  }) as typeof fetch;
  try {
    const fldObjProgress = fncConvProgress('run-9');
    fldObjProgress.emit({ fldStrStage: 'price', fldStrEvent: 'start' });
    await fldObjProgress.flush();
    assertEquals(fldArrSeen.length, 1);
    assertEquals(
      fldArrSeen[0]!.url,
      'https://test.supabase.co/realtime/v1/api/broadcast',
    );
    const fldArrMessages = fldArrSeen[0]!.body['messages'] as {
      topic: string;
      event: string;
      payload: Record<string, unknown>;
    }[];
    assertEquals(fldArrMessages[0]!.topic, 'bits-pipeline:run-9');
    assertEquals(fldArrMessages[0]!.event, 'step');
    assertEquals(fldArrMessages[0]!.payload['stage'], 'price');
    assertEquals(fldArrMessages[0]!.payload['run_id'], 'run-9');
  } finally {
    globalThis.fetch = fldObjRealFetch;
    Deno.env.delete('SUPABASE_URL');
    Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
  }
});

Deno.test('progress stays console-only without env', async () => {
  Deno.env.delete('SUPABASE_URL');
  Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
  let fldNumCalls = 0;
  const fldObjRealFetch = globalThis.fetch;
  const fldObjRealLog = console.log;
  let fldStrLogged = '';
  console.log = (fldStrLine: string) => {
    fldStrLogged = fldStrLine;
  };
  globalThis.fetch = (() => {
    fldNumCalls += 1;
    return Promise.resolve(new Response('ok'));
  }) as typeof fetch;
  try {
    const fldObjProgress = fncConvProgress('run-9');
    fldObjProgress.emit({ fldStrStage: 'price', fldStrEvent: 'ok' });
    await fldObjProgress.flush();
    assertEquals(fldNumCalls, 0);
    assert(fldStrLogged.includes('[bits-pipeline]'));
  } finally {
    globalThis.fetch = fldObjRealFetch;
    console.log = fldObjRealLog;
  }
});
