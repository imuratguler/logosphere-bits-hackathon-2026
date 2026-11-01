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
    fldStrContinue: string;
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
    fldStrProductsTitle: string;
    fldStrNoProductsTitle: string;
    fldStrPhotosLabel: string;
    fldStrNewSet: string;
    fldStrConvertAll: string;
    fldStrSingleItem: string;
    fldStrBulkItems: string;
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
  fldObjDelete: {
    fldStrTitle: string;
    fldStrCollectionsLabel: string;
    fldStrSetsLabel: string;
    fldStrProductsLabel: string;
    fldStrPhotosLabel: string;
    fldStrVoicesLabel: string;
    fldStrBlockedChildren: string;
    fldStrDelete: string;
    fldStrCancel: string;
    fldStrLoading: string;
    fldStrLoadErrorTitle: string;
    fldStrRetry: string;
    fldStrErrorTitle: string;
    fldStrFilesLeft: string;
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
  fldObjAccountLogin: {
    fldStrTitle: string;
    fldStrEmailPlaceholder: string;
    fldStrPasswordPlaceholder: string;
    fldStrEmailRequired: string;
    fldStrEmailInvalid: string;
    fldStrPasswordRequired: string;
    fldStrLogin: string;
    fldStrErrorTitle: string;
  };
  fldObjAccountRegister: {
    fldStrTitle: string;
    fldStrIndividualButton: string;
    fldStrCorporateButton: string;
    fldStrDisplayNamePlaceholder: string;
    fldStrEmailPlaceholder: string;
    fldStrPasswordPlaceholder: string;
    fldStrOrganizationPlaceholder: string;
    fldStrTypeInvalid: string;
    fldStrEmailRequired: string;
    fldStrEmailInvalid: string;
    fldStrPasswordRequired: string;
    fldStrPasswordTooShort: string;
    fldStrDisplayNameRequired: string;
    fldStrOrganizationRequired: string;
    fldStrRegister: string;
    fldStrErrorTitle: string;
  };
  fldObjAccountProfile: {
    fldStrTitle: string;
    fldStrDisplayNamePlaceholder: string;
    fldStrDisplayNameRequired: string;
    fldStrSave: string;
    fldStrSaveErrorTitle: string;
    fldStrOrganizationsTitle: string;
    fldStrEmptyOrganizations: string;
    fldStrRoleLabel: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
  };
  fldObjAccountDocuments: {
    fldStrTitle: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrRemove: string;
    fldStrRemoveTitle: string;
    fldStrRemoveConfirm: string;
    fldStrRemoveCancel: string;
    fldStrRemoveErrorTitle: string;
  };
  fldObjAccountRoles: {
    fldStrTitle: string;
    fldStrRolesTitle: string;
    fldStrMatrixTitle: string;
    fldStrMembersTitle: string;
    fldStrUnnamedMember: string;
    fldStrMemberRoleLabel: string;
    fldStrReadOnlyHint: string;
    fldStrGranted: string;
    fldStrRevoked: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyRoles: string;
    fldStrEmptyMembers: string;
    fldStrSaveErrorTitle: string;
  };
  fldObjAccountMessages: {
    fldStrTitle: string;
    fldStrComposeTitle: string;
    fldStrProfilePlaceholder: string;
    fldStrOrgPlaceholder: string;
    fldStrBodyPlaceholder: string;
    fldStrRecipientRequired: string;
    fldStrBodyRequired: string;
    fldStrSend: string;
    fldStrMarkRead: string;
    fldStrReadLabel: string;
    fldStrUnreadLabel: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrOpErrorTitle: string;
  };
  fldObjAccountInvitations: {
    fldStrTitle: string;
    fldStrInviteTitle: string;
    fldStrEmailPlaceholder: string;
    fldStrEmailRequired: string;
    fldStrEmailInvalid: string;
    fldStrRoleRequired: string;
    fldStrInvite: string;
    fldStrTokenIssuedLabel: string;
    fldStrDecideTitle: string;
    fldStrTokenPlaceholder: string;
    fldStrTokenRequired: string;
    fldStrAccept: string;
    fldStrDecline: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrOpErrorTitle: string;
  };
  fldObjAccountRelations: {
    fldStrTitle: string;
    fldStrAddTitle: string;
    fldStrProfilePlaceholder: string;
    fldStrOrgPlaceholder: string;
    fldStrPeerRequired: string;
    fldStrUnnamedPeer: string;
    fldStrAdd: string;
    fldStrRemove: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrOpErrorTitle: string;
  };
  fldObjCameraCapture: {
    fldStrTitle: string;
    fldStrPreparing: string;
    fldStrNoDeviceTitle: string;
    fldStrPermissionTitle: string;
    fldStrPermissionMessage: string;
    fldStrRequest: string;
    fldStrBlockedTitle: string;
    fldStrBlockedMessage: string;
    fldStrOpenSettings: string;
    fldStrShutter: string;
    fldStrConverting: string;
    fldStrRetake: string;
    fldStrClose: string;
    fldStrCaptureError: string;
    fldStrModeError: string;
    fldStrUsePhoto: string;
    fldStrChooseGallery: string;
    fldStrAdding: string;
    fldStrDraftTitle: string;
    fldStrDraftEmpty: string;
    fldStrIntakeError: string;
    fldStrFindNow: string;
    fldStrRotate: string;
    fldStrDelete: string;
    fldStrBack: string;
    fldStrPreviewTitle: string;
    fldStrPhotosAdded: string;
    fldStrClear: string;
    fldStrClearTitle: string;
    fldStrCancel: string;
  };
  fldObjVoiceNote: {
    fldStrRecord: string;
    fldStrRecording: string;
    fldStrStop: string;
    fldStrListen: string;
    fldStrPlaying: string;
    fldStrReRecord: string;
    fldStrDeleteNote: string;
    fldStrHasNote: string;
    fldStrMicTitle: string;
    fldStrMicMessage: string;
    fldStrMicRequest: string;
    fldStrMicBlockedTitle: string;
    fldStrMicBlockedMessage: string;
    fldStrMicOpenSettings: string;
    fldStrVoiceError: string;
  };
  fldObjBrandHeader: {
    fldStrName: string;
    fldStrSuffix: string;
  };
  fldObjDemoFooter: {
    fldStrText: string;
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
    fldStrContinue: 'Continue',
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
    fldStrProductsTitle: 'Products',
    fldStrNoProductsTitle: 'No products outside sets',
    fldStrPhotosLabel: 'Photos',
    fldStrNewSet: 'New set',
    fldStrConvertAll: 'Convert all to set',
    fldStrSingleItem: 'Single Item',
    fldStrBulkItems: 'Bulk Items',
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
  fldObjDelete: {
    fldStrTitle: 'Delete',
    fldStrCollectionsLabel: 'collections',
    fldStrSetsLabel: 'sets',
    fldStrProductsLabel: 'products',
    fldStrPhotosLabel: 'photos',
    fldStrVoicesLabel: 'voice notes',
    fldStrBlockedChildren:
      'Collections with sub-collections cannot be deleted.',
    fldStrDelete: 'Delete',
    fldStrCancel: 'Cancel',
    fldStrLoading: 'Loading affected content…',
    fldStrLoadErrorTitle: 'Could not load affected content',
    fldStrRetry: 'Retry',
    fldStrErrorTitle: 'Could not delete',
    fldStrFilesLeft: 'Some files could not be removed. Press Delete to retry.',
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
  fldObjAccountLogin: {
    fldStrTitle: 'Account login',
    fldStrEmailPlaceholder: 'Email address',
    fldStrPasswordPlaceholder: 'Password',
    fldStrEmailRequired: 'Enter your email address.',
    fldStrEmailInvalid: 'Enter a valid email address.',
    fldStrPasswordRequired: 'Enter your password.',
    fldStrLogin: 'Log in',
    fldStrErrorTitle: 'Could not log in',
  },
  fldObjAccountRegister: {
    fldStrTitle: 'Create an account',
    fldStrIndividualButton: 'Individual',
    fldStrCorporateButton: 'Corporate',
    fldStrDisplayNamePlaceholder: 'Display name',
    fldStrEmailPlaceholder: 'Email address',
    fldStrPasswordPlaceholder: 'Password (min 8 characters)',
    fldStrOrganizationPlaceholder: 'Organization name',
    fldStrTypeInvalid: 'Choose individual or corporate.',
    fldStrEmailRequired: 'Enter your email address.',
    fldStrEmailInvalid: 'Enter a valid email address.',
    fldStrPasswordRequired: 'Enter a password.',
    fldStrPasswordTooShort: 'Use at least 8 characters.',
    fldStrDisplayNameRequired: 'Enter a display name.',
    fldStrOrganizationRequired: 'Enter the organization name.',
    fldStrRegister: 'Register',
    fldStrErrorTitle: 'Could not register',
  },
  fldObjAccountProfile: {
    fldStrTitle: 'Account profile',
    fldStrDisplayNamePlaceholder: 'Display name',
    fldStrDisplayNameRequired: 'Enter a display name.',
    fldStrSave: 'Save profile',
    fldStrSaveErrorTitle: 'Could not save the profile',
    fldStrOrganizationsTitle: 'Organizations',
    fldStrEmptyOrganizations: 'No organizations yet',
    fldStrRoleLabel: 'Role',
    fldStrLoading: 'Loading profile…',
    fldStrErrorTitle: 'Could not load the profile',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No profile yet',
  },
  fldObjAccountDocuments: {
    fldStrTitle: 'Corporate documents',
    fldStrLoading: 'Loading documents…',
    fldStrErrorTitle: 'Could not load documents',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No documents yet',
    fldStrRemove: 'Remove',
    fldStrRemoveTitle: 'Remove document',
    fldStrRemoveConfirm: 'Remove document',
    fldStrRemoveCancel: 'Cancel',
    fldStrRemoveErrorTitle: 'Could not remove the document',
  },
  fldObjAccountRoles: {
    fldStrTitle: 'Roles and permissions',
    fldStrRolesTitle: 'Roles',
    fldStrMatrixTitle: 'Permission matrix',
    fldStrMembersTitle: 'Members',
    fldStrUnnamedMember: 'Unnamed member',
    fldStrMemberRoleLabel: 'Role',
    fldStrReadOnlyHint: 'Only account managers can change roles.',
    fldStrGranted: 'Granted',
    fldStrRevoked: 'Revoked',
    fldStrLoading: 'Loading roles…',
    fldStrErrorTitle: 'Could not load roles',
    fldStrRetry: 'Retry',
    fldStrEmptyRoles: 'No roles yet',
    fldStrEmptyMembers: 'No members yet',
    fldStrSaveErrorTitle: 'Could not save the change',
  },
  fldObjAccountMessages: {
    fldStrTitle: 'Messages',
    fldStrComposeTitle: 'New message',
    fldStrProfilePlaceholder: 'Recipient profile id',
    fldStrOrgPlaceholder: 'Recipient organization id',
    fldStrBodyPlaceholder: 'Message',
    fldStrRecipientRequired: 'Enter exactly one recipient.',
    fldStrBodyRequired: 'Enter a message.',
    fldStrSend: 'Send',
    fldStrMarkRead: 'Mark read',
    fldStrReadLabel: 'Read',
    fldStrUnreadLabel: 'Unread',
    fldStrLoading: 'Loading messages…',
    fldStrErrorTitle: 'Could not load messages',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No messages yet',
    fldStrOpErrorTitle: 'Could not complete the action',
  },
  fldObjAccountInvitations: {
    fldStrTitle: 'Invitations',
    fldStrInviteTitle: 'Invite a member',
    fldStrEmailPlaceholder: 'Email address',
    fldStrEmailRequired: 'Enter an email address.',
    fldStrEmailInvalid: 'Enter a valid email address.',
    fldStrRoleRequired: 'Choose a role first.',
    fldStrInvite: 'Invite',
    fldStrTokenIssuedLabel: 'Share this token with the invitee:',
    fldStrDecideTitle: 'Answer an invitation',
    fldStrTokenPlaceholder: 'Invitation token',
    fldStrTokenRequired: 'Enter the invitation token.',
    fldStrAccept: 'Accept',
    fldStrDecline: 'Decline',
    fldStrLoading: 'Loading invitations…',
    fldStrErrorTitle: 'Could not load invitations',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No invitations yet',
    fldStrOpErrorTitle: 'Could not complete the action',
  },
  fldObjAccountRelations: {
    fldStrTitle: 'Relations',
    fldStrAddTitle: 'Add a relation',
    fldStrProfilePlaceholder: 'Peer profile id',
    fldStrOrgPlaceholder: 'Peer organization id',
    fldStrPeerRequired: 'Enter exactly one peer.',
    fldStrUnnamedPeer: 'Unnamed peer',
    fldStrAdd: 'Add relation',
    fldStrRemove: 'Remove',
    fldStrLoading: 'Loading relations…',
    fldStrErrorTitle: 'Could not load relations',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No relations yet',
    fldStrOpErrorTitle: 'Could not complete the action',
  },
  fldObjCameraCapture: {
    fldStrTitle: 'Capture',
    fldStrPreparing: 'Preparing camera…',
    fldStrNoDeviceTitle: 'No back camera found',
    fldStrPermissionTitle: 'Camera permission needed',
    fldStrPermissionMessage: 'Allow camera access to capture items.',
    fldStrRequest: 'Allow camera',
    fldStrBlockedTitle: 'Camera is blocked',
    fldStrBlockedMessage: 'Enable the camera in the app settings.',
    fldStrOpenSettings: 'Open settings',
    fldStrShutter: 'Take photo',
    fldStrConverting: 'Processing…',
    fldStrRetake: 'Retake',
    fldStrClose: 'Close',
    fldStrCaptureError: 'Could not take the photo',
    fldStrModeError: 'Unknown capture mode',
    fldStrUsePhoto: 'Use photo',
    fldStrChooseGallery: 'Choose from gallery',
    fldStrAdding: 'Adding…',
    fldStrDraftTitle: 'Draft',
    fldStrDraftEmpty: 'No photos yet',
    fldStrIntakeError: 'Could not add the photo',
    fldStrFindNow: 'Find Now',
    fldStrRotate: 'Rotate',
    fldStrDelete: 'Delete',
    fldStrBack: 'Back',
    fldStrPreviewTitle: 'Preview',
    fldStrPhotosAdded: 'photos added',
    fldStrClear: 'Clear',
    fldStrClearTitle: 'Clear all photos?',
    fldStrCancel: 'Cancel',
  },
  fldObjVoiceNote: {
    fldStrRecord: 'Record note',
    fldStrRecording: 'Recording…',
    fldStrStop: 'Stop',
    fldStrListen: 'Listen',
    fldStrPlaying: 'Playing…',
    fldStrReRecord: 'Re-record',
    fldStrDeleteNote: 'Delete note',
    fldStrHasNote: 'Voice note',
    fldStrMicTitle: 'Microphone needed',
    fldStrMicMessage: 'Allow microphone access to record voice notes.',
    fldStrMicRequest: 'Allow microphone',
    fldStrMicBlockedTitle: 'Microphone is blocked',
    fldStrMicBlockedMessage: 'Enable the microphone in the app settings.',
    fldStrMicOpenSettings: 'Open settings',
    fldStrVoiceError: 'Could not record the voice note',
  },
  fldObjBrandHeader: {
    fldStrName: 'Logosphere',
    fldStrSuffix: 'BITS',
  },
  fldObjDemoFooter: {
    fldStrText: 'Demo Version © 2026',
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
    fldStrContinue: 'Devam Et',
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
    fldStrProductsTitle: 'Ürünler',
    fldStrNoProductsTitle: 'Set dışında ürün yok',
    fldStrPhotosLabel: 'Fotoğraf',
    fldStrNewSet: 'Yeni set',
    fldStrConvertAll: 'Tümünü sete çevir',
    fldStrSingleItem: 'Tek Ürün',
    fldStrBulkItems: 'Toplu Ürün',
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
  fldObjDelete: {
    fldStrTitle: 'Sil',
    fldStrCollectionsLabel: 'koleksiyon',
    fldStrSetsLabel: 'set',
    fldStrProductsLabel: 'ürün',
    fldStrPhotosLabel: 'fotoğraf',
    fldStrVoicesLabel: 'ses kaydı',
    fldStrBlockedChildren: 'Alt koleksiyonu olan koleksiyonlar silinemez.',
    fldStrDelete: 'Sil',
    fldStrCancel: 'Vazgeç',
    fldStrLoading: 'Etkilenen içerik yükleniyor…',
    fldStrLoadErrorTitle: 'Etkilenen içerik yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrErrorTitle: 'Silinemedi',
    fldStrFilesLeft:
      "Bazı dosyalar kaldırılamadı. Yeniden denemek için Sil'e basın.",
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
  fldObjAccountLogin: {
    fldStrTitle: 'Hesap girişi',
    fldStrEmailPlaceholder: 'E-posta adresi',
    fldStrPasswordPlaceholder: 'Parola',
    fldStrEmailRequired: 'E-posta adresinizi girin.',
    fldStrEmailInvalid: 'Geçerli bir e-posta adresi girin.',
    fldStrPasswordRequired: 'Parolanızı girin.',
    fldStrLogin: 'Giriş yap',
    fldStrErrorTitle: 'Giriş yapılamadı',
  },
  fldObjAccountRegister: {
    fldStrTitle: 'Hesap oluştur',
    fldStrIndividualButton: 'Bireysel',
    fldStrCorporateButton: 'Kurumsal',
    fldStrDisplayNamePlaceholder: 'Görünen ad',
    fldStrEmailPlaceholder: 'E-posta adresi',
    fldStrPasswordPlaceholder: 'Parola (en az 8 karakter)',
    fldStrOrganizationPlaceholder: 'Kurum adı',
    fldStrTypeInvalid: 'Bireysel veya kurumsal seçin.',
    fldStrEmailRequired: 'E-posta adresinizi girin.',
    fldStrEmailInvalid: 'Geçerli bir e-posta adresi girin.',
    fldStrPasswordRequired: 'Bir parola girin.',
    fldStrPasswordTooShort: 'En az 8 karakter kullanın.',
    fldStrDisplayNameRequired: 'Görünen ad girin.',
    fldStrOrganizationRequired: 'Kurum adını girin.',
    fldStrRegister: 'Kaydol',
    fldStrErrorTitle: 'Kayıt yapılamadı',
  },
  fldObjAccountProfile: {
    fldStrTitle: 'Hesap profili',
    fldStrDisplayNamePlaceholder: 'Görünen ad',
    fldStrDisplayNameRequired: 'Görünen ad girin.',
    fldStrSave: 'Profili kaydet',
    fldStrSaveErrorTitle: 'Profil kaydedilemedi',
    fldStrOrganizationsTitle: 'Kurumlar',
    fldStrEmptyOrganizations: 'Henüz kurum yok',
    fldStrRoleLabel: 'Rol',
    fldStrLoading: 'Profil yükleniyor…',
    fldStrErrorTitle: 'Profil yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz profil yok',
  },
  fldObjAccountDocuments: {
    fldStrTitle: 'Kurumsal belgeler',
    fldStrLoading: 'Belgeler yükleniyor…',
    fldStrErrorTitle: 'Belgeler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz belge yok',
    fldStrRemove: 'Kaldır',
    fldStrRemoveTitle: 'Belgeyi kaldır',
    fldStrRemoveConfirm: 'Belgeyi kaldır',
    fldStrRemoveCancel: 'Vazgeç',
    fldStrRemoveErrorTitle: 'Belge kaldırılamadı',
  },
  fldObjAccountRoles: {
    fldStrTitle: 'Roller ve yetkiler',
    fldStrRolesTitle: 'Roller',
    fldStrMatrixTitle: 'Yetki matrisi',
    fldStrMembersTitle: 'Üyeler',
    fldStrUnnamedMember: 'Adsız üye',
    fldStrMemberRoleLabel: 'Rol',
    fldStrReadOnlyHint: 'Rolleri yalnız hesap yöneticileri değiştirebilir.',
    fldStrGranted: 'Verildi',
    fldStrRevoked: 'Alındı',
    fldStrLoading: 'Roller yükleniyor…',
    fldStrErrorTitle: 'Roller yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyRoles: 'Henüz rol yok',
    fldStrEmptyMembers: 'Henüz üye yok',
    fldStrSaveErrorTitle: 'Değişiklik kaydedilemedi',
  },
  fldObjAccountMessages: {
    fldStrTitle: 'Mesajlar',
    fldStrComposeTitle: 'Yeni mesaj',
    fldStrProfilePlaceholder: 'Alıcı profil kimliği',
    fldStrOrgPlaceholder: 'Alıcı kurum kimliği',
    fldStrBodyPlaceholder: 'Mesaj',
    fldStrRecipientRequired: 'Tam bir alıcı girin.',
    fldStrBodyRequired: 'Bir mesaj girin.',
    fldStrSend: 'Gönder',
    fldStrMarkRead: 'Okundu işaretle',
    fldStrReadLabel: 'Okundu',
    fldStrUnreadLabel: 'Okunmadı',
    fldStrLoading: 'Mesajlar yükleniyor…',
    fldStrErrorTitle: 'Mesajlar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz mesaj yok',
    fldStrOpErrorTitle: 'İşlem tamamlanamadı',
  },
  fldObjAccountInvitations: {
    fldStrTitle: 'Davetler',
    fldStrInviteTitle: 'Üye davet et',
    fldStrEmailPlaceholder: 'E-posta adresi',
    fldStrEmailRequired: 'Bir e-posta adresi girin.',
    fldStrEmailInvalid: 'Geçerli bir e-posta adresi girin.',
    fldStrRoleRequired: 'Önce bir rol seçin.',
    fldStrInvite: 'Davet et',
    fldStrTokenIssuedLabel: 'Bu jetonu davetliyle paylaşın:',
    fldStrDecideTitle: 'Daveti yanıtla',
    fldStrTokenPlaceholder: 'Davet jetonu',
    fldStrTokenRequired: 'Davet jetonunu girin.',
    fldStrAccept: 'Kabul et',
    fldStrDecline: 'Reddet',
    fldStrLoading: 'Davetler yükleniyor…',
    fldStrErrorTitle: 'Davetler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz davet yok',
    fldStrOpErrorTitle: 'İşlem tamamlanamadı',
  },
  fldObjAccountRelations: {
    fldStrTitle: 'İlişkiler',
    fldStrAddTitle: 'İlişki ekle',
    fldStrProfilePlaceholder: 'Eş profil kimliği',
    fldStrOrgPlaceholder: 'Eş kurum kimliği',
    fldStrPeerRequired: 'Tam bir eş girin.',
    fldStrUnnamedPeer: 'Adsız eş',
    fldStrAdd: 'İlişki ekle',
    fldStrRemove: 'Kaldır',
    fldStrLoading: 'İlişkiler yükleniyor…',
    fldStrErrorTitle: 'İlişkiler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz ilişki yok',
    fldStrOpErrorTitle: 'İşlem tamamlanamadı',
  },
  fldObjCameraCapture: {
    fldStrTitle: 'Çekim',
    fldStrPreparing: 'Kamera hazırlanıyor…',
    fldStrNoDeviceTitle: 'Arka kamera bulunamadı',
    fldStrPermissionTitle: 'Kamera izni gerekli',
    fldStrPermissionMessage: 'Öğe çekmek için kamera erişimine izin verin.',
    fldStrRequest: 'Kameraya izin ver',
    fldStrBlockedTitle: 'Kamera engelli',
    fldStrBlockedMessage: 'Kamerayı uygulama ayarlarından açın.',
    fldStrOpenSettings: 'Ayarları aç',
    fldStrShutter: 'Fotoğraf çek',
    fldStrConverting: 'İşleniyor…',
    fldStrRetake: 'Tekrar çek',
    fldStrClose: 'Kapat',
    fldStrCaptureError: 'Fotoğraf çekilemedi',
    fldStrModeError: 'Bilinmeyen çekim kipi',
    fldStrUsePhoto: 'Fotoğrafı kullan',
    fldStrChooseGallery: 'Galeriden seç',
    fldStrAdding: 'Ekleniyor…',
    fldStrDraftTitle: 'Taslak',
    fldStrDraftEmpty: 'Henüz fotoğraf yok',
    fldStrIntakeError: 'Fotoğraf eklenemedi',
    fldStrFindNow: 'Şimdi Bul',
    fldStrRotate: 'Döndür',
    fldStrDelete: 'Sil',
    fldStrBack: 'Geri',
    fldStrPreviewTitle: 'Önizleme',
    fldStrPhotosAdded: 'fotoğraf eklendi',
    fldStrClear: 'Temizle',
    fldStrClearTitle: 'Tüm fotoğraflar silinsin mi?',
    fldStrCancel: 'Vazgeç',
  },
  fldObjVoiceNote: {
    fldStrRecord: 'Not kaydet',
    fldStrRecording: 'Kaydediliyor…',
    fldStrStop: 'Durdur',
    fldStrListen: 'Dinle',
    fldStrPlaying: 'Çalınıyor…',
    fldStrReRecord: 'Yeniden kaydet',
    fldStrDeleteNote: 'Notu sil',
    fldStrHasNote: 'Sesli not',
    fldStrMicTitle: 'Mikrofon gerekli',
    fldStrMicMessage: 'Sesli not kaydetmek için mikrofon erişimine izin verin.',
    fldStrMicRequest: 'Mikrofona izin ver',
    fldStrMicBlockedTitle: 'Mikrofon engelli',
    fldStrMicBlockedMessage: 'Mikrofonu uygulama ayarlarından açın.',
    fldStrMicOpenSettings: 'Ayarları aç',
    fldStrVoiceError: 'Sesli not kaydedilemedi',
  },
  fldObjBrandHeader: {
    fldStrName: 'Logosphere',
    fldStrSuffix: 'BITS',
  },
  fldObjDemoFooter: {
    fldStrText: 'Demo Version © 2026',
  },
  fldObjCommon: {},
};
