// Logosphere BITS â€” edge service client + demo authorization (shared).
// Functions run with the service role (RLS bypass) but every
// demo caller is still authorized through demo_authorize: an
// unknown, revoked, or expired session fails before any paid
// work starts. Identifiers follow D6.

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function fncConvServiceClient(): SupabaseClient {
  const fldStrUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const fldStrKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (fldStrUrl === '' || fldStrKey === '') {
    throw new Error('Logosphere BITS: edge Supabase env is missing.');
  }
  return createClient(fldStrUrl, fldStrKey);
}

export async function fncRunAuthorizeDemo(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrAction: string,
  fldStrScope: string,
): Promise<string> {
  if (fldStrSessionId.trim() === '') {
    throw new Error('Logosphere BITS: demo session is missing.');
  }
  const { data: fldObjPersonaId, error: fldObjError } = await fldObjClient.rpc(
    'demo_authorize',
    {
      p_session_id: fldStrSessionId,
      p_action: fldStrAction,
      p_scope: fldStrScope,
    },
  );
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo session rejected (${fldObjError.message}).`,
    );
  }
  return fldObjPersonaId as string;
}
