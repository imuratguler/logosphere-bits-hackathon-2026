/**
 * Logosphere BITS — shared top bar (presentational only).
 *
 * Fixed 60dp surface band with 16dp side margins: a 48dp back
 * touch target on the left, the centered page title (20sp, single
 * line with tail ellipsis), and a balanced 48dp action slot on
 * the right (settings glyph when an action is wired, empty spacer
 * otherwise so the title stays centered). Glyphs are non-linguistic
 * decoration; screen-reader names arrive via the label props.
 * Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colAccentBlue,
  colSurface,
  colTextPrimary,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumTitleSize,
  fldNumTopBarHeight,
  fldNumTouchTarget,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

type vwTopBarProps = {
  fldStrTitle: string;
  fldStrBackLabel: string;
  actHandOnBack: (() => void) | null;
  fldStrActionLabel?: string;
  actHandOnAction?: (() => void) | null;
};

export function vwTopBar({
  fldStrTitle,
  fldStrBackLabel,
  actHandOnBack,
  fldStrActionLabel = '',
  actHandOnAction = null,
}: vwTopBarProps): React.JSX.Element {
  return (
    <View style={vwTopBarStyles.fldObjBar}>
      {actHandOnBack === null ? (
        <View style={vwTopBarStyles.fldObjSlot} />
      ) : (
        <Pressable
          testID="topbar-back"
          onPress={actHandOnBack}
          accessibilityRole="button"
          accessibilityLabel={fldStrBackLabel}
          style={vwTopBarStyles.fldObjSlot}
        >
          <Text style={vwTopBarStyles.fldObjBackGlyph}>←</Text>
        </Pressable>
      )}
      <Text
        style={vwTopBarStyles.fldObjTitle}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {fldStrTitle}
      </Text>
      {actHandOnAction === null ? (
        <View style={vwTopBarStyles.fldObjSlot} />
      ) : (
        <Pressable
          testID="topbar-action"
          onPress={actHandOnAction}
          accessibilityRole="button"
          accessibilityLabel={fldStrActionLabel}
          style={vwTopBarStyles.fldObjSlot}
        >
          <Text style={vwTopBarStyles.fldObjActionGlyph}>⚙</Text>
        </Pressable>
      )}
    </View>
  );
}

const vwTopBarStyles = StyleSheet.create({
  fldObjBar: {
    height: fldNumTopBarHeight,
    backgroundColor: colSurface,
    paddingHorizontal: fldNumSpacingMd,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fldObjSlot: {
    width: fldNumTouchTarget,
    height: fldNumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fldStrFontFamilyUi,
    fontSize: fldNumTitleSize,
    lineHeight: 28,
    fontWeight: 'bold',
    color: colTextPrimary,
    marginHorizontal: fldNumSpacingSm,
  },
  fldObjBackGlyph: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 28,
    lineHeight: 32,
    color: colAccentBlue,
  },
  fldObjActionGlyph: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 22,
    lineHeight: 26,
    color: colAccentBlue,
  },
});
