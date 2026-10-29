/**
 * Logosphere BITS — Supabase endpoint derivation (secret-free).
 *
 * All Supabase endpoints derive from ONE central project address.
 * Public mobile values (project address, anon key) are wired from env at a
 * later step; server-only secrets (service-role, Muse API) NEVER enter
 * mobile source, the APK, or Git (see .env.example).
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / fnc roots).
 */

export type fldObjSupabaseEndpoints = {
  fldStrRest: string;
  fldStrAuth: string;
  fldStrRealtime: string;
  fldStrStorage: string;
};

export function fncConvProjectAddressToEndpoints(
  fldStrProjectAddress: string,
): fldObjSupabaseEndpoints {
  const fldStrBase = fldStrProjectAddress.replace(/\/+$/, '');
  return {
    fldStrRest: `${fldStrBase}/rest/v1`,
    fldStrAuth: `${fldStrBase}/auth/v1`,
    fldStrRealtime: `${fldStrBase}/realtime/v1`,
    fldStrStorage: `${fldStrBase}/storage/v1`,
  };
}
