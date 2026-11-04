/**
 * Logosphere BITS — leading-number display tests.
 *
 * Printer keys collapse to their first integer, ordinal
 * words map to numerals, and numberless text survives.
 */

import { utlStrLeadingNumber } from '../src/utils/utlNumbers';

describe('utlStrLeadingNumber', () => {
  test('takes the first integer from printer keys', () => {
    expect(utlStrLeadingNumber('9 8 7 6 5 4 3 2')).toBe('9');
    expect(utlStrLeadingNumber('  3rd printing')).toBe('3');
  });

  test('maps ordinal words to numerals', () => {
    expect(utlStrLeadingNumber('First Edition')).toBe('1');
    expect(utlStrLeadingNumber('second revised edition')).toBe('2');
  });

  test('keeps numberless text and nulls honest', () => {
    expect(utlStrLeadingNumber('Revised edition')).toBe('Revised edition');
    expect(utlStrLeadingNumber('  ')).toBe(null);
    expect(utlStrLeadingNumber(null)).toBe(null);
  });
});
