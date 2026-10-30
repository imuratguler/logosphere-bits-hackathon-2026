/**
 * Logosphere BITS — central feature flags and demo configuration.
 *
 * These flags only control which screens and flows the client shows.
 * They MUST NOT replace server-side authorization: every protected
 * request is still authorized by the backend, regardless of what the
 * client displays.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld roots).
 */

export type fldObjFeatureFlags = {
  fldBooDemoMode: boolean;
  fldBooLoginEnabled: boolean;
  fldBooMembershipEnabled: boolean;
  fldBooRolesEnabled: boolean;
  fldBooLanguageSelectorEnabled: boolean;
};

export const fldObjDemoFlags: fldObjFeatureFlags = {
  fldBooDemoMode: true,
  fldBooLoginEnabled: false,
  fldBooMembershipEnabled: false,
  fldBooRolesEnabled: false,
  fldBooLanguageSelectorEnabled: false,
};
