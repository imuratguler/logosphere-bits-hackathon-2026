/**
 * Logosphere BITS — capture entry validation (no DB, no IO).
 *
 * Single home of the D10 capture-mode vocabulary: the leaf
 * entries open the same camera with exactly one mode, chosen
 * once at entry. Anything outside the vocabulary fails closed
 * at the camera gate (error state, no session, no capture).
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld roots).
 */

import type { fldStrCaptureMode } from '../types/typModels';

export function vldChgIsCaptureMode(
  fldStrValue: string,
): fldStrValue is fldStrCaptureMode {
  return fldStrValue === 'single' || fldStrValue === 'bulk';
}
