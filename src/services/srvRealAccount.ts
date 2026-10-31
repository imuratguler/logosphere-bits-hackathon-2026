/**
 * Logosphere BITS — HIDDEN future real-account auth module.
 *
 * NOT imported by demo startup, demo routes, or any demo service: login,
 * register, logout, and account linking ship here for a later stage and
 * no real account is opened from the demo path. The real client is built
 * by srvApiCreateRealClient with Auth persistence ON (AsyncStorage);
 * the demo anon client (srvDemoClient, persistence OFF, memory only)
 * is a separate instance whose session, headers, and role this module
 * never touches.
 *
 * Separation rules: persona preference (local UX choice) and real
 * identity (server-issued user id) live in different structures and
 * are never mixed — auth functions take no persona, and demo session
 * functions take no identity. Mobile flag changes grant no server
 * authority: identity comes ONLY from the server user object, and this
 * module reads no client flags (no cfgFlags import).
 * Naming follows D6 (fld / srv roots); auth method and user-field
 * names are the third-party API contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  fldStrSupabaseAnonKey,
  fldStrSupabaseProjectAddress,
} from '../config/cfgSupabaseEnv';
import type { fldObjSupabasePublicConfig } from './srvSupabase';
import { srvApiCreateSupabaseClient } from './srvSupabase';

export type fldObjPersonaPreference = {
  fldStrPersonaId: string;
};

export type fldObjRealAccountIdentity = {
  fldStrUserId: string;
  fldStrEmail?: string;
};

export type fldObjRealAccountCredentials = {
  fldStrEmail: string;
  fldStrPassword: string;
};

export type fldObjRealAccountLinkRequest = {
  fldStrProvider: string;
};

export type fldObjRealAccountLink = {
  fldStrUrl: string;
};

type fldObjAuthUserShape = {
  id: string;
  email?: string;
};

export function srvApiCreateRealClient(
  fldObjConfig: fldObjSupabasePublicConfig,
): SupabaseClient {
  return srvApiCreateSupabaseClient(fldObjConfig);
}

let fldObjRealClient: SupabaseClient | null = null;

export function srvApiGetRealClient(): SupabaseClient {
  if (fldObjRealClient === null) {
    fldObjRealClient = srvApiCreateSupabaseClient({
      fldStrProjectAddress: fldStrSupabaseProjectAddress,
      fldStrAnonKey: fldStrSupabaseAnonKey,
    });
  }
  return fldObjRealClient;
}

function fncRunRequireCredential(
  fldStrValue: string,
  fldStrLabel: string,
): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: real-account ${fldStrLabel} is missing or blank. ` +
        'Values are never logged.',
    );
  }
  return fldStrTrimmed;
}

function fncRunRequireIdentity(
  fldObjUser: fldObjAuthUserShape | null,
  fldStrContext: string,
): fldObjRealAccountIdentity {
  if (fldObjUser === null || fldObjUser.id === '') {
    throw new Error(`Logosphere BITS: ${fldStrContext}`);
  }
  const fldObjIdentity: fldObjRealAccountIdentity = {
    fldStrUserId: fldObjUser.id,
  };
  if (fldObjUser.email !== undefined) {
    fldObjIdentity.fldStrEmail = fldObjUser.email;
  }
  return fldObjIdentity;
}

export async function srvAuthRegister(
  fldObjClient: SupabaseClient,
  fldObjCredentials: fldObjRealAccountCredentials,
): Promise<fldObjRealAccountIdentity> {
  const fldStrEmail = fncRunRequireCredential(
    fldObjCredentials.fldStrEmail,
    'email',
  );
  const fldStrPassword = fncRunRequireCredential(
    fldObjCredentials.fldStrPassword,
    'password',
  );
  const { data: fldObjData, error: fldObjError } =
    await fldObjClient.auth.signUp({
      email: fldStrEmail,
      password: fldStrPassword,
    });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: real-account registration failed: ${fldObjError.message}.`,
    );
  }
  return fncRunRequireIdentity(
    fldObjData.user,
    'account created but no identity was returned ' +
      '(email confirmation may be pending).',
  );
}

export async function srvAuthLogin(
  fldObjClient: SupabaseClient,
  fldObjCredentials: fldObjRealAccountCredentials,
): Promise<fldObjRealAccountIdentity> {
  const fldStrEmail = fncRunRequireCredential(
    fldObjCredentials.fldStrEmail,
    'email',
  );
  const fldStrPassword = fncRunRequireCredential(
    fldObjCredentials.fldStrPassword,
    'password',
  );
  const { data: fldObjData, error: fldObjError } =
    await fldObjClient.auth.signInWithPassword({
      email: fldStrEmail,
      password: fldStrPassword,
    });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: real-account login failed: ${fldObjError.message}.`,
    );
  }
  return fncRunRequireIdentity(
    fldObjData.user,
    'login succeeded but no identity was returned.',
  );
}

export async function srvAuthLogout(
  fldObjClient: SupabaseClient,
): Promise<void> {
  const { error: fldObjError } = await fldObjClient.auth.signOut();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: real-account logout failed: ${fldObjError.message}.`,
    );
  }
}

export async function srvAuthLinkIdentity(
  fldObjClient: SupabaseClient,
  fldObjRequest: fldObjRealAccountLinkRequest,
): Promise<fldObjRealAccountLink> {
  const fldStrProvider = fncRunRequireCredential(
    fldObjRequest.fldStrProvider,
    'provider',
  );
  const { data: fldObjData, error: fldObjError } =
    await fldObjClient.auth.linkIdentity({
      // Provider is a closed third-party union; the runtime value passes
      // through after the blank check and the server validates membership.
      provider: fldStrProvider as 'apple',
    });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: real-account linking failed: ${fldObjError.message}.`,
    );
  }
  if (typeof fldObjData.url !== 'string' || fldObjData.url === '') {
    throw new Error(
      'Logosphere BITS: account linking returned an unexpected shape ' +
        '(need authorization url).',
    );
  }
  return { fldStrUrl: fldObjData.url };
}
