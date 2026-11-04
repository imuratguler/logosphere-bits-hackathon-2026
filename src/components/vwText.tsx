/**
 * Logosphere BITS — themed text primitive (presentational only).
 *
 * Variants: header / body / caption (Lato family) + brand
 * (EB Garamond Medium, never bolded: single-style family)
 * + onAccent (dark label on accent fills) + muted (grey note text)
 * + rowTitle / rowSubtitle (list row texts) + label (field labels).
 * Line heights leave headroom for Turkish/English ascenders and descenders.
 * Accessible font scaling is preserved (no allowFontScaling override).
 * Naming follows D6 (vw / fld roots); `children` is React API and unchanged.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import {
  colTextOnAccent,
  colTextPrimary,
  colTextSecondary,
  fldStrFontFamilyBrand,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

type vwTextProps = {
  fldStrVariant?:
    | 'header'
    | 'body'
    | 'caption'
    | 'brand'
    | 'onAccent'
    | 'muted'
    | 'rowTitle'
    | 'rowSubtitle'
    | 'label';
  fldNumLines?: number;
  fldStrEllipsize?: 'head' | 'middle' | 'tail';
  fldObjStyle?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function vwText({
  fldStrVariant = 'body',
  fldNumLines,
  fldStrEllipsize,
  fldObjStyle,
  children,
}: vwTextProps): React.JSX.Element {
  const fldObjVariantStyle = vwTextVariantStyles[fldStrVariant];
  return (
    <Text
      style={[fldObjVariantStyle, fldObjStyle]}
      numberOfLines={fldNumLines}
      ellipsizeMode={fldStrEllipsize}
    >
      {children}
    </Text>
  );
}

const vwTextStyles = StyleSheet.create({
  fldObjHeader: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 20,
    lineHeight: 28,
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
  fldObjOnAccent: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextOnAccent,
  },
  fldObjMuted: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextSecondary,
  },
  fldObjRowTitle: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextPrimary,
  },
  fldObjRowSubtitle: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 14,
    lineHeight: 20,
    color: colTextSecondary,
  },
  fldObjLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 20,
    color: colTextSecondary,
  },
});

const vwTextVariantStyles = {
  header: vwTextStyles.fldObjHeader,
  body: vwTextStyles.fldObjBody,
  caption: vwTextStyles.fldObjCaption,
  brand: vwTextStyles.fldObjBrand,
  onAccent: vwTextStyles.fldObjOnAccent,
  muted: vwTextStyles.fldObjMuted,
  rowTitle: vwTextStyles.fldObjRowTitle,
  rowSubtitle: vwTextStyles.fldObjRowSubtitle,
  label: vwTextStyles.fldObjLabel,
};
