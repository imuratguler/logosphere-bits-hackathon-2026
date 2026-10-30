/**
 * Logosphere BITS — themed text primitive (presentational only).
 *
 * Variants: header / body / caption (Lato family) + brand
 * (EB Garamond Medium, never bolded: single-style family).
 * Line heights leave headroom for Turkish/English ascenders and descenders.
 * Accessible font scaling is preserved (no allowFontScaling override).
 * Naming follows D6 (vw / fld roots); `children` is React API and unchanged.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  colTextPrimary,
  colTextSecondary,
  fldStrFontFamilyBrand,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

type vwTextProps = {
  fldStrVariant?: 'header' | 'body' | 'caption' | 'brand';
  children: React.ReactNode;
};

export function vwText({
  fldStrVariant = 'body',
  children,
}: vwTextProps): React.JSX.Element {
  if (fldStrVariant === 'brand') {
    return <Text style={vwTextStyles.fldObjBrand}>{children}</Text>;
  }
  if (fldStrVariant === 'header') {
    return <Text style={vwTextStyles.fldObjHeader}>{children}</Text>;
  }
  if (fldStrVariant === 'caption') {
    return <Text style={vwTextStyles.fldObjCaption}>{children}</Text>;
  }
  return <Text style={vwTextStyles.fldObjBody}>{children}</Text>;
}

const vwTextStyles = StyleSheet.create({
  fldObjHeader: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    color: colTextPrimary,
  },
  fldObjBody: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextPrimary,
  },
  fldObjCaption: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 13,
    lineHeight: 20,
    color: colTextSecondary,
  },
  fldObjBrand: {
    fontFamily: fldStrFontFamilyBrand,
    fontSize: 22,
    lineHeight: 30,
    color: colTextPrimary,
  },
});
