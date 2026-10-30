/**
 * Logosphere BITS — shared empty state (presentational only).
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { vwText as VwText } from './vwText';
import { fldNumSpacingLg, fldNumSpacingMd } from '../utils/utlTheme';

type vwEmptyStateProps = {
  fldStrTitle: string;
  fldStrMessage?: string;
};

export function vwEmptyState({
  fldStrTitle,
  fldStrMessage,
}: vwEmptyStateProps): React.JSX.Element {
  const fldBooHasMessage = fldStrMessage !== undefined && fldStrMessage !== '';
  return (
    <View style={vwEmptyStateStyles.fldObjContainer}>
      <VwText fldStrVariant="header">{fldStrTitle}</VwText>
      {fldBooHasMessage && (
        <View style={vwEmptyStateStyles.fldObjMessage}>
          <VwText fldStrVariant="body">{fldStrMessage}</VwText>
        </View>
      )}
    </View>
  );
}

const vwEmptyStateStyles = StyleSheet.create({
  fldObjContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: fldNumSpacingLg,
  },
  fldObjMessage: {
    marginTop: fldNumSpacingMd,
  },
});
