/**
 * Logosphere BITS — set/product membership.
 */

import { vldChgIsProductSetMatch } from '../src/validation/vldMembership';
import type {
  fldObjProductLink,
  fldObjSetLink,
} from '../src/validation/vldMembership';

function fncConvArgsToSetLink(
  fldStrSetId: string,
  fldStrCollectionId: string,
): fldObjSetLink {
  return { fldStrSetId, fldStrCollectionId };
}

function fncConvArgsToProductLink(
  fldStrCollectionId: string,
  fldStrSetId: string | null,
): fldObjProductLink {
  return { fldStrProductId: 'p1', fldStrCollectionId, fldStrSetId };
}

describe('Set/product membership', () => {
  it('accepts direct-to-collection products', () => {
    expect(
      vldChgIsProductSetMatch(fncConvArgsToProductLink('c1', null), [
        fncConvArgsToSetLink('s1', 'c1'),
      ]),
    ).toBe(true);
  });

  it('accepts sets of the same collection', () => {
    expect(
      vldChgIsProductSetMatch(fncConvArgsToProductLink('c1', 's1'), [
        fncConvArgsToSetLink('s1', 'c1'),
        fncConvArgsToSetLink('s2', 'c2'),
      ]),
    ).toBe(true);
  });

  it("rejects another collection's set", () => {
    expect(
      vldChgIsProductSetMatch(fncConvArgsToProductLink('c1', 's2'), [
        fncConvArgsToSetLink('s1', 'c1'),
        fncConvArgsToSetLink('s2', 'c2'),
      ]),
    ).toBe(false);
  });

  it('skips unknown sets', () => {
    expect(
      vldChgIsProductSetMatch(fncConvArgsToProductLink('c1', 'ghost'), [
        fncConvArgsToSetLink('s1', 'c1'),
      ]),
    ).toBe(true);
  });
});
