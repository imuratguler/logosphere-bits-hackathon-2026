/**
 * Logosphere BITS — shared loading indicator (presentational only).
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { vwText as VwText } from './vwText';
import {
  colAccentBlue,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/theme';

type vwLoadingProps = {
  fldStrMessage?: string;
};

export function vwLoading({
  fldStrMessage,
}: vwLoadingProps): React.JSX.Element {
  const fldBooHasMessage = fldStrMessage !== undefined && fldStrMessage !== '';
  return (
    <View style={vwLoadingStyles.fldObjContainer}>
      <ActivityIndicator size="large" color={colAccentBlue} />
      {fldBooHasMessage && (
        <View style={vwLoadingStyles.fldObjMessage}>
          <VwText fldStrVariant="caption">{fldStrMessage}</VwText>
        </View>
      )}
    </View>
  );
}

const vwLoadingStyles = StyleSheet.create({
  fldObjContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: fldNumSpacingMd,
  },
  fldObjMessage: {
    marginTop: fldNumSpacingSm,
  },
});
