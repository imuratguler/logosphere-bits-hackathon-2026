/**
 * Logosphere BITS — UUID generation tests (pure).
 */

import { fncMakeUuid } from '../src/utils/utlUuid';

const fldObjUuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('fncMakeUuid', () => {
  it('yields valid v4 strings', () => {
    for (let fldNumIndex = 0; fldNumIndex < 25; fldNumIndex += 1) {
      expect(fncMakeUuid()).toMatch(fldObjUuidV4);
    }
  });

  it('yields unique values', () => {
    const fldObjSeen = new Set<string>();
    for (let fldNumIndex = 0; fldNumIndex < 200; fldNumIndex += 1) {
      fldObjSeen.add(fncMakeUuid());
    }
    expect(fldObjSeen.size).toBe(200);
  });
});
