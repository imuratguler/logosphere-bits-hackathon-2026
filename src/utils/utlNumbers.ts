/**
 * Logosphere BITS — numeric display for edition/printing text.
 *
 * Colophon lines arrive raw ("First Edition", printer keys such as
 * "9 8 7 6 5 4 3 2"): the card shows the leading number only, so
 * edition and printing read as plain numerals. Ordinal words map
 * to their number; otherwise the first integer wins. Text without
 * any number stays untouched instead of disappearing.
 * Naming follows D6 (utl / fld roots).
 */

const fldObjOrdinalWords: Record<string, string> = {
  first: '1',
  second: '2',
  third: '3',
  fourth: '4',
  fifth: '5',
  sixth: '6',
  seventh: '7',
  eighth: '8',
  ninth: '9',
  tenth: '10',
  eleventh: '11',
  twelfth: '12',
};

export function utlStrLeadingNumber(fldStrValue: string | null): string | null {
  if (fldStrValue === null) {
    return null;
  }
  const fldStrText = fldStrValue.trim();
  if (fldStrText === '') {
    return null;
  }
  const fldObjDigits = fldStrText.match(/\d+/);
  if (fldObjDigits !== null) {
    return fldObjDigits[0];
  }
  const fldStrFirstWord = fldStrText.split(/[\s-]+/, 1)[0] ?? '';
  const fldStrOrdinal = fldObjOrdinalWords[fldStrFirstWord.toLowerCase()];
  if (fldStrOrdinal !== undefined) {
    return fldStrOrdinal;
  }
  return fldStrText;
}
