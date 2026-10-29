/**
 * Logosphere BITS — demo configuration pins login, membership, roles,
 * and language selector to hidden.
 */

import { fldObjDemoFlags } from '../src/config/flags';

describe('demo flags', () => {
  it('opens the demo with login, membership, roles, and language selector hidden', () => {
    expect(fldObjDemoFlags.fldBooDemoMode).toBe(true);
    expect(fldObjDemoFlags.fldBooLoginEnabled).toBe(false);
    expect(fldObjDemoFlags.fldBooMembershipEnabled).toBe(false);
    expect(fldObjDemoFlags.fldBooRolesEnabled).toBe(false);
    expect(fldObjDemoFlags.fldBooLanguageSelectorEnabled).toBe(false);
  });
});
