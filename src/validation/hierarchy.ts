/**
 * Logosphere BITS — pure hierarchy validation (no DB, no IO).
 *
 * Rules: an account holds only libraries; a library holds only
 * collections; a collection holds either sub-collections or sets/products
 * (never mixed at one level); a set holds only products. Cycles and
 * cross-workspace links are rejected. `product` is the D7 publication
 * counterpart. Nodes with a missing parent are skipped (their link cannot
 * be evaluated); domain models map to nodes at the enforcement step.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

export type fldStrHierarchyKind =
  | 'workspace'
  | 'library'
  | 'collection'
  | 'set'
  | 'product';

export type fldObjHierarchyNode = {
  fldStrId: string;
  fldStrKind: fldStrHierarchyKind;
  fldStrWorkspaceId: string;
  fldStrParentId: string | null;
};

export function vldChgIsParentKindAllowed(
  fldStrChildKind: fldStrHierarchyKind,
  fldStrParentKind: fldStrHierarchyKind | null,
): boolean {
  if (fldStrChildKind === 'workspace') {
    return fldStrParentKind === null;
  }
  if (fldStrChildKind === 'library') {
    return fldStrParentKind === 'workspace';
  }
  if (fldStrChildKind === 'collection') {
    return fldStrParentKind === 'library' || fldStrParentKind === 'collection';
  }
  if (fldStrChildKind === 'set') {
    return fldStrParentKind === 'collection';
  }
  return fldStrParentKind === 'collection' || fldStrParentKind === 'set';
}

export function vldChgIsLevelPure(
  fldArrChildren: fldObjHierarchyNode[],
): boolean {
  const fldBooHasCollection = fldArrChildren.some(
    fldObjChild => fldObjChild.fldStrKind === 'collection',
  );
  const fldBooHasLeaf = fldArrChildren.some(
    fldObjChild =>
      fldObjChild.fldStrKind === 'set' || fldObjChild.fldStrKind === 'product',
  );
  return !(fldBooHasCollection && fldBooHasLeaf);
}

export function vldChgHasCycle(fldArrNodes: fldObjHierarchyNode[]): boolean {
  const fldObjById: Record<string, fldObjHierarchyNode> = {};
  for (const fldObjNode of fldArrNodes) {
    fldObjById[fldObjNode.fldStrId] = fldObjNode;
  }
  for (const fldObjNode of fldArrNodes) {
    const fldObjSeen = new Set<string>();
    let fldStrCurrent: string | null = fldObjNode.fldStrParentId;
    while (fldStrCurrent !== null) {
      if (fldObjSeen.has(fldStrCurrent)) {
        return true;
      }
      fldObjSeen.add(fldStrCurrent);
      const fldObjParent = fldObjById[fldStrCurrent];
      fldStrCurrent = fldObjParent ? fldObjParent.fldStrParentId : null;
    }
  }
  return false;
}

export function vldChgIsWorkspaceConsistent(
  fldArrNodes: fldObjHierarchyNode[],
): boolean {
  const fldObjById: Record<string, fldObjHierarchyNode> = {};
  for (const fldObjNode of fldArrNodes) {
    fldObjById[fldObjNode.fldStrId] = fldObjNode;
  }
  return fldArrNodes.every(fldObjNode => {
    if (fldObjNode.fldStrParentId === null) {
      return true;
    }
    const fldObjParent = fldObjById[fldObjNode.fldStrParentId];
    if (!fldObjParent) {
      return true;
    }
    return fldObjParent.fldStrWorkspaceId === fldObjNode.fldStrWorkspaceId;
  });
}

export function vldChgIsHierarchyValid(
  fldArrNodes: fldObjHierarchyNode[],
): boolean {
  if (vldChgHasCycle(fldArrNodes)) {
    return false;
  }
  if (!vldChgIsWorkspaceConsistent(fldArrNodes)) {
    return false;
  }
  const fldObjById: Record<string, fldObjHierarchyNode> = {};
  for (const fldObjNode of fldArrNodes) {
    fldObjById[fldObjNode.fldStrId] = fldObjNode;
  }
  const fldObjChildrenByParent: Record<string, fldObjHierarchyNode[]> = {};
  for (const fldObjNode of fldArrNodes) {
    if (fldObjNode.fldStrParentId === null) {
      continue;
    }
    const fldObjParent = fldObjById[fldObjNode.fldStrParentId];
    if (!fldObjParent) {
      continue;
    }
    if (
      !vldChgIsParentKindAllowed(fldObjNode.fldStrKind, fldObjParent.fldStrKind)
    ) {
      return false;
    }
    const fldArrGroup = fldObjChildrenByParent[fldObjParent.fldStrId] ?? [];
    fldArrGroup.push(fldObjNode);
    fldObjChildrenByParent[fldObjParent.fldStrId] = fldArrGroup;
  }
  return Object.values(fldObjChildrenByParent).every(vldChgIsLevelPure);
}
