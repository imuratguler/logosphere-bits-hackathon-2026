/**
 * Logosphere BITS — shared dropdown select (presentational only).
 *
 * One 52dp surface field showing the picked label (or the
 * placeholder) with a chevron; tapping opens a modal option sheet
 * with single-choice rows, closable via Cancel or the Android back
 * button. Renders no password, membership, or authority shape:
 * picking only highlights, the caller acts on the pick. The chevron
 * glyph is non-linguistic decoration; every other string arrives
 * via props.
 * D6 JSX-alias exception: shared views are used through capitalized
 * aliases.
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (vwDropdown); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { vwButton as VwButton } from './vwButton';
import { vwListRow as VwListRow } from './vwListRow';
import { vwText as VwText } from './vwText';
import {
  colAccentBlue,
  colBackground,
  colScrim,
  colSurface,
  colTextPrimary,
  colTextSecondary,
  fldNumDropdownHeight,
  fldNumRadiusLg,
  fldNumRadiusMd,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

export type fldObjDropdownOption = {
  fldStrId: string;
  fldStrLabel: string;
};

type vwDropdownProps = {
  fldArrOptions: fldObjDropdownOption[];
  fldStrPickedId: string | null;
  fldStrPlaceholder: string;
  fldStrTitle: string;
  fldStrCancelLabel: string;
  fldBooDisabled?: boolean;
  fldBooOnSurface?: boolean;
  actHandOnPick: (fldStrId: string) => void;
};

export function vwDropdown({
  fldArrOptions,
  fldStrPickedId,
  fldStrPlaceholder,
  fldStrTitle,
  fldStrCancelLabel,
  fldBooDisabled = false,
  fldBooOnSurface = false,
  actHandOnPick,
}: vwDropdownProps): React.JSX.Element {
  const [fldBooOpen, actSetOpen] = React.useState(false);
  const fldObjPicked =
    fldArrOptions.find(
      fldObjOption => fldObjOption.fldStrId === fldStrPickedId,
    ) ?? null;
  return (
    <View>
      <Pressable
        testID="dropdown-field"
        disabled={fldBooDisabled}
        onPress={() => {
          actSetOpen(true);
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: fldBooDisabled }}
        accessibilityLabel={fldObjPicked?.fldStrLabel ?? fldStrPlaceholder}
        style={[
          vwDropdownStyles.fldObjField,
          fldBooOnSurface && vwDropdownStyles.fldObjOnSurface,
          fldBooDisabled && vwDropdownStyles.fldObjInactive,
        ]}
      >
        <View style={vwDropdownStyles.fldObjLabel}>
          <Text
            style={[
              vwDropdownStyles.fldObjFieldText,
              fldObjPicked === null && vwDropdownStyles.fldObjPlaceholder,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {fldObjPicked?.fldStrLabel ?? fldStrPlaceholder}
          </Text>
        </View>
        <Text style={vwDropdownStyles.fldObjChevron}>▾</Text>
      </Pressable>
      {fldBooOpen && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={true}
          onRequestClose={() => {
            actSetOpen(false);
          }}
        >
          <View style={vwDropdownStyles.fldObjOverlay}>
            <View style={vwDropdownStyles.fldObjCard}>
              <VwText fldStrVariant="header">{fldStrTitle}</VwText>
              <ScrollView style={vwDropdownStyles.fldObjList}>
                {fldArrOptions.map(fldObjOption => (
                  <VwListRow
                    key={fldObjOption.fldStrId}
                    fldStrTitle={fldObjOption.fldStrLabel}
                    fldBooChecked={fldObjOption.fldStrId === fldStrPickedId}
                    fldBooCompact
                    actHandOnPress={() => {
                      actHandOnPick(fldObjOption.fldStrId);
                      actSetOpen(false);
                    }}
                  />
                ))}
              </ScrollView>
              <View style={vwDropdownStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldStrCancelLabel}
                  fldStrVariant="text"
                  actHandOnPress={() => {
                    actSetOpen(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const vwDropdownStyles = StyleSheet.create({
  fldObjField: {
    height: fldNumDropdownHeight,
    backgroundColor: colSurface,
    borderWidth: 1,
    borderColor: colAccentBlue,
    borderRadius: fldNumRadiusMd,
    paddingHorizontal: fldNumSpacingMd,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fldObjOnSurface: {
    backgroundColor: colBackground,
  },
  fldObjFieldText: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 24,
    color: colTextPrimary,
  },
  fldObjPlaceholder: {
    color: colTextSecondary,
  },
  fldObjInactive: {
    opacity: 0.5,
  },
  fldObjLabel: {
    flex: 1,
    marginRight: fldNumSpacingSm,
  },
  fldObjChevron: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 20,
    lineHeight: 28,
    color: colAccentBlue,
  },
  fldObjOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colScrim,
    padding: fldNumSpacingLg,
  },
  fldObjCard: {
    backgroundColor: colBackground,
    borderRadius: fldNumRadiusLg,
    padding: fldNumSpacingLg,
    maxHeight: '70%',
  },
  fldObjList: {
    marginTop: fldNumSpacingMd,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
  },
});
