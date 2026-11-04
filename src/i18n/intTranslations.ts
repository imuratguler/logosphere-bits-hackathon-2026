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
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrContinue: string;
    fldStrNoPassword: string;
    fldStrSessionErrorTitle: string;
    fldStrEmptyTitle: string;
    fldStrPickerPlaceholder: string;
    fldStrCancel: string;
  };
  fldObjHome: {
    fldStrChangeProfile: string;
    fldStrTypeCorporate: string;
    fldStrTypeIndividual: string;
    fldStrRefresh: string;
    fldStrLogoff: string;
  };
  fldObjLibraryList: {
    fldStrBack: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrAddLibrary: string;
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
    fldStrCancel: string;
    fldStrSaveErrorTitle: string;
  };
  fldObjLibrarySettings: {
    fldStrTitle: string;
    fldStrBack: string;
    fldStrCodeLabel: string;
    fldStrNameLabel: string;
    fldStrTypeLabel: string;
    fldStrTypePlaceholder: string;
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
    fldStrAddCollectionFull: string;
    fldStrAddCollection: string;
    fldStrAddProduct: string;
    fldStrProductChoiceTitle: string;
    fldStrEmptyContent: string;
    fldStrCancel: string;
    fldStrExport: string;
    fldStrForSale: string;
  };
  fldObjCollectionShortcut: {
    fldStrTitle: string;
    fldStrNamePlaceholder: string;
    fldStrNameRequired: string;
    fldStrSave: string;
    fldStrCancel: string;
    fldStrSaveErrorTitle: string;
  };
  fldObjSetDetail: {
    fldStrBack: string;
    fldStrLoading: string;
    fldStrErrorTitle: string;
    fldStrRetry: string;
    fldStrEmptyTitle: string;
    fldStrPhotosLabel: string;
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
    fldStrBack: string;
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
    fldStrClose: string;
    fldStrCaptureError: string;
    fldStrModeError: string;
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
    fldStrPhotoAdded: string;
    fldStrClear: string;
    fldStrClearTitle: string;
    fldStrDeletePhotoTitle: string;
    fldStrDeletePhotoSummary: string;
    fldStrCancel: string;
  };
  fldObjVoiceNote: {
    fldStrRecord: string;
    fldStrRecording: string;
    fldStrStop: string;
    fldStrListen: string;
    fldStrPlaying: string;
    fldStrDeleteNote: string;
    fldStrDeleteAudio: string;
    fldStrDeleteAudioTitle: string;
    fldStrDeleteAudioSummary: string;
    fldStrHasNote: string;
    fldStrMicTitle: string;
    fldStrMicMessage: string;
    fldStrMicRequest: string;
    fldStrMicBlockedTitle: string;
    fldStrMicBlockedMessage: string;
    fldStrMicOpenSettings: string;
    fldStrVoiceError: string;
  };
  fldObjAnalysisFlow: {
    fldStrTitle: string;
    fldStrPhotosReady: string;
    fldStrUploading: string;
    fldStrRunning: string;
    fldStrFlowError: string;
    fldStrPreparing: string;
    fldStrSearching: string;
    fldStrCancel: string;
    fldStrRetry: string;
    fldStrBack: string;
  };
  fldObjAnalysisResult: {
    fldStrTitle: string;
    fldStrPriceButton: string;
    fldStrTagPrice: string;
    fldStrListed: string;
    fldStrNotListed: string;
    fldStrNoPhotos: string;
    fldStrBack: string;
    fldStrLoadError: string;
    fldStrRetry: string;
    fldStrSaveAll: string;
    fldStrSaving: string;
    fldStrSavedProducts: string;
    fldStrSaveError: string;
    fldStrOpenSaved: string;
    fldStrResultLabel: string;
    fldStrConfidence: string;
    fldStrRationale: string;
    fldStrSingleTitle: string;
    fldStrMultiTitle: string;
    fldStrPhotos: string;
    fldStrIdentity: string;
    fldStrCondition: string;
    fldStrVoice: string;
    fldStrVoiceClaim: string;
    fldStrSourceTitle: string;
    fldStrPriceTitle: string;
    fldStrAddToCollection: string;
    fldStrAdd: string;
    fldStrAddAsSet: string;
    fldStrSetTitle: string;
    fldStrSetPlaceholder: string;
    fldStrSetSave: string;
    fldStrSetCancel: string;
    fldStrSetBlank: string;
    fldStrSetError: string;
    fldStrMergedDuplicate: string;
    fldStrMergedPhotos: string;
    fldStrNotAvailable: string;
    fldStrBasisAi: string;
    fldStrBasisObserved: string;
    fldStrBasisEstimate: string;
    fldStrNeedsReview: string;
    fldStrReviewNoSource: string;
    fldStrReviewVoiceFailed: string;
    fldStrReviewDuplicateSplit: string;
    fldStrReviewUncertain: string;
    fldStrReviewMultiSubject: string;
    fldStrObservationsTitle: string;
    fldStrAiEstimateTitle: string;
    fldStrMarketNew: string;
    fldStrMarketUsed: string;
    fldStrObservedOn: string;
  };
  fldObjCodeLabels: {
    fldArrPublicationType: string[];
    fldArrPersonRole: string[];
    fldArrCover: string[];
    fldArrPaper: string[];
    fldArrCondition: string[];
  };
  fldObjMarketPrice: {
    fldStrTitle: string;
    fldStrResearch: string;
    fldStrResearching: string;
    fldStrResearchNote: string;
    fldStrResearchError: string;
    fldStrEstimatesTitle: string;
    fldStrReplacementNew: string;
    fldStrMarketLow: string;
    fldStrMarketMedian: string;
    fldStrMarketHigh: string;
    fldStrRecommended: string;
    fldStrBasis: string;
    fldStrBasisEstimate: string;
    fldStrBasisEvidence: string;
    fldStrBasisAiEstimate: string;
    fldStrObservationsTitle: string;
    fldStrNoObservations: string;
    fldStrNoEstimates: string;
    fldStrMarketNew: string;
    fldStrMarketUsed: string;
    fldStrObservedOn: string;
    fldStrBack: string;
    fldStrLoadError: string;
    fldStrRetry: string;
  };
  fldObjBrandHeader: {
    fldStrName: string;
    fldStrSuffix: string;
  };
  fldObjDemoFooter: {
    fldStrText: string;
  };
  fldObjSale: {
    fldStrTitle: string;
    fldStrTagLabel: string;
    fldStrTagPlaceholder: string;
    fldStrTagInvalid: string;
    fldStrActivate: string;
    fldStrDeactivate: string;
    fldStrCancel: string;
    fldStrSaving: string;
    fldStrListedAt: string;
    fldStrDeactivatedKept: string;
    fldStrScopeNote: string;
    fldStrScopeLine: string;
    fldStrScopeTitle: string;
    fldStrScopeIntro: string;
    fldStrScopeTotal: string;
    fldStrSkippedNote: string;
    fldStrUnitCollections: string;
    fldStrUnitSets: string;
    fldStrUnitProducts: string;
    fldStrDoneApplied: string;
    fldStrDoneSkipped: string;
    fldStrMissingNote: string;
    fldStrChangedError: string;
    fldStrOnSaleBadge: string;
    fldStrSaleButton: string;
    fldStrTotalLabel: string;
    fldStrNotListed: string;
  };
  fldObjExport: {
    fldStrTitle: string;
    fldStrButton: string;
    fldStrWorking: string;
    fldStrDone: string;
    fldStrEmpty: string;
    fldStrFailTitle: string;
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
    fldStrTitle: 'Choose a demo user',
    fldStrLoading: 'Loading personas…',
    fldStrErrorTitle: 'Could not load personas',
    fldStrRetry: 'Retry',
    fldStrContinue: 'Login',
    fldStrNoPassword: 'No password required for Demo',
    fldStrSessionErrorTitle: 'Session failed',
    fldStrEmptyTitle: 'No demo personas yet',
    fldStrPickerPlaceholder: 'Select a user',
    fldStrCancel: 'Cancel',
  },
  fldObjHome: {
    fldStrChangeProfile: 'Change Demo Profile',
    fldStrTypeCorporate: 'Corporate',
    fldStrTypeIndividual: 'Individual',
    fldStrRefresh: 'Refresh',
    fldStrLogoff: 'Log off',
  },
  fldObjLibraryList: {
    fldStrBack: 'Back',
    fldStrLoading: 'Loading libraries…',
    fldStrErrorTitle: 'Could not load libraries',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No libraries yet',
    fldStrAddLibrary: '+ Add Library',
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
    fldStrSave: 'Create library',
    fldStrCancel: 'Cancel',
    fldStrSaveErrorTitle: 'Could not save the library',
  },
  fldObjLibrarySettings: {
    fldStrTitle: 'Library settings',
    fldStrBack: 'Back',
    fldStrCodeLabel: 'Code',
    fldStrNameLabel: 'Name',
    fldStrTypeLabel: 'Type',
    fldStrTypePlaceholder: 'Select type',
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
    fldStrMembersLabel: 'Items',
    fldStrProductsTitle: 'Items',
    fldStrNoProductsTitle: 'No items outside sets',
    fldStrPhotosLabel: 'Photos',
    fldStrNewSet: 'New Set',
    fldStrConvertAll: 'Convert all to set',
    fldStrSingleItem: 'Single Item',
    fldStrBulkItems: 'Bulk Items',
    fldStrAddCollectionFull: '+ Add Collection',
    fldStrAddCollection: '+ Collection',
    fldStrAddProduct: '+ Add Item(s)',
    fldStrProductChoiceTitle: 'Add items',
    fldStrEmptyContent: 'No content yet',
    fldStrCancel: 'Cancel',
    fldStrExport: 'Export CSV',
    fldStrForSale: 'For Sale',
  },
  fldObjCollectionShortcut: {
    fldStrTitle: 'New collection',
    fldStrNamePlaceholder: 'Collection name',
    fldStrNameRequired: 'Enter a collection name.',
    fldStrSave: 'Create collection',
    fldStrCancel: 'Cancel',
    fldStrSaveErrorTitle: 'Could not save the collection',
  },
  fldObjSetDetail: {
    fldStrBack: 'Back',
    fldStrLoading: 'Loading items…',
    fldStrErrorTitle: 'Could not load items',
    fldStrRetry: 'Retry',
    fldStrEmptyTitle: 'No items yet',
    fldStrPhotosLabel: 'Photos',
  },
  fldObjSetShortcut: {
    fldStrNamePlaceholder: 'Set name',
    fldStrNameRequired: 'Enter a set name.',
    fldStrSave: 'Create set',
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
    fldStrExtractTitle: 'Extract items',
    fldStrConvertTitle: 'Convert all to set',
    fldStrNamePlaceholder: 'Set name',
    fldStrNameRequired: 'Enter a set name.',
    fldStrSetsLabel: 'sets',
    fldStrProductsLabel: 'items',
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
    fldStrProductsLabel: 'items',
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
    fldStrBack: 'Back',
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
    fldStrClose: 'Close',
    fldStrCaptureError: 'Could not take the photo',
    fldStrModeError: 'Unknown capture mode',
    fldStrChooseGallery: 'Choose from gallery',
    fldStrAdding: 'Adding…',
    fldStrDraftTitle: 'Added photos',
    fldStrDraftEmpty: 'No photos yet',
    fldStrIntakeError: 'Could not add the photo',
    fldStrFindNow: 'Find Now',
    fldStrRotate: 'Rotate',
    fldStrDelete: 'Delete',
    fldStrBack: 'Back',
    fldStrPreviewTitle: 'Preview',
    fldStrPhotosAdded: 'photos added',
    fldStrPhotoAdded: 'photo added',
    fldStrClear: 'Clear',
    fldStrClearTitle: 'Clear all photos?',
    fldStrDeletePhotoTitle: 'Delete photo?',
    fldStrDeletePhotoSummary: 'The photo and its voice note will be removed.',
    fldStrCancel: 'Cancel',
  },
  fldObjVoiceNote: {
    fldStrRecord: 'Record note',
    fldStrRecording: 'Recording…',
    fldStrStop: 'Stop',
    fldStrListen: 'Listen',
    fldStrPlaying: 'Playing…',
    fldStrDeleteNote: 'Delete note',
    fldStrDeleteAudio: 'Delete Audio',
    fldStrDeleteAudioTitle: 'Delete voice note?',
    fldStrDeleteAudioSummary:
      'The voice note will be removed. The photo stays.',
    fldStrHasNote: 'Voice note',
    fldStrMicTitle: 'Microphone needed',
    fldStrMicMessage: 'Allow microphone access to record voice notes.',
    fldStrMicRequest: 'Allow microphone',
    fldStrMicBlockedTitle: 'Microphone is blocked',
    fldStrMicBlockedMessage: 'Enable the microphone in the app settings.',
    fldStrMicOpenSettings: 'Open settings',
    fldStrVoiceError: 'Could not record the voice note',
  },
  fldObjAnalysisFlow: {
    fldStrTitle: 'Analysis',
    fldStrPhotosReady: 'photos ready',
    fldStrUploading: 'Uploading…',
    fldStrRunning: 'Analyzing…',
    fldStrFlowError: 'Analysis failed',
    fldStrPreparing: 'Preparing…',
    fldStrSearching: 'Searching…',
    fldStrCancel: 'Cancel',
    fldStrRetry: 'Retry',
    fldStrBack: 'Back',
  },
  fldObjAnalysisResult: {
    fldStrTitle: 'Result',
    fldStrPriceButton: 'Market price',
    fldStrTagPrice: 'Tag price',
    fldStrListed: 'Listed for sale',
    fldStrNotListed: 'Not listed',
    fldStrNoPhotos: 'No saved photos yet',
    fldStrBack: 'Back',
    fldStrLoadError: 'Could not load the item',
    fldStrRetry: 'Retry',
    fldStrSaveAll: 'Save results',
    fldStrSaving: 'Saving…',
    fldStrSavedProducts: 'items saved',
    fldStrSaveError: 'Could not save',
    fldStrOpenSaved: 'Open saved item',
    fldStrResultLabel: 'Result',
    fldStrConfidence: 'Confidence',
    fldStrRationale: 'Why',
    fldStrSingleTitle: 'Result',
    fldStrMultiTitle: 'Results',
    fldStrPhotos: 'Photos',
    fldStrIdentity: 'Identity',
    fldStrCondition: 'Condition',
    fldStrVoice: 'Voice note',
    fldStrVoiceClaim: 'User claim',
    fldStrSourceTitle: 'Source & confidence',
    fldStrPriceTitle: 'Price (USD)',
    fldStrAddToCollection: 'Add to Collection',
    fldStrAdd: 'Add',
    fldStrAddAsSet: 'Add as Set',
    fldStrSetTitle: 'New set',
    fldStrSetPlaceholder: 'Set name',
    fldStrSetSave: 'Save as set',
    fldStrSetCancel: 'Cancel',
    fldStrSetBlank: 'Enter a set name.',
    fldStrSetError: 'Could not save the set.',
    fldStrMergedDuplicate: 'Merged duplicate',
    fldStrMergedPhotos: 'photos merged',
    fldStrNotAvailable: 'Not available',
    fldStrBasisAi: 'AI estimate',
    fldStrBasisObserved: 'Observed market data',
    fldStrBasisEstimate: 'Estimate',
    fldStrNeedsReview: 'Needs your review',
    fldStrReviewNoSource: 'No catalog source confirmed this item',
    fldStrReviewVoiceFailed: 'A voice note could not be transcribed',
    fldStrReviewDuplicateSplit: 'A possible duplicate was kept separate',
    fldStrReviewUncertain: 'A low-confidence merge needs a look',
    fldStrReviewMultiSubject: 'One photo shows more than one publication',
    fldStrObservationsTitle: 'Price sightings',
    fldStrAiEstimateTitle: 'AI estimate (kept separate)',
    fldStrMarketNew: 'New',
    fldStrMarketUsed: 'Used',
    fldStrObservedOn: 'Observed',
  },
  fldObjCodeLabels: {
    fldArrPublicationType: [
      'Book',
      'Academic Journal',
      'Magazine',
      'Periodical',
      'Encyclopedia',
      'Dictionary',
      'Newspaper',
      'Newsletter',
      'Almanac',
      'Fascicle',
      'Catalog',
      'Thesis',
      'Report',
      'Brochure',
      'Booklet',
      'Proceedings',
      'Album',
      'Atlas',
      'Planner',
      'Set-in-Set',
    ],
    fldArrPersonRole: [
      'Contributor',
      'Author',
      'Prepared',
      'Compiled',
      'Editor',
      'Foreword',
      'Illustrator',
      'Photographer',
      'Translator',
      'Cover Art',
    ],
    fldArrCover: [
      'None',
      'Paperback',
      'Hardcover',
      'Greyboard',
      'Flexibound',
      'Clothbound',
      'Leatherbound',
      'Spiralbound',
      'Smyth Sewn',
      'Saddle Stitched',
      'Mounted',
    ],
    fldArrPaper: [
      'Unspecified',
      'Premium Offset',
      'Bookprint',
      'Newsprint',
      'Glossy Coated',
      'Matte Coated',
      'Bristol Board',
      'Tracing',
      'Textured',
      'BOPP Lamination',
      'Kraft',
    ],
    fldArrCondition: ['New', 'Poor', 'Fair', 'Good', 'Very Good', 'Like New'],
  },
  fldObjMarketPrice: {
    fldStrTitle: 'Market price',
    fldStrResearch: 'Research prices',
    fldStrResearching: 'Researching…',
    fldStrResearchNote: 'Estimates come from model knowledge (estimate basis).',
    fldStrResearchError: 'Could not research prices',
    fldStrEstimatesTitle: 'Estimate',
    fldStrReplacementNew: 'Replacement (new)',
    fldStrMarketLow: 'Low band',
    fldStrMarketMedian: 'Median',
    fldStrMarketHigh: 'High band',
    fldStrRecommended: 'Recommended',
    fldStrBasis: 'Basis',
    fldStrBasisEstimate: 'Estimate',
    fldStrBasisEvidence: 'Evidence',
    fldStrBasisAiEstimate: 'AI estimate',
    fldStrObservationsTitle: 'Observations',
    fldStrNoObservations: 'No observations yet',
    fldStrNoEstimates: 'No estimate yet',
    fldStrMarketNew: 'New',
    fldStrMarketUsed: 'Used',
    fldStrObservedOn: 'Observed',
    fldStrBack: 'Back',
    fldStrLoadError: 'Could not load the prices',
    fldStrRetry: 'Retry',
  },
  fldObjBrandHeader: {
    fldStrName: 'Logosphere',
    fldStrSuffix: 'BITS',
  },
  fldObjDemoFooter: {
    fldStrText: 'Demo Version © 2026',
  },
  fldObjSale: {
    fldStrTitle: 'Sale',
    fldStrTagLabel: 'Tag price (USD)',
    fldStrTagPlaceholder: '19.99',
    fldStrTagInvalid: 'Enter a valid tag price.',
    fldStrActivate: 'Activate',
    fldStrDeactivate: 'Deactivate',
    fldStrCancel: 'Cancel',
    fldStrSaving: 'Saving…',
    fldStrListedAt: 'Listed for sale at',
    fldStrDeactivatedKept: 'Sale deactivated. Tag price kept.',
    fldStrScopeNote:
      'Each in-scope item will be tagged at its recommended price.',
    fldStrScopeLine: 'Scope',
    fldStrMissingNote: 'items have no USD recommendation and will be skipped',
    fldStrChangedError: 'The listing changed. Reload and try again.',
    fldStrOnSaleBadge: 'ON SALE',
    fldStrSaleButton: 'Sale',
    fldStrScopeTitle: 'Sale scope',
    fldStrScopeIntro:
      'Activation tags every in-scope item at its recommended USD price.',
    fldStrScopeTotal: 'Recommended total',
    fldStrSkippedNote: 'Skipped (no USD recommendation)',
    fldStrUnitCollections: 'collections',
    fldStrUnitSets: 'sets',
    fldStrUnitProducts: 'items',
    fldStrDoneApplied: 'Listings applied',
    fldStrDoneSkipped: 'skipped',
    fldStrTotalLabel: 'Recommended total',
    fldStrNotListed: 'Not listed',
  },
  fldObjExport: {
    fldStrTitle: 'Export',
    fldStrButton: 'Export CSV',
    fldStrWorking: 'Preparing the export…',
    fldStrDone: 'Export saved to Downloads.',
    fldStrEmpty: 'Nothing to export.',
    fldStrFailTitle: 'Export failed',
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
    fldStrTitle: 'Bir demo kullanıcısı seç',
    fldStrLoading: 'Personalar yükleniyor…',
    fldStrErrorTitle: 'Personalar yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrContinue: 'Giriş Yap',
    fldStrNoPassword: 'Demo için parola gerekmez',
    fldStrSessionErrorTitle: 'Oturum başarısız oldu',
    fldStrEmptyTitle: 'Henüz demo persona yok',
    fldStrPickerPlaceholder: 'Bir kullanıcı seç',
    fldStrCancel: 'Vazgeç',
  },
  fldObjHome: {
    fldStrChangeProfile: 'Demo Profilini Değiştir',
    fldStrTypeCorporate: 'Kurumsal',
    fldStrTypeIndividual: 'Bireysel',
    fldStrRefresh: 'Yenile',
    fldStrLogoff: 'Çıkış',
  },
  fldObjLibraryList: {
    fldStrBack: 'Geri',
    fldStrLoading: 'Kütüphaneler yükleniyor…',
    fldStrErrorTitle: 'Kütüphaneler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz kütüphane yok',
    fldStrAddLibrary: '+ Kütüphane Ekle',
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
    fldStrSave: 'Kütüphane oluştur',
    fldStrCancel: 'Vazgeç',
    fldStrSaveErrorTitle: 'Kütüphane kaydedilemedi',
  },
  fldObjLibrarySettings: {
    fldStrTitle: 'Kütüphane ayarları',
    fldStrBack: 'Geri',
    fldStrCodeLabel: 'Kod',
    fldStrNameLabel: 'Ad',
    fldStrTypeLabel: 'Tür',
    fldStrTypePlaceholder: 'Tür seçin',
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
    fldStrMembersLabel: 'Öğeler',
    fldStrProductsTitle: 'Öğeler',
    fldStrNoProductsTitle: 'Set dışında öğe yok',
    fldStrPhotosLabel: 'Fotoğraf',
    fldStrNewSet: 'Yeni Set',
    fldStrConvertAll: 'Tümünü sete çevir',
    fldStrSingleItem: 'Tek Öğe',
    fldStrBulkItems: 'Toplu Öğe',
    fldStrAddCollectionFull: '+ Koleksiyon Ekle',
    fldStrAddCollection: '+ Koleksiyon',
    fldStrAddProduct: '+ Öğe Ekle',
    fldStrProductChoiceTitle: 'Öğe ekle',
    fldStrEmptyContent: 'Henüz içerik yok',
    fldStrCancel: 'Vazgeç',
    fldStrExport: "CSV'ye aktar",
    fldStrForSale: 'Satılık',
  },
  fldObjCollectionShortcut: {
    fldStrTitle: 'Yeni koleksiyon',
    fldStrNamePlaceholder: 'Koleksiyon adı',
    fldStrNameRequired: 'Bir koleksiyon adı girin.',
    fldStrSave: 'Koleksiyon oluştur',
    fldStrCancel: 'Vazgeç',
    fldStrSaveErrorTitle: 'Koleksiyon kaydedilemedi',
  },
  fldObjSetDetail: {
    fldStrBack: 'Geri',
    fldStrLoading: 'Öğeler yükleniyor…',
    fldStrErrorTitle: 'Öğeler yüklenemedi',
    fldStrRetry: 'Tekrar Dene',
    fldStrEmptyTitle: 'Henüz öğe yok',
    fldStrPhotosLabel: 'Fotoğraf',
  },
  fldObjSetShortcut: {
    fldStrNamePlaceholder: 'Set adı',
    fldStrNameRequired: 'Bir set adı girin.',
    fldStrSave: 'Set oluştur',
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
    fldStrExtractTitle: 'Öğeleri çıkar',
    fldStrConvertTitle: 'Tümünü sete çevir',
    fldStrNamePlaceholder: 'Set adı',
    fldStrNameRequired: 'Bir set adı girin.',
    fldStrSetsLabel: 'set',
    fldStrProductsLabel: 'öğe',
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
    fldStrProductsLabel: 'öğe',
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
    fldStrBack: 'Geri',
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
    fldStrClose: 'Kapat',
    fldStrCaptureError: 'Fotoğraf çekilemedi',
    fldStrModeError: 'Bilinmeyen çekim kipi',
    fldStrChooseGallery: 'Galeriden seç',
    fldStrAdding: 'Ekleniyor…',
    fldStrDraftTitle: 'Eklenen fotoğraflar',
    fldStrDraftEmpty: 'Henüz fotoğraf yok',
    fldStrIntakeError: 'Fotoğraf eklenemedi',
    fldStrFindNow: 'Şimdi Bul',
    fldStrRotate: 'Döndür',
    fldStrDelete: 'Sil',
    fldStrBack: 'Geri',
    fldStrPreviewTitle: 'Önizleme',
    fldStrPhotosAdded: 'fotoğraf eklendi',
    fldStrPhotoAdded: 'fotoğraf eklendi',
    fldStrClear: 'Temizle',
    fldStrClearTitle: 'Tüm fotoğraflar silinsin mi?',
    fldStrDeletePhotoTitle: 'Fotoğraf silinsin mi?',
    fldStrDeletePhotoSummary: 'Fotoğraf ve sesli notu silinecek.',
    fldStrCancel: 'Vazgeç',
  },
  fldObjVoiceNote: {
    fldStrRecord: 'Not kaydet',
    fldStrRecording: 'Kaydediliyor…',
    fldStrStop: 'Durdur',
    fldStrListen: 'Dinle',
    fldStrPlaying: 'Çalınıyor…',
    fldStrDeleteNote: 'Notu sil',
    fldStrDeleteAudio: 'Ses Sil',
    fldStrDeleteAudioTitle: 'Sesli not silinsin mi?',
    fldStrDeleteAudioSummary: 'Sesli not silinecek. Fotoğraf kalacak.',
    fldStrHasNote: 'Sesli not',
    fldStrMicTitle: 'Mikrofon gerekli',
    fldStrMicMessage: 'Sesli not kaydetmek için mikrofon erişimine izin verin.',
    fldStrMicRequest: 'Mikrofona izin ver',
    fldStrMicBlockedTitle: 'Mikrofon engelli',
    fldStrMicBlockedMessage: 'Mikrofonu uygulama ayarlarından açın.',
    fldStrMicOpenSettings: 'Ayarları aç',
    fldStrVoiceError: 'Sesli not kaydedilemedi',
  },
  fldObjAnalysisFlow: {
    fldStrTitle: 'Analiz',
    fldStrPhotosReady: 'fotoğraf hazır',
    fldStrUploading: 'Yükleniyor…',
    fldStrRunning: 'Analiz ediliyor…',
    fldStrFlowError: 'Analiz başarısız',
    fldStrPreparing: 'Hazırlanıyor…',
    fldStrSearching: 'Aranıyor…',
    fldStrCancel: 'Vazgeç',
    fldStrRetry: 'Yeniden dene',
    fldStrBack: 'Geri',
  },
  fldObjAnalysisResult: {
    fldStrTitle: 'Sonuç',
    fldStrPriceButton: 'Rayiç değeri',
    fldStrTagPrice: 'Etiket fiyatı',
    fldStrListed: 'Satışta',
    fldStrNotListed: 'Satışta değil',
    fldStrNoPhotos: 'Kayıtlı fotoğraf yok',
    fldStrBack: 'Geri',
    fldStrLoadError: 'Öğe yüklenemedi',
    fldStrRetry: 'Yeniden dene',
    fldStrSaveAll: 'Sonuçları kaydet',
    fldStrSaving: 'Kaydediliyor…',
    fldStrSavedProducts: 'öğe kaydedildi',
    fldStrSaveError: 'Kaydedilemedi',
    fldStrOpenSaved: 'Kaydedilen öğeyi aç',
    fldStrResultLabel: 'Sonuç',
    fldStrConfidence: 'Güven',
    fldStrRationale: 'Gerekçe',
    fldStrSingleTitle: 'Sonuç',
    fldStrMultiTitle: 'Sonuçlar',
    fldStrPhotos: 'Fotoğraflar',
    fldStrIdentity: 'Kimlik',
    fldStrCondition: 'Kondisyon',
    fldStrVoice: 'Ses notu',
    fldStrVoiceClaim: 'Kullanıcı beyanı',
    fldStrSourceTitle: 'Kaynak ve güven',
    fldStrPriceTitle: 'Fiyat (USD)',
    fldStrAddToCollection: 'Koleksiyona Ekle',
    fldStrAdd: 'Ekle',
    fldStrAddAsSet: 'Set Olarak Ekle',
    fldStrSetTitle: 'Yeni set',
    fldStrSetPlaceholder: 'Set adı',
    fldStrSetSave: 'Set olarak kaydet',
    fldStrSetCancel: 'Vazgeç',
    fldStrSetBlank: 'Bir set adı girin.',
    fldStrSetError: 'Set kaydedilemedi.',
    fldStrMergedDuplicate: 'Birleştirilmiş kopya',
    fldStrMergedPhotos: 'fotoğraf birleşti',
    fldStrNotAvailable: 'Yok',
    fldStrBasisAi: 'YZ tahmini',
    fldStrBasisObserved: 'Gözlenen piyasa verisi',
    fldStrBasisEstimate: 'Tahmin',
    fldStrNeedsReview: 'İncelemeniz gerekiyor',
    fldStrReviewNoSource: 'Bu öğeyi doğrulayan katalog kaynağı yok',
    fldStrReviewVoiceFailed: 'Bir ses notu çevrilemedi',
    fldStrReviewDuplicateSplit: 'Olası bir kopya ayrı tutuldu',
    fldStrReviewUncertain: 'Düşük güvenli bir birleştirme gözden geçirilmeli',
    fldStrReviewMultiSubject: 'Bir fotoğrafta birden fazla yayın görünüyor',
    fldStrObservationsTitle: 'Fiyat gözlemleri',
    fldStrAiEstimateTitle: 'YZ tahmini (ayrı tutulur)',
    fldStrMarketNew: 'Yeni',
    fldStrMarketUsed: 'İkinci el',
    fldStrObservedOn: 'Gözlem',
  },
  fldObjCodeLabels: {
    fldArrPublicationType: [
      'Kitap',
      'Akademik Dergi',
      'Dergi',
      'Süreli Yayın',
      'Ansiklopedi',
      'Sözlük',
      'Gazete',
      'Bülten',
      'Almanak',
      'Fasikül',
      'Katalog',
      'Tez',
      'Rapor',
      'Broşür',
      'Kitapçık',
      'Bildiriler',
      'Albüm',
      'Atlas',
      'Planlayıcı',
      'Set-içi Set',
    ],
    fldArrPersonRole: [
      'Katkıda Bulunan',
      'Yazar',
      'Hazırlayan',
      'Derleyen',
      'Editör',
      'Önsöz Yazarı',
      'Resimleyen',
      'Fotoğrafçı',
      'Çevirmen',
      'Kapak Sanatçısı',
    ],
    fldArrCover: [
      'Yok',
      'Karton Kapak',
      'Sert Kapak',
      'Gri Mukavva',
      'Esnek Kapak',
      'Bez Ciltli',
      'Deri Ciltli',
      'Spiralli',
      'Smyth Dikişli',
      'Tel Dikişli',
      'Monte',
    ],
    fldArrPaper: [
      'Belirtilmemiş',
      'Premium Ofset',
      'Kitap Baskı Kağıdı',
      'Gazete Kağıdı',
      'Parlak Kuşe',
      'Mat Kuşe',
      'Bristol Karton',
      'Aydınger',
      'Dokulu',
      'BOPP Kaplama',
      'Kraft',
    ],
    fldArrCondition: ['Yeni', 'Kötü', 'Orta', 'İyi', 'Çok İyi', 'Yeni Gibi'],
  },
  fldObjMarketPrice: {
    fldStrTitle: 'Rayiç',
    fldStrResearch: 'Rayiç Araştır',
    fldStrResearching: 'Araştırılıyor…',
    fldStrResearchNote: 'Tahminler model bilgisinden gelir (tahmin dayanağı).',
    fldStrResearchError: 'Rayiç araştırılamadı',
    fldStrEstimatesTitle: 'Tahmin',
    fldStrReplacementNew: 'Yeniye İkame',
    fldStrMarketLow: 'Alt Bant',
    fldStrMarketMedian: 'Medyan',
    fldStrMarketHigh: 'Üst Bant',
    fldStrRecommended: 'Önerilen',
    fldStrBasis: 'Dayanak',
    fldStrBasisEstimate: 'Tahmin',
    fldStrBasisEvidence: 'Kanıt',
    fldStrBasisAiEstimate: 'YZ tahmini',
    fldStrObservationsTitle: 'Gözlemler',
    fldStrNoObservations: 'Gözlem yok',
    fldStrNoEstimates: 'Tahmin yok',
    fldStrMarketNew: 'Yeni',
    fldStrMarketUsed: 'İkinci el',
    fldStrObservedOn: 'Gözlem',
    fldStrBack: 'Geri',
    fldStrLoadError: 'Fiyatlar yüklenemedi',
    fldStrRetry: 'Yeniden dene',
  },
  fldObjBrandHeader: {
    fldStrName: 'Logosphere',
    fldStrSuffix: 'BITS',
  },
  fldObjDemoFooter: {
    fldStrText: 'Demo Version © 2026',
  },
  fldObjSale: {
    fldStrTitle: 'Satış',
    fldStrTagLabel: 'Etiket fiyatı (USD)',
    fldStrTagPlaceholder: '19.99',
    fldStrTagInvalid: 'Geçerli bir etiket fiyatı girin.',
    fldStrActivate: 'Aktifleştir',
    fldStrDeactivate: 'Pasifleştir',
    fldStrCancel: 'Vazgeç',
    fldStrSaving: 'Kaydediliyor…',
    fldStrListedAt: 'Şu fiyatla satışta',
    fldStrDeactivatedKept: 'Satış pasife alındı. Etiket fiyatı saklandı.',
    fldStrScopeNote:
      'Kapsamdaki her öğeye önerilen fiyatı etiket olarak yazılacak.',
    fldStrScopeLine: 'Kapsam',
    fldStrMissingNote: 'öğenin USD önerisi yok, atlanacak',
    fldStrChangedError: 'Liste değişti. Yeniden yükleyip deneyin.',
    fldStrOnSaleBadge: 'SATIŞTA',
    fldStrSaleButton: 'Satış',
    fldStrScopeTitle: 'Satış kapsamı',
    fldStrScopeIntro:
      'Aktivasyon kapsamdaki her öğeyi önerilen USD fiyatıyla etiketler.',
    fldStrScopeTotal: 'Önerilen toplam',
    fldStrSkippedNote: 'Atlandı (USD önerisi yok)',
    fldStrUnitCollections: 'koleksiyon',
    fldStrUnitSets: 'set',
    fldStrUnitProducts: 'öğe',
    fldStrDoneApplied: 'Listeler uygulandı',
    fldStrDoneSkipped: 'atlandı',
    fldStrTotalLabel: 'Önerilen toplam',
    fldStrNotListed: 'Satışta değil',
  },
  fldObjExport: {
    fldStrTitle: 'Dışa aktar',
    fldStrButton: "CSV'ye aktar",
    fldStrWorking: 'Dışa aktarım hazırlanıyor…',
    fldStrDone: 'Dışa aktarım Downloads klasörüne kaydedildi.',
    fldStrEmpty: 'Dışa aktarılacak öğe yok.',
    fldStrFailTitle: 'Dışa aktarım başarısız',
  },
  fldObjCommon: {},
};
