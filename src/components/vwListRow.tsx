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
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  fldBooCompact?: boolean;
  fldStrTestId?: string;
  fldStrIcon?: string;
  actHandOnPress?: () => void;
  actHandOnLongPress?: () => void;
};

export function vwListRow({
  fldStrTitle,
  fldStrSubtitle = null,
  fldBooChecked,
  fldBooChevron = false,
  fldBooTall = false,
  fldBooCompact = false,
  fldStrTestId,
  fldStrIcon,
  actHandOnPress,
  actHandOnLongPress,
}: vwListRowProps): React.JSX.Element {
  return (
    <Pressable
      style={[
        vwListRowStyles.fldObjRow,
        fldBooTall && vwListRowStyles.fldObjTall,
        fldBooCompact && vwListRowStyles.fldObjCompact,
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
      {fldStrIcon !== undefined && fldStrIcon !== '' && (
        <Text style={vwListRowStyles.fldObjIcon}>{fldStrIcon}</Text>
      )}
      <View style={vwListRowStyles.fldObjTexts}>
        <VwText fldStrVariant={fldBooCompact ? 'body' : 'rowTitle'}>
          {fldStrTitle}
        </VwText>
        {fldStrSubtitle !== null && fldStrSubtitle !== '' && (
          <VwText fldStrVariant={fldBooCompact ? 'caption' : 'rowSubtitle'}>
            {fldStrSubtitle}
          </VwText>
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
    marginBottom: fldNumSpacingMd,
    minHeight: 72,
  },
  fldObjTall: {
    minHeight: 76,
  },
  fldObjCompact: {
    minHeight: 64,
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
