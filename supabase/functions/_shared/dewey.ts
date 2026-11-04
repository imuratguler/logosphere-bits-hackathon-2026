// Logosphere BITS — Dewey suggestion check (shared).
// An AI Dewey suggestion is verified against the loaded
// dewey_nodes rows: exact match wins, otherwise the longest
// loaded ancestor is reported next to the suggestion and the
// suggestion stays uncertain. Nothing is ever inserted into
// the reference table, and no missing intermediate prefix
// or wrong parent is fabricated. Identifiers follow D6.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function fncConvNormalizeDewey(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrText = fldObjValue.trim().replace(/\s+/g, '');
  if (fldStrText === '') {
    return null;
  }
  const fldArrParts = fldStrText.split('.');
  if (fldArrParts.length > 2) {
    return null;
  }
  const fldStrHead = fldArrParts[0] ?? '';
  if (!/^\d{3}$/.test(fldStrHead)) {
    return null;
  }
  if (fldArrParts.length === 1) {
    return fldStrHead;
  }
  const fldStrTail = (fldArrParts[1] ?? '').replace(/[^0-9]/g, '');
  const fldStrTrimmed = fldStrTail.replace(/0+$/, '');
  if (fldStrTrimmed === '') {
    return fldStrHead;
  }
  return `${fldStrHead}.${fldStrTrimmed}`;
}

function fncConvIsAncestor(
  fldStrCode: string,
  fldStrSuggestion: string,
): boolean {
  if (fldStrCode === fldStrSuggestion) {
    return true;
  }
  if (!fldStrSuggestion.startsWith(fldStrCode) || fldStrCode.length < 3) {
    return false;
  }
  if (fldStrCode.includes('.')) {
    return true;
  }
  return fldStrSuggestion[fldStrCode.length] === '.';
}

export type fldObjDeweyVerdict = {
  code: string | null;
  verified: boolean;
  parent: string | null;
  title_en: string | null;
};

export async function fncRunCheckDewey(
  fldObjClient: SupabaseClient,
  fldObjValue: unknown,
): Promise<fldObjDeweyVerdict> {
  const fldStrCode = fncConvNormalizeDewey(fldObjValue);
  if (fldStrCode === null) {
    return { code: null, verified: false, parent: null, title_en: null };
  }
  try {
    const { data, error } = await fldObjClient
      .from('dewey_nodes')
      .select('code, name_en')
      .like('code', `${fldStrCode.slice(0, 3)}%`);
    if (error || !Array.isArray(data)) {
      return {
        code: fldStrCode,
        verified: false,
        parent: null,
        title_en: null,
      };
    }
    let fldStrParent: string | null = null;
    for (const fldObjRow of data) {
      const fldObjCast = fldObjRow as { code?: unknown; name_en?: unknown };
      const fldStrRow = fldObjCast.code;
      if (typeof fldStrRow !== 'string') {
        continue;
      }
      if (fldStrRow === fldStrCode) {
        const fldObjTitle = fldObjCast.name_en;
        return {
          code: fldStrCode,
          verified: true,
          parent: null,
          title_en: typeof fldObjTitle === 'string' ? fldObjTitle : null,
        };
      }
      if (
        fncConvIsAncestor(fldStrRow, fldStrCode) &&
        (fldStrParent === null || fldStrRow.length > fldStrParent.length)
      ) {
        fldStrParent = fldStrRow;
      }
    }
    return {
      code: fldStrCode,
      verified: false,
      parent: fldStrParent,
      title_en: null,
    };
  } catch {
    return { code: fldStrCode, verified: false, parent: null, title_en: null };
  }
}

export type fldObjDeweyPathNode = {
  code: string;
  name_en: string;
};

export type fldObjDeweyPath = {
  nodes: fldObjDeweyPathNode[];
  broken: 'missing-parent' | 'cycle' | null;
};

type fldObjDeweyRow = {
  id?: unknown;
  code?: unknown;
  name_en?: unknown;
  parent_id?: unknown;
};

function fncConvDeweyRow(fldObjValue: unknown): fldObjDeweyRow | null {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return null;
  }
  return fldObjValue as fldObjDeweyRow;
}

export async function fncRunDeweyPath(
  fldObjClient: SupabaseClient,
  fldStrCode: string,
): Promise<fldObjDeweyPath> {
  const fldArrLeafFirst: fldObjDeweyPathNode[] = [];
  const fldObjSeen = new Set<string>();
  let fldStrWant: string | null = `code:${fldStrCode}`;
  for (let fldNumAt = 0; fldNumAt < 24; fldNumAt += 1) {
    if (fldStrWant === null) {
      return { nodes: fldArrLeafFirst.reverse(), broken: null };
    }
    const fldBooByCode = fldStrWant.startsWith('code:');
    const fldStrKey = fldBooByCode ? fldStrWant.slice(5) : fldStrWant.slice(3);
    let fldObjRow: fldObjDeweyRow | null = null;
    try {
      const fldObjQuery = fldObjClient.from('dewey_nodes').select(
        'id, code, name_en, parent_id',
      );
      const { data, error } = fldBooByCode
        ? await fldObjQuery.eq('code', fldStrKey).maybeSingle()
        : await fldObjQuery.eq('id', fldStrKey).maybeSingle();
      if (!error) {
        fldObjRow = fncConvDeweyRow(data);
      }
    } catch {
      fldObjRow = null;
    }
    if (
      fldObjRow === null || typeof fldObjRow.code !== 'string' ||
      typeof fldObjRow.name_en !== 'string'
    ) {
      return { nodes: fldArrLeafFirst.reverse(), broken: 'missing-parent' };
    }
    const fldStrRowId = typeof fldObjRow.id === 'string'
      ? `id:${fldObjRow.id}`
      : fldStrWant;
    if (fldObjSeen.has(fldStrRowId)) {
      return { nodes: fldArrLeafFirst.reverse(), broken: 'cycle' };
    }
    fldObjSeen.add(fldStrRowId);
    fldArrLeafFirst.push({
      code: fldObjRow.code,
      name_en: fldObjRow.name_en,
    });
    fldStrWant = typeof fldObjRow.parent_id === 'string' &&
        fldObjRow.parent_id !== ''
      ? `id:${fldObjRow.parent_id}`
      : null;
  }
  return { nodes: fldArrLeafFirst.reverse(), broken: 'cycle' };
}
