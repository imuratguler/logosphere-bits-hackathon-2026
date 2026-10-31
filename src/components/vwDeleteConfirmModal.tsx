/**
 * Logosphere BITS — delete confirmation dialog (controlled,
 * presentational).
 *
 * Confirms the deletion of the selected collections, sets, or
 * products. The caller loads the affected-content preview (counts
 * per unit plus an optional blocked reason when a selected
 * collection holds sub-collections), computes the confirm gate, and
 * holds all state; all text arrives via props. Renders nothing
 * while hidden; Android back cancels via onRequestClose.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { vwButton as VwButton } from './vwButton';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwLoading as VwLoading } from './vwLoading';
import { vwText as VwText } from './vwText';
import {
  colBackground,
  colScrim,
  fldNumRadiusLg,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingXl,
} from '../utils/utlTheme';

type vwDeleteConfirmModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldStrSummary: string;
  fldStrBlockedReason: string | null;
  fldBooLoading: boolean;
  fldStrLoading: string;
  fldStrLoadErrorTitle: string;
  fldStrLoadError: string | null;
  fldStrRetry: string;
  actHandOnRetry: () => void;
  fldStrConfirmLabel: string;
  fldBooConfirmDisabled: boolean;
  fldBooWorking: boolean;
  fldStrErrorTitle: string;
  fldStrError: string | null;
  actHandOnConfirm: () => void;
  fldStrCancelLabel: string;
  actHandOnCancel: () => void;
};

export function vwDeleteConfirmModal({
  fldBooVisible,
  fldStrTitle,
  fldStrSummary,
  fldStrBlockedReason,
  fldBooLoading,
  fldStrLoading,
  fldStrLoadErrorTitle,
  fldStrLoadError,
  fldStrRetry,
  actHandOnRetry,
  fldStrConfirmLabel,
  fldBooConfirmDisabled,
  fldBooWorking,
  fldStrErrorTitle,
  fldStrError,
  actHandOnConfirm,
  fldStrCancelLabel,
  actHandOnCancel,
}: vwDeleteConfirmModalProps): React.JSX.Element | null {
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
      <View style={vwDeleteConfirmModalStyles.fldObjOverlay}>
        <View style={vwDeleteConfirmModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          {fldStrLoadError !== null ? (
            <View style={vwDeleteConfirmModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrLoadErrorTitle}
                fldStrMessage={fldStrLoadError}
              />
              <VwButton
                fldStrLabel={fldStrRetry}
                actHandOnPress={actHandOnRetry}
              />
            </View>
          ) : fldBooLoading ? (
            <VwLoading fldStrMessage={fldStrLoading} />
          ) : (
            <View style={vwDeleteConfirmModalStyles.fldObjGap}>
              <VwText fldStrVariant="body">{fldStrSummary}</VwText>
            </View>
          )}
          {fldStrBlockedReason !== null && (
            <View style={vwDeleteConfirmModalStyles.fldObjGap}>
              <VwEmptyState fldStrTitle={fldStrBlockedReason} />
            </View>
          )}
          {fldStrError !== null && (
            <View style={vwDeleteConfirmModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrErrorTitle}
                fldStrMessage={fldStrError}
              />
            </View>
          )}
          <View style={vwDeleteConfirmModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrConfirmLabel}
              fldBooDisabled={fldBooConfirmDisabled || fldBooWorking}
              fldBooLoading={fldBooWorking}
              actHandOnPress={actHandOnConfirm}
            />
          </View>
          <View style={vwDeleteConfirmModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrCancelLabel}
              fldBooDisabled={fldBooWorking}
              actHandOnPress={actHandOnCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const vwDeleteConfirmModalStyles = StyleSheet.create({
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
