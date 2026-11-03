/**
 * Logosphere BITS - demo sale moves (preview + apply).
 *
 * Listing changes run through the atomic sale RPCs with the
 * caller's session id only - never a persona, role, or
 * profile value. Preview computes the scope (nested
 * collections, sets, publications, the deduped USD total,
 * and the unpriced counts) without writing; apply writes
 * the whole move in one server transaction and reports the
 * applied/skipped counts. Expected tag/active values ride
 * along so racing updates conflict instead of overwriting.
 * Naming follows D6 (fld / srv / fnc roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldStrSaleSubject = 'product' | 'set' | 'collection';

export type fldObjSalePreview = {
  fldNumCollections: number;
  fldNumSets: number;
  fldNumProducts: number;
  fldNumMissing: number;
  fldNumNonUsd: number;
  fldNumTotalMinor: number;
  fldStrCurrency: string;
};

export type fldObjSaleApplied = {
  fldNumApplied: number;
  fldNumSkipped: number;
  fldNumTagMinor: number | null;
};

export type fldObjSaleMove = {
  fldNumTagMinor: number | null;
  fldBooActive: boolean;
  fldNumExpectedTagMinor?: number | null;
  fldBooExpectedActive?: boolean;
  fldBooCheckExpected?: boolean;
};

function fncConvCount(fldObjValue: unknown): number {
  return typeof fldObjValue === 'number' &&
    Number.isInteger(fldObjValue) &&
    fldObjValue >= 0
    ? fldObjValue
    : 0;
}

function fncConvMinorOrNull(fldObjValue: unknown): number | null {
  return typeof fldObjValue === 'number' &&
    Number.isInteger(fldObjValue) &&
    fldObjValue > 0
    ? fldObjValue
    : null;
}

export async function srvApiPreviewSale(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrSubject: fldStrSaleSubject,
  fldStrSubjectId: string,
): Promise<fldObjSalePreview> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then try again.',
    );
  }
  if (fldStrSubjectId.trim() === '') {
    throw new Error('Logosphere BITS: sale subject ID is missing or blank.');
  }
  const { data: fldObjData, error: fldObjError } = await fldObjClient.rpc(
    'demo_sale_preview',
    {
      p_session_id: fldStrSessionId,
      p_subject: fldStrSubject,
      p_subject_id: fldStrSubjectId,
    },
  );
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: sale preview failed (demo_sale_preview failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (typeof fldObjData !== 'object' || fldObjData === null) {
    throw new Error(
      'Logosphere BITS: demo_sale_preview returned an unexpected shape.',
    );
  }
  const fldObjRow = fldObjData as Record<string, unknown>;
  return {
    fldNumCollections: fncConvCount(fldObjRow.collections),
    fldNumSets: fncConvCount(fldObjRow.sets),
    fldNumProducts: fncConvCount(fldObjRow.products),
    fldNumMissing: fncConvCount(fldObjRow.missing),
    fldNumNonUsd: fncConvCount(fldObjRow.non_usd),
    fldNumTotalMinor: fncConvCount(fldObjRow.total),
    fldStrCurrency:
      typeof fldObjRow.currency === 'string' && fldObjRow.currency.trim() !== ''
        ? fldObjRow.currency.trim().toUpperCase()
        : 'USD',
  };
}

export async function srvApiApplySale(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrSubject: fldStrSaleSubject,
  fldStrSubjectId: string,
  fldObjMove: fldObjSaleMove,
): Promise<fldObjSaleApplied> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then try again.',
    );
  }
  if (fldStrSubjectId.trim() === '') {
    throw new Error('Logosphere BITS: sale subject ID is missing or blank.');
  }
  if (
    fldObjMove.fldNumTagMinor !== null &&
    (!Number.isInteger(fldObjMove.fldNumTagMinor) ||
      fldObjMove.fldNumTagMinor <= 0)
  ) {
    throw new Error('Logosphere BITS: tag price must be positive.');
  }
  const fldBooCheck = fldObjMove.fldBooCheckExpected ?? false;
  const { data: fldObjData, error: fldObjError } = await fldObjClient.rpc(
    'demo_apply_sale',
    {
      p_session_id: fldStrSessionId,
      p_subject: fldStrSubject,
      p_subject_id: fldStrSubjectId,
      p_tag_price: fldObjMove.fldNumTagMinor,
      p_is_active: fldObjMove.fldBooActive,
      p_expected_tag: fldObjMove.fldNumExpectedTagMinor ?? null,
      p_expected_active: fldObjMove.fldBooExpectedActive ?? null,
      p_check_expected: fldBooCheck,
    },
  );
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: sale apply failed (demo_apply_sale failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (typeof fldObjData !== 'object' || fldObjData === null) {
    throw new Error(
      'Logosphere BITS: demo_apply_sale returned an unexpected shape.',
    );
  }
  const fldObjRow = fldObjData as Record<string, unknown>;
  return {
    fldNumApplied: fncConvCount(fldObjRow.applied),
    fldNumSkipped: fncConvCount(fldObjRow.skipped),
    fldNumTagMinor: fncConvMinorOrNull(fldObjRow.tag),
  };
}
