// Logosphere BITS â€” pipeline stage helpers (shared).
// Claim/extend run through the lease RPCs; terminal marking
// clears the lease and stores the payload in one update, with
// the error row written alongside on failure. A claim that
// returns null means another worker holds the stage or the
// stage already reached a terminal state â€” the caller reuses
// the stored payload instead of re-executing paid work.
// Identifiers follow D6.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const fldNumLeaseSeconds = 300;

export async function fncRunClaimStage(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStage: string,
  fldStrWorkerId: string,
): Promise<number | null> {
  const { data: fldNumVersion, error: fldObjError } = await fldObjClient.rpc(
    'claim_pipeline_stage',
    {
      p_run_id: fldStrRunId,
      p_stage: fldStrStage,
      p_worker_id: fldStrWorkerId,
      p_lease_seconds: fldNumLeaseSeconds,
    },
  );
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: stage claim failed (${fldObjError.message}).`,
    );
  }
  return fldNumVersion as number | null;
}

export async function fncRunReadStagePayload<T>(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStage: string,
): Promise<T | null> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('pipeline_stage_runs')
    .select('payload')
    .eq('run_id', fldStrRunId)
    .eq('stage', fldStrStage)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: stage payload read failed (${fldObjError.message}).`,
    );
  }
  return (fldObjRow?.payload ?? null) as T | null;
}

export type fldObjStageState = {
  status: string;
  version: number;
};

export async function fncRunReadStageState(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStage: string,
): Promise<fldObjStageState | null> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('pipeline_stage_runs')
    .select('status, version')
    .eq('run_id', fldStrRunId)
    .eq('stage', fldStrStage)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: stage state read failed (${fldObjError.message}).`,
    );
  }
  if (
    fldObjRow === null || typeof fldObjRow !== 'object' ||
    typeof (fldObjRow as { status?: unknown }).status !== 'string' ||
    typeof (fldObjRow as { version?: unknown }).version !== 'number'
  ) {
    return null;
  }
  return {
    status: (fldObjRow as { status: string }).status,
    version: (fldObjRow as { version: number }).version,
  };
}

export async function fncRunClaimStageWaiting(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStage: string,
  fldStrWorkerId: string,
  fldNumRounds = 20,
  fldNumGapMs = 3000,
): Promise<number | 'replay' | 'busy'> {
  const fldNumFirst = await fncRunClaimStage(
    fldObjClient,
    fldStrRunId,
    fldStrStage,
    fldStrWorkerId,
  );
  if (fldNumFirst !== null) {
    return fldNumFirst;
  }
  for (let fldNumAt = 0; fldNumAt < fldNumRounds; fldNumAt += 1) {
    const fldObjState = await fncRunReadStageState(
      fldObjClient,
      fldStrRunId,
      fldStrStage,
    );
    if (fldObjState !== null && fldObjState.status === 'succeeded') {
      return 'replay';
    }
    if (
      fldObjState === null ||
      fldObjState.status === 'failedRetryable' ||
      fldObjState.status === 'failedPermanent' ||
      fldObjState.status === 'cancelled'
    ) {
      const fldNumRetry = await fncRunClaimStage(
        fldObjClient,
        fldStrRunId,
        fldStrStage,
        fldStrWorkerId,
      );
      if (fldNumRetry !== null) {
        return fldNumRetry;
      }
    }
    await new Promise((fncResolve) => setTimeout(fncResolve, fldNumGapMs));
  }
  return 'busy';
}

export async function fncRunMarkStage(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStage: string,
  fldNumVersion: number,
  fldStrStatus:
    | 'succeeded'
    | 'failedRetryable'
    | 'failedPermanent'
    | 'cancelled',
  fldObjPayload: unknown,
  fldObjError?: { fldStrCode: string; fldStrMessage: string },
): Promise<void> {
  const { error: fldObjUpdateError } = await fldObjClient
    .from('pipeline_stage_runs')
    .update({
      status: fldStrStatus,
      payload: fldObjPayload,
      worker_id: null,
      lease_expires_at: null,
    })
    .eq('run_id', fldStrRunId)
    .eq('stage', fldStrStage)
    .eq('version', fldNumVersion);
  if (fldObjUpdateError) {
    throw new Error(
      `Logosphere BITS: stage mark failed (${fldObjUpdateError.message}).`,
    );
  }
  if (fldObjError !== undefined) {
    const { error: fldObjInsertError } = await fldObjClient
      .from('pipeline_stage_errors')
      .insert({
        run_id: fldStrRunId,
        stage: fldStrStage,
        version: fldNumVersion,
        code: fldObjError.fldStrCode,
        message: fldObjError.fldStrMessage,
      });
    if (fldObjInsertError) {
      throw new Error(
        `Logosphere BITS: stage error write failed (${fldObjInsertError.message}).`,
      );
    }
  }
}

export async function fncRunMarkRun(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldStrStatus:
    | 'running'
    | 'succeeded'
    | 'failedRetryable'
    | 'failedPermanent'
    | 'cancelled',
): Promise<void> {
  const { error: fldObjError } = await fldObjClient
    .from('pipeline_runs')
    .update({ status: fldStrStatus })
    .eq('id', fldStrRunId);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: run mark failed (${fldObjError.message}).`,
    );
  }
}
