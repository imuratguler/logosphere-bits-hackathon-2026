/**
 * Logosphere BITS — demo client wiring (public values only).
 *
 * Single place where the generated public env values enter a Supabase
 * client. The demo client runs as anon WITHOUT loading any registered
 * Auth session (fldBooPersistAuthSession: false); no Auth account is
 * created and signInAnonymously() is never called on the demo path.
 * Demo writes authorize through server-minted demo sessions
 * (start_demo_session RPC, see srvDemoSession); public reads need no
 * session at all. The future real-account client is a separate
 * construction and never shares this instance.
 * Naming follows D6 (fld / srv roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  fldStrSupabaseAnonKey,
  fldStrSupabaseProjectAddress,
} from '../config/cfgSupabaseEnv';
import { srvApiCreateSupabaseClient } from './srvSupabase';

let fldObjDemoClient: SupabaseClient | null = null;

export function srvApiGetDemoClient(): SupabaseClient {
  if (fldObjDemoClient === null) {
    fldObjDemoClient = srvApiCreateSupabaseClient(
      {
        fldStrProjectAddress: fldStrSupabaseProjectAddress,
        fldStrAnonKey: fldStrSupabaseAnonKey,
      },
      { fldBooPersistAuthSession: false },
    );
  }
  return fldObjDemoClient;
}
