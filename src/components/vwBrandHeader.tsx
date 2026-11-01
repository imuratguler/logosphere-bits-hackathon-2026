/**
 * Logosphere BITS — brand header (presentational only).
 *
 * "Logosphere BITS" in the brand face: the suffix renders as
 * faux small caps (same EB Garamond Medium at a smaller size
 * with letter spacing) nested in the name line, so both parts
 * share one baseline without font-variant support. Never
 * bolded: the brand family has a single style.
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { vwText as VwText } from './vwText';
import { fldStrFontFamilyBrand } from '../utils/utlTheme';

type vwBrandHeaderProps = {
  fldStrName: string;
  fldStrSuffix: string;
};

export function vwBrandHeader({
  fldStrName,
  fldStrSuffix,
}: vwBrandHeaderProps): React.JSX.Element {
  return (
    <VwText fldStrVariant="brand">
      {fldStrName}{' '}
      <Text style={vwBrandHeaderStyles.fldObjSuffix}>{fldStrSuffix}</Text>
    </VwText>
  );
}

const vwBrandHeaderStyles = StyleSheet.create({
  fldObjSuffix: {
    fontFamily: fldStrFontFamilyBrand,
    fontSize: 15,
    letterSpacing: 1.5,
  },
});
