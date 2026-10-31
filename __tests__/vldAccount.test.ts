/**
 * Logosphere BITS — real-account validation tests (hermetic).
 *
 * Pure predicates and form schemas: no database, no network, no
 * storage. The login schema maps each failure to the caller message
 * so both languages stay covered by the same suite.
 */

import {
  fldNumAccountPasswordMinLength,
  vldChgIsAccountRelation,
  vldChgIsEmailValid,
  vldChgIsPasswordStrong,
  vldChgIsProfileType,
  vldSchAccountLogin,
  vldSchAccountRegister,
} from '../src/validation/vldAccount';

const fldObjMessages = {
  fldStrEmailRequired: 'email required',
  fldStrEmailInvalid: 'email invalid',
  fldStrPasswordRequired: 'password required',
};

const fldObjRegisterMessages = {
  fldStrTypeInvalid: 'type invalid',
  fldStrEmailRequired: 'email required',
  fldStrEmailInvalid: 'email invalid',
  fldStrPasswordRequired: 'password required',
  fldStrPasswordTooShort: 'password too short',
  fldStrDisplayNameRequired: 'display name required',
  fldStrOrganizationRequired: 'organization required',
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

  it('passes a valid individual registration', () => {
    expect(
      vldSchAccountRegister(
        {
          fldStrProfileType: 'individual',
          fldStrEmail: 'owner@example.com',
          fldStrPassword: 'secret-pw-1',
          fldStrDisplayName: 'Owner',
          fldStrOrganizationName: '',
        },
        fldObjRegisterMessages,
      ),
    ).toEqual({});
  });

  it('passes a valid corporate registration', () => {
    expect(
      vldSchAccountRegister(
        {
          fldStrProfileType: 'corporate',
          fldStrEmail: 'owner@example.com',
          fldStrPassword: 'secret-pw-1',
          fldStrDisplayName: 'Owner',
          fldStrOrganizationName: 'Acme',
        },
        fldObjRegisterMessages,
      ),
    ).toEqual({});
  });

  it('requires every registration field', () => {
    expect(
      vldSchAccountRegister(
        {
          fldStrProfileType: 'corporate',
          fldStrEmail: '  ',
          fldStrPassword: '',
          fldStrDisplayName: '  ',
          fldStrOrganizationName: '  ',
        },
        fldObjRegisterMessages,
      ),
    ).toEqual({
      fldStrEmail: 'email required',
      fldStrPassword: 'password required',
      fldStrDisplayName: 'display name required',
      fldStrOrganizationName: 'organization required',
    });
  });

  it('flags a short registration password', () => {
    expect(
      vldSchAccountRegister(
        {
          fldStrProfileType: 'individual',
          fldStrEmail: 'owner@example.com',
          fldStrPassword: 'short',
          fldStrDisplayName: 'Owner',
          fldStrOrganizationName: '',
        },
        fldObjRegisterMessages,
      ),
    ).toEqual({ fldStrPassword: 'password too short' });
  });

  it('rejects an unknown registration profile type', () => {
    const fldObjErrors = vldSchAccountRegister(
      {
        fldStrProfileType: 'admin',
        fldStrEmail: 'owner@example.com',
        fldStrPassword: 'secret-pw-1',
        fldStrDisplayName: 'Owner',
        fldStrOrganizationName: '',
      },
      fldObjRegisterMessages,
    );
    expect(fldObjErrors.fldStrProfileType).toBe('type invalid');
  });

  it('closes the relation vocabulary', () => {
    expect(vldChgIsAccountRelation('contact')).toBe(true);
    expect(vldChgIsAccountRelation('partner')).toBe(true);
    expect(vldChgIsAccountRelation('blocked')).toBe(true);
    expect(vldChgIsAccountRelation('stalking')).toBe(false);
    expect(vldChgIsAccountRelation('')).toBe(false);
    expect(vldChgIsAccountRelation('Contact')).toBe(false);
  });

  it('skips the organization field for individuals', () => {
    expect(
      vldSchAccountRegister(
        {
          fldStrProfileType: 'individual',
          fldStrEmail: 'owner@example.com',
          fldStrPassword: 'secret-pw-1',
          fldStrDisplayName: 'Owner',
          fldStrOrganizationName: '  ',
        },
        fldObjRegisterMessages,
      ),
    ).toEqual({});
  });
});
