/**
 * Logosphere BITS - shared result detail (analysis review).
 *
 * One component renders every approved product card: six
 * titled sections with Field | Value rows (Publication,
 * People, Content, Physical copy, Identifiers &
 * classification, Evidence & price). Empty rows hide;
 * coded fields show "label · code" with the raw AI text
 * as fallback. The expandable wrapper serves the multi
 * list; single results render the detail directly.
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
import { utlNumFormatMinorPrice } from '../utils/utlPrice';
import { utlStrCodeLabelWithCode } from '../utils/utlCodeLabels';
import { vwButton as VwButton } from './vwButton';
import { vwCard as VwCard } from './vwCard';
import { vwText as VwText } from './vwText';

export type vwResultDetailProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjItem: fldObjAnalysisItem;
  fldArrSources: fldObjAnalysisSource[];
};

type fldObjRow = [string, string | null];

function fncConvRowsPresent(fldArrRows: fldObjRow[]): fldObjRow[] {
  return fldArrRows.filter(
    (fldObjRow): fldObjRow is [string, string] =>
      fldObjRow[1] !== null && fldObjRow[1] !== '',
  );
}

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

function fncConvBasisLabel(
  fldObjCopy: fldObjAppStrings['fldObjAnalysisResult'],
  fldStrBasis: string,
): string {
  if (fldStrBasis === 'ai-estimate') {
    return fldObjCopy.fldStrBasisAi;
  }
  if (
    fldStrBasis === 'observed' ||
    fldStrBasis === 'sourced' ||
    fldStrBasis === 'evidence'
  ) {
    return fldObjCopy.fldStrBasisObserved;
  }
  return fldObjCopy.fldStrBasisEstimate;
}

function fncConvDeweyLine(
  fldObjCopy: fldObjAppStrings['fldObjAnalysisResult'],
  fldObjBiblio: fldObjAnalysisBiblio,
): string {
  if (fldObjBiblio.fldStrDewey === null) {
    return fldObjCopy.fldStrDeweyNone;
  }
  if (!fldObjBiblio.fldBooDeweyVerified) {
    const fldStrParent =
      fldObjBiblio.fldStrDeweyParent === null
        ? ''
        : ` · ↑${fldObjBiblio.fldStrDeweyParent}`;
    return `${fldObjBiblio.fldStrDewey} · ${fldObjCopy.fldStrDeweyUnverified}${fldStrParent}`;
  }
  const fldStrTitle =
    fldObjBiblio.fldStrDeweyTitleEn === null
      ? ''
      : ` · ${fldObjBiblio.fldStrDeweyTitleEn}`;
  return `${fldObjBiblio.fldStrDewey} · ${fldObjCopy.fldStrDeweyVerified}${fldStrTitle}`;
}

function fncConvSection(
  fldStrTitle: string,
  fldArrRows: fldObjRow[],
): React.JSX.Element | null {
  const fldArrPresent = fncConvRowsPresent(fldArrRows);
  if (fldArrPresent.length === 0) {
    return null;
  }
  return (
    <View key={fldStrTitle} style={vwResultDetailStyles.fldObjGap}>
      <VwCard>
        <VwText fldStrVariant="label">{fldStrTitle}</VwText>
        {fldArrPresent.map(([fldStrField, fldStrValue], fldNumAt) => (
          <VwText
            key={`${fldStrField}-${fldNumAt}`}
            fldStrVariant="body"
            fldNumLines={3}
            fldStrEllipsize="tail"
          >
            {`${fldStrField} | ${fldStrValue}`}
          </VwText>
        ))}
      </VwCard>
    </View>
  );
}

export function vwResultDetail(
  fldObjProps: vwResultDetailProps,
): React.JSX.Element {
  const { fldObjStrings, fldObjItem, fldArrSources } = fldObjProps;
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const fldObjMarketCopy = fldObjStrings.fldObjMarketPrice;
  const fldObjCodeLabels = fldObjStrings.fldObjCodeLabels;
  const fldObjBiblio = fldObjItem.fldObjBiblio;
  const fldObjPrice = fldObjItem.fldObjPrice;
  const fldStrMissing = fldObjCopy.fldStrNotAvailable;
  const fldNumYear = fldObjBiblio.fldNumPublicationYear;
  const fldNumOriginalYear = fldObjBiblio.fldNumOriginalPublicationYear;
  const fldStrConfidence =
    fldObjBiblio.fldNumConfidence === null
      ? null
      : `${Math.round(fldObjBiblio.fldNumConfidence * 100)}%`;
  const fldObjAi = fldObjPrice.fldObjAiEstimate;
  const fldBooAiKnown =
    fldObjAi.fldNumReplacementNew !== null ||
    fldObjAi.fldNumMarketMin !== null ||
    fldObjAi.fldNumMarketMedian !== null ||
    fldObjAi.fldNumMarketMax !== null ||
    fldObjAi.fldNumMarketRecommended !== null;
  const fldStrPipeline =
    fldArrSources.length === 0
      ? null
      : fldArrSources
          .map(fldObjSource => fldObjSource.fldStrSource)
          .join(' · ');
  const fldArrEvidenceRows: fldObjRow[] = fldObjItem.fldArrEvidence.map(
    fldObjRow => {
      const fldStrVoice = fldObjRow.fldStrVoiceText;
      const fldObjCatalog = fldObjRow.fldObjCatalog;
      const fldStrCatalog =
        fldObjCatalog === null
          ? null
          : [
              fldObjCatalog.fldStrSource,
              fldObjCatalog.fldStrReason,
              fldObjCatalog.fldStrRecordTitle,
            ]
              .filter(
                (fldObjPart): fldObjPart is string =>
                  fldObjPart !== null && fldObjPart !== '',
              )
              .join(' · ');
      const fldStrValue = [fldStrVoice, fldStrCatalog]
        .filter(
          (fldObjPart): fldObjPart is string =>
            fldObjPart !== null && fldObjPart !== '',
        )
        .join(' — ');
      return [
        `Photo ${fldObjRow.fldStrPhotoId.slice(0, 8)}`,
        fldStrValue === '' ? null : fldStrValue,
      ];
    },
  );
  const fldArrPriceRows: fldObjRow[] = (
    [
      [fldObjMarketCopy.fldStrReplacementNew, fldObjPrice.fldNumReplacementNew],
      [fldObjMarketCopy.fldStrMarketLow, fldObjPrice.fldNumMarketMin],
      [fldObjMarketCopy.fldStrMarketMedian, fldObjPrice.fldNumMarketMedian],
      [fldObjMarketCopy.fldStrMarketHigh, fldObjPrice.fldNumMarketMax],
      [fldObjMarketCopy.fldStrRecommended, fldObjPrice.fldNumMarketRecommended],
    ] as [string, number | null][]
  ).map(
    ([fldStrLabel, fldNumValue]): fldObjRow => [
      fldStrLabel,
      fncConvPriceLine(fldNumValue, fldObjPrice.fldStrCurrency, fldStrMissing),
    ],
  );
  const fldObjBasisRow: fldObjRow = [
    fldObjMarketCopy.fldStrBasis,
    fncConvBasisLabel(fldObjCopy, fldObjPrice.fldStrBasis),
  ];
  const fldBooObserved = fldObjPrice.fldStrBasis === 'observed';
  const fldArrAiRows: fldObjRow[] =
    !fldBooObserved || !fldBooAiKnown
      ? []
      : [
          [
            fldObjCopy.fldStrAiEstimateTitle,
            [
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
            ].join(' · '),
          ],
        ];
  const fldArrObservationRows: fldObjRow[] = fldObjPrice.fldArrObservations.map(
    (fldObjOb, fldNumAt) => {
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
      return [
        `Sighting ${fldNumAt + 1}`,
        [
          fldStrSeen,
          fldObjOb.fldStrSource,
          fldStrMarket,
          fldStrUsd === null ? null : `→ ${fldStrUsd}`,
          `${fldObjCopy.fldStrObservedOn} ${fldStrWhen}`,
        ]
          .filter((fldObjPart): fldObjPart is string => fldObjPart !== null)
          .join(' · '),
      ];
    },
  );
  return (
    <>
      {fncConvSection(fldObjCopy.fldStrSectionPublication, [
        ['Title', fldObjBiblio.fldStrTitle],
        ['Subtitle', fldObjBiblio.fldStrSubtitle],
        ['Publisher', fldObjBiblio.fldStrPublisher],
        ['Language', fldObjBiblio.fldStrPublicationLanguage],
        ['Edition', fldObjBiblio.fldStrEdition],
        ['Printing', fldObjBiblio.fldStrPrinting],
        ['Edition year', fldNumYear === null ? null : String(fldNumYear)],
        [
          'Original year',
          fldNumOriginalYear === null ? null : String(fldNumOriginalYear),
        ],
      ])}
      {fncConvSection(
        fldObjCopy.fldStrSectionPeople,
        fldObjBiblio.fldArrContributors.map(fldObjPerson => [
          fldObjPerson.fldStrPerson,
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrPersonRole,
            fldObjPerson.fldNumRoleCode,
            fldObjPerson.fldStrRole === '' ? null : fldObjPerson.fldStrRole,
          ) ?? fldObjCopy.fldStrUnknown,
        ]),
      )}
      {fncConvSection(fldObjCopy.fldStrSectionContent, [
        [
          'Publication type',
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrPublicationType,
            fldObjBiblio.fldNumPublicationTypeCode,
            fldObjBiblio.fldStrPublicationType,
          ),
        ],
        [
          'Page count',
          fldObjBiblio.fldNumPageCount === null
            ? null
            : String(fldObjBiblio.fldNumPageCount),
        ],
        ['Description', fldObjBiblio.fldStrDescription],
        ['Description TR', fldObjBiblio.fldStrDescriptionTr],
        ['Description EN', fldObjBiblio.fldStrDescriptionEn],
      ])}
      {fncConvSection(fldObjCopy.fldStrSectionPhysical, [
        [
          'Packaging',
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrPackaging,
            fldObjBiblio.fldNumPackagingCode,
            fldObjBiblio.fldStrPackaging,
          ),
        ],
        [
          'Cover',
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrCover,
            fldObjBiblio.fldNumCoverCode,
            fldObjBiblio.fldStrBinding,
          ),
        ],
        [
          'Paper',
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrPaper,
            fldObjBiblio.fldNumPaperCode,
            fldObjBiblio.fldStrPaper,
          ),
        ],
        [
          'Condition',
          utlStrCodeLabelWithCode(
            fldObjCodeLabels.fldArrCondition,
            fldObjBiblio.fldNumConditionCode,
            fldObjBiblio.fldStrCondition,
          ),
        ],
        ['Dust jacket', fldObjBiblio.fldStrDustJacket],
        ['Dimensions', fldObjBiblio.fldStrDimensions],
        ['Signature', fldObjBiblio.fldStrSignature],
        ['Dedication', fldObjBiblio.fldStrDedication],
        ...fldObjItem.fldArrEvidence
          .map(fldObjRow => fldObjRow.fldStrVoiceText)
          .filter(
            (fldObjText): fldObjText is string =>
              fldObjText !== null && fldObjText !== '',
          )
          .map(
            (fldStrVoice): fldObjRow => [
              fldObjCopy.fldStrVoiceClaim,
              `"${fldStrVoice}"`,
            ],
          ),
      ])}
      {fncConvSection(fldObjCopy.fldStrSectionIdentifiers, [
        ['ISBN-10', fldObjBiblio.fldStrIsbn10],
        ['ISBN-13', fldObjBiblio.fldStrIsbn13],
        ['Dewey', fncConvDeweyLine(fldObjCopy, fldObjBiblio)],
      ])}
      {fncConvSection(fldObjCopy.fldStrSectionEvidencePrice, [
        ...fldArrEvidenceRows,
        ['Confidence', fldStrConfidence],
        ['Rationale', fldObjBiblio.fldStrRationale],
        ['Pipeline', fldStrPipeline],
        ...fldArrPriceRows,
        fldObjBasisRow,
        ...fldArrAiRows,
        ...fldArrObservationRows,
      ])}
    </>
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
});
