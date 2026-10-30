/**
 * Logosphere BITS — Supabase endpoints derive from one project address.
 */

import { fncConvProjectAddressToEndpoints } from '../src/config/cfgSupabase';

describe('supabase endpoints', () => {
  it('derives all endpoints from one project address', () => {
    const fldObjEndpoints = fncConvProjectAddressToEndpoints(
      'https://xyz.supabase.co',
    );
    expect(fldObjEndpoints.fldStrRest).toBe('https://xyz.supabase.co/rest/v1');
    expect(fldObjEndpoints.fldStrAuth).toBe('https://xyz.supabase.co/auth/v1');
    expect(fldObjEndpoints.fldStrRealtime).toBe(
      'https://xyz.supabase.co/realtime/v1',
    );
    expect(fldObjEndpoints.fldStrStorage).toBe(
      'https://xyz.supabase.co/storage/v1',
    );
  });

  it('tolerates a trailing slash on the project address', () => {
    const fldObjEndpoints = fncConvProjectAddressToEndpoints(
      'https://xyz.supabase.co/',
    );
    expect(fldObjEndpoints.fldStrRest).toBe('https://xyz.supabase.co/rest/v1');
  });
});
