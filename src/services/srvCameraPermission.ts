/**
 * Logosphere BITS — camera permission flow (device permission only).
 *
 * Wraps react-native-permissions 5.6.3 for the single CAMERA
 * permission: check the current state, request it, and open the
 * app settings screen when the user is permanently denied
 * (blocked). Results pass through 1:1 in a closed vocabulary —
 * no silent remap. Gallery picking stays independent of the
 * camera permission (no media permission is ever named here);
 * microphone flow belongs to the audio stage; account roles
 * never mix with device permissions (no Auth, persona, demo, or
 * account module is imported).
 * Naming follows D6 (fld / srv / fnc roots).
 */

import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
  type PermissionStatus,
} from 'react-native-permissions';

export type fldStrCameraPermissionStatus =
  | 'unavailable'
  | 'denied'
  | 'limited'
  | 'granted'
  | 'blocked';

function fncConvToCameraStatus(
  fldObjResult: PermissionStatus,
): fldStrCameraPermissionStatus {
  if (
    fldObjResult === RESULTS.UNAVAILABLE ||
    fldObjResult === RESULTS.DENIED ||
    fldObjResult === RESULTS.LIMITED ||
    fldObjResult === RESULTS.GRANTED ||
    fldObjResult === RESULTS.BLOCKED
  ) {
    return fldObjResult;
  }
  throw new Error('Logosphere BITS: unknown camera permission result.');
}

export async function srvApiCheckCameraPermission(): Promise<fldStrCameraPermissionStatus> {
  const fldObjResult = await check(PERMISSIONS.ANDROID.CAMERA);
  return fncConvToCameraStatus(fldObjResult);
}

export async function srvApiRequestCameraPermission(): Promise<fldStrCameraPermissionStatus> {
  const fldObjResult = await request(PERMISSIONS.ANDROID.CAMERA);
  return fncConvToCameraStatus(fldObjResult);
}

export async function srvApiOpenCameraAppSettings(): Promise<void> {
  await openSettings();
}
