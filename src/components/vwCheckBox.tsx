/**
 * Logosphere BITS — shared checkbox mark (presentational only).
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { vwText as VwText } from './vwText';
import {
  colAccentBlue,
  colTextSecondary,
  fldNumRadiusSm,
  fldNumSpacingXs,
} from '../utils/utlTheme';

type vwCheckBoxProps = {
  fldBooChecked: boolean;
};

export function vwCheckBox({
  fldBooChecked,
}: vwCheckBoxProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="checkbox"
      accessibilityState={{ checked: fldBooChecked }}
      style={[
        vwCheckBoxStyles.fldObjBox,
        fldBooChecked && vwCheckBoxStyles.fldObjChecked,
      ]}
    >
      {fldBooChecked && <VwText fldStrVariant="body">{'\u2713'}</VwText>}
    </View>
  );
}

const vwCheckBoxStyles = StyleSheet.create({
  fldObjBox: {
    width: 22,
    height: 22,
    borderRadius: fldNumRadiusSm,
    borderWidth: 2,
    borderColor: colTextSecondary,
    marginRight: fldNumSpacingXs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjChecked: {
    backgroundColor: colAccentBlue,
    borderColor: colAccentBlue,
  },
});
