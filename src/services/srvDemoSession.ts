/**
 * Logosphere BITS — demo session service (persona-bound, RPC-minted).
 *
 * Demo identity is a server-minted row in demo_sessions, never a Supabase
 * Auth user: start_demo_session(p_persona_id) validates the persona id
 * against demo_personas and returns a random session id with a 24-hour
 * expiry (migration 20261030080608_demo_write_policy). The client only
 * holds the session id plus the end time in AsyncStorage, namespaced
 * per persona — selecting another persona never reuses the old
 * persona's session id for writes.
 *
 * Rules: reuse a stored, unexpired session for the same persona;
 * otherwise mint exactly one creation request shared by concurrent
 * callers; clear an invalid, revoked, or expired session and renew at
 * most once; if no session can be established, public reads still work
 * (they need no session) while the write caller gets a clear error and
 * can retry by calling again. Persona ids are public seed values.
 * Naming follows D6 (fld / srv / fnc roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvStorSupabaseAuthStorage } from './srvSupabase';

export type fldObjDemoSession = {
  fldStrSessionId: string;
  fldNumEndsAtMs: number;
};

const fldStrDemoSessionKeyPrefix = 'demo-session:';
const fldNumDemoSessionExpiryMarginMs = 30000;
const fldObjDemoSessionInflight = new Map<string, Promise<fldObjDemoSession>>();

function fncRunRequirePersonaId(fldStrPersonaId: string): string {
  const fldStrTrimmed = fldStrPersonaId.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      'Logosphere BITS: demo persona ID is missing or blank. ' +
        'Pass the selected persona ID from the persona list step.',
    );
  }
  return fldStrTrimmed;
}

function fncRunIsStoredDemoSession(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoSession {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjCandidate = fldObjValue as Partial<fldObjDemoSession>;
  return (
    typeof fldObjCandidate.fldStrSessionId === 'string' &&
    fldObjCandidate.fldStrSessionId !== '' &&
    typeof fldObjCandidate.fldNumEndsAtMs === 'number' &&
    Number.isFinite(fldObjCandidate.fldNumEndsAtMs)
  );
}

async function fncRunReadStoredDemoSession(
  fldStrPersonaId: string,
): Promise<fldObjDemoSession | null> {
  const fldStrKey = fldStrDemoSessionKeyPrefix + fldStrPersonaId;
  let fldStrRaw: string | null;
  try {
    fldStrRaw = await srvStorSupabaseAuthStorage.getItem(fldStrKey);
  } catch (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo session storage read failed: ${
        (fldObjError as Error).message
      }. Public reads still work; call again to retry.`,
    );
  }
  if (fldStrRaw === null) {
    return null;
  }
  let fldObjParsed: unknown;
  try {
    fldObjParsed = JSON.parse(fldStrRaw);
  } catch {
    await srvStorSupabaseAuthStorage.removeItem(fldStrKey);
    return null;
  }
  if (!fncRunIsStoredDemoSession(fldObjParsed)) {
    await srvStorSupabaseAuthStorage.removeItem(fldStrKey);
    return null;
  }
  if (
    fldObjParsed.fldNumEndsAtMs - fldNumDemoSessionExpiryMarginMs <=
    Date.now()
  ) {
    await srvStorSupabaseAuthStorage.removeItem(fldStrKey);
    return null;
  }
  return fldObjParsed;
}

async function fncRunCreateDemoSession(
  fldObjClient: SupabaseClient,
  fldStrPersonaId: string,
): Promise<fldObjDemoSession> {
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'start_demo_session',
    { p_persona_id: fldStrPersonaId },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo session unavailable for persona '${fldStrPersonaId}' ` +
        `(start_demo_session failed: ${fldObjRpcError.message}). ` +
        'Public reads still work; call again to retry.',
    );
  }
  const fldObjRow = Array.isArray(fldObjRpcData)
    ? fldObjRpcData[0]
    : fldObjRpcData;
  const fldStrSessionId = typeof fldObjRow?.id === 'string' ? fldObjRow.id : '';
  const fldNumEndsAtMs =
    typeof fldObjRow?.expires_at === 'string'
      ? Date.parse(fldObjRow.expires_at)
      : NaN;
  if (fldStrSessionId === '' || !Number.isFinite(fldNumEndsAtMs)) {
    throw new Error(
      'Logosphere BITS: start_demo_session returned an unexpected shape ' +
        '(need row id + expires_at). Public reads still work; call again ' +
        'to retry.',
    );
  }
  const fldObjSession: fldObjDemoSession = {
    fldStrSessionId,
    fldNumEndsAtMs,
  };
  try {
    await srvStorSupabaseAuthStorage.setItem(
      fldStrDemoSessionKeyPrefix + fldStrPersonaId,
      JSON.stringify(fldObjSession),
    );
  } catch (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo session storage write failed: ${
        (fldObjError as Error).message
      }. Public reads still work; call again to retry.`,
    );
  }
  return fldObjSession;
}

function fncRunGetOrCreateDemoSession(
  fldObjClient: SupabaseClient,
  fldStrPersonaId: string,
): Promise<fldObjDemoSession> {
  const fldObjExisting = fldObjDemoSessionInflight.get(fldStrPersonaId);
  if (fldObjExisting !== undefined) {
    return fldObjExisting;
  }
  const fldObjCreated = fncRunCreateDemoSession(
    fldObjClient,
    fldStrPersonaId,
  ).finally(() => {
    if (fldObjDemoSessionInflight.get(fldStrPersonaId) === fldObjCreated) {
      fldObjDemoSessionInflight.delete(fldStrPersonaId);
    }
  });
  fldObjDemoSessionInflight.set(fldStrPersonaId, fldObjCreated);
  return fldObjCreated;
}

export async function srvApiGetDemoSession(
  fldObjClient: SupabaseClient,
  fldStrPersonaId: string,
): Promise<fldObjDemoSession> {
  const fldStrId = fncRunRequirePersonaId(fldStrPersonaId);
  const fldObjStored = await fncRunReadStoredDemoSession(fldStrId);
  if (fldObjStored !== null) {
    return fldObjStored;
  }
  return fncRunGetOrCreateDemoSession(fldObjClient, fldStrId);
}

export async function srvApiRefreshDemoSession(
  fldObjClient: SupabaseClient,
  fldStrPersonaId: string,
): Promise<fldObjDemoSession> {
  const fldStrId = fncRunRequirePersonaId(fldStrPersonaId);
  fldObjDemoSessionInflight.delete(fldStrId);
  try {
    await srvStorSupabaseAuthStorage.removeItem(
      fldStrDemoSessionKeyPrefix + fldStrId,
    );
  } catch {
    // Best effort: the single creation below overwrites the stored row.
  }
  return fncRunGetOrCreateDemoSession(fldObjClient, fldStrId);
}

export async function srvApiClearDemoSession(
  fldStrPersonaId: string,
): Promise<void> {
  const fldStrId = fncRunRequirePersonaId(fldStrPersonaId);
  fldObjDemoSessionInflight.delete(fldStrId);
  await srvStorSupabaseAuthStorage.removeItem(
    fldStrDemoSessionKeyPrefix + fldStrId,
  );
}
