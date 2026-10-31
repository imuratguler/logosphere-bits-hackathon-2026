/**
 * Logosphere BITS — real-account validation tests (hermetic).
 *
 * Pure predicates and form schemas: no database, no network, no
 * storage. The login schema maps each failure to the caller message
 * so both languages stay covered by the same suite.
 */

import {
  fldNumAccountPasswordMinLength,
  vldChgIsEmailValid,
  vldChgIsPasswordStrong,
  vldChgIsProfileType,
  vldSchAccountLogin,
} from '../src/validation/vldAccount';

const fldObjMessages = {
  fldStrEmailRequired: 'email required',
  fldStrEmailInvalid: 'email invalid',
  fldStrPasswordRequired: 'password required',
};

describe('account validation', () => {
  it('accepts plain valid emails', () => {
    expect(vldChgIsEmailValid('owner@example.com')).toBe(true);
    expect(vldChgIsEmailValid('  owner@example.com  ')).toBe(true);
    expect(vldChgIsEmailValid('a.b+tag@mail.example.co')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(vldChgIsEmailValid('')).toBe(false);
    expect(vldChgIsEmailValid('   ')).toBe(false);
    expect(vldChgIsEmailValid('owner')).toBe(false);
    expect(vldChgIsEmailValid('owner@')).toBe(false);
    expect(vldChgIsEmailValid('@example.com')).toBe(false);
    expect(vldChgIsEmailValid('owner@@example.com')).toBe(false);
    expect(vldChgIsEmailValid('owner @example.com')).toBe(false);
    expect(vldChgIsEmailValid('owner@example')).toBe(false);
    expect(vldChgIsEmailValid('owner@example.')).toBe(false);
    expect(vldChgIsEmailValid('owner@.com')).toBe(false);
  });

  it('enforces the documented password minimum', () => {
    expect(fldNumAccountPasswordMinLength).toBe(8);
    expect(vldChgIsPasswordStrong('12345678')).toBe(true);
    expect(vldChgIsPasswordStrong('1234567')).toBe(false);
    expect(vldChgIsPasswordStrong('')).toBe(false);
  });

  it('closes the profile-type vocabulary', () => {
    expect(vldChgIsProfileType('individual')).toBe(true);
    expect(vldChgIsProfileType('corporate')).toBe(true);
    expect(vldChgIsProfileType('admin')).toBe(false);
    expect(vldChgIsProfileType('')).toBe(false);
    expect(vldChgIsProfileType('Individual')).toBe(false);
  });

  it('passes a valid login form with no errors', () => {
    expect(
      vldSchAccountLogin(
        { fldStrEmail: 'owner@example.com', fldStrPassword: 'secret-pw' },
        fldObjMessages,
      ),
    ).toEqual({});
  });

  it('requires both login fields', () => {
    expect(
      vldSchAccountLogin(
        { fldStrEmail: '   ', fldStrPassword: '' },
        fldObjMessages,
      ),
    ).toEqual({
      fldStrEmail: 'email required',
      fldStrPassword: 'password required',
    });
  });

  it('flags a malformed login email', () => {
    expect(
      vldSchAccountLogin(
        { fldStrEmail: 'owner@example', fldStrPassword: 'secret-pw' },
        fldObjMessages,
      ),
    ).toEqual({ fldStrEmail: 'email invalid' });
  });
});
