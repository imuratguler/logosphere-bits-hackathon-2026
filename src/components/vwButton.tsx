/**
 * Logosphere BITS — shared button (presentational only).
 *
 * Variants: primary (one emphasized action per screen), secondary
 * (surface block for supporting actions), text (borderless accent
 * line for dismissals and navigation). All variants keep a 48dp
 * minimum touch height.
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { vwText as VwText } from './vwText';
import {
  colAccentBlue,
  colSurface,
  colTextPrimary,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumTouchTarget,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

export type fldStrButtonVariant = 'primary' | 'secondary' | 'text';

type vwButtonProps = {
  fldStrLabel: string;
  fldStrVariant?: fldStrButtonVariant;
  fldBooDisabled?: boolean;
  fldBooLoading?: boolean;
  actHandOnPress: () => void;
};

export function vwButton({
  fldStrLabel,
  fldStrVariant = 'primary',
  fldBooDisabled = false,
  fldBooLoading = false,
  actHandOnPress,
}: vwButtonProps): React.JSX.Element {
  const fldBooInactive = fldBooDisabled || fldBooLoading;
  const fldBooText = fldStrVariant === 'text';
  return (
    <Pressable
      disabled={fldBooInactive}
      onPress={actHandOnPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: fldBooInactive, busy: fldBooLoading }}
      style={[
        vwButtonStyles.fldObjPressable,
        fldStrVariant === 'secondary' && vwButtonStyles.fldObjSecondary,
        fldBooText && vwButtonStyles.fldObjText,
        fldBooInactive && vwButtonStyles.fldObjInactive,
      ]}
    >
      {fldBooLoading && (
        <ActivityIndicator
          size="small"
          color={fldBooText ? colAccentBlue : colTextPrimary}
          style={vwButtonStyles.fldObjSpinner}
        />
      )}
      {fldBooText ? (
        <Text style={vwButtonStyles.fldObjTextLabel}>{fldStrLabel}</Text>
      ) : (
        <VwText fldStrVariant="body">{fldStrLabel}</VwText>
      )}
    </Pressable>
  );
}

const vwButtonStyles = StyleSheet.create({
  fldObjPressable: {
    backgroundColor: colAccentBlue,
    borderRadius: fldNumRadiusMd,
    paddingVertical: fldNumSpacingMd,
    paddingHorizontal: fldNumSpacingMd,
    minHeight: fldNumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fldObjSecondary: {
    backgroundColor: colSurface,
    paddingVertical: fldNumSpacingSm,
  },
  fldObjText: {
    backgroundColor: 'transparent',
    paddingVertical: fldNumSpacingSm,
    paddingHorizontal: fldNumSpacingSm,
  },
  fldObjTextLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colAccentBlue,
  },
  fldObjInactive: {
    opacity: 0.5,
  },
  fldObjSpinner: {
    marginRight: fldNumSpacingSm,
  },
});
