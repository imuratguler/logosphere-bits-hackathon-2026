/**
 * Logosphere BITS — minor-unit price formatting tests.
 *
 * Pure checks: stored minor amounts render with their own
 * currency code, and null stays null for the caller's own
 * unknown state. No conversion is ever applied.
 */

import { utlNumFormatMinorPrice } from '../src/utils/utlPrice';

describe('minor-unit price formatting', () => {
  it('renders minor amounts with the stored currency', () => {
    expect(utlNumFormatMinorPrice(1999, 'USD')).toBe('19.99 USD');
    expect(utlNumFormatMinorPrice(250, 'EUR')).toBe('2.50 EUR');
  });

  it('keeps null for unknown amounts', () => {
    expect(utlNumFormatMinorPrice(null, 'USD')).toBe(null);
  });
});
