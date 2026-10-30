/**
 * Logosphere BITS — central mobile Supabase client (public values only).
 *
 * Load order is load-bearing: the URL polyfill MUST stay the first import so
 * it installs before any Supabase code runs (React Native Hermes has no URL).
 * Session persistence delegates to AsyncStorage 3.1.1 (getItem / setItem /
 * removeItem signatures verified against the installed typings).
 * The `supabase` CLI (devDependency) is a local tool and is NEVER imported by
 * mobile runtime code. Server-only secrets (service-role, Muse API) NEVER
 * enter mobile source, the APK, or Git. Env wiring is a later step; the caller
 * passes the central public config in. Error messages name the missing
 * variable and never carry values.
 * Naming follows D6 (fld / srv / fnc roots); getItem / setItem / removeItem
 * are the third-party storage API names and stay as-is (D6 exception).
 */

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type fldObjSupabasePublicConfig = {
  fldStrProjectAddress: string;
  fldStrAnonKey: string;
};

export const srvStorSupabaseAuthStorage = {
  getItem: (fldStrKey: string): Promise<string | null> =>
    AsyncStorage.getItem(fldStrKey),
  setItem: (fldStrKey: string, fldStrValue: string): Promise<void> =>
    AsyncStorage.setItem(fldStrKey, fldStrValue),
  removeItem: (fldStrKey: string): Promise<void> =>
    AsyncStorage.removeItem(fldStrKey),
};

function fncRunRequirePublicValue(
  fldStrValue: string,
  fldStrVariableName: string,
): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: ${fldStrVariableName} is missing or blank. ` +
        'Set it in the Git-ignored .env file (see .env.example). ' +
        'Values are never logged.',
    );
  }
  return fldStrTrimmed;
}

export function srvApiCreateSupabaseClient(
  fldObjConfig: fldObjSupabasePublicConfig,
): SupabaseClient {
  const fldStrProjectAddress = fncRunRequirePublicValue(
    fldObjConfig.fldStrProjectAddress,
    'SUPABASE_PROJECT_ADDRESS',
  );
  const fldStrAnonKey = fncRunRequirePublicValue(
    fldObjConfig.fldStrAnonKey,
    'SUPABASE_ANON_KEY',
  );
  const fldStrBase = fldStrProjectAddress.replace(/\/+$/, '');
  return createClient(fldStrBase, fldStrAnonKey, {
    auth: {
      storage: srvStorSupabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
