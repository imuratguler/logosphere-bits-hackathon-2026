/**
 * Logosphere BITS — hierarchy validation rules.
 */

import {
  vldChgHasCycle,
  vldChgIsHierarchyValid,
  vldChgIsParentKindAllowed,
  vldChgIsWorkspaceConsistent,
} from '../src/validation/hierarchy';
import type { fldObjHierarchyNode } from '../src/validation/hierarchy';

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
});
