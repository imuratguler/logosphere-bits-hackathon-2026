/**
 * Logosphere BITS — contract code label tests.
 *
 * Zero is a valid code; missing or out-of-range codes fall
 * back to the raw AI text (or null when there is none).
 */

import { utlStrCodeLabel } from '../src/utils/utlCodeLabels';

const FLD_ARR_CONDITION = [
  'New',
  'Poor',
  'Fair',
  'Good',
  'Very Good',
  'Like New',
];

describe('utlStrCodeLabel', () => {
  test('resolves codes including zero', () => {
    expect(utlStrCodeLabel(FLD_ARR_CONDITION, 0, 'Brand new')).toBe('New');
    expect(utlStrCodeLabel(FLD_ARR_CONDITION, 5, null)).toBe('Like New');
  });

  test('falls back when the code is missing or out of range', () => {
    expect(utlStrCodeLabel(FLD_ARR_CONDITION, null, 'worn cover')).toBe(
      'worn cover',
    );
    expect(utlStrCodeLabel(FLD_ARR_CONDITION, 9, 'worn cover')).toBe(
      'worn cover',
    );
    expect(utlStrCodeLabel(FLD_ARR_CONDITION, -1, null)).toBe(null);
  });
});
