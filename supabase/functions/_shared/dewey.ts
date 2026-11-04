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
};

export async function fncRunCheckDewey(
  fldObjClient: SupabaseClient,
  fldObjValue: unknown,
): Promise<fldObjDeweyVerdict> {
  const fldStrCode = fncConvNormalizeDewey(fldObjValue);
  if (fldStrCode === null) {
    return { code: null, verified: false, parent: null };
  }
  try {
    const { data, error } = await fldObjClient
      .from('dewey_nodes')
      .select('code')
      .like('code', `${fldStrCode.slice(0, 3)}%`);
    if (error || !Array.isArray(data)) {
      return { code: fldStrCode, verified: false, parent: null };
    }
    let fldStrParent: string | null = null;
    for (const fldObjRow of data) {
      const fldStrRow = (fldObjRow as { code?: unknown }).code;
      if (typeof fldStrRow !== 'string') {
        continue;
      }
      if (fldStrRow === fldStrCode) {
        return { code: fldStrCode, verified: true, parent: null };
      }
      if (
        fncConvIsAncestor(fldStrRow, fldStrCode) &&
        (fldStrParent === null || fldStrRow.length > fldStrParent.length)
      ) {
        fldStrParent = fldStrRow;
      }
    }
    return { code: fldStrCode, verified: false, parent: fldStrParent };
  } catch {
    return { code: fldStrCode, verified: false, parent: null };
  }
}
