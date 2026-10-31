/**
 * Logosphere BITS — EXIF orientation parsing (pure, no IO).
 *
 * Reads the JPEG orientation tag (0x0112) so gallery files can
 * bake the camera's orientation into analysis pixels together
 * with the user's rotation. Anything malformed, truncated, or
 * non-JPEG resolves to identity (no rotation, no mirror) and
 * the user's rotation still applies. Naming follows D6
 * (fld / vld / fnc roots).
 */

/* eslint-disable no-bitwise -- binary JPEG/TIFF parsing reads multi-byte integers. */

export type fldObjExifOrientation = {
  fldNumDegrees: number;
  fldBooMirror: boolean;
};

const fldStrBase64Alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function fncDecodeBase64(fldStrInput: string): Uint8Array {
  const fldArrBytes: number[] = [];
  let fldNumBuffer = 0;
  let fldNumBits = 0;
  for (const fldStrChar of fldStrInput) {
    if (fldStrChar === '=') {
      break;
    }
    const fldNumValue = fldStrBase64Alphabet.indexOf(fldStrChar);
    if (fldNumValue < 0) {
      continue;
    }
    fldNumBuffer = (fldNumBuffer << 6) | fldNumValue;
    fldNumBits += 6;
    if (fldNumBits >= 8) {
      fldNumBits -= 8;
      fldArrBytes.push((fldNumBuffer >> fldNumBits) & 0xff);
      fldNumBuffer &= (1 << fldNumBits) - 1;
    }
  }
  return Uint8Array.from(fldArrBytes);
}

function fncConvOrientation(fldNumValue: number): fldObjExifOrientation | null {
  switch (fldNumValue) {
    case 1:
      return { fldNumDegrees: 0, fldBooMirror: false };
    case 2:
      return { fldNumDegrees: 0, fldBooMirror: true };
    case 3:
      return { fldNumDegrees: 180, fldBooMirror: false };
    case 4:
      return { fldNumDegrees: 180, fldBooMirror: true };
    case 5:
      return { fldNumDegrees: 90, fldBooMirror: true };
    case 6:
      return { fldNumDegrees: 90, fldBooMirror: false };
    case 7:
      return { fldNumDegrees: 270, fldBooMirror: true };
    case 8:
      return { fldNumDegrees: 270, fldBooMirror: false };
    default:
      return null;
  }
}

function fncReadU16(
  fldArrBytes: Uint8Array,
  fldNumOffset: number,
  fldBooLittleEndian: boolean,
): number | null {
  if (fldNumOffset + 1 >= fldArrBytes.length) {
    return null;
  }
  const fldNumLow = fldArrBytes[fldNumOffset] ?? 0;
  const fldNumHigh = fldArrBytes[fldNumOffset + 1] ?? 0;
  return fldBooLittleEndian
    ? fldNumLow | (fldNumHigh << 8)
    : (fldNumLow << 8) | fldNumHigh;
}

function fncReadU32(
  fldArrBytes: Uint8Array,
  fldNumOffset: number,
  fldBooLittleEndian: boolean,
): number | null {
  if (fldNumOffset + 3 >= fldArrBytes.length) {
    return null;
  }
  const fldNumB0 = fldArrBytes[fldNumOffset] ?? 0;
  const fldNumB1 = fldArrBytes[fldNumOffset + 1] ?? 0;
  const fldNumB2 = fldArrBytes[fldNumOffset + 2] ?? 0;
  const fldNumB3 = fldArrBytes[fldNumOffset + 3] ?? 0;
  return fldBooLittleEndian
    ? fldNumB0 | (fldNumB1 << 8) | (fldNumB2 << 16) | (fldNumB3 * 0x1000000)
    : (fldNumB0 * 0x1000000) | (fldNumB1 << 16) | (fldNumB2 << 8) | fldNumB3;
}

function fncParseExifBlock(
  fldArrBytes: Uint8Array,
  fldNumStart: number,
  fldNumEnd: number,
): fldObjExifOrientation | null {
  // "Exif\0\0" header, then the TIFF header.
  if (fldNumStart + 14 > fldNumEnd) {
    return null;
  }
  const fldStrHeader = String.fromCharCode(
    ...(fldArrBytes.slice(fldNumStart, fldNumStart + 6) as Uint8Array),
  );
  if (fldStrHeader !== 'Exif\0\0') {
    return null;
  }
  const fldNumTiff = fldNumStart + 6;
  const fldNumOrder0 = fldArrBytes[fldNumTiff] ?? 0;
  const fldNumOrder1 = fldArrBytes[fldNumTiff + 1] ?? 0;
  const fldBooLittleEndian = fldNumOrder0 === 0x49 && fldNumOrder1 === 0x49;
  const fldBooBigEndian = fldNumOrder0 === 0x4d && fldNumOrder1 === 0x4d;
  if (!fldBooLittleEndian && !fldBooBigEndian) {
    return null;
  }
  if (fncReadU16(fldArrBytes, fldNumTiff + 2, fldBooLittleEndian) !== 42) {
    return null;
  }
  const fldNumIfd0 = fncReadU32(
    fldArrBytes,
    fldNumTiff + 4,
    fldBooLittleEndian,
  );
  if (fldNumIfd0 === null || fldNumIfd0 < 8) {
    return null;
  }
  const fldNumCount = fncReadU16(
    fldArrBytes,
    fldNumTiff + fldNumIfd0,
    fldBooLittleEndian,
  );
  if (fldNumCount === null || fldNumCount > 200) {
    return null;
  }
  for (let fldNumIndex = 0; fldNumIndex < fldNumCount; fldNumIndex += 1) {
    const fldNumEntry = fldNumTiff + fldNumIfd0 + 2 + fldNumIndex * 12;
    if (fldNumEntry + 12 > fldNumEnd) {
      return null;
    }
    const fldNumTag = fncReadU16(fldArrBytes, fldNumEntry, fldBooLittleEndian);
    if (fldNumTag !== 0x0112) {
      continue;
    }
    const fldNumType = fncReadU16(
      fldArrBytes,
      fldNumEntry + 2,
      fldBooLittleEndian,
    );
    const fldNumValues = fncReadU32(
      fldArrBytes,
      fldNumEntry + 4,
      fldBooLittleEndian,
    );
    if (fldNumType !== 3 || fldNumValues !== 1) {
      return null;
    }
    const fldNumValue = fncReadU16(
      fldArrBytes,
      fldNumEntry + 8,
      fldBooLittleEndian,
    );
    if (fldNumValue === null) {
      return null;
    }
    return fncConvOrientation(fldNumValue);
  }
  return null;
}

function fncBooStandaloneMarker(fldNumMarker: number): boolean {
  if (fldNumMarker === 0x01) {
    return true;
  }
  return fldNumMarker >= 0xd0 && fldNumMarker <= 0xd9;
}

export function vldParseExifOrientation(
  fldArrBytes: Uint8Array,
): fldObjExifOrientation {
  const fldObjIdentity = { fldNumDegrees: 0, fldBooMirror: false };
  if (fldArrBytes.length < 4) {
    return fldObjIdentity;
  }
  if (fldArrBytes[0] !== 0xff || fldArrBytes[1] !== 0xd8) {
    return fldObjIdentity;
  }
  let fldNumOffset = 2;
  while (fldNumOffset + 1 < fldArrBytes.length) {
    if (fldArrBytes[fldNumOffset] !== 0xff) {
      return fldObjIdentity;
    }
    const fldNumMarker = fldArrBytes[fldNumOffset + 1] ?? 0;
    if (fldNumMarker === 0xda) {
      return fldObjIdentity;
    }
    if (fncBooStandaloneMarker(fldNumMarker)) {
      fldNumOffset += 2;
      continue;
    }
    if (fldNumOffset + 3 >= fldArrBytes.length) {
      return fldObjIdentity;
    }
    const fldNumLength =
      ((fldArrBytes[fldNumOffset + 2] ?? 0) << 8) |
      (fldArrBytes[fldNumOffset + 3] ?? 0);
    if (fldNumLength < 2) {
      return fldObjIdentity;
    }
    const fldNumStart = fldNumOffset + 4;
    const fldNumEnd = fldNumOffset + 2 + fldNumLength;
    if (fldNumEnd > fldArrBytes.length) {
      return fldObjIdentity;
    }
    if (fldNumMarker === 0xe1) {
      const fldObjFound = fncParseExifBlock(
        fldArrBytes,
        fldNumStart,
        fldNumEnd,
      );
      if (fldObjFound !== null) {
        return fldObjFound;
      }
    }
    fldNumOffset = fldNumEnd;
  }
  return fldObjIdentity;
}
