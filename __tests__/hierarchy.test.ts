/**
 * Logosphere BITS — hierarchy validation rules.
 */

import {
  vldChgHasCycle,
  vldChgIsCollectionMergeTargetValid,
  vldChgIsCollectionMoveTargetValid,
  vldChgIsHierarchyValid,
  vldChgIsParentKindAllowed,
  vldChgIsWorkspaceConsistent,
} from '../src/validation/vldHierarchy';
import type { fldObjHierarchyNode } from '../src/validation/vldHierarchy';

function fncConvArgsToNode(
  fldStrId: string,
  fldStrKind: fldObjHierarchyNode['fldStrKind'],
  fldStrParentId: string | null,
  fldStrWorkspaceId: string = 'ws1',
): fldObjHierarchyNode {
  return { fldStrId, fldStrKind, fldStrWorkspaceId, fldStrParentId };
}

describe('hierarchy validation', () => {
  it('allows only the specified parent kinds', () => {
    expect(vldChgIsParentKindAllowed('workspace', null)).toBe(true);
    expect(vldChgIsParentKindAllowed('workspace', 'workspace')).toBe(false);
    expect(vldChgIsParentKindAllowed('library', 'workspace')).toBe(true);
    expect(vldChgIsParentKindAllowed('library', null)).toBe(false);
    expect(vldChgIsParentKindAllowed('library', 'library')).toBe(false);
    expect(vldChgIsParentKindAllowed('collection', 'library')).toBe(true);
    expect(vldChgIsParentKindAllowed('collection', 'collection')).toBe(true);
    expect(vldChgIsParentKindAllowed('collection', 'workspace')).toBe(false);
    expect(vldChgIsParentKindAllowed('library', 'collection')).toBe(false);
  });

  it('detects cycles', () => {
    const fldArrLoop: fldObjHierarchyNode[] = [
      fncConvArgsToNode('a', 'collection', 'c'),
      fncConvArgsToNode('b', 'collection', 'a'),
      fncConvArgsToNode('c', 'collection', 'b'),
    ];
    expect(vldChgHasCycle(fldArrLoop)).toBe(true);
    expect(vldChgHasCycle([fncConvArgsToNode('a', 'collection', 'a')])).toBe(
      true,
    );
    expect(
      vldChgHasCycle([
        fncConvArgsToNode('a', 'collection', null),
        fncConvArgsToNode('b', 'collection', 'a'),
      ]),
    ).toBe(false);
    expect(vldChgHasCycle([])).toBe(false);
    expect(
      vldChgHasCycle([fncConvArgsToNode('a', 'collection', 'ghost')]),
    ).toBe(false);
  });

  it('rejects cross-workspace links', () => {
    expect(
      vldChgIsWorkspaceConsistent([
        fncConvArgsToNode('w1', 'workspace', null, 'w1'),
        fncConvArgsToNode('l1', 'library', 'w1', 'w1'),
      ]),
    ).toBe(true);
    expect(
      vldChgIsWorkspaceConsistent([
        fncConvArgsToNode('w1', 'workspace', null, 'w1'),
        fncConvArgsToNode('l1', 'library', 'w1', 'w2'),
      ]),
    ).toBe(false);
    expect(
      vldChgIsWorkspaceConsistent([
        fncConvArgsToNode('a', 'collection', 'ghost'),
      ]),
    ).toBe(true);
  });

  it('accepts a valid mixed tree', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('w1', 'workspace', null),
      fncConvArgsToNode('l1', 'library', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1'),
      fncConvArgsToNode('c2', 'collection', 'c1'),
      fncConvArgsToNode('c3', 'collection', 'c1'),
    ];
    expect(vldChgIsHierarchyValid(fldArrNodes)).toBe(true);
  });

  it('rejects invalid trees through the composite check', () => {
    const fldArrCrossed: fldObjHierarchyNode[] = [
      fncConvArgsToNode('c1', 'collection', 'l1', 'w1'),
      fncConvArgsToNode('c2', 'collection', 'c1', 'w2'),
    ];
    expect(vldChgIsHierarchyValid(fldArrCrossed)).toBe(false);
    const fldArrLoop: fldObjHierarchyNode[] = [
      fncConvArgsToNode('a', 'collection', 'b'),
      fncConvArgsToNode('b', 'collection', 'a'),
    ];
    expect(vldChgIsHierarchyValid(fldArrLoop)).toBe(false);
    const fldArrWrongParent: fldObjHierarchyNode[] = [
      fncConvArgsToNode('l1', 'library', 'w1'),
      fncConvArgsToNode('l2', 'library', 'l1'),
    ];
    expect(vldChgIsHierarchyValid(fldArrWrongParent)).toBe(false);
  });

  it('accepts libraries and outside collections as move targets', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('w1', 'workspace', null),
      fncConvArgsToNode('l1', 'library', 'w1'),
      fncConvArgsToNode('l2', 'library', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1'),
      fncConvArgsToNode('c2', 'collection', 'c1'),
      fncConvArgsToNode('c3', 'collection', 'l2'),
    ];
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c2'], 'l1')).toBe(
      true,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c2'], 'l2')).toBe(
      true,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c2'], 'c3')).toBe(
      true,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c2'], 'c1')).toBe(
      true,
    );
  });

  it('rejects self, descendants, and wrong-kind move targets', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('w1', 'workspace', null),
      fncConvArgsToNode('l1', 'library', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1'),
      fncConvArgsToNode('c2', 'collection', 'c1'),
      fncConvArgsToNode('c3', 'collection', 'c2'),
    ];
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'c1')).toBe(
      false,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'c2')).toBe(
      false,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'c3')).toBe(
      false,
    );
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'w1')).toBe(
      false,
    );
    expect(
      vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'ghost'),
    ).toBe(false);
  });

  it('guards every moved collection and the workspace edge', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('l1', 'library', 'w1', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1', 'w1'),
      fncConvArgsToNode('c2', 'collection', 'c1', 'w1'),
      fncConvArgsToNode('l9', 'library', 'w9', 'w9'),
    ];
    expect(
      vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1', 'c2'], 'c2'),
    ).toBe(false);
    expect(
      vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1', 'c2'], 'l1'),
    ).toBe(true);
    expect(vldChgIsCollectionMoveTargetValid(fldArrNodes, ['c1'], 'l9')).toBe(
      false,
    );
    expect(
      vldChgIsCollectionMoveTargetValid(fldArrNodes, ['ghost'], 'l1'),
    ).toBe(true);
  });

  it('accepts a selected source or an outside collection as merge target', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('w1', 'workspace', null),
      fncConvArgsToNode('l1', 'library', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1'),
      fncConvArgsToNode('c2', 'collection', 'l1'),
      fncConvArgsToNode('c3', 'collection', 'l1'),
    ];
    expect(
      vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1', 'c2'], 'c1'),
    ).toBe(true);
    expect(
      vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1', 'c2'], 'c3'),
    ).toBe(true);
  });

  it('rejects descendants, libraries, and cross-workspace merge targets', () => {
    const fldArrNodes: fldObjHierarchyNode[] = [
      fncConvArgsToNode('l1', 'library', 'w1', 'w1'),
      fncConvArgsToNode('c1', 'collection', 'l1', 'w1'),
      fncConvArgsToNode('c2', 'collection', 'c1', 'w1'),
      fncConvArgsToNode('l9', 'library', 'w9', 'w9'),
      fncConvArgsToNode('c9', 'collection', 'l9', 'w9'),
    ];
    expect(vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1'], 'c2')).toBe(
      false,
    );
    expect(vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1'], 'l1')).toBe(
      false,
    );
    expect(vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1'], 'c9')).toBe(
      false,
    );
    expect(
      vldChgIsCollectionMergeTargetValid(fldArrNodes, ['c1'], 'ghost'),
    ).toBe(false);
  });
});
