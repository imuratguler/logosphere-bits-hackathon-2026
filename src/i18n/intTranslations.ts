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
    fldStrCollectionSettings: string;
    fldStrSetsTitle: string;
    fldStrNoSetsTitle: string;
    fldStrMembersLabel: string;
    fldStrNewSet: string;
    fldStrConvertAll: string;
  };
  fldObjCollectionShortcut: {
    fldStrTitle: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrSave: string;
    fldStrSaveErrorTitle: string;
  };
  fldObjSetShortcut: {
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrSave: string;
    fldStrCancel: string;
    fldStrSaveErrorTitle: string;
  };
  fldObjMultiSelect: {
    fldStrSelectAll: string;
    fldStrCancel: string;
    fldStrMove: string;
    fldStrMerge: string;
    fldStrExtract: string;
    fldStrDelete: string;
  };
  fldObjMovePicker: {
    fldStrTitle: string;
    fldStrMove: string;
    fldStrCancel: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrNewCollection: string;
    fldStrNewSet: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrSaveErrorTitle: string;
    fldStrMoveErrorTitle: string;
    fldStrCurrent: string;
  };
  fldObjCollectionMerge: {
    fldStrTitle: string;
    fldStrNewCollection: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrExisting: string;
    fldStrSources: string;
    fldStrInto: string;
    fldStrMerge: string;
    fldStrCancel: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrMergeErrorTitle: string;
  };
  fldObjSetBatch: {
    fldStrMergeTitle: string;
    fldStrExtractTitle: string;
    fldStrConvertTitle: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrSetsLabel: string;
    fldStrProductsLabel: string;
    fldStrLeavesLabel: string;
    fldStrInto: string;
    fldStrMerge: string;
    fldStrExtract: string;
    fldStrConvert: string;
    fldStrCancel: string;
    fldStrLoading: string;
    fldStrLoadErrorTitle: string;
    fldStrRetry: string;
    fldStrErrorTitle: string;
  };
  fldObjProductDetails: {
    fldStrIdentityTitle: string;
    fldStrContributorsTitle: string;
    fldStrDescriptionTitle: string;
    fldStrPhysicalTitle: string;
    fldStrSignatureTitle: string;
    fldStrTitleLabel: string;
    fldStrSubtitleLabel: string;
    fldStrIsbn10Label: string;
    fldStrIsbn13Label: string;
    fldStrPublisherLabel: string;
    fldStrPublicationYearLabel: string;
    fldStrOriginalYearLabel: string;
    fldStrEditionLabel: string;
    fldStrPrintingLabel: string;
    fldStrPageCountLabel: string;
    fldStrPublicationTypeLabel: string;
    fldStrPublicationLanguageLabel: string;
    fldStrOriginalTextLabel: string;
    fldStrTranslationTrLabel: string;
    fldStrTranslationEnLabel: string;
    fldStrBindingLabel: string;
    fldStrDustJacketLabel: string;
    fldStrPaperLabel: string;
    fldStrDimensionsLabel: string;
    fldStrConditionLabel: string;
    fldStrSignatureLabel: string;
    fldStrDedicationLabel: string;
    fldStrLanguageTr: string;
    fldStrLanguageEn: string;
    fldStrSourcesTitle: string;
    fldStrNoSourcesTitle: string;
    fldStrAccessedLabel: string;
    fldStrFieldLabel: string;
  };
  fldObjCollectionSettings: {
    fldStrTitle: string;
    fldStrNameLabel: string;
    fldStrFormedDateLabel: string;
    fldStrHallRoomLabel: string;
    fldStrCabinetFaceLabel: string;
    fldStrBlockLabel: string;
    fldStrRowLabel: string;
    fldStrShelfLabel: string;
    fldStrWebsiteLabel: string;
    fldStrNameRequired: string;
    fldStrDateInvalid: string;
    fldStrSave: string;
    fldStrSaveErrorTitle: string;
    fldStrSavedMessage: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
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
    fldStrCollectionSettings: 'Collection settings',
    fldStrSetsTitle: 'Sets',
    fldStrNoSetsTitle: 'No sets yet',
    fldStrMembersLabel: 'Members',
    fldStrNewSet: 'New set',
    fldStrConvertAll: 'Convert all to set',
  },
  fldObjCollectionShortcut: {
    fldStrTitle: 'New collection',
    fldStrNamePlaceholder: 'Collection name',
    fldStrNameRequired: 'Enter a collection name.',
    fldStrSave: 'Save collection',
    fldStrSaveErrorTitle: 'Could not save the collection',
  },
  fldObjSetShortcut: {
    fldStrNamePlaceholder: 'Set name',
    fldStrNameRequired: 'Enter a set name.',
    fldStrSave: 'Save set',
    fldStrCancel: 'Cancel',
    fldStrSaveErrorTitle: 'Could not save the set',
  },
  fldObjMultiSelect: {
    fldStrSelectAll: 'Select All',
    fldStrCancel: 'Cancel',
    fldStrMove: 'Move',
    fldStrMerge: 'Merge',
    fldStrExtract: 'Extract',
    fldStrDelete: 'Delete',
  },
  fldObjMovePicker: {
    fldStrTitle: 'Move to…',
    fldStrMove: 'Move',
    fldStrCancel: 'Cancel',
    fldStrLoading: 'Loading destinations…',
    fldStrErrorTitle: 'Could not load destinations',
    fldStrRetry: 'Retry',
    fldStrNewCollection: 'New collection here',
    fldStrNewSet: 'New set here',
    fldStrNamePlaceholder: 'Name',
    fldStrNameRequired: 'Enter a name.',
    fldStrSaveErrorTitle: 'Could not save',
    fldStrMoveErrorTitle: 'Could not move',
    fldStrCurrent: 'Current',
  },
  fldObjCollectionMerge: {
    fldStrTitle: 'Merge collections',
    fldStrNewCollection: 'New collection',
    fldStrNamePlaceholder: 'Name',
    fldStrNameRequired: 'Enter a name.',
    fldStrExisting: 'Merge into existing',
    fldStrSources: 'Collections to merge',
    fldStrInto: 'Into',
    fldStrMerge: 'Merge',
    fldStrCancel: 'Cancel',
    fldStrLoading: 'Loading destinations…',
    fldStrErrorTitle: 'Could not load destinations',
    fldStrRetry: 'Retry',
    fldStrMergeErrorTitle: 'Could not merge',
  },
  fldObjSetBatch: {
    fldStrMergeTitle: 'Merge into new set',
    fldStrExtractTitle: 'Extract members',
    fldStrConvertTitle: 'Convert all to set',
    fldStrNamePlaceholder: 'Set name',
    fldStrNameRequired: 'Enter a set name.',
    fldStrSetsLabel: 'sets',
    fldStrProductsLabel: 'products',
    fldStrLeavesLabel: 'leaf collections',
    fldStrInto: 'Into',
    fldStrMerge: 'Merge',
    fldStrExtract: 'Extract',
    fldStrConvert: 'Convert',
    fldStrCancel: 'Cancel',
    fldStrLoading: 'Loading scope…',
    fldStrLoadErrorTitle: 'Could not load the scope',
    fldStrRetry: 'Retry',
    fldStrErrorTitle: 'Operation failed',
  },
  fldObjProductDetails: {
    fldStrIdentityTitle: 'Identity',
    fldStrContributorsTitle: 'Contributors',
    fldStrDescriptionTitle: 'Description',
    fldStrPhysicalTitle: 'Physical condition',
    fldStrSignatureTitle: 'Signature & dedication',
    fldStrTitleLabel: 'Title',
    fldStrSubtitleLabel: 'Subtitle',
    fldStrIsbn10Label: 'ISBN-10',
    fldStrIsbn13Label: 'ISBN-13',
    fldStrPublisherLabel: 'Publisher',
    fldStrPublicationYearLabel: 'Publication year',
    fldStrOriginalYearLabel: 'Original publication year',
    fldStrEditionLabel: 'Edition',
    fldStrPrintingLabel: 'Printing',
    fldStrPageCountLabel: 'Page count',
    fldStrPublicationTypeLabel: 'Publication type',
    fldStrPublicationLanguageLabel: 'Publication language',
    fldStrOriginalTextLabel: 'Original text',
    fldStrTranslationTrLabel: 'Turkish translation',
    fldStrTranslationEnLabel: 'English translation',
    fldStrBindingLabel: 'Binding',
    fldStrDustJacketLabel: 'Dust jacket',
    fldStrPaperLabel: 'Paper',
    fldStrDimensionsLabel: 'Dimensions',
    fldStrConditionLabel: 'Condition',
    fldStrSignatureLabel: 'Signature',
    fldStrDedicationLabel: 'Dedication',
    fldStrLanguageTr: 'Turkish',
    fldStrLanguageEn: 'English',
    fldStrSourcesTitle: 'Sources',
    fldStrNoSourcesTitle: 'No sources recorded',
    fldStrAccessedLabel: 'Accessed',
    fldStrFieldLabel: 'Field',
  },
  fldObjCollectionSettings: {
    fldStrTitle: 'Collection settings',
    fldStrNameLabel: 'Name',
    fldStrFormedDateLabel: 'Formed date',
    fldStrHallRoomLabel: 'Hall/room',
    fldStrCabinetFaceLabel: 'Cabinet face',
    fldStrBlockLabel: 'Block',
    fldStrRowLabel: 'Row',
    fldStrShelfLabel: 'Shelf',
    fldStrWebsiteLabel: 'Website',
    fldStrNameRequired: 'Enter the collection name.',
    fldStrDateInvalid: 'Enter a real YYYY-MM-DD date.',
    fldStrSave: 'Save settings',
    fldStrSaveErrorTitle: 'Could not save settings',
    fldStrSavedMessage: 'Settings saved.',
    fldStrLoading: 'Loading settings…',
    fldStrErrorTitle: 'Could not load settings',
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
    fldStrCollectionSettings: 'Koleksiyon ayarları',
    fldStrSetsTitle: 'Setler',
    fldStrNoSetsTitle: 'Henüz set yok',
    fldStrMembersLabel: 'Üyeler',
    fldStrNewSet: 'Yeni set',
    fldStrConvertAll: 'Tümünü sete çevir',
  },
  fldObjCollectionShortcut: {
    fldStrTitle: 'Yeni koleksiyon',
    fldStrNamePlaceholder: 'Koleksiyon adı',
    fldStrNameRequired: 'Bir koleksiyon adı girin.',
    fldStrSave: 'Koleksiyonu kaydet',
    fldStrSaveErrorTitle: 'Koleksiyon kaydedilemedi',
  },
  fldObjSetShortcut: {
    fldStrNamePlaceholder: 'Set adı',
    fldStrNameRequired: 'Bir set adı girin.',
    fldStrSave: 'Seti kaydet',
    fldStrCancel: 'Vazgeç',
    fldStrSaveErrorTitle: 'Set kaydedilemedi',
  },
  fldObjMultiSelect: {
    fldStrSelectAll: 'Tümünü seç',
    fldStrCancel: 'Vazgeç',
    fldStrMove: 'Taşı',
    fldStrMerge: 'Birleştir',
    fldStrExtract: 'Çıkar',
    fldStrDelete: 'Sil',
  },
  fldObjMovePicker: {
    fldStrTitle: 'Şuraya taşı…',
    fldStrMove: 'Taşı',
    fldStrCancel: 'Vazgeç',
    fldStrLoading: 'Hedefler yükleniyor…',
    fldStrErrorTitle: 'Hedefler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrNewCollection: 'Buraya yeni koleksiyon',
    fldStrNewSet: 'Buraya yeni set',
    fldStrNamePlaceholder: 'Ad',
    fldStrNameRequired: 'Bir ad girin.',
    fldStrSaveErrorTitle: 'Kaydedilemedi',
    fldStrMoveErrorTitle: 'Taşınamadı',
    fldStrCurrent: 'Mevcut',
  },
  fldObjCollectionMerge: {
    fldStrTitle: 'Koleksiyonları birleştir',
    fldStrNewCollection: 'Yeni koleksiyon',
    fldStrNamePlaceholder: 'Ad',
    fldStrNameRequired: 'Bir ad girin.',
    fldStrExisting: 'Mevcutta birleştir',
    fldStrSources: 'Birleştirilecek koleksiyonlar',
    fldStrInto: 'Hedef',
    fldStrMerge: 'Birleştir',
    fldStrCancel: 'Vazgeç',
    fldStrLoading: 'Hedefler yükleniyor…',
    fldStrErrorTitle: 'Hedefler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrMergeErrorTitle: 'Birleştirilemedi',
  },
  fldObjSetBatch: {
    fldStrMergeTitle: 'Yeni sette birleştir',
    fldStrExtractTitle: 'Üyeleri çıkar',
    fldStrConvertTitle: 'Tümünü sete çevir',
    fldStrNamePlaceholder: 'Set adı',
    fldStrNameRequired: 'Bir set adı girin.',
    fldStrSetsLabel: 'set',
    fldStrProductsLabel: 'ürün',
    fldStrLeavesLabel: 'yaprak koleksiyon',
    fldStrInto: 'Hedef',
    fldStrMerge: 'Birleştir',
    fldStrExtract: 'Çıkar',
    fldStrConvert: 'Çevir',
    fldStrCancel: 'Vazgeç',
    fldStrLoading: 'Kapsam yükleniyor…',
    fldStrLoadErrorTitle: 'Kapsam yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrErrorTitle: 'İşlem başarısız',
  },
  fldObjProductDetails: {
    fldStrIdentityTitle: 'Kimlik',
    fldStrContributorsTitle: 'Kişiler',
    fldStrDescriptionTitle: 'Açıklama',
    fldStrPhysicalTitle: 'Fiziksel durum',
    fldStrSignatureTitle: 'İmza ve ithaf',
    fldStrTitleLabel: 'Başlık',
    fldStrSubtitleLabel: 'Alt başlık',
    fldStrIsbn10Label: 'ISBN-10',
    fldStrIsbn13Label: 'ISBN-13',
    fldStrPublisherLabel: 'Yayıncı',
    fldStrPublicationYearLabel: 'Yayın yılı',
    fldStrOriginalYearLabel: 'Orijinal yayın yılı',
    fldStrEditionLabel: 'Baskı',
    fldStrPrintingLabel: 'Basım',
    fldStrPageCountLabel: 'Sayfa sayısı',
    fldStrPublicationTypeLabel: 'Yayın türü',
    fldStrPublicationLanguageLabel: 'Yayın dili',
    fldStrOriginalTextLabel: 'Orijinal metin',
    fldStrTranslationTrLabel: 'Türkçe çeviri',
    fldStrTranslationEnLabel: 'İngilizce çeviri',
    fldStrBindingLabel: 'Cilt',
    fldStrDustJacketLabel: 'Şömiz',
    fldStrPaperLabel: 'Kağıt',
    fldStrDimensionsLabel: 'Boyutlar',
    fldStrConditionLabel: 'Kondisyon',
    fldStrSignatureLabel: 'İmza',
    fldStrDedicationLabel: 'İthaf',
    fldStrLanguageTr: 'Türkçe',
    fldStrLanguageEn: 'İngilizce',
    fldStrSourcesTitle: 'Kaynaklar',
    fldStrNoSourcesTitle: 'Kayıtlı kaynak yok',
    fldStrAccessedLabel: 'Erişim',
    fldStrFieldLabel: 'Alan',
  },
  fldObjCollectionSettings: {
    fldStrTitle: 'Koleksiyon ayarları',
    fldStrNameLabel: 'Ad',
    fldStrFormedDateLabel: 'Oluşum tarihi',
    fldStrHallRoomLabel: 'Salon/oda',
    fldStrCabinetFaceLabel: 'Dolap yüzü',
    fldStrBlockLabel: 'Blok',
    fldStrRowLabel: 'Sıra',
    fldStrShelfLabel: 'Raf',
    fldStrWebsiteLabel: 'Web sitesi',
    fldStrNameRequired: 'Koleksiyon adını girin.',
    fldStrDateInvalid: 'Gerçek bir YYYY-AA-GG tarihi girin.',
    fldStrSave: 'Ayarları kaydet',
    fldStrSaveErrorTitle: 'Ayarlar kaydedilemedi',
    fldStrSavedMessage: 'Ayarlar kaydedildi.',
    fldStrLoading: 'Ayarlar yükleniyor…',
    fldStrErrorTitle: 'Ayarlar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
  },
  fldObjCommon: {},
};
