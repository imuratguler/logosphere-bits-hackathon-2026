/**
 * Logosphere BITS — sale modal (controlled, presentational only).
 *
 * One modal for product, set, and collection listing moves:
 * optional editable tag (product only), the scope lines the
 * caller computed, and Activate / Deactivate / Cancel. The
 * tag input validates locally; activation sends the tag,
 * deactivation keeps the stored price server-side. Renders
 * nothing while hidden; Cancel never writes. All state
 * arrives via props. Naming follows D6 (fld / vw / act
 * roots).
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

type vwSaleModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldArrScopeLines: string[];
  fldBooTagInput: boolean;
  fldStrTagLabel: string;
  fldStrTagValue: string;
  actHandOnTagChange: (fldStrText: string) => void;
  fldStrTagPlaceholder: string;
  fldStrTagError?: string;
  fldStrActivateLabel: string;
  fldStrDeactivateLabel: string;
  fldStrCancelLabel: string;
  fldBooSaving: boolean;
  fldStrSaveErrorTitle: string;
  fldStrSaveError: string | null;
  actHandOnActivate: () => void;
  actHandOnDeactivate: () => void;
  actHandOnCancel: () => void;
};

export function vwSaleModal({
  fldBooVisible,
  fldStrTitle,
  fldArrScopeLines,
  fldBooTagInput,
  fldStrTagLabel,
  fldStrTagValue,
  actHandOnTagChange,
  fldStrTagPlaceholder,
  fldStrTagError,
  fldStrActivateLabel,
  fldStrDeactivateLabel,
  fldStrCancelLabel,
  fldBooSaving,
  fldStrSaveErrorTitle,
  fldStrSaveError,
  actHandOnActivate,
  actHandOnDeactivate,
  actHandOnCancel,
}: vwSaleModalProps): React.JSX.Element | null {
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
      <View style={vwSaleModalStyles.fldObjOverlay}>
        <View style={vwSaleModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          {fldArrScopeLines.map((fldStrLine, fldNumAt) => (
            <VwText
              key={`scope-${fldNumAt}`}
              fldStrVariant="caption"
              fldNumLines={3}
              fldStrEllipsize="tail"
            >
              {fldStrLine}
            </VwText>
          ))}
          {fldBooTagInput && (
            <View style={vwSaleModalStyles.fldObjGap}>
              <VwText fldStrVariant="label">{fldStrTagLabel}</VwText>
              <VwTextInput
                fldStrValue={fldStrTagValue}
                actHandOnChange={actHandOnTagChange}
                fldStrPlaceholder={fldStrTagPlaceholder}
                fldStrError={fldStrTagError}
                fldBooDisabled={fldBooSaving}
              />
            </View>
          )}
          {fldStrSaveError !== null && (
            <View style={vwSaleModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrSaveErrorTitle}
                fldStrMessage={fldStrSaveError}
              />
            </View>
          )}
          <View style={vwSaleModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrActivateLabel}
              fldBooLoading={fldBooSaving}
              actHandOnPress={actHandOnActivate}
            />
          </View>
          <View style={vwSaleModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrDeactivateLabel}
              fldStrVariant="outline"
              fldBooDisabled={fldBooSaving}
              actHandOnPress={actHandOnDeactivate}
            />
          </View>
          <VwButton
            fldStrLabel={fldStrCancelLabel}
            fldStrVariant="text"
            fldBooDisabled={fldBooSaving}
            actHandOnPress={actHandOnCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

const vwSaleModalStyles = StyleSheet.create({
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
