/**
 * Logosphere BITS — capture entry validation tests (pure, no mocks).
 */

import { vldChgIsCaptureMode } from '../src/validation/vldCapture';

describe('capture mode vocabulary', () => {
  it('accepts the two D10 modes', () => {
    expect(vldChgIsCaptureMode('single')).toBe(true);
    expect(vldChgIsCaptureMode('bulk')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(vldChgIsCaptureMode('')).toBe(false);
    expect(vldChgIsCaptureMode('auto')).toBe(false);
    expect(vldChgIsCaptureMode('Single')).toBe(false);
    expect(vldChgIsCaptureMode('single ')).toBe(false);
  });
});
