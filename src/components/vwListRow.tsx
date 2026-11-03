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
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { vwCheckBox as VwCheckBox } from './vwCheckBox';
import { vwText as VwText } from './vwText';
import {
  colSurface,
  colSurfaceLight,
  fldNumRadiusMd,
  fldNumRadiusSm,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type vwListRowProps = {
  fldStrTitle: string;
  fldStrSubtitle?: string | null;
  fldBooChecked: boolean | null;
  fldBooChevron?: boolean;
  fldBooTall?: boolean;
  fldBooCompact?: boolean;
  fldBooSlim?: boolean;
  fldBooTight?: boolean;
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
  fldBooChecked,
  fldBooChevron = false,
  fldBooTall = false,
  fldBooCompact = false,
  fldBooSlim = false,
  fldBooTight = false,
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
  return (
    <Pressable
      style={[
        vwListRowStyles.fldObjRow,
        fldBooTall && vwListRowStyles.fldObjTall,
        fldBooCompact && vwListRowStyles.fldObjCompact,
        fldBooSlim && vwListRowStyles.fldObjSlim,
        fldBooTight && vwListRowStyles.fldObjTight,
      ]}
      accessibilityRole="button"
      accessibilityLabel={fldStrTitle}
      testID={fldStrTestId}
      onPress={actHandOnPress}
      onLongPress={actHandOnLongPress}
    >
      {fldBooChecked !== null && (
        <View style={vwListRowStyles.fldObjCheck}>
          <VwCheckBox fldBooChecked={fldBooChecked} />
        </View>
      )}
      {fldStrThumbnailUri !== null && fldStrThumbnailUri !== '' ? (
        <Image
          style={vwListRowStyles.fldObjThumb}
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
            ]}
          >
            {fldStrIcon}
          </Text>
        )
      )}
      <View style={vwListRowStyles.fldObjTexts}>
        <VwText fldStrVariant={fldBooSmallText ? 'body' : 'rowTitle'}>
          {fldStrTitle}
        </VwText>
        {fldStrSubtitle !== null && fldStrSubtitle !== '' && (
          <VwText fldStrVariant={fldBooSmallText ? 'caption' : 'rowSubtitle'}>
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
