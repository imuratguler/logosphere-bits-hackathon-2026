/**
 * Logosphere BITS — collection merge dialog (controlled, presentational).
 *
 * Merges the selected collections into an existing collection (from
 * the workspace tree, collections only) or a newly named one. Renders
 * nothing while hidden; Android back cancels via onRequestClose. The
 * caller computes row validity, the target display name, and the
 * confirm gate; all text arrives via props and all state is
 * caller-held, mirroring the move picker.
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

type vwMergeCollectionsModalProps = {
  fldBooVisible: boolean;
  fldStrTitle: string;
  fldStrSources: string;
  fldNumSources: number;
  fldStrInto: string;
  fldStrIntoName: string;
  fldStrNewCollection: string;
  fldStrNamePlaceholder: string;
  fldStrDraftName: string;
  actHandOnDraftChange: (fldStrText: string) => void;
  fldStrExisting: string;
  fldArrRows: fldObjMoveTargetRow[];
  fldBooLoading: boolean;
  fldStrLoading: string;
  fldStrErrorTitle: string;
  fldStrError: string | null;
  fldStrRetry: string;
  actHandOnRetry: () => void;
  actHandOnSelectTarget: (fldStrId: string) => void;
  fldStrMergeLabel: string;
  fldBooMergeDisabled: boolean;
  fldBooMerging: boolean;
  fldStrMergeErrorTitle: string;
  fldStrMergeError: string | null;
  actHandOnConfirmMerge: () => void;
  fldStrCancelLabel: string;
  actHandOnCancel: () => void;
};

const fldNumMergeListMaxHeight = 240;
const fldNumMergeIndent = 24;

export function vwMergeCollectionsModal({
  fldBooVisible,
  fldStrTitle,
  fldStrSources,
  fldNumSources,
  fldStrInto,
  fldStrIntoName,
  fldStrNewCollection,
  fldStrNamePlaceholder,
  fldStrDraftName,
  actHandOnDraftChange,
  fldStrExisting,
  fldArrRows,
  fldBooLoading,
  fldStrLoading,
  fldStrErrorTitle,
  fldStrError,
  fldStrRetry,
  actHandOnRetry,
  actHandOnSelectTarget,
  fldStrMergeLabel,
  fldBooMergeDisabled,
  fldBooMerging,
  fldStrMergeErrorTitle,
  fldStrMergeError,
  actHandOnConfirmMerge,
  fldStrCancelLabel,
  actHandOnCancel,
}: vwMergeCollectionsModalProps): React.JSX.Element | null {
  if (!fldBooVisible) {
    return null;
  }
  const fldArrCollections = fldArrRows.filter(
    fldObjRow => fldObjRow.fldStrKind === 'collection',
  );
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
      onRequestClose={actHandOnCancel}
    >
      <View style={vwMergeCollectionsModalStyles.fldObjOverlay}>
        <View style={vwMergeCollectionsModalStyles.fldObjCard}>
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwText fldStrVariant="body">{`${fldStrSources}: ${fldNumSources}`}</VwText>
          </View>
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwText fldStrVariant="body">{fldStrNewCollection}</VwText>
          </View>
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldStrDraftName}
              actHandOnChange={actHandOnDraftChange}
              fldStrPlaceholder={fldStrNamePlaceholder}
              fldBooDisabled={fldBooMerging}
            />
          </View>
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwText fldStrVariant="body">{fldStrExisting}</VwText>
          </View>
          {fldStrError !== null ? (
            <View style={vwMergeCollectionsModalStyles.fldObjGap}>
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
              style={vwMergeCollectionsModalStyles.fldObjList}
              keyboardShouldPersistTaps="handled"
            >
              {fldArrCollections.map(fldObjRow => (
                <Pressable
                  key={fldObjRow.fldStrId}
                  style={[
                    vwMergeCollectionsModalStyles.fldObjRow,
                    { paddingLeft: fldObjRow.fldNumDepth * fldNumMergeIndent },
                    fldObjRow.fldBooInvalid &&
                      vwMergeCollectionsModalStyles.fldObjInvalid,
                  ]}
                  accessibilityRole="button"
                  disabled={fldObjRow.fldBooInvalid || fldBooMerging}
                  onPress={() => {
                    actHandOnSelectTarget(fldObjRow.fldStrId);
                  }}
                >
                  {!fldObjRow.fldBooInvalid && (
                    <VwCheckBox fldBooChecked={fldObjRow.fldBooSelected} />
                  )}
                  <VwText fldStrVariant="body">{fldObjRow.fldStrName}</VwText>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwText fldStrVariant="body">{`${fldStrInto}: ${
              fldStrIntoName === '' ? '—' : fldStrIntoName
            }`}</VwText>
          </View>
          {fldStrMergeError !== null && (
            <View style={vwMergeCollectionsModalStyles.fldObjGap}>
              <VwEmptyState
                fldStrTitle={fldStrMergeErrorTitle}
                fldStrMessage={fldStrMergeError}
              />
            </View>
          )}
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrMergeLabel}
              fldBooDisabled={fldBooMergeDisabled || fldBooMerging}
              fldBooLoading={fldBooMerging}
              actHandOnPress={actHandOnConfirmMerge}
            />
          </View>
          <View style={vwMergeCollectionsModalStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldStrCancelLabel}
              fldBooDisabled={fldBooMerging}
              actHandOnPress={actHandOnCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const vwMergeCollectionsModalStyles = StyleSheet.create({
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
    maxHeight: fldNumMergeListMaxHeight,
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
