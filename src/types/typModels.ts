/**
 * Logosphere BITS — domain models: workspace, library, collection.
 *
 * Workspace is the account scope (root); library is the library within a
 * workspace; collection is a (possibly nested) collection within a library.
 * Identity is a string id (UUID in transport); time fields are ISO 8601
 * strings (Supabase transport form); ordering is a plain number, lower
 * first. Names ride on every level (F2 renames collections). No
 * soft-delete flag: archive-vs-delete is undecided (SCOPE F1).
 * Screens, hooks, and the database client arrive in their own steps.
 * Product carries bibliographic data as a nested object; every
 * bibliographic field is nullable and unknown is always null (never an
 * empty string, a placeholder word, or zero). Missing data is never
 * filled with fabricated values. Record name and canonical title are
 * distinct (F5 unrecognized-image flow). Collection/set links ride
 * on the product (D7 table step): one collection plus an optional set
 * of the same collection.
 * Contributors pair person with role in one record (never parallel
 * arrays); null means unknown, an empty array means verified none.
 * Description keeps the original text plus its language; TR/EN slots
 * hold only genuine translations (null otherwise). Open vocabularies
 * (publication type, condition scale) stay free strings.
 * Draft images and voice notes are file-backed media records outside
 * fldObjModelBase (identity is a fixed UUID, currency is a version).
 * The image links its single current voice note by nesting, never by
 * array index, so reordering cannot break the link. Re-recording
 * invalidates transcription by bumping the version and moving status
 * to stale; the transition behavior arrives in its own step.
 * Pipeline runs track nine ordered stages with per-stage versioned
 * results; history is appended, never overwritten. Run states keep
 * retryable and permanent failures distinct from cancellation.
 * Modes separate single-product and multi-product runs.
 * Pricing groups five minor-unit amounts (unknown is null, never zero)
 * under one base currency (USD by default). Source price, its currency,
 * the rate date, and the estimate/evidence basis preserve the
 * conversion audit trail. The group is reusable for set totals (D7).
 * Sale status pairs the user's tag price with listing state (active
 * flag, transaction scope, time, and id); the AI suggestion lives in
 * pricing as the recommended market value (F8). Sets price and list
 * like products and collections; a set total is its own concept,
 * independent of member unit prices.
 * Library details split required from later-fillable: code and name
 * are required at creation; type, founding date, address, and website
 * start null and fill in later. Collection details keep name required
 * and add a forming date, five physical-location parts (hall/room,
 * cabinet face, block, row, shelf), and a website, all null until
 * filled. Shortcut creation never requires the detailed address: a
 * library shortcut needs only code and name. Detail dates are ISO 8601
 * calendar dates; location parts stay free strings (they can be
 * alphanumeric); presence means non-blank text, blank counts as missing.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld roots).
 */

export type fldObjModelBase = {
  fldStrId: string;
  fldStrName: string;
  fldDatCreatedAt: string;
  fldDatUpdatedAt: string;
};

export type fldObjWorkspace = fldObjModelBase;

export type fldObjLibrary = fldObjModelBase & {
  fldStrWorkspaceId: string;
  fldNumSortOrder: number;
  fldStrCode: string;
  fldStrLibraryType: string | null;
  fldDatFoundedDate: string | null;
  fldStrAddress: string | null;
  fldStrWebsite: string | null;
};

// Demo quick-create shortcut vocabulary: the only library types the
// shortcut offers. Values stay English identifiers; screens map them
// to i18n labels. Single source for validation, service, and UI.
export const fldArrLibraryShortcutTypes = [
  'Branch',
  'Department',
  'Hall',
] as const;

export type fldStrLibraryShortcutType =
  (typeof fldArrLibraryShortcutTypes)[number];

// Geo reference hierarchy: country down to street, top-down order.
// Single source for the geo service and the settings cascade.
export const fldArrGeoLevels = [
  'country',
  'state',
  'city',
  'district',
  'town',
  'neighborhood',
  'street',
] as const;

export type fldStrGeoLevel = (typeof fldArrGeoLevels)[number];

export type fldObjCollection = fldObjModelBase & {
  fldStrLibraryId: string;
  fldStrParentCollectionId: string | null;
  fldNumSortOrder: number;
  fldObjPricing: fldObjPricing | null;
  fldObjSaleStatus: fldObjSaleStatus | null;
  fldDatFormedDate: string | null;
  fldStrHallRoom: string | null;
  fldStrCabinetFace: string | null;
  fldStrBlock: string | null;
  fldStrRow: string | null;
  fldStrShelf: string | null;
  fldStrWebsite: string | null;
};

export type fldObjContributor = {
  fldStrPerson: string;
  fldStrRole: string;
};

export type fldObjDescription = {
  fldStrText: string;
  fldStrOriginalLanguage: string;
  fldStrTextTr: string | null;
  fldStrTextEn: string | null;
};

export type fldObjBibliographicData = {
  fldStrTitle: string | null;
  fldStrSubtitle: string | null;
  fldStrIsbn10: string | null;
  fldStrIsbn13: string | null;
  fldStrPublisher: string | null;
  fldStrPublicationLanguage: string | null;
  fldStrEdition: string | null;
  fldStrPrinting: string | null;
  fldNumPublicationYear: number | null;
  fldArrContributors: fldObjContributor[] | null;
  fldNumOriginalPublicationYear: number | null;
  fldNumPageCount: number | null;
  fldStrPublicationType: string | null;
  fldObjDescription: fldObjDescription | null;
  fldStrBinding: string | null;
  fldStrDustJacket: string | null;
  fldStrPaper: string | null;
  fldStrDimensions: string | null;
  fldStrCondition: string | null;
  fldStrSignature: string | null;
  fldStrDedication: string | null;
};

export type fldObjProduct = fldObjModelBase & {
  fldStrCollectionId: string;
  fldStrSetId: string | null;
  fldObjBibliographicData: fldObjBibliographicData;
  fldObjPricing: fldObjPricing | null;
  fldObjSaleStatus: fldObjSaleStatus | null;
};

export type fldStrPriceBasis = 'estimate' | 'evidence';

export const fldStrDefaultCurrency = 'USD';

export type fldObjPricing = {
  fldNumReplacementNew: number | null;
  fldNumMarketMin: number | null;
  fldNumMarketMax: number | null;
  fldNumMarketRecommended: number | null;
  fldNumMarketMedian: number | null;
  fldStrCurrency: string;
  fldNumSourcePrice: number | null;
  fldStrSourceCurrency: string | null;
  fldDatRateDate: string | null;
  fldStrPriceBasis: fldStrPriceBasis | null;
};

export type fldStrTranscriptionStatus =
  | 'none'
  | 'pending'
  | 'ready'
  | 'stale'
  | 'failed';

export type fldObjVoiceNote = {
  fldStrId: string;
  fldNumVersion: number;
  fldStrFilePath: string;
  fldStrMimeType: string;
  fldNumDurationSec: number | null;
  fldStrTranscriptionStatus: fldStrTranscriptionStatus;
};

export type fldObjDraftImage = {
  fldStrId: string;
  fldNumSortOrder: number;
  fldStrLocalPath: string;
  fldNumRotationDegrees: number;
  fldObjVoiceNote: fldObjVoiceNote | null;
};

export type fldStrPipelineStage =
  | 'draft'
  | 'upload'
  | 'transcribe'
  | 'preRead'
  | 'catalog'
  | 'finalDiagnose'
  | 'price'
  | 'merge'
  | 'review';

export type fldStrRunStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failedRetryable'
  | 'failedPermanent'
  | 'cancelled';

export type fldStrPipelineMode = 'singleProduct' | 'multiProduct';

export type fldObjStageResult = {
  fldStrStage: fldStrPipelineStage;
  fldNumVersion: number;
  fldStrStatus: fldStrRunStatus;
};

export type fldObjPipelineRun = {
  fldStrId: string;
  fldStrMode: fldStrPipelineMode;
  fldStrStatus: fldStrRunStatus;
  fldArrStageResults: fldObjStageResult[];
};

export type fldObjSaleStatus = {
  fldNumTagPrice: number | null;
  fldBooIsActive: boolean;
  fldStrTransactionScope: string | null;
  fldDatTransactionAt: string | null;
  fldStrTransactionId: string | null;
};

export type fldObjSet = fldObjModelBase & {
  fldStrCollectionId: string;
  fldObjPricing: fldObjPricing | null;
  fldObjSaleStatus: fldObjSaleStatus | null;
};

// Source evidence: the real catalog or record proofs a bibliographic
// claim relies on (source name, optional link, access time, and the
// supported field as display text). Recorded evidence arrives with a
// later step (pipeline waterfall results); until then lists stay
// empty and the detail shows its no-sources note instead of
// fabricating entries. ISBNs, publishers, collection links, and
// price observations are never passed off as sources.
export type fldObjSourceEvidence = {
  fldStrName: string;
  fldStrUrl: string | null;
  fldDatAccessedAt: string | null;
  fldStrField: string | null;
};
