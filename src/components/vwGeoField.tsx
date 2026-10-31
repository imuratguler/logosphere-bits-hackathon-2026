/**
 * Logosphere BITS — geo reference field (presentational only).
 *
 * One address-hierarchy level: a caption, a combined search and
 * free-text input, and the matching reference rows. The parent owns
 * the text, the loaded options, and the selection; this block only
 * renders them. An empty option list renders no rows, leaving free
 * text as the only path — exactly right for levels with no loaded
 * rows. Naming follows D6 (fld / vw / act roots).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { fldObjGeoNode } from '../services/srvDemoGeo';
import { fldNumSpacingSm } from '../utils/utlTheme';
import { vwButton as VwButton } from './vwButton';
import { vwText as VwText } from './vwText';
import { vwTextInput as VwTextInput } from './vwTextInput';

type vwGeoFieldProps = {
  fldStrLabel: string;
  fldStrText: string;
  actHandOnText: (fldStrValue: string) => void;
  fldStrSearchPlaceholder: string;
  fldArrOptions: fldObjGeoNode[];
  actHandOnSelect: (fldObjNode: fldObjGeoNode) => void;
  fldBooDisabled?: boolean;
};

export function vwGeoField({
  fldStrLabel,
  fldStrText,
  actHandOnText,
  fldStrSearchPlaceholder,
  fldArrOptions,
  actHandOnSelect,
  fldBooDisabled = false,
}: vwGeoFieldProps): React.JSX.Element {
  return (
    <View>
      <VwText fldStrVariant="caption">{fldStrLabel}</VwText>
      <View style={vwGeoFieldStyles.fldObjGap}>
        <VwTextInput
          fldStrValue={fldStrText}
          actHandOnChange={actHandOnText}
          fldStrPlaceholder={fldStrSearchPlaceholder}
          fldBooDisabled={fldBooDisabled}
        />
      </View>
      {fldArrOptions.map(fldObjNode => (
        <View key={fldObjNode.fldStrId} style={vwGeoFieldStyles.fldObjRow}>
          <VwButton
            fldStrLabel={fldObjNode.fldStrName}
            fldBooDisabled={fldBooDisabled}
            actHandOnPress={() => {
              actHandOnSelect(fldObjNode);
            }}
          />
        </View>
      ))}
    </View>
  );
}

const vwGeoFieldStyles = StyleSheet.create({
  fldObjGap: {
    marginTop: fldNumSpacingSm,
  },
  fldObjRow: {
    marginTop: fldNumSpacingSm,
  },
});
