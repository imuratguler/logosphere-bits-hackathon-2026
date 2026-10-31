/**
 * Logosphere BITS — pure hierarchy validation (no DB, no IO).
 *
 * Rules: an account holds only libraries; a library holds only
 * collections; a collection holds only sub-collections. Sets and
 * products live in their own tables and attach to one collection
 * (see membership.ts); they are not hierarchy nodes. Cycles and
 * cross-workspace links are rejected. Nodes with a missing parent are
 * skipped (their link cannot be evaluated); domain models map to nodes
 * at the enforcement step.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

export type fldStrHierarchyKind = 'workspace' | 'library' | 'collection';

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
  return fldStrParentKind === 'library' || fldStrParentKind === 'collection';
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

export function vldChgIsCollectionMoveTargetValid(
  fldArrNodes: fldObjHierarchyNode[],
  fldArrMovedIds: string[],
  fldStrTargetId: string,
): boolean {
  const fldObjById: Record<string, fldObjHierarchyNode> = {};
  for (const fldObjNode of fldArrNodes) {
    fldObjById[fldObjNode.fldStrId] = fldObjNode;
  }
  const fldObjTarget = fldObjById[fldStrTargetId];
  if (!fldObjTarget) {
    return false;
  }
  if (!vldChgIsParentKindAllowed('collection', fldObjTarget.fldStrKind)) {
    return false;
  }
  for (const fldStrMovedId of fldArrMovedIds) {
    const fldObjMoved = fldObjById[fldStrMovedId];
    if (!fldObjMoved) {
      continue;
    }
    if (fldObjMoved.fldStrWorkspaceId !== fldObjTarget.fldStrWorkspaceId) {
      return false;
    }
    let fldStrCurrent: string | null = fldStrTargetId;
    const fldObjSeen = new Set<string>();
    while (fldStrCurrent !== null) {
      if (fldStrCurrent === fldStrMovedId) {
        return false;
      }
      if (fldObjSeen.has(fldStrCurrent)) {
        break;
      }
      fldObjSeen.add(fldStrCurrent);
      const fldObjCurrent: fldObjHierarchyNode | undefined =
        fldObjById[fldStrCurrent];
      fldStrCurrent = fldObjCurrent ? fldObjCurrent.fldStrParentId : null;
    }
  }
  return true;
}

export function vldChgIsCollectionMergeTargetValid(
  fldArrNodes: fldObjHierarchyNode[],
  fldArrSourceIds: string[],
  fldStrTargetId: string,
): boolean {
  const fldObjById: Record<string, fldObjHierarchyNode> = {};
  for (const fldObjNode of fldArrNodes) {
    fldObjById[fldObjNode.fldStrId] = fldObjNode;
  }
  const fldObjTarget = fldObjById[fldStrTargetId];
  if (!fldObjTarget || fldObjTarget.fldStrKind !== 'collection') {
    return false;
  }
  for (const fldStrSourceId of fldArrSourceIds) {
    const fldObjSource = fldObjById[fldStrSourceId];
    if (!fldObjSource) {
      continue;
    }
    if (fldObjSource.fldStrWorkspaceId !== fldObjTarget.fldStrWorkspaceId) {
      return false;
    }
    let fldStrCurrent: string | null = fldObjTarget.fldStrParentId;
    const fldObjSeen = new Set<string>();
    while (fldStrCurrent !== null) {
      if (fldStrCurrent === fldStrSourceId) {
        return false;
      }
      if (fldObjSeen.has(fldStrCurrent)) {
        break;
      }
      fldObjSeen.add(fldStrCurrent);
      const fldObjCurrent: fldObjHierarchyNode | undefined =
        fldObjById[fldStrCurrent];
      fldStrCurrent = fldObjCurrent ? fldObjCurrent.fldStrParentId : null;
    }
  }
  return true;
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
  }
  return true;
}
