/**
 * Logosphere BITS — move destination picker (controlled, presentational).
 *
 * Shows the flattened workspace tree inside a Modal (Android back
 * cancels via onRequestClose) and renders nothing while hidden. Rows
 * arrive ready to render: the caller computes selection, validity,
 * the current marker, and inline creation from the tree and the
 * moved items. All text arrives via props; all state (draft name,
 * busy flags, errors) is caller-held, mirroring the set-name modal.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { vwButton as VwButton } from './vwButton';
import { vwCheckBox as VwCheckBox } from './vwCheckBox';
import { vwEmptyState as VwEmptyState } from './vwEmptyState';
import { vwLoading as VwLoading } from './vwLoading';
import { vwText as VwText } from './vwText';
import { vwTextInput as VwTextInput } from './vwTextInput';
import type { fldObjMoveTargetRow } from '../types/typModels';
import {
  colBackground,
  colScrim,
  fldNumRadiusLg,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumSpacingXl,
} from '../utils/utlTheme';

type vwMoveDestinationModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldArrRows: fldObjMoveTargetRow[];
  fldBooLoading: boolean;
  fldStrLoading: string;
  fldStrErrorTitle: string;
  fldStrError: string | null;
  fldStrRetry: string;
  actHandOnRetry: () => void;
  fldStrCurrent: string;
  actHandOnSelectTarget: (fldStrId: string) => void;
  fldStrNamePlaceholder: string;
  fldStrDraftName: string;
  actHandOnDraftChange: (fldStrText: string) => void;
  fldStrNewCollection: string;
  fldStrNewSet: string;
  fldStrCreatingKind: 'collection' | 'set' | null;
  actHandOnCreateCollection: () => void;
  actHandOnCreateSet: () => void;
  fldStrSaveErrorTitle: string;
  fldStrSaveError: string | null;
  fldStrMoveLabel: string;
  fldBooMoveDisabled: boolean;
  fldBooMoving: boolean;
  fldStrMoveErrorTitle: string;
  fldStrMoveError: string | null;
  actHandOnConfirmMove: () => void;
  fldStrCancelLabel: string;
  actHandOnCancel: () => void;
};

const fldNumPickerListMaxHeight = 320;
const fldNumPickerIndent = 24;

export function vwMoveDestinationModal({
  fldBooVisible,
  fldStrTitle,
  fldArrRows,
  fldBooLoading,
  fldStrLoading,
  fldStrErrorTitle,
  fldStrError,
  fldStrRetry,
  actHandOnRetry,
  fldStrCurrent,
  actHandOnSelectTarget,
  fldStrNamePlaceholder,
  fldStrDraftName,
  actHandOnDraftChange,
  fldStrNewCollection,
  fldStrNewSet,
  fldStrCreatingKind,
  actHandOnCreateCollection,
  actHandOnCreateSet,
  fldStrSaveErrorTitle,
  fldStrSaveError,
  fldStrMoveLabel,
  fldBooMoveDisabled,
  fldBooMoving,
  fldStrMoveErrorTitle,
  fldStrMoveError,
  actHandOnConfirmMove,
  fldStrCancelLabel,
  actHandOnCancel,
}: vwMoveDestinationModalProps): React.JSX.Element | null {
  if (!fldBooVisible) {
    return null;
  }
  const fldObjSelected = fldArrRows.find(fldObjRow => fldObjRow.fldBooSelected);
  const fldBooBusy = fldBooMoving || fldStrCreatingKind !== null;
  const fldBooShowCreation =
    fldObjSelected !== undefined &&
    (fldObjSelected.fldBooCanCreateCollection ||
      fldObjSelected.fldBooCanCreateSet);
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
      onRequestClose={actHandOnCancel}
    >
      <View style={vwMoveDestinationModalStyles.fldObjOverlay}>
        <View style={vwMoveDestinationModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          {fldStrError !== null ? (
            <View style={vwMoveDestinationModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrErrorTitle}
                fldStrMessage={fldStrError}
              />
              <VwButton
                fldStrLabel={fldStrRetry}
                actHandOnPress={actHandOnRetry}
              />
            </View>
          ) : fldBooLoading ? (
            <VwLoading fldStrMessage={fldStrLoading} />
          ) : (
            <ScrollView
              style={vwMoveDestinationModalStyles.fldObjList}
              keyboardShouldPersistTaps="handled"
            >
              {fldArrRows.map(fldObjRow => (
                <Pressable
                  key={fldObjRow.fldStrId}
                  style={[
                    vwMoveDestinationModalStyles.fldObjRow,
                    { paddingLeft: fldObjRow.fldNumDepth * fldNumPickerIndent },
                    fldObjRow.fldBooInvalid &&
                      vwMoveDestinationModalStyles.fldObjInvalid,
                  ]}
                  accessibilityRole="button"
                  disabled={fldObjRow.fldBooInvalid || fldBooBusy}
                  onPress={() => {
                    actHandOnSelectTarget(fldObjRow.fldStrId);
                  }}
                >
                  {!fldObjRow.fldBooInvalid && (
                    <VwCheckBox fldBooChecked={fldObjRow.fldBooSelected} />
                  )}
                  <View>
                    <VwText fldStrVariant="body">{fldObjRow.fldStrName}</VwText>
                    {fldObjRow.fldBooIsCurrent && (
                      <VwText fldStrVariant="caption">{fldStrCurrent}</VwText>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {fldBooShowCreation && (
            <View style={vwMoveDestinationModalStyles.fldObjGap}>
              <VwTextInput
                fldStrValue={fldStrDraftName}
                actHandOnChange={actHandOnDraftChange}
                fldStrPlaceholder={fldStrNamePlaceholder}
                fldBooDisabled={fldBooBusy}
              />
            </View>
          )}
          {fldBooShowCreation &&
            fldObjSelected?.fldBooCanCreateCollection === true && (
              <View style={vwMoveDestinationModalStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldStrNewCollection}
                  fldBooLoading={fldStrCreatingKind === 'collection'}
                  fldBooDisabled={fldBooBusy}
                  actHandOnPress={actHandOnCreateCollection}
                />
              </View>
            )}
          {fldBooShowCreation &&
            fldObjSelected?.fldBooCanCreateSet === true && (
              <View style={vwMoveDestinationModalStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldStrNewSet}
                  fldBooLoading={fldStrCreatingKind === 'set'}
                  fldBooDisabled={fldBooBusy}
                  actHandOnPress={actHandOnCreateSet}
                />
              </View>
            )}
          {fldStrSaveError !== null && (
            <View style={vwMoveDestinationModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrSaveErrorTitle}
                fldStrMessage={fldStrSaveError}
              />
            </View>
          )}
          {fldStrMoveError !== null && (
            <View style={vwMoveDestinationModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrMoveErrorTitle}
                fldStrMessage={fldStrMoveError}
              />
            </View>
          )}
          <View style={vwMoveDestinationModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrMoveLabel}
              fldBooDisabled={fldBooMoveDisabled || fldBooBusy}
              fldBooLoading={fldBooMoving}
              actHandOnPress={actHandOnConfirmMove}
            />
          </View>
          <View style={vwMoveDestinationModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrCancelLabel}
              fldBooDisabled={fldBooBusy}
              actHandOnPress={actHandOnCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const vwMoveDestinationModalStyles = StyleSheet.create({
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
  fldObjList: {
    maxHeight: fldNumPickerListMaxHeight,
    marginTop: fldNumSpacingMd,
  },
  fldObjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: fldNumSpacingSm,
  },
  fldObjInvalid: {
    opacity: 0.5,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
  },
});
