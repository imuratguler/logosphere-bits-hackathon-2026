/**
 * Logosphere BITS — demo footer (presentational only).
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { vwText as VwText } from './vwText';
import { fldNumSpacingMd } from '../utils/utlTheme';

type vwDemoFooterProps = {
  fldStrText: string;
};

export function vwDemoFooter({
  fldStrText,
}: vwDemoFooterProps): React.JSX.Element {
  return (
    <View style={vwDemoFooterStyles.fldObjFooter}>
      <VwText fldStrVariant="caption">{fldStrText}</VwText>
    </View>
  );
}

const vwDemoFooterStyles = StyleSheet.create({
  fldObjFooter: {
    alignItems: 'center',
    paddingVertical: fldNumSpacingMd,
  },
});
