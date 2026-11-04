/**
 * Logosphere BITS — shared product details (presentational only).
 *
 * Shows one product's bibliographic record in meaningful groups for
 * list and review screens: identity (title, subtitle, ISBNs,
 * publisher, years, edition, printing, page count, type, language),
 * contributors (each person paired with their role, never parallel
 * lists), description (original text with its language plus the
 * Turkish and English translations), physical condition (binding,
 * dust jacket, paper, dimensions, condition), signature and
 * dedication, and sources. Groups carry no titles: rows follow
 * each other with section spacing only. Groups with no known
 * values render nothing — unknown is never filled with a
 * placeholder — including sources, which stays hidden until
 * real waterfall evidence is recorded.
 * Nothing renders as raw JSON: objects unfold into labeled rows,
 * and language codes resolve to names (unknown codes ride inside
 * their label, never bare). All fixed UI text arrives via the
 * strings prop (no built-in strings).
 * Naming follows D6 (fld / vw roots).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { vwText as VwText } from './vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjProduct, fldObjSourceEvidence } from '../types/typModels';
import { utlStrCodeLabelWithCode } from '../utils/utlCodeLabels';
import { fldNumSpacingLg, fldNumSpacingSm } from '../utils/utlTheme';

type fldObjDetailStrings = fldObjAppStrings['fldObjProductDetails'];

type vwProductDetailsProps = {
  fldObjProduct: fldObjProduct;
  fldArrSources: fldObjSourceEvidence[];
  fldObjStrings: fldObjDetailStrings;
  fldObjCodeLabels?: fldObjAppStrings['fldObjCodeLabels'];
};

type fldObjDetailRow = {
  fldStrKey: string;
  fldStrLabel: string;
  fldStrValue: string;
};

function fncConvLanguageDisplay(
  fldStrCode: string | null,
  fldObjStrings: fldObjDetailStrings,
): string | null {
  if (fldStrCode === null) {
    return null;
  }
  const fldStrLower = fldStrCode.trim().toLowerCase();
  if (fldStrLower === 'tr') {
    return fldObjStrings.fldStrLanguageTr;
  }
  if (fldStrLower === 'en') {
    return fldObjStrings.fldStrLanguageEn;
  }
  return fldStrCode;
}

function fncConvDetailRows(
  fldArrPairs: [string, string, string | null][],
): fldObjDetailRow[] {
  return fldArrPairs
    .filter(
      (fldObjPair): fldObjPair is [string, string, string] =>
        fldObjPair[2] !== null && fldObjPair[2] !== '',
    )
    .map(([fldStrKey, fldStrLabel, fldStrValue]) => ({
      fldStrKey,
      fldStrLabel,
      fldStrValue,
    }));
}

export function vwProductDetails({
  fldObjProduct,
  fldArrSources,
  fldObjStrings,
  fldObjCodeLabels,
}: vwProductDetailsProps): React.JSX.Element {
  const fldObjBiblio = fldObjProduct.fldObjBibliographicData;
  const fncConvCoded = (
    fldArrLabels: string[] | undefined,
    fldNumCode: number | null | undefined,
    fldStrText: string | null,
  ): string | null => {
    if (fldObjCodeLabels === undefined || fldArrLabels === undefined) {
      return fldStrText;
    }
    return (
      utlStrCodeLabelWithCode(fldArrLabels, fldNumCode ?? null, fldStrText) ??
      fldStrText
    );
  };
  const fldArrIdentityRows = fncConvDetailRows([
    [
      'title',
      fldObjStrings.fldStrTitleLabel,
      fldObjBiblio.fldStrTitle ?? fldObjProduct.fldStrName,
    ],
    [
      'subtitle',
      fldObjStrings.fldStrSubtitleLabel,
      fldObjBiblio.fldStrSubtitle,
    ],
    ['isbn10', fldObjStrings.fldStrIsbn10Label, fldObjBiblio.fldStrIsbn10],
    ['isbn13', fldObjStrings.fldStrIsbn13Label, fldObjBiblio.fldStrIsbn13],
    [
      'dewey',
      fldObjStrings.fldStrDeweyLabel,
      fldObjBiblio.fldStrDewey === null
        ? null
        : fldObjBiblio.fldStrDeweySource === null
        ? fldObjBiblio.fldStrDewey
        : `${fldObjBiblio.fldStrDewey} · ${fldObjBiblio.fldStrDeweySource}`,
    ],
    [
      'publisher',
      fldObjStrings.fldStrPublisherLabel,
      fldObjBiblio.fldStrPublisher,
    ],
    [
      'publicationYear',
      fldObjStrings.fldStrPublicationYearLabel,
      fldObjBiblio.fldNumPublicationYear === null
        ? null
        : String(fldObjBiblio.fldNumPublicationYear),
    ],
    [
      'originalYear',
      fldObjStrings.fldStrOriginalYearLabel,
      fldObjBiblio.fldNumOriginalPublicationYear === null
        ? null
        : String(fldObjBiblio.fldNumOriginalPublicationYear),
    ],
    ['edition', fldObjStrings.fldStrEditionLabel, fldObjBiblio.fldStrEdition],
    [
      'printing',
      fldObjStrings.fldStrPrintingLabel,
      fldObjBiblio.fldStrPrinting,
    ],
    [
      'pageCount',
      fldObjStrings.fldStrPageCountLabel,
      fldObjBiblio.fldNumPageCount === null
        ? null
        : String(fldObjBiblio.fldNumPageCount),
    ],
    [
      'publicationType',
      fldObjStrings.fldStrPublicationTypeLabel,
      fncConvCoded(
        fldObjCodeLabels?.fldArrPublicationType,
        fldObjBiblio.fldNumPublicationTypeCode,
        fldObjBiblio.fldStrPublicationType,
      ),
    ],
    [
      'publicationLanguage',
      fldObjStrings.fldStrPublicationLanguageLabel,
      fncConvLanguageDisplay(
        fldObjBiblio.fldStrPublicationLanguage,
        fldObjStrings,
      ),
    ],
  ]);
  const fldArrContributors = fldObjBiblio.fldArrContributors ?? [];
  const fldObjDescription = fldObjBiblio.fldObjDescription;
  const fldStrOriginalLanguage =
    fldObjDescription === null
      ? null
      : fncConvLanguageDisplay(
          fldObjDescription.fldStrOriginalLanguage,
          fldObjStrings,
        );
  const fldArrDescriptionRows = fncConvDetailRows([
    [
      'originalText',
      fldStrOriginalLanguage === null
        ? fldObjStrings.fldStrOriginalTextLabel
        : `${fldObjStrings.fldStrOriginalTextLabel} (${fldStrOriginalLanguage})`,
      fldObjDescription?.fldStrText ?? null,
    ],
    [
      'translationTr',
      fldObjStrings.fldStrTranslationTrLabel,
      fldObjDescription?.fldStrTextTr ?? null,
    ],
    [
      'translationEn',
      fldObjStrings.fldStrTranslationEnLabel,
      fldObjDescription?.fldStrTextEn ?? null,
    ],
  ]);
  const fldArrPhysicalRows = fncConvDetailRows([
    [
      'binding',
      fldObjStrings.fldStrBindingLabel,
      fncConvCoded(
        fldObjCodeLabels?.fldArrCover,
        fldObjBiblio.fldNumCoverCode,
        fldObjBiblio.fldStrBinding,
      ),
    ],
    [
      'dustJacket',
      fldObjStrings.fldStrDustJacketLabel,
      fldObjBiblio.fldStrDustJacket,
    ],
    [
      'paper',
      fldObjStrings.fldStrPaperLabel,
      fncConvCoded(
        fldObjCodeLabels?.fldArrPaper,
        fldObjBiblio.fldNumPaperCode,
        fldObjBiblio.fldStrPaper,
      ),
    ],
    [
      'dimensions',
      fldObjStrings.fldStrDimensionsLabel,
      fldObjBiblio.fldStrDimensions,
    ],
    [
      'condition',
      fldObjStrings.fldStrConditionLabel,
      fncConvCoded(
        fldObjCodeLabels?.fldArrCondition,
        fldObjBiblio.fldNumConditionCode,
        fldObjBiblio.fldStrCondition,
      ),
    ],
  ]);
  const fldArrSignatureRows = fncConvDetailRows([
    [
      'signature',
      fldObjStrings.fldStrSignatureLabel,
      fldObjBiblio.fldStrSignature,
    ],
    [
      'dedication',
      fldObjStrings.fldStrDedicationLabel,
      fldObjBiblio.fldStrDedication,
    ],
  ]);
  const fncRenderRows = (fldArrRows: fldObjDetailRow[]) =>
    fldArrRows.map(fldObjRow => (
      <View
        key={fldObjRow.fldStrKey}
        style={vwProductDetailsStyles.fldObjField}
      >
        <VwText fldStrVariant="label">{fldObjRow.fldStrLabel}</VwText>
        <VwText fldStrVariant="body">{fldObjRow.fldStrValue}</VwText>
      </View>
    ));
  return (
    <>
      <View>{fncRenderRows(fldArrIdentityRows)}</View>
      {fldArrContributors.length > 0 && (
        <View style={vwProductDetailsStyles.fldObjGroup}>
          {fldArrContributors.map((fldObjContributor, fldNumIndex) => (
            <VwText
              key={`${fldObjContributor.fldStrPerson}—${fldObjContributor.fldStrRole}-${fldNumIndex}`}
              fldStrVariant="caption"
            >
              {`${fldObjContributor.fldStrPerson} — ${
                fncConvCoded(
                  fldObjCodeLabels?.fldArrPersonRole,
                  fldObjContributor.fldNumRoleCode,
                  fldObjContributor.fldStrRole,
                ) ?? fldObjContributor.fldStrRole
              }`}
            </VwText>
          ))}
        </View>
      )}
      {fldArrDescriptionRows.length > 0 && (
        <View style={vwProductDetailsStyles.fldObjGroup}>
          {fncRenderRows(fldArrDescriptionRows)}
        </View>
      )}
      {fldArrPhysicalRows.length > 0 && (
        <View style={vwProductDetailsStyles.fldObjGroup}>
          {fncRenderRows(fldArrPhysicalRows)}
        </View>
      )}
      {fldArrSignatureRows.length > 0 && (
        <View style={vwProductDetailsStyles.fldObjGroup}>
          {fncRenderRows(fldArrSignatureRows)}
        </View>
      )}
      {fldArrSources.length > 0 && (
        <View style={vwProductDetailsStyles.fldObjGroup}>
          {fldArrSources.map((fldObjSource, fldNumIndex) => (
            <View
              key={`${fldObjSource.fldStrName}-${fldNumIndex}`}
              style={vwProductDetailsStyles.fldObjField}
            >
              <VwText fldStrVariant="body">{fldObjSource.fldStrName}</VwText>
              {fldObjSource.fldStrUrl !== null && (
                <VwText fldStrVariant="caption">
                  {fldObjSource.fldStrUrl}
                </VwText>
              )}
              {fncRenderRows(
                fncConvDetailRows([
                  [
                    'accessedAt',
                    fldObjStrings.fldStrAccessedLabel,
                    fldObjSource.fldDatAccessedAt,
                  ],
                  [
                    'field',
                    fldObjStrings.fldStrFieldLabel,
                    fldObjSource.fldStrField,
                  ],
                ]),
              )}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const vwProductDetailsStyles = StyleSheet.create({
  fldObjGroup: {
    marginTop: fldNumSpacingLg,
  },
  fldObjField: {
    marginTop: fldNumSpacingSm,
  },
});
