/**
 * Logosphere BITS — contract code labels for the result screens.
 *
 * Section 03 keeps coded fields as numbers from the server; the
 * screens render the localized dictionary label for the code and
 * fall back to the raw AI text when the code is missing or out
 * of range. Zero is a valid code and is never dropped.
 * Naming follows D6 (utl / fld / fnc roots).
 */

/**
 * Resolve one contract code to its localized label.
 *
 * @param fldArrLabels Localized labels indexed by code.
 * @param fldNumCode Contract code (0 is valid) or null.
 * @param fldStrFallback Raw AI text shown when no label fits.
 * @returns The dictionary label, or the fallback text.
 */
export function utlStrCodeLabel(
  fldArrLabels: string[],
  fldNumCode: number | null,
  fldStrFallback: string | null,
): string | null {
  if (
    fldNumCode !== null &&
    Number.isInteger(fldNumCode) &&
    fldNumCode >= 0 &&
    fldNumCode < fldArrLabels.length
  ) {
    const fldStrLabel = fldArrLabels[fldNumCode];
    if (fldStrLabel !== undefined && fldStrLabel !== '') {
      return fldStrLabel;
    }
  }
  return fldStrFallback;
}

/**
 * Resolve one contract code to "label · code" for the card.
 * A missing code falls back to the raw AI text; nothing
 * renders when both are missing.
 */
export function utlStrCodeLabelWithCode(
  fldArrLabels: string[],
  fldNumCode: number | null,
  fldStrFallback: string | null,
): string | null {
  const fldStrLabel = utlStrCodeLabel(fldArrLabels, fldNumCode, null);
  if (fldStrLabel !== null && fldNumCode !== null) {
    return `${fldStrLabel} · ${fldNumCode}`;
  }
  return fldStrFallback;
}
