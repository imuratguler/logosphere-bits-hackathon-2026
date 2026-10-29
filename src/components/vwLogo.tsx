/**
 * Logosphere BITS — reusable in-app logo (presentational only).
 *
 * Uses the project copy of the approved docs logo, which already contains
 * the "Logosphere" wordmark: never render the same text next to it.
 * Aspect ratio is locked to the source file (1920x2480): height is
 * derived from width, so the ratio holds on every layout engine.
 * Transparency shows the backdrop, so place it on a contrasting background.
 */

import React from 'react';
import { Image } from 'react-native';

const fldNumLogoAspect = 1920 / 2480;

type vwLogoProps = {
  fldNumWidth?: number;
};

export function vwLogo({ fldNumWidth = 160 }: vwLogoProps): React.JSX.Element {
  const fldNumHeight = fldNumWidth / fldNumLogoAspect;
  return (
    <Image
      source={require('../../assets/brand/logo-docs-bits.png')}
      style={{ width: fldNumWidth, height: fldNumHeight }}
      resizeMode="contain"
    />
  );
}
