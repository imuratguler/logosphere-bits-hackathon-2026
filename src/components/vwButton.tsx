/**
 * Logosphere BITS — shared button (presentational only).
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { vwText as VwText } from './vwText';
import {
  colAccentBlue,
  colTextPrimary,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type vwButtonProps = {
  fldStrLabel: string;
  fldBooDisabled?: boolean;
  fldBooLoading?: boolean;
  actHandOnPress: () => void;
};

export function vwButton({
  fldStrLabel,
  fldBooDisabled = false,
  fldBooLoading = false,
  actHandOnPress,
}: vwButtonProps): React.JSX.Element {
  const fldBooInactive = fldBooDisabled || fldBooLoading;
  return (
    <Pressable
      disabled={fldBooInactive}
      onPress={actHandOnPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: fldBooInactive, busy: fldBooLoading }}
      style={[
        vwButtonStyles.fldObjPressable,
        fldBooInactive && vwButtonStyles.fldObjInactive,
      ]}
    >
      {fldBooLoading && (
        <ActivityIndicator
          size="small"
          color={colTextPrimary}
          style={vwButtonStyles.fldObjSpinner}
        />
      )}
      <VwText fldStrVariant="body">{fldStrLabel}</VwText>
    </Pressable>
  );
}

const vwButtonStyles = StyleSheet.create({
  fldObjPressable: {
    backgroundColor: colAccentBlue,
    borderRadius: fldNumRadiusMd,
    paddingVertical: fldNumSpacingMd,
    paddingHorizontal: fldNumSpacingMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fldObjInactive: {
    opacity: 0.5,
  },
  fldObjSpinner: {
    marginRight: fldNumSpacingSm,
  },
});
