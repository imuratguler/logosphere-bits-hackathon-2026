/**
 * Logosphere BITS — shared text input (controlled, presentational only).
 * Error red sits outside vwText's fixed palette, so the error line uses
 * raw Text; this keeps vwText's variant API stable.
 */

import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import {
  colDanger,
  colSurface,
  colTextPrimary,
  colTextSecondary,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

type vwTextInputProps = {
  fldStrValue: string;
  actHandOnChange: (fldStrText: string) => void;
  fldStrPlaceholder?: string;
  fldStrError?: string;
  fldBooDisabled?: boolean;
  fldBooSecureEntry?: boolean;
};

export function vwTextInput({
  fldStrValue,
  actHandOnChange,
  fldStrPlaceholder,
  fldStrError,
  fldBooDisabled = false,
  fldBooSecureEntry = false,
}: vwTextInputProps): React.JSX.Element {
  const fldBooHasError = fldStrError !== undefined && fldStrError !== '';
  return (
    <>
      <TextInput
        value={fldStrValue}
        onChangeText={actHandOnChange}
        placeholder={fldStrPlaceholder}
        placeholderTextColor={colTextSecondary}
        editable={!fldBooDisabled}
        secureTextEntry={fldBooSecureEntry}
        style={[
          vwTextInputStyles.fldObjInput,
          fldBooHasError && vwTextInputStyles.fldObjErrorBorder,
          fldBooDisabled && vwTextInputStyles.fldObjDisabled,
        ]}
      />
      {fldBooHasError && (
        <Text style={vwTextInputStyles.fldObjError}>{fldStrError}</Text>
      )}
    </>
  );
}

const vwTextInputStyles = StyleSheet.create({
  fldObjInput: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 20,
    lineHeight: 28,
    color: colTextPrimary,
    backgroundColor: colSurface,
    borderWidth: 1,
    borderColor: colTextSecondary,
    borderRadius: fldNumRadiusMd,
    paddingVertical: fldNumSpacingMd,
    paddingHorizontal: fldNumSpacingMd,
  },
  fldObjErrorBorder: {
    borderColor: colDanger,
  },
  fldObjDisabled: {
    opacity: 0.5,
  },
  fldObjError: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 13,
    lineHeight: 20,
    color: colDanger,
    marginTop: fldNumSpacingSm,
  },
});
