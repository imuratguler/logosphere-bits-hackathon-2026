/**
 * Logosphere BITS — English and Turkish UI strings.
 *
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld roots; data module,
 * same convention as theme.ts). Both dictionaries share one row type, so a
 * missing key in either language fails typecheck; the parity test guards
 * the structure at runtime as well. New features extend both dictionaries
 * with their own strings; no future screens are scaffolded here.
 */

export type fldObjAppStrings = {
  fldObjSplash: {
    fldStrTitle: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrErrorMessage: string;
    fldStrRetry: string;
  };
  // Shared components carry no built-in UI text today (all strings arrive
  // via props); this group stays empty until the first one needs a default.
  fldObjCommon: Record<string, never>;
};

export const fldObjStringsEn: fldObjAppStrings = {
  fldObjSplash: {
    fldStrTitle: 'Logosphere BITS',
    fldStrLoading: 'Loading...',
    fldStrErrorTitle: 'Startup failed',
    fldStrErrorMessage: 'Please try again.',
    fldStrRetry: 'Retry',
  },
  fldObjCommon: {},
};

export const fldObjStringsTr: fldObjAppStrings = {
  fldObjSplash: {
    fldStrTitle: 'Logosphere BITS',
    fldStrLoading: 'Yükleniyor...',
    fldStrErrorTitle: 'Başlatma başarısız oldu',
    fldStrErrorMessage: 'Lütfen yeniden deneyin.',
    fldStrRetry: 'Tekrar Dene',
  },
  fldObjCommon: {},
};
