/**
 * Logosphere BITS — shared list row (presentational only).
 *
 * One card row for library, collection, set, and product lists:
 * an optional leading checkbox (selection mode), a title with
 * an optional subtitle, and an optional trailing chevron. The
 * chevron glyph is non-linguistic decoration (no translation
 * exists for it); every other string arrives via props.
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { vwCheckBox as VwCheckBox } from './vwCheckBox';
import { vwText as VwText } from './vwText';
import {
  colSurface,
  fldNumRadiusMd,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type vwListRowProps = {
  fldStrTitle: string;
  fldStrSubtitle?: string | null;
  fldBooChecked: boolean | null;
  fldBooChevron?: boolean;
  fldBooTall?: boolean;
  actHandOnPress?: () => void;
  actHandOnLongPress?: () => void;
};

export function vwListRow({
  fldStrTitle,
  fldStrSubtitle = null,
  fldBooChecked,
  fldBooChevron = false,
  fldBooTall = false,
  actHandOnPress,
  actHandOnLongPress,
}: vwListRowProps): React.JSX.Element {
  return (
    <Pressable
      style={[
        vwListRowStyles.fldObjRow,
        fldBooTall && vwListRowStyles.fldObjTall,
      ]}
      accessibilityRole="button"
      accessibilityLabel={fldStrTitle}
      onPress={actHandOnPress}
      onLongPress={actHandOnLongPress}
    >
      {fldBooChecked !== null && (
        <View style={vwListRowStyles.fldObjCheck}>
          <VwCheckBox fldBooChecked={fldBooChecked} />
        </View>
      )}
      <View style={vwListRowStyles.fldObjTexts}>
        <VwText fldStrVariant="body">{fldStrTitle}</VwText>
        {fldStrSubtitle !== null && fldStrSubtitle !== '' && (
          <VwText fldStrVariant="caption">{fldStrSubtitle}</VwText>
        )}
      </View>
      {fldBooChevron && <VwText fldStrVariant="caption">›</VwText>}
    </Pressable>
  );
}

const vwListRowStyles = StyleSheet.create({
  fldObjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colSurface,
    borderRadius: fldNumRadiusMd,
    paddingVertical: fldNumSpacingSm,
    paddingHorizontal: fldNumSpacingMd,
    marginBottom: fldNumSpacingSm,
  },
  fldObjTall: {
    minHeight: 68,
  },
  fldObjCheck: {
    marginRight: fldNumSpacingMd,
  },
  fldObjTexts: {
    flex: 1,
  },
});
