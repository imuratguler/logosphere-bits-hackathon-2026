/**
 * Logosphere BITS — UUID v4 generation (no dependency).
 *
 * Prefers the platform `crypto.randomUUID`, falls back to
 * `crypto.getRandomValues`, then to `Math.random`; every path
 * yields a valid v4 string. Draft entries take their stable
 * identity from here. Naming follows D6 (fld / fnc roots).
 */

/* eslint-disable no-bitwise -- UUID v4 variant/version bits need masking. */

function fncConvHexByte(fldNumValue: number): string {
  return fldNumValue.toString(16).padStart(2, '0');
}

function fncMakeUuidFromBytes(fldArrBytes: ArrayLike<number>): string {
  const fldArrHex: string[] = [];
  for (let fldNumIndex = 0; fldNumIndex < 16; fldNumIndex += 1) {
    fldArrHex.push(fncConvHexByte(fldArrBytes[fldNumIndex] ?? 0));
  }
  // Version 4 + RFC 4122 variant bits.
  fldArrHex[6] = ((parseInt(fldArrHex[6] ?? '0', 16) & 0x0f) | 0x40)
    .toString(16)
    .padStart(2, '0');
  fldArrHex[8] = ((parseInt(fldArrHex[8] ?? '0', 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');
  return (
    `${fldArrHex.slice(0, 4).join('')}-` +
    `${fldArrHex.slice(4, 6).join('')}-` +
    `${fldArrHex.slice(6, 8).join('')}-` +
    `${fldArrHex.slice(8, 10).join('')}-` +
    `${fldArrHex.slice(10, 16).join('')}`
  );
}

function fncMakeUuidFallback(): string {
  const fldArrBytes: number[] = [];
  for (let fldNumIndex = 0; fldNumIndex < 16; fldNumIndex += 1) {
    fldArrBytes.push(Math.floor(Math.random() * 256));
  }
  return fncMakeUuidFromBytes(fldArrBytes);
}

export function fncMakeUuid(): string {
  const fldObjCrypto = (
    globalThis as unknown as {
      crypto?: {
        randomUUID?: () => string;
        getRandomValues?: (fldArrTarget: Uint8Array) => Uint8Array;
      };
    }
  ).crypto;
  if (typeof fldObjCrypto?.randomUUID === 'function') {
    return fldObjCrypto.randomUUID();
  }
  if (typeof fldObjCrypto?.getRandomValues === 'function') {
    return fncMakeUuidFromBytes(
      fldObjCrypto.getRandomValues(new Uint8Array(16)),
    );
  }
  return fncMakeUuidFallback();
}
