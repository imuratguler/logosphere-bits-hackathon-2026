/**
 * Logosphere BITS — set/product membership (no DB, no IO).
 *
 * Rules: a product attaches to exactly one collection plus optionally
 * one set; the set must belong to the same collection (another
 * collection's set is rejected). A null set means direct-to-collection.
 * Sets attach to exactly one collection and hold only products, so no
 * set-in-set or collection-in-set exists. Unknown sets are skipped
 * (their link cannot be evaluated), matching the hierarchy rule for
 * missing parents.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

export type fldObjSetLink = {
  fldStrSetId: string;
  fldStrCollectionId: string;
};

export type fldObjProductLink = {
  fldStrProductId: string;
  fldStrCollectionId: string;
  fldStrSetId: string | null;
};

export function vldChgIsProductSetMatch(
  fldObjProduct: fldObjProductLink,
  fldArrSets: fldObjSetLink[],
): boolean {
  if (fldObjProduct.fldStrSetId === null) {
    return true;
  }
  const fldObjSet = fldArrSets.find(
    fldObjCandidate =>
      fldObjCandidate.fldStrSetId === fldObjProduct.fldStrSetId,
  );
  if (!fldObjSet) {
    return true;
  }
  return fldObjSet.fldStrCollectionId === fldObjProduct.fldStrCollectionId;
}
