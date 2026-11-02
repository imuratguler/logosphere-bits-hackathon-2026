/**
 * Logosphere BITS — themed text primitive (presentational only).
 *
 * Variants: header / body / caption (Lato family) + brand
 * (EB Garamond Medium, never bolded: single-style family)
 * + onAccent (dark label on accent fills) + muted (grey note text)
 * + rowTitle / rowSubtitle (list row texts).
 * Line heights leave headroom for Turkish/English ascenders and descenders.
 * Accessible font scaling is preserved (no allowFontScaling override).
 * Naming follows D6 (vw / fld roots); `children` is React API and unchanged.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
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
    | 'rowSubtitle';
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
  if (fldStrVariant === 'onAccent') {
    return <Text style={vwTextStyles.fldObjOnAccent}>{children}</Text>;
  }
  if (fldStrVariant === 'muted') {
    return <Text style={vwTextStyles.fldObjMuted}>{children}</Text>;
  }
  if (fldStrVariant === 'rowTitle') {
    return <Text style={vwTextStyles.fldObjRowTitle}>{children}</Text>;
  }
  if (fldStrVariant === 'rowSubtitle') {
    return <Text style={vwTextStyles.fldObjRowSubtitle}>{children}</Text>;
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
  fldObjOnAccent: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextOnAccent,
  },
  fldObjMuted: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 20,
    lineHeight: 28,
    color: colTextSecondary,
  },
  fldObjRowTitle: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 20,
    lineHeight: 28,
    color: colTextPrimary,
  },
  fldObjRowSubtitle: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 14,
    lineHeight: 20,
    color: colTextSecondary,
  },
});
