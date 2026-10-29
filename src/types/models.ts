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
