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
  fldObjPersonaSelection: {
    fldStrTitle: string;
    fldStrSubtitle: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrSelected: string;
    fldStrSessionErrorTitle: string;
    fldStrEmptyTitle: string;
  };
  fldObjHome: {
    fldStrLibrariesTitle: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrChangeProfile: string;
  };
  fldObjLibraryShortcut: {
    fldStrTitle: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrTypeRequired: string;
    fldStrTypeBranch: string;
    fldStrTypeDepartment: string;
    fldStrTypeHall: string;
    fldStrSelected: string;
    fldStrSave: string;
    fldStrSaveErrorTitle: string;
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
  fldObjPersonaSelection: {
    fldStrTitle: 'Choose a demo persona',
    fldStrSubtitle:
      'No account needed — every persona shares the same demo data.',
    fldStrLoading: 'Loading personas…',
    fldStrErrorTitle: 'Could not load personas',
    fldStrRetry: 'Retry',
    fldStrSelected: 'Selected',
    fldStrSessionErrorTitle: 'Session failed',
    fldStrEmptyTitle: 'No demo personas yet',
  },
  fldObjHome: {
    fldStrLibrariesTitle: 'Libraries',
    fldStrLoading: 'Loading libraries…',
    fldStrErrorTitle: 'Could not load libraries',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No libraries yet',
    fldStrChangeProfile: 'Change Demo Profile',
  },
  fldObjLibraryShortcut: {
    fldStrTitle: 'New library',
    fldStrNamePlaceholder: 'Library name',
    fldStrNameRequired: 'Enter a library name.',
    fldStrTypeRequired: 'Choose a library type.',
    fldStrTypeBranch: 'Branch',
    fldStrTypeDepartment: 'Department',
    fldStrTypeHall: 'Hall',
    fldStrSelected: 'Selected',
    fldStrSave: 'Save library',
    fldStrSaveErrorTitle: 'Could not save the library',
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
  fldObjPersonaSelection: {
    fldStrTitle: 'Bir demo persona seç',
    fldStrSubtitle:
      'Hesap gerekmez — tüm personalar aynı demo verisini kullanır.',
    fldStrLoading: 'Personalar yükleniyor…',
    fldStrErrorTitle: 'Personalar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrSelected: 'Seçildi',
    fldStrSessionErrorTitle: 'Oturum başarısız oldu',
    fldStrEmptyTitle: 'Henüz demo persona yok',
  },
  fldObjHome: {
    fldStrLibrariesTitle: 'Kütüphaneler',
    fldStrLoading: 'Kütüphaneler yükleniyor…',
    fldStrErrorTitle: 'Kütüphaneler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz kütüphane yok',
    fldStrChangeProfile: 'Demo Profilini Değiştir',
  },
  fldObjLibraryShortcut: {
    fldStrTitle: 'Yeni kütüphane',
    fldStrNamePlaceholder: 'Kütüphane adı',
    fldStrNameRequired: 'Bir kütüphane adı girin.',
    fldStrTypeRequired: 'Bir kütüphane türü seçin.',
    fldStrTypeBranch: 'Şube',
    fldStrTypeDepartment: 'Departman',
    fldStrTypeHall: 'Salon',
    fldStrSelected: 'Seçildi',
    fldStrSave: 'Kütüphaneyi kaydet',
    fldStrSaveErrorTitle: 'Kütüphane kaydedilemedi',
  },
  fldObjCommon: {},
};
