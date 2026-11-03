/**
 * Logosphere BITS — shared product card (presentational only).
 *
 * Shows one product for list and review screens: cover image (or the
 * caller's empty state when no cover URI is available), title
 * (bibliographic title, record name when unknown), one person/role
 * line per contributor, basic print info (publisher, year, edition —
 * whatever is known), and condition. Missing values render nothing:
 * unknown is never filled with a placeholder. Price and sale render
 * through caller slots in fixed positions below the condition; the
 * card reserves the area but wires no pricing or sale behavior — list
 * and review screens fill the slots when those flows exist. All fixed
 * UI text arrives via props (no built-in strings).
 * Naming follows D6 (fld / vw roots).
 */

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { vwCard as VwCard } from './vwCard';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwText as VwText } from './vwText';
import type { fldObjProduct } from '../types/typModels';
import {
  colAccentBlue,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumSpacingXs,
} from '../utils/utlTheme';

type vwProductCardProps = {
  fldObjProduct: fldObjProduct;
  fldStrCoverUri: string | null;
  fldStrNoCoverTitle: string;
  fldStrNoCoverMessage: string;
  fldObjPriceSlot?: React.ReactNode;
  fldObjSaleSlot?: React.ReactNode;
  fldStrOnSaleBadge?: string;
};

export function vwProductCard({
  fldObjProduct,
  fldStrCoverUri,
  fldStrNoCoverTitle,
  fldStrNoCoverMessage,
  fldObjPriceSlot,
  fldObjSaleSlot,
  fldStrOnSaleBadge,
}: vwProductCardProps): React.JSX.Element {
  const fldObjBiblio = fldObjProduct.fldObjBibliographicData;
  const fldStrTitle = fldObjBiblio.fldStrTitle ?? fldObjProduct.fldStrName;
  const fldArrPrintParts: string[] = [];
  if (fldObjBiblio.fldStrPublisher !== null) {
    fldArrPrintParts.push(fldObjBiblio.fldStrPublisher);
  }
  if (fldObjBiblio.fldNumPublicationYear !== null) {
    fldArrPrintParts.push(String(fldObjBiblio.fldNumPublicationYear));
  }
  if (fldObjBiblio.fldStrEdition !== null) {
    fldArrPrintParts.push(fldObjBiblio.fldStrEdition);
  }
  const fldArrContributors = fldObjBiblio.fldArrContributors ?? [];
  return (
    <VwCard>
      {fldObjProduct.fldObjSaleStatus?.fldBooIsActive === true &&
        fldStrOnSaleBadge !== undefined && (
          <View style={vwProductCardStyles.fldObjSaleBadge}>
            <VwText fldStrVariant="onAccent">{fldStrOnSaleBadge}</VwText>
          </View>
        )}
      {fldStrCoverUri !== null && fldStrCoverUri.trim() !== '' ? (
        <Image
          source={{ uri: fldStrCoverUri }}
          style={vwProductCardStyles.fldObjCover}
          resizeMode="cover"
          accessibilityLabel={fldStrTitle}
          testID="product-cover"
        />
      ) : (
        <VwEmptyState
          fldStrTitle={fldStrNoCoverTitle}
          fldStrMessage={fldStrNoCoverMessage}
        />
      )}
      <View style={vwProductCardStyles.fldObjGap}>
        <VwText fldStrVariant="header">{fldStrTitle}</VwText>
      </View>
      {fldArrContributors.map((fldObjContributor, fldNumIndex) => (
        <VwText
          key={`${fldObjContributor.fldStrPerson}—${fldObjContributor.fldStrRole}-${fldNumIndex}`}
          fldStrVariant="caption"
        >
          {`${fldObjContributor.fldStrPerson} — ${fldObjContributor.fldStrRole}`}
        </VwText>
      ))}
      {fldArrPrintParts.length > 0 && (
        <VwText fldStrVariant="caption">{fldArrPrintParts.join(' · ')}</VwText>
      )}
      {fldObjBiblio.fldStrCondition !== null && (
        <VwText fldStrVariant="caption">{fldObjBiblio.fldStrCondition}</VwText>
      )}
      {fldObjPriceSlot ?? null}
      {fldObjSaleSlot ?? null}
    </VwCard>
  );
}

const vwProductCardStyles = StyleSheet.create({
  fldObjSaleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colAccentBlue,
    borderRadius: fldNumRadiusMd,
    paddingHorizontal: fldNumSpacingSm,
    paddingVertical: fldNumSpacingXs,
    marginBottom: fldNumSpacingSm,
  },
  fldObjCover: {
    width: 120,
    height: 160,
    borderRadius: fldNumRadiusMd,
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
    marginBottom: fldNumSpacingMd,
  },
});
