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
  fldObjLibrarySettings: {
    fldStrTitle: string;
    fldStrCodeLabel: string;
    fldStrNameLabel: string;
    fldStrTypeLabel: string;
    fldStrFoundedDateLabel: string;
    fldStrCountryLabel: string;
    fldStrStateLabel: string;
    fldStrCityLabel: string;
    fldStrDistrictLabel: string;
    fldStrTownLabel: string;
    fldStrNeighborhoodLabel: string;
    fldStrStreetLabel: string;
    fldStrExtraDescriptionLabel: string;
    fldStrPostalCodeLabel: string;
    fldStrBuildingLabel: string;
    fldStrFloorLabel: string;
    fldStrApartmentLabel: string;
    fldStrWebsiteLabel: string;
    fldStrSearchPlaceholder: string;
    fldStrCodeRequired: string;
    fldStrNameRequired: string;
    fldStrSave: string;
    fldStrSaveErrorTitle: string;
    fldStrSavedMessage: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
  };
  fldObjCollectionBrowser: {
    fldStrBack: string;
    fldStrCollectionsTitle: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrLibrarySettings: string;
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
  fldObjLibrarySettings: {
    fldStrTitle: 'Library settings',
    fldStrCodeLabel: 'Code',
    fldStrNameLabel: 'Name',
    fldStrTypeLabel: 'Type',
    fldStrFoundedDateLabel: 'Founded date',
    fldStrCountryLabel: 'Country',
    fldStrStateLabel: 'State',
    fldStrCityLabel: 'City',
    fldStrDistrictLabel: 'District',
    fldStrTownLabel: 'Town',
    fldStrNeighborhoodLabel: 'Neighborhood',
    fldStrStreetLabel: 'Street',
    fldStrExtraDescriptionLabel: 'Extra description',
    fldStrPostalCodeLabel: 'Postal code',
    fldStrBuildingLabel: 'Building name/no',
    fldStrFloorLabel: 'Floor',
    fldStrApartmentLabel: 'Apartment',
    fldStrWebsiteLabel: 'Website',
    fldStrSearchPlaceholder: 'Search or type…',
    fldStrCodeRequired: 'Enter the library code.',
    fldStrNameRequired: 'Enter the library name.',
    fldStrSave: 'Save settings',
    fldStrSaveErrorTitle: 'Could not save settings',
    fldStrSavedMessage: 'Settings saved.',
    fldStrLoading: 'Loading settings…',
    fldStrErrorTitle: 'Could not load settings',
    fldStrRetry: 'Retry',
  },
  fldObjCollectionBrowser: {
    fldStrBack: 'Back',
    fldStrCollectionsTitle: 'Collections',
    fldStrLoading: 'Loading collections…',
    fldStrErrorTitle: 'Could not load collections',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No collections yet',
    fldStrLibrarySettings: 'Library settings',
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
  fldObjLibrarySettings: {
    fldStrTitle: 'Kütüphane ayarları',
    fldStrCodeLabel: 'Kod',
    fldStrNameLabel: 'Ad',
    fldStrTypeLabel: 'Tür',
    fldStrFoundedDateLabel: 'Kuruluş tarihi',
    fldStrCountryLabel: 'Ülke',
    fldStrStateLabel: 'Eyalet',
    fldStrCityLabel: 'Şehir',
    fldStrDistrictLabel: 'İlçe',
    fldStrTownLabel: 'Belde',
    fldStrNeighborhoodLabel: 'Mahalle',
    fldStrStreetLabel: 'Sokak',
    fldStrExtraDescriptionLabel: 'Ek tanım',
    fldStrPostalCodeLabel: 'Posta kodu',
    fldStrBuildingLabel: 'Bina adı/no',
    fldStrFloorLabel: 'Kat',
    fldStrApartmentLabel: 'Daire',
    fldStrWebsiteLabel: 'Web sitesi',
    fldStrSearchPlaceholder: 'Ara veya yaz…',
    fldStrCodeRequired: 'Kütüphane kodunu girin.',
    fldStrNameRequired: 'Kütüphane adını girin.',
    fldStrSave: 'Ayarları kaydet',
    fldStrSaveErrorTitle: 'Ayarlar kaydedilemedi',
    fldStrSavedMessage: 'Ayarlar kaydedildi.',
    fldStrLoading: 'Ayarlar yükleniyor…',
    fldStrErrorTitle: 'Ayarlar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
  },
  fldObjCollectionBrowser: {
    fldStrBack: 'Geri',
    fldStrCollectionsTitle: 'Koleksiyonlar',
    fldStrLoading: 'Koleksiyonlar yükleniyor…',
    fldStrErrorTitle: 'Koleksiyonlar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz koleksiyon yok',
    fldStrLibrarySettings: 'Kütüphane ayarları',
  },
  fldObjCommon: {},
};
