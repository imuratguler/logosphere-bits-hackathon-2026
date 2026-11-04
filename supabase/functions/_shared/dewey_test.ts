// Logosphere BITS — Dewey check tests (Deno).
// Normalization strips meaningless terminal zeros and
// rejects malformed codes; the check verifies exact rows
// and names the longest loaded ancestor without ever
// inserting reference data. No network runs.

import { assertEquals } from '@std/assert';
import { fncConvNormalizeDewey, fncRunCheckDewey } from './dewey.ts';

Deno.test('dewey normalization cleans terminal zeros', () => {
  assertEquals(fncConvNormalizeDewey('813.54'), '813.54');
  assertEquals(fncConvNormalizeDewey('813.5400'), '813.54');
  assertEquals(fncConvNormalizeDewey('500.000'), '500');
  assertEquals(fncConvNormalizeDewey(' 813 '), '813');
  assertEquals(fncConvNormalizeDewey('81'), null);
  assertEquals(fncConvNormalizeDewey('813.5A'), '813.5');
  assertEquals(fncConvNormalizeDewey('813.5.4'), null);
  assertEquals(fncConvNormalizeDewey(''), null);
  assertEquals(fncConvNormalizeDewey(null), null);
});

function fncConvFakeClient(fldArrCodes: string[]) {
  const fldObjClient = {
    from: (fldStrTable: string) => {
      assertEquals(fldStrTable, 'dewey_nodes');
      return {
        select: () => ({
          like: (_fldStrCol: string, _fldStrPattern: string) =>
            Promise.resolve({
              data: fldArrCodes.map((fldStrCode) => ({ code: fldStrCode })),
              error: null,
            }),
        }),
      };
    },
  };
  return fldObjClient as never;
}

Deno.test('dewey check verifies exact rows', async () => {
  const fldObjVerdict = await fncRunCheckDewey(
    fncConvFakeClient(['813', '813.5']),
    '813.5',
  );
  assertEquals(fldObjVerdict, {
    code: '813.5',
    verified: true,
    parent: null,
  });
});

Deno.test('dewey check keeps misses uncertain with a parent', async () => {
  const fldObjVerdict = await fncRunCheckDewey(
    fncConvFakeClient(['813', '813.5']),
    '813.54',
  );
  assertEquals(fldObjVerdict, {
    code: '813.54',
    verified: false,
    parent: '813.5',
  });
});

Deno.test('dewey check fails open without inventing a parent', async () => {
  const fldObjVerdict = await fncRunCheckDewey(
    fncConvFakeClient(['500']),
    '813.54',
  );
  assertEquals(fldObjVerdict, {
    code: '813.54',
    verified: false,
    parent: null,
  });
  const fldObjNull = await fncRunCheckDewey(fncConvFakeClient([]), 'junk');
  assertEquals(fldObjNull, { code: null, verified: false, parent: null });
});
