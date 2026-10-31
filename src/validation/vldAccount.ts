/**
 * Logosphere BITS — real-account validation (no DB, no IO).
 *
 * Hidden account-plane rules live here, apart from demo validation:
 * email shape, password minimum, profile-type vocabulary, and the
 * registration/profile form schemas. Checks are pure predicates over
 * caller-supplied values; they mint no session, touch no persona,
 * and read no device state. The password minimum is a client-side
 * floor only — Supabase Auth may enforce a stricter policy, and its
 * refusal surfaces as a submit error, never as a bypass.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

export type fldStrAccountProfileType = 'individual' | 'corporate';

export type fldObjAccountLoginForm = {
  fldStrEmail: string;
  fldStrPassword: string;
};

export type fldObjAccountLoginErrors = {
  fldStrEmail?: string;
  fldStrPassword?: string;
};

export type fldObjAccountRegisterForm = {
  fldStrProfileType: string;
  fldStrEmail: string;
  fldStrPassword: string;
  fldStrDisplayName: string;
  fldStrOrganizationName: string;
};

export type fldObjAccountRegisterErrors = {
  fldStrProfileType?: string;
  fldStrEmail?: string;
  fldStrPassword?: string;
  fldStrDisplayName?: string;
  fldStrOrganizationName?: string;
};

export const fldNumAccountPasswordMinLength = 8;

export function vldChgIsEmailValid(fldStrEmail: string): boolean {
  const fldStrTrimmed = fldStrEmail.trim();
  if (fldStrTrimmed === '' || fldStrTrimmed.includes(' ')) {
    return false;
  }
  const fldNumAt = fldStrTrimmed.indexOf('@');
  if (
    fldNumAt <= 0 ||
    fldNumAt !== fldStrTrimmed.lastIndexOf('@') ||
    fldNumAt === fldStrTrimmed.length - 1
  ) {
    return false;
  }
  const fldStrDomain = fldStrTrimmed.slice(fldNumAt + 1);
  const fldNumDot = fldStrDomain.indexOf('.');
  return fldNumDot > 0 && fldNumDot < fldStrDomain.length - 1;
}

export function vldChgIsPasswordStrong(fldStrPassword: string): boolean {
  return fldStrPassword.length >= fldNumAccountPasswordMinLength;
}

export function vldChgIsProfileType(
  fldStrValue: string,
): fldStrValue is fldStrAccountProfileType {
  return fldStrValue === 'individual' || fldStrValue === 'corporate';
}

export function vldSchAccountRegister(
  fldObjForm: fldObjAccountRegisterForm,
  fldObjMessages: {
    fldStrTypeInvalid: string;
    fldStrEmailRequired: string;
    fldStrEmailInvalid: string;
    fldStrPasswordRequired: string;
    fldStrPasswordTooShort: string;
    fldStrDisplayNameRequired: string;
    fldStrOrganizationRequired: string;
  },
): fldObjAccountRegisterErrors {
  const fldObjErrors: fldObjAccountRegisterErrors = {};
  if (!vldChgIsProfileType(fldObjForm.fldStrProfileType)) {
    fldObjErrors.fldStrProfileType = fldObjMessages.fldStrTypeInvalid;
  }
  if (fldObjForm.fldStrEmail.trim() === '') {
    fldObjErrors.fldStrEmail = fldObjMessages.fldStrEmailRequired;
  } else if (!vldChgIsEmailValid(fldObjForm.fldStrEmail)) {
    fldObjErrors.fldStrEmail = fldObjMessages.fldStrEmailInvalid;
  }
  if (fldObjForm.fldStrPassword === '') {
    fldObjErrors.fldStrPassword = fldObjMessages.fldStrPasswordRequired;
  } else if (!vldChgIsPasswordStrong(fldObjForm.fldStrPassword)) {
    fldObjErrors.fldStrPassword = fldObjMessages.fldStrPasswordTooShort;
  }
  if (fldObjForm.fldStrDisplayName.trim() === '') {
    fldObjErrors.fldStrDisplayName = fldObjMessages.fldStrDisplayNameRequired;
  }
  if (
    fldObjForm.fldStrProfileType === 'corporate' &&
    fldObjForm.fldStrOrganizationName.trim() === ''
  ) {
    fldObjErrors.fldStrOrganizationName =
      fldObjMessages.fldStrOrganizationRequired;
  }
  return fldObjErrors;
}

export function vldSchAccountLogin(
  fldObjForm: fldObjAccountLoginForm,
  fldObjMessages: {
    fldStrEmailRequired: string;
    fldStrEmailInvalid: string;
    fldStrPasswordRequired: string;
  },
): fldObjAccountLoginErrors {
  const fldObjErrors: fldObjAccountLoginErrors = {};
  if (fldObjForm.fldStrEmail.trim() === '') {
    fldObjErrors.fldStrEmail = fldObjMessages.fldStrEmailRequired;
  } else if (!vldChgIsEmailValid(fldObjForm.fldStrEmail)) {
    fldObjErrors.fldStrEmail = fldObjMessages.fldStrEmailInvalid;
  }
  if (fldObjForm.fldStrPassword === '') {
    fldObjErrors.fldStrPassword = fldObjMessages.fldStrPasswordRequired;
  }
  return fldObjErrors;
}
