/**
 * Logosphere BITS - shared result detail (analysis review).
 *
 * One component renders every approved product card: a flat
 * stack of label-over-value rows with a blank line between
 * rows, no section headers, and no contract code flags. Each
 * person shows their role as the label with the name below;
 * prices split into labeled bands with a bold Recommended
 * value; edition and printing read as plain numerals. Voice
 * claims stay with the copy; source traces (evidence, basis,
 * confidence, pipeline) stay off the card. The Dewey value is
 * the verified root-to-leaf path as selectable text.
 * Naming follows D6 (vw / fld / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (vwResultDetailExpandable); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { fldObjAppStrings } from '../i18n/intTranslations';
import type {
  fldObjAnalysisBiblio,
  fldObjAnalysisItem,
  fldObjAnalysisSource,
} from '../types/typModels';
import { utlStrCodeLabel } from '../utils/utlCodeLabels';
import { utlStrDeweyPath } from '../utils/utlDewey';
import { utlStrLeadingNumber } from '../utils/utlNumbers';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';
import { vwButton as VwButton } from './vwButton';
import { vwCard as VwCard } from './vwCard';
import { vwText as VwText } from './vwText';

export type vwResultDetailProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjItem: fldObjAnalysisItem;
  fldArrSources: fldObjAnalysisSource[];
};

type fldObjRow = {
  fldStrLabel: string;
  fldStrValue: string | null;
  fldBooBold?: boolean;
  fldBooSelectable?: boolean;
};

function fncConvPriceLine(
  fldNumValue: number | null,
  fldStrCurrency: string,
  fldStrEmpty: string,
): string {
  if (fldNumValue === null) {
    return fldStrEmpty;
  }
  return utlNumFormatMinorPrice(fldNumValue, fldStrCurrency) ?? fldStrEmpty;
}

function fncConvDeweyValue(
  fldObjCopy: fldObjAppStrings['fldObjAnalysisResult'],
  fldObjBiblio: fldObjAnalysisBiblio,
): string {
  if (fldObjBiblio.fldStrDewey === null) {
    return fldObjCopy.fldStrDeweyNone;
  }
  if (!fldObjBiblio.fldBooDeweyVerified) {
    return `${fldObjBiblio.fldStrDewey} · ${fldObjCopy.fldStrDeweyUnverified}`;
  }
  const fldStrPath = utlStrDeweyPath(
    fldObjBiblio.fldArrDeweyPath,
    fldObjBiblio.fldStrDeweyPathBroken === null
      ? null
      : fldObjCopy.fldStrDeweyPathBroken,
  );
  if (fldStrPath !== null) {
    return fldStrPath;
  }
  const fldStrTitle =
    fldObjBiblio.fldStrDeweyTitleEn === null
      ? ''
      : ` · ${fldObjBiblio.fldStrDeweyTitleEn}`;
  return `${fldObjBiblio.fldStrDewey} · ${fldObjCopy.fldStrDeweyVerified}${fldStrTitle}`;
}

export function vwResultDetail(
  fldObjProps: vwResultDetailProps,
): React.JSX.Element {
  const { fldObjStrings, fldObjItem } = fldObjProps;
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const fldObjMarketCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjCodeLabels = fldObjStrings.fldObjCodeLabels;
  const fldObjBiblio = fldObjItem.fldObjBiblio;
  const fldObjPrice = fldObjItem.fldObjPrice;
  const fldStrMissing = fldObjCopy.fldStrNotAvailable;
  const fldNumYear = fldObjBiblio.fldNumPublicationYear;
  const fldNumOriginalYear = fldObjBiblio.fldNumOriginalPublicationYear;
  const fldObjAi = fldObjPrice.fldObjAiEstimate;
  const fldBooAiKnown =
    fldObjAi.fldNumReplacementNew !== null ||
    fldObjAi.fldNumMarketMin !== null ||
    fldObjAi.fldNumMarketMedian !== null ||
    fldObjAi.fldNumMarketMax !== null ||
    fldObjAi.fldNumMarketRecommended !== null;
  const fldBooObserved = fldObjPrice.fldStrBasis === 'observed';
  const fldStrAiValue =
    !fldBooObserved || !fldBooAiKnown
      ? null
      : [
          fncConvPriceLine(
            fldObjAi.fldNumReplacementNew,
            fldObjAi.fldStrCurrency,
            fldStrMissing,
          ),
          fncConvPriceLine(
            fldObjAi.fldNumMarketMin,
            fldObjAi.fldStrCurrency,
            fldStrMissing,
          ),
          fncConvPriceLine(
            fldObjAi.fldNumMarketMedian,
            fldObjAi.fldStrCurrency,
            fldStrMissing,
          ),
          fncConvPriceLine(
            fldObjAi.fldNumMarketMax,
            fldObjAi.fldStrCurrency,
            fldStrMissing,
          ),
          fncConvPriceLine(
            fldObjAi.fldNumMarketRecommended,
            fldObjAi.fldStrCurrency,
            fldStrMissing,
          ),
        ].join(' · ');
  const fldArrRows: fldObjRow[] = [
    { fldStrLabel: 'Title', fldStrValue: fldObjBiblio.fldStrTitle },
    { fldStrLabel: 'Subtitle', fldStrValue: fldObjBiblio.fldStrSubtitle },
    { fldStrLabel: 'Publisher', fldStrValue: fldObjBiblio.fldStrPublisher },
    {
      fldStrLabel: 'Language',
      fldStrValue: fldObjBiblio.fldStrPublicationLanguage,
    },
    {
      fldStrLabel: 'Edition',
      fldStrValue: utlStrLeadingNumber(fldObjBiblio.fldStrEdition),
    },
    {
      fldStrLabel: 'Printing',
      fldStrValue: utlStrLeadingNumber(fldObjBiblio.fldStrPrinting),
    },
    {
      fldStrLabel: 'Edition year',
      fldStrValue: fldNumYear === null ? null : String(fldNumYear),
    },
    {
      fldStrLabel: 'Original year',
      fldStrValue:
        fldNumOriginalYear === null ? null : String(fldNumOriginalYear),
    },
    ...fldObjBiblio.fldArrContributors.map(
      (fldObjPerson): fldObjRow => ({
        fldStrLabel:
          utlStrCodeLabel(
            fldObjCodeLabels.fldArrPersonRole,
            fldObjPerson.fldNumRoleCode,
            fldObjPerson.fldStrRole === '' ? null : fldObjPerson.fldStrRole,
          ) ?? 'Contributor',
        fldStrValue: fldObjPerson.fldStrPerson,
      }),
    ),
    {
      fldStrLabel: 'Publication type',
      fldStrValue: utlStrCodeLabel(
        fldObjCodeLabels.fldArrPublicationType,
        fldObjBiblio.fldNumPublicationTypeCode,
        fldObjBiblio.fldStrPublicationType,
      ),
    },
    {
      fldStrLabel: 'Page count',
      fldStrValue:
        fldObjBiblio.fldNumPageCount === null
          ? null
          : String(fldObjBiblio.fldNumPageCount),
    },
    {
      fldStrLabel: 'Description',
      fldStrValue: fldObjBiblio.fldStrDescription,
    },
    {
      fldStrLabel: 'Description TR',
      fldStrValue: fldObjBiblio.fldStrDescriptionTr,
    },
    {
      fldStrLabel: 'Description EN',
      fldStrValue: fldObjBiblio.fldStrDescriptionEn,
    },
    {
      fldStrLabel: 'Packaging',
      fldStrValue: utlStrCodeLabel(
        fldObjCodeLabels.fldArrPackaging,
        fldObjBiblio.fldNumPackagingCode,
        fldObjBiblio.fldStrPackaging,
      ),
    },
    {
      fldStrLabel: 'Cover',
      fldStrValue: utlStrCodeLabel(
        fldObjCodeLabels.fldArrCover,
        fldObjBiblio.fldNumCoverCode,
        fldObjBiblio.fldStrBinding,
      ),
    },
    {
      fldStrLabel: 'Paper',
      fldStrValue: utlStrCodeLabel(
        fldObjCodeLabels.fldArrPaper,
        fldObjBiblio.fldNumPaperCode,
        fldObjBiblio.fldStrPaper,
      ),
    },
    {
      fldStrLabel: 'Condition',
      fldStrValue: utlStrCodeLabel(
        fldObjCodeLabels.fldArrCondition,
        fldObjBiblio.fldNumConditionCode,
        fldObjBiblio.fldStrCondition,
      ),
    },
    {
      fldStrLabel: 'Dust jacket',
      fldStrValue: fldObjBiblio.fldStrDustJacket,
    },
    {
      fldStrLabel: 'Dimensions',
      fldStrValue: fldObjBiblio.fldStrDimensions,
    },
    {
      fldStrLabel: 'Signature',
      fldStrValue: fldObjBiblio.fldStrSignature,
    },
    {
      fldStrLabel: 'Dedication',
      fldStrValue: fldObjBiblio.fldStrDedication,
    },
    ...fldObjItem.fldArrEvidence
      .map(fldObjRow => fldObjRow.fldStrVoiceText)
      .filter(
        (fldObjText): fldObjText is string =>
          fldObjText !== null && fldObjText !== '',
      )
      .map(
        (fldStrVoice): fldObjRow => ({
          fldStrLabel: fldObjCopy.fldStrVoiceClaim,
          fldStrValue: `"${fldStrVoice}"`,
        }),
      ),
    { fldStrLabel: 'ISBN-10', fldStrValue: fldObjBiblio.fldStrIsbn10 },
    { fldStrLabel: 'ISBN-13', fldStrValue: fldObjBiblio.fldStrIsbn13 },
    {
      fldStrLabel: 'Dewey',
      fldStrValue: fncConvDeweyValue(fldObjCopy, fldObjBiblio),
      fldBooSelectable: true,
    },
    {
      fldStrLabel: 'Rationale',
      fldStrValue: fldObjBiblio.fldStrRationale,
    },
    {
      fldStrLabel: fldObjMarketCopy.fldStrReplacementNew,
      fldStrValue: fncConvPriceLine(
        fldObjPrice.fldNumReplacementNew,
        fldObjPrice.fldStrCurrency,
        fldStrMissing,
      ),
    },
    {
      fldStrLabel: fldObjMarketCopy.fldStrMarketLow,
      fldStrValue: fncConvPriceLine(
        fldObjPrice.fldNumMarketMin,
        fldObjPrice.fldStrCurrency,
        fldStrMissing,
      ),
    },
    {
      fldStrLabel: fldObjMarketCopy.fldStrMarketMedian,
      fldStrValue: fncConvPriceLine(
        fldObjPrice.fldNumMarketMedian,
        fldObjPrice.fldStrCurrency,
        fldStrMissing,
      ),
    },
    {
      fldStrLabel: fldObjMarketCopy.fldStrMarketHigh,
      fldStrValue: fncConvPriceLine(
        fldObjPrice.fldNumMarketMax,
        fldObjPrice.fldStrCurrency,
        fldStrMissing,
      ),
    },
    {
      fldStrLabel: fldObjMarketCopy.fldStrRecommended,
      fldStrValue: fncConvPriceLine(
        fldObjPrice.fldNumMarketRecommended,
        fldObjPrice.fldStrCurrency,
        fldStrMissing,
      ),
      fldBooBold: true,
    },
    {
      fldStrLabel: fldObjCopy.fldStrAiEstimateTitle,
      fldStrValue: fldStrAiValue,
    },
    ...fldObjPrice.fldArrObservations.map((fldObjOb, fldNumAt): fldObjRow => {
      const fldStrSeen =
        utlNumFormatMinorPrice(
          fldObjOb.fldNumAmountMinor,
          fldObjOb.fldStrCurrency,
        ) ?? fldStrMissing;
      const fldStrUsd =
        fldObjOb.fldStrCurrency === 'USD' || fldObjOb.fldNumUsdMinor === null
          ? null
          : utlNumFormatMinorPrice(fldObjOb.fldNumUsdMinor, 'USD');
      const fldStrMarket =
        fldObjOb.fldStrMarket === 'new'
          ? fldObjCopy.fldStrMarketNew
          : fldObjOb.fldStrMarket === 'used'
          ? fldObjCopy.fldStrMarketUsed
          : null;
      const fldStrWhen = fldObjOb.fldStrObservedAt.slice(0, 10);
      return {
        fldStrLabel: `Sighting ${fldNumAt + 1}`,
        fldStrValue: [
          fldStrSeen,
          fldObjOb.fldStrSource,
          fldStrMarket,
          fldStrUsd === null ? null : `→ ${fldStrUsd}`,
          `${fldObjCopy.fldStrObservedOn} ${fldStrWhen}`,
        ]
          .filter((fldObjPart): fldObjPart is string => fldObjPart !== null)
          .join(' · '),
      };
    }),
  ];
  const fldArrPresent = fldArrRows.filter(
    (fldObjRow): fldObjRow is fldObjRow & { fldStrValue: string } =>
      fldObjRow.fldStrValue !== null && fldObjRow.fldStrValue !== '',
  );
  return (
    <VwCard>
      {fldArrPresent.map((fldObjRow, fldNumAt) => (
        <View
          key={`${fldObjRow.fldStrLabel}-${fldNumAt}`}
          style={fldNumAt === 0 ? undefined : vwResultDetailStyles.fldObjGap}
        >
          <VwText fldStrVariant="label">{fldObjRow.fldStrLabel}</VwText>
          <VwText
            fldStrVariant="body"
            fldObjStyle={
              fldObjRow.fldBooBold === true
                ? vwResultDetailStyles.fldObjBold
                : undefined
            }
            fldBooSelectable={fldObjRow.fldBooSelectable === true}
          >
            {fldObjRow.fldStrValue}
          </VwText>
        </View>
      ))}
    </VwCard>
  );
}

export type vwResultDetailExpandableProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjItem: fldObjAnalysisItem;
  fldArrSources: fldObjAnalysisSource[];
};

export function vwResultDetailExpandable(
  fldObjProps: vwResultDetailExpandableProps,
): React.JSX.Element {
  const [fldBooOpen, fncSetOpen] = React.useState(false);
  const fldObjCopy = fldObjProps.fldObjStrings.fldObjAnalysisResult;
  return (
    <View style={vwResultDetailStyles.fldObjGap}>
      <VwButton
        fldStrVariant="outline"
        fldStrLabel={
          fldBooOpen
            ? fldObjCopy.fldStrHideDetails
            : fldObjCopy.fldStrShowDetails
        }
        actHandOnPress={() => fncSetOpen(!fldBooOpen)}
      />
      {fldBooOpen ? (
        <View style={vwResultDetailStyles.fldObjGap}>
          {vwResultDetail({
            fldObjStrings: fldObjProps.fldObjStrings,
            fldObjItem: fldObjProps.fldObjItem,
            fldArrSources: fldObjProps.fldArrSources,
          })}
        </View>
      ) : null}
    </View>
  );
}

const vwResultDetailStyles = StyleSheet.create({
  fldObjGap: {
    marginTop: 12,
  },
  fldObjBold: {
    fontWeight: 'bold',
  },
});
