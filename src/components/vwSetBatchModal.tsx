/**
 * Logosphere BITS — set batch dialog (controlled, presentational).
 *
 * One dialog serves the three set batch operations: merging the
 * selected sets or products into a newly named set, extracting
 * members back to loose products, and converting every leaf
 * collection's products into new sets. The caller computes the
 * confirmation summary, the target display name, and the confirm
 * gate; all text arrives via props and all state is caller-held,
 * mirroring the merge picker. Renders nothing while hidden;
 * Android back cancels via onRequestClose.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { vwButton as VwButton } from './vwButton';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwLoading as VwLoading } from './vwLoading';
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

type vwSetBatchModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldStrSummary: string;
  fldStrInto: string;
  fldStrIntoName: string;
  fldBooNameVisible: boolean;
  fldStrNamePlaceholder: string;
  fldStrDraftName: string;
  actHandOnDraftChange: (fldStrText: string) => void;
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

export function vwSetBatchModal({
  fldBooVisible,
  fldStrTitle,
  fldStrSummary,
  fldStrInto,
  fldStrIntoName,
  fldBooNameVisible,
  fldStrNamePlaceholder,
  fldStrDraftName,
  actHandOnDraftChange,
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
}: vwSetBatchModalProps): React.JSX.Element | null {
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
      <View style={vwSetBatchModalStyles.fldObjOverlay}>
        <View style={vwSetBatchModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          {fldStrLoadError !== null ? (
            <View style={vwSetBatchModalStyles.fldObjGap}>
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
            <View style={vwSetBatchModalStyles.fldObjGap}>
              <VwText fldStrVariant="body">{fldStrSummary}</VwText>
            </View>
          )}
          {fldBooNameVisible && fldStrLoadError === null && !fldBooLoading && (
            <View style={vwSetBatchModalStyles.fldObjGap}>
              <VwTextInput
                fldStrValue={fldStrDraftName}
                actHandOnChange={actHandOnDraftChange}
                fldStrPlaceholder={fldStrNamePlaceholder}
                fldBooDisabled={fldBooWorking}
              />
            </View>
          )}
          {fldStrIntoName !== '' && (
            <View style={vwSetBatchModalStyles.fldObjGap}>
              <VwText fldStrVariant="body">{`${fldStrInto}: ${fldStrIntoName}`}</VwText>
            </View>
          )}
          {fldStrError !== null && (
            <View style={vwSetBatchModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrErrorTitle}
                fldStrMessage={fldStrError}
              />
            </View>
          )}
          <View style={vwSetBatchModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrConfirmLabel}
              fldBooDisabled={fldBooConfirmDisabled || fldBooWorking}
              fldBooLoading={fldBooWorking}
              actHandOnPress={actHandOnConfirm}
            />
          </View>
          <View style={vwSetBatchModalStyles.fldObjGap}>
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

const vwSetBatchModalStyles = StyleSheet.create({
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
