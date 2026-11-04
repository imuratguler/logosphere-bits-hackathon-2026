// Logosphere BITS — Dewey check tests (Deno).
// Normalization strips meaningless terminal zeros and
// rejects malformed codes; the check verifies exact rows
// and names the longest loaded ancestor without ever
// inserting reference data. No network runs.

import { assertEquals } from '@std/assert';
import {
  fncConvNormalizeDewey,
  fncRunCheckDewey,
  fncRunDeweyPath,
} from './dewey.ts';

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
    title_en: null,
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
    title_en: null,
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
    title_en: null,
  });
  const fldObjNull = await fncRunCheckDewey(fncConvFakeClient([]), 'junk');
  assertEquals(fldObjNull, {
    code: null,
    verified: false,
    parent: null,
    title_en: null,
  });
});

type fldObjPathRow = {
  id: string;
  code: string;
  name_en: string;
  parent_id: string | null;
};

function fncConvFakePathClient(fldArrRows: fldObjPathRow[]) {
  const fldObjClient = {
    from: (fldStrTable: string) => {
      assertEquals(fldStrTable, 'dewey_nodes');
      return {
        select: () => ({
          eq: (fldStrCol: string, fldStrKey: string) => ({
            maybeSingle: () => {
              const fldObjFound =
                fldArrRows.find((fldObjRow) =>
                  fldStrCol === 'code'
                    ? fldObjRow.code === fldStrKey
                    : fldObjRow.id === fldStrKey
                ) ?? null;
              return Promise.resolve({ data: fldObjFound, error: null });
            },
          }),
        }),
      };
    },
  };
  return fldObjClient as never;
}

Deno.test('dewey path walks parent links root first', async () => {
  const fldObjPath = await fncRunDeweyPath(
    fncConvFakePathClient([
      { id: 'n1', code: '800', name_en: 'Root Eight', parent_id: null },
      { id: 'n2', code: '81', name_en: 'Branch One', parent_id: 'n1' },
      { id: 'n3', code: '813.54', name_en: 'Leaf Five-Four', parent_id: 'n2' },
    ]),
    '813.54',
  );
  assertEquals(fldObjPath, {
    nodes: [
      { code: '800', name_en: 'Root Eight' },
      { code: '81', name_en: 'Branch One' },
      { code: '813.54', name_en: 'Leaf Five-Four' },
    ],
    broken: null,
  });
});

Deno.test('dewey path reports missing parents without inventing', async () => {
  const fldObjPath = await fncRunDeweyPath(
    fncConvFakePathClient([
      { id: 'n3', code: '813.54', name_en: 'Leaf Five-Four', parent_id: 'n9' },
    ]),
    '813.54',
  );
  assertEquals(fldObjPath, {
    nodes: [{ code: '813.54', name_en: 'Leaf Five-Four' }],
    broken: 'missing-parent',
  });
});

Deno.test('dewey path reports cycles without hanging', async () => {
  const fldObjPath = await fncRunDeweyPath(
    fncConvFakePathClient([
      { id: 'n1', code: '800', name_en: 'Root Eight', parent_id: 'n2' },
      { id: 'n2', code: '81', name_en: 'Branch One', parent_id: 'n1' },
    ]),
    '800',
  );
  assertEquals(fldObjPath.broken, 'cycle');
  assertEquals(fldObjPath.nodes.length, 2);
});
