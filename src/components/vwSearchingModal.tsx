/**
 * Logosphere BITS — searching modal (controlled, presentational).
 *
 * Full-screen waiting state for the Find Now pipeline: a
 * spinner with the live status line plus a cancel action.
 * Renders nothing while hidden; Android back cancels via
 * onRequestClose. All text arrives via props.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { vwButton as VwButton } from './vwButton';
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

type vwSearchingModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldStrStatus: string;
  fldStrCancelLabel: string;
  actHandOnCancel: () => void;
};

export function vwSearchingModal({
  fldBooVisible,
  fldStrTitle,
  fldStrStatus,
  fldStrCancelLabel,
  actHandOnCancel,
}: vwSearchingModalProps): React.JSX.Element | null {
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
      <View style={vwSearchingModalStyles.fldObjOverlay}>
        <View style={vwSearchingModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          <VwLoading fldStrMessage={fldStrStatus} />
          <View style={vwSearchingModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrCancelLabel}
              fldStrVariant="secondary"
              fldStrTestId="searching-cancel"
              actHandOnPress={actHandOnCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const vwSearchingModalStyles = StyleSheet.create({
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
