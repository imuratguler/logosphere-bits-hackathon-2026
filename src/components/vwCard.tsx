/**
 * Logosphere BITS — shared card container (presentational only).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colSurface, fldNumRadiusLg, fldNumSpacingLg } from '../utils/utlTheme';

type vwCardProps = {
  children: React.ReactNode;
};

export function vwCard({ children }: vwCardProps): React.JSX.Element {
  return <View style={vwCardStyles.fldObjCard}>{children}</View>;
}

const vwCardStyles = StyleSheet.create({
  fldObjCard: {
    backgroundColor: colSurface,
    borderRadius: fldNumRadiusLg,
    padding: fldNumSpacingLg,
  },
});
