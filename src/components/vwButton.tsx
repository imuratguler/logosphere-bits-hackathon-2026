/**
 * Logosphere BITS — shared button (presentational only).
 *
 * Variants: primary (one emphasized action per screen, dark label
 * on the accent fill), secondary (surface block for supporting
 * actions), text (borderless accent line for dismissals and
 * navigation), outline (accent-bordered block pairing a primary
 * action), pill (compact accent capsule for viewfinder overlays).
 * All variants keep a 48dp minimum touch height.
 * Block labels run in the UI bold face at 16sp, line labels
 * in the bold face at 16sp.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import {
  colAccentBlue,
  colSurface,
  colTextOnAccent,
  colTextPrimary,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumSpacingXl,
  fldNumTouchTarget,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

export type fldStrButtonVariant =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'outline'
  | 'pill';

type vwButtonProps = {
  fldStrLabel: string;
  fldStrVariant?: fldStrButtonVariant;
  fldBooDisabled?: boolean;
  fldBooLoading?: boolean;
  fldStrTestId?: string;
  actHandOnPress: () => void;
};

export function vwButton({
  fldStrLabel,
  fldStrVariant = 'primary',
  fldBooDisabled = false,
  fldBooLoading = false,
  fldStrTestId,
  actHandOnPress,
}: vwButtonProps): React.JSX.Element {
  const fldBooInactive = fldBooDisabled || fldBooLoading;
  const fldBooText = fldStrVariant === 'text';
  const fldBooOutline = fldStrVariant === 'outline';
  const fldBooPill = fldStrVariant === 'pill';
  return (
    <Pressable
      disabled={fldBooInactive}
      onPress={actHandOnPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: fldBooInactive, busy: fldBooLoading }}
      testID={fldStrTestId}
      style={[
        vwButtonStyles.fldObjPressable,
        fldStrVariant === 'secondary' && vwButtonStyles.fldObjSecondary,
        fldBooText && vwButtonStyles.fldObjText,
        fldBooOutline && vwButtonStyles.fldObjOutline,
        fldBooPill && vwButtonStyles.fldObjPill,
        fldBooInactive && vwButtonStyles.fldObjInactive,
      ]}
    >
      {fldBooLoading && (
        <ActivityIndicator
          size="small"
          color={fldBooText || fldBooOutline ? colAccentBlue : colTextPrimary}
          style={vwButtonStyles.fldObjSpinner}
        />
      )}
      {fldBooText || fldBooOutline ? (
        <Text style={vwButtonStyles.fldObjTextLabel}>{fldStrLabel}</Text>
      ) : (
        <Text
          style={[
            vwButtonStyles.fldObjButtonLabel,
            (fldStrVariant === 'primary' || fldBooPill) &&
              vwButtonStyles.fldObjButtonLabelOnAccent,
          ]}
        >
          {fldStrLabel}
        </Text>
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
  fldObjOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colAccentBlue,
  },
  fldObjPill: {
    borderRadius: 28,
    paddingVertical: fldNumSpacingSm,
    paddingHorizontal: fldNumSpacingXl,
  },
  fldObjTextLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 24,
    color: colAccentBlue,
  },
  fldObjButtonLabel: {
    fontFamily: fldStrFontFamilyUi,
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 24,
    color: colTextPrimary,
    textAlign: 'center',
  },
  fldObjButtonLabelOnAccent: {
    color: colTextOnAccent,
  },
  fldObjInactive: {
    opacity: 0.5,
  },
  fldObjSpinner: {
    marginRight: fldNumSpacingSm,
  },
});
