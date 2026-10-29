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
 * distinct (F5 unrecognized-image flow). Collection/set links arrive
 * with the sets step (D7).
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
};

export type fldObjCollection = fldObjModelBase & {
  fldStrLibraryId: string;
  fldStrParentCollectionId: string | null;
  fldNumSortOrder: number;
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
};

export type fldObjProduct = fldObjModelBase & {
  fldObjBibliographicData: fldObjBibliographicData;
};
