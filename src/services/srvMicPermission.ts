/**
 * Logosphere BITS — microphone permission flow (device permission only).
 *
 * Wraps react-native-permissions 5.6.3 for the single Android
 * RECORD_AUDIO permission: check the current state, request it,
 * and open the app settings screen when the user is permanently
 * denied (blocked). Results pass through 1:1 in a closed
 * vocabulary — no silent remap. The permission covers voice-note
 * recording only; camera, gallery, and account paths never mix
 * in (no Auth, persona, demo, or account module is imported).
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

export type fldStrMicPermissionStatus =
  | 'unavailable'
  | 'denied'
  | 'limited'
  | 'granted'
  | 'blocked';

function fncConvToMicStatus(
  fldObjResult: PermissionStatus,
): fldStrMicPermissionStatus {
  if (
    fldObjResult === RESULTS.UNAVAILABLE ||
    fldObjResult === RESULTS.DENIED ||
    fldObjResult === RESULTS.LIMITED ||
    fldObjResult === RESULTS.GRANTED ||
    fldObjResult === RESULTS.BLOCKED
  ) {
    return fldObjResult;
  }
  throw new Error('Logosphere BITS: unknown microphone permission result.');
}

export async function srvApiCheckMicPermission(): Promise<fldStrMicPermissionStatus> {
  const fldObjResult = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
  return fncConvToMicStatus(fldObjResult);
}

export async function srvApiRequestMicPermission(): Promise<fldStrMicPermissionStatus> {
  const fldObjResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
  return fncConvToMicStatus(fldObjResult);
}

export async function srvApiOpenMicAppSettings(): Promise<void> {
  await openSettings();
}
