/**
 * Logosphere BITS — minor-unit price formatting.
 *
 * Money rides as minor-unit integers (unknown is null, never
 * zero); this renders one stored amount with its currency code
 * ("19.99 USD"). No conversion happens here: the stored
 * currency is always shown, so a value can never silently
 * change meaning. Null stays null for the caller to render
 * its own unknown state.
 * Naming follows D6 (utlNum root).
 */

export function utlNumFormatMinorPrice(
  fldNumAmountMinor: number | null,
  fldStrCurrency: string,
): string | null {
  if (fldNumAmountMinor === null) {
    return null;
  }
  const fldNumMajor = fldNumAmountMinor / 100;
  return `${fldNumMajor.toFixed(2)} ${fldStrCurrency}`;
}
