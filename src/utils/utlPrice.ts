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

export type fldObjPriceStatLabels = {
  fldStrReplacementNew: string;
  fldStrMarketLow: string;
  fldStrMarketMedian: string;
  fldStrMarketHigh: string;
  fldStrRecommended: string;
};

export type fldObjPriceStat = {
  fldStrKey: string;
  fldStrLabel: string;
  fldStrValue: string;
};

type fldObjPriceStatSource = {
  fldNumReplacementNew: number | null;
  fldNumMarketMin: number | null;
  fldNumMarketMax: number | null;
  fldNumMarketMedian: number | null;
  fldNumMarketRecommended: number | null;
  fldStrCurrency: string;
};

/**
 * Builds the display-ready estimate rows (replacement plus
 * the used-market band, median, and recommendation), skipping
 * unknown amounts — nulls never render as zeroes.
 */
export function utlArrPriceStats(
  fldObjPricing: fldObjPriceStatSource | null,
  fldObjLabels: fldObjPriceStatLabels,
): fldObjPriceStat[] {
  if (fldObjPricing === null) {
    return [];
  }
  const fldStrCurrency = fldObjPricing.fldStrCurrency;
  const fldArrCandidates: {
    fldStrKey: string;
    fldStrLabel: string;
    fldNumAmount: number | null;
  }[] = [
    {
      fldStrKey: 'replacementNew',
      fldStrLabel: fldObjLabels.fldStrReplacementNew,
      fldNumAmount: fldObjPricing.fldNumReplacementNew,
    },
    {
      fldStrKey: 'marketLow',
      fldStrLabel: fldObjLabels.fldStrMarketLow,
      fldNumAmount: fldObjPricing.fldNumMarketMin,
    },
    {
      fldStrKey: 'marketMedian',
      fldStrLabel: fldObjLabels.fldStrMarketMedian,
      fldNumAmount: fldObjPricing.fldNumMarketMedian,
    },
    {
      fldStrKey: 'marketHigh',
      fldStrLabel: fldObjLabels.fldStrMarketHigh,
      fldNumAmount: fldObjPricing.fldNumMarketMax,
    },
    {
      fldStrKey: 'recommended',
      fldStrLabel: fldObjLabels.fldStrRecommended,
      fldNumAmount: fldObjPricing.fldNumMarketRecommended,
    },
  ];
  return fldArrCandidates
    .filter(
      (
        fldObjStat,
      ): fldObjStat is {
        fldStrKey: string;
        fldStrLabel: string;
        fldNumAmount: number;
      } => fldObjStat.fldNumAmount !== null,
    )
    .map(fldObjStat => ({
      fldStrKey: fldObjStat.fldStrKey,
      fldStrLabel: fldObjStat.fldStrLabel,
      fldStrValue:
        utlNumFormatMinorPrice(fldObjStat.fldNumAmount, fldStrCurrency) ?? '',
    }));
}
