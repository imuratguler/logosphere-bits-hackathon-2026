/**
 * Logosphere BITS — set name modal (controlled, presentational only).
 *
 * Custom-built instead of Alert.prompt, which is iOS-only: this
 * Modal renders on Android too, and onRequestClose wires the Android
 * back button to cancel. Renders nothing while hidden. All state
 * (value, errors, saving) arrives via props; the caller clears the
 * value after a confirmed save and keeps it on failure.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { vwButton as VwButton } from './vwButton';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwText as VwText } from './vwText';
import { vwTextInput as VwTextInput } from './vwTextInput';
import {
  colBackground,
  colScrim,
  fldNumRadiusLg,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingXl,
} from '../utils/utlTheme';

type vwSetNameModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldStrValue: string;
  actHandOnChange: (fldStrText: string) => void;
  fldStrPlaceholder: string;
  fldStrError?: string;
  fldStrSaveLabel: string;
  fldStrCancelLabel: string;
  fldBooSaving: boolean;
  fldStrSaveErrorTitle: string;
  fldStrSaveError: string | null;
  actHandOnSave: () => void;
  actHandOnCancel: () => void;
};

export function vwSetNameModal({
  fldBooVisible,
  fldStrTitle,
  fldStrValue,
  actHandOnChange,
  fldStrPlaceholder,
  fldStrError,
  fldStrSaveLabel,
  fldStrCancelLabel,
  fldBooSaving,
  fldStrSaveErrorTitle,
  fldStrSaveError,
  actHandOnSave,
  actHandOnCancel,
}: vwSetNameModalProps): React.JSX.Element | null {
  if (!fldBooVisible) {
    return null;
  }
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
      onRequestClose={actHandOnCancel}
    >
      <View style={vwSetNameModalStyles.fldObjOverlay}>
        <View style={vwSetNameModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          <View style={vwSetNameModalStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldStrValue}
              actHandOnChange={actHandOnChange}
              fldStrPlaceholder={fldStrPlaceholder}
              fldStrError={fldStrError}
              fldBooDisabled={fldBooSaving}
            />
          </View>
          {fldStrSaveError !== null && (
            <View style={vwSetNameModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrSaveErrorTitle}
                fldStrMessage={fldStrSaveError}
              />
            </View>
          )}
          <View style={vwSetNameModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrSaveLabel}
              fldBooLoading={fldBooSaving}
              actHandOnPress={actHandOnSave}
            />
          </View>
          <VwButton
            fldStrLabel={fldStrCancelLabel}
            fldBooDisabled={fldBooSaving}
            actHandOnPress={actHandOnCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

const vwSetNameModalStyles = StyleSheet.create({
  fldObjOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colScrim,
    padding: fldNumSpacingXl,
  },
  fldObjCard: {
    backgroundColor: colBackground,
    borderRadius: fldNumRadiusLg,
    padding: fldNumSpacingLg,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
  },
});
