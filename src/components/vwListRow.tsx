/**
 * Logosphere BITS — shared list row (presentational only).
 *
 * One card row for library, collection, set, and product lists:
 * an optional leading number (list position, ahead of the icon
 * or thumbnail), an optional leading checkbox (selection mode),
 * a title with an optional subtitle, and an optional trailing
 * chevron. The chevron glyph is non-linguistic decoration (no
 * translation exists for it); every other string arrives via props.
 * D6 JSX-alias exception: vwText is used through a capitalized alias.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { vwCheckBox as VwCheckBox } from './vwCheckBox';
import { vwText as VwText } from './vwText';
import {
  colRowMember,
  colRowSet,
  colSurface,
  colSurfaceLight,
  colTextOnAccent,
  fldNumRadiusMd,
  fldNumRadiusSm,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldStrFontFamilyUiMedium,
} from '../utils/utlTheme';

type vwListRowProps = {
  fldStrTitle: string;
  fldStrSubtitle?: string | null;
  fldStrNumber?: string;
  fldBooChecked: boolean | null;
  fldBooChevron?: boolean;
  fldBooIndented?: boolean;
  fldBooTall?: boolean;
  fldBooCompact?: boolean;
  fldBooSlim?: boolean;
  fldBooTight?: boolean;
  fldBooMediaTrailing?: boolean;
  fldStrRowTone?: 'set' | 'member';
  fldStrTestId?: string;
  fldStrIcon?: string;
  fldStrThumbnailUri?: string | null;
  fldStrToggleGlyph?: string;
  fldStrToggleTestId?: string;
  actHandOnPress?: () => void;
  actHandOnLongPress?: () => void;
  actHandOnTogglePress?: () => void;
};

export function vwListRow({
  fldStrTitle,
  fldStrSubtitle = null,
  fldStrNumber,
  fldBooChecked,
  fldBooChevron = false,
  fldBooIndented = false,
  fldBooTall = false,
  fldBooCompact = false,
  fldBooSlim = false,
  fldBooTight = false,
  fldBooMediaTrailing = false,
  fldStrRowTone,
  fldStrTestId,
  fldStrIcon,
  fldStrThumbnailUri = null,
  fldStrToggleGlyph,
  fldStrToggleTestId,
  actHandOnPress,
  actHandOnLongPress,
  actHandOnTogglePress,
}: vwListRowProps): React.JSX.Element {
  const fldBooSmallText = fldBooCompact || fldBooSlim;
  const fldBooToggle =
    fldStrToggleGlyph !== undefined && actHandOnTogglePress !== undefined;
  const fldBooOnLight = fldStrRowTone === 'member';
  const fldObjMedia =
    fldStrThumbnailUri !== null && fldStrThumbnailUri !== '' ? (
      <Image
        style={[
          vwListRowStyles.fldObjThumb,
          fldBooMediaTrailing && vwListRowStyles.fldObjMediaTrailing,
        ]}
        source={{ uri: fldStrThumbnailUri }}
        testID={
          fldStrTestId === undefined ? undefined : `${fldStrTestId}-thumb`
        }
      />
    ) : (
      fldStrIcon !== undefined &&
      fldStrIcon !== '' && (
        <Text
          style={[
            vwListRowStyles.fldObjIcon,
            fldBooSlim && vwListRowStyles.fldObjIconSmall,
            fldBooMediaTrailing && vwListRowStyles.fldObjMediaTrailing,
          ]}
        >
          {fldStrIcon}
        </Text>
      )
    );
  return (
    <Pressable
      style={[
        vwListRowStyles.fldObjRow,
        fldBooTall && vwListRowStyles.fldObjTall,
        fldBooCompact && vwListRowStyles.fldObjCompact,
        fldBooSlim && vwListRowStyles.fldObjSlim,
        fldBooTight && vwListRowStyles.fldObjTight,
        fldBooIndented && vwListRowStyles.fldObjIndented,
        fldStrRowTone === 'set' && vwListRowStyles.fldObjToneSet,
        fldBooOnLight && vwListRowStyles.fldObjToneMember,
      ]}
      accessibilityRole="button"
      accessibilityLabel={fldStrTitle}
      testID={fldStrTestId}
      onPress={actHandOnPress}
      onLongPress={actHandOnLongPress}
    >
      {fldStrNumber !== undefined && fldStrNumber !== '' && (
        <VwText
          fldStrVariant={fldBooSmallText ? 'body' : 'rowTitle'}
          fldObjStyle={[
            vwListRowStyles.fldObjNumber,
            fldBooOnLight && vwListRowStyles.fldObjOnLight,
          ]}
        >
          {fldStrNumber}
        </VwText>
      )}
      {fldBooChecked !== null && (
        <View style={vwListRowStyles.fldObjCheck}>
          <VwCheckBox fldBooChecked={fldBooChecked} />
        </View>
      )}
      {!fldBooMediaTrailing && fldObjMedia}
      <View style={vwListRowStyles.fldObjTexts}>
        <VwText
          fldStrVariant={fldBooSmallText ? 'body' : 'rowTitle'}
          fldObjStyle={fldBooOnLight && vwListRowStyles.fldObjOnLight}
        >
          {fldStrTitle}
        </VwText>
        {fldStrSubtitle !== null && fldStrSubtitle !== '' && (
          <VwText
            fldStrVariant={fldBooSmallText ? 'caption' : 'rowSubtitle'}
            fldObjStyle={fldBooOnLight && vwListRowStyles.fldObjOnLight}
          >
            {fldStrSubtitle}
          </VwText>
        )}
      </View>
      {fldBooToggle ? (
        <Pressable
          style={vwListRowStyles.fldObjToggle}
          testID={fldStrToggleTestId}
          hitSlop={8}
          onPress={actHandOnTogglePress}
        >
          <VwText fldStrVariant="body">{fldStrToggleGlyph}</VwText>
        </Pressable>
      ) : (
        fldBooChevron && <VwText fldStrVariant="caption">›</VwText>
      )}
      {fldBooMediaTrailing && fldObjMedia}
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
    marginBottom: fldNumSpacingMd,
    minHeight: 72,
  },
  fldObjTall: {
    minHeight: 76,
  },
  fldObjCompact: {
    minHeight: 64,
  },
  fldObjSlim: {
    minHeight: 48,
    paddingVertical: fldNumSpacingSm,
    backgroundColor: colSurfaceLight,
  },
  fldObjTight: {
    marginBottom: fldNumSpacingSm,
  },
  fldObjIndented: {
    marginLeft: fldNumSpacingMd,
  },
  fldObjNumber: {
    fontFamily: fldStrFontFamilyUiMedium,
    marginRight: fldNumSpacingSm,
  },
  fldObjMediaTrailing: {
    marginRight: 0,
    marginLeft: fldNumSpacingSm,
  },
  fldObjToneSet: {
    backgroundColor: colRowSet,
  },
  fldObjToneMember: {
    backgroundColor: colRowMember,
  },
  fldObjOnLight: {
    color: colTextOnAccent,
  },
  fldObjIconSmall: {
    fontSize: 22,
    lineHeight: 26,
  },
  fldObjThumb: {
    width: 36,
    height: 36,
    borderRadius: fldNumRadiusSm,
    marginRight: fldNumSpacingSm,
  },
  fldObjToggle: {
    paddingHorizontal: fldNumSpacingMd,
    paddingVertical: fldNumSpacingSm,
  },
  fldObjCheck: {
    marginRight: fldNumSpacingMd,
  },
  fldObjIcon: {
    fontSize: 28,
    lineHeight: 34,
    marginRight: fldNumSpacingSm,
  },
  fldObjTexts: {
    flex: 1,
  },
});
