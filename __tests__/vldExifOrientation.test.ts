/**
 * Logosphere BITS — EXIF orientation tests (pure, crafted buffers).
 */

/* eslint-disable no-bitwise -- crafted JPEG fixtures pack multi-byte lengths. */

import {
  fncDecodeBase64,
  vldParseExifOrientation,
} from '../src/validation/vldExifOrientation';

function fncMakeJpeg(
  fldNumOrientation: number,
  fldBooLittleEndian: boolean,
): Uint8Array {
  const fldArrTiff: number[] = fldBooLittleEndian
    ? [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00]
    : [0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01];
  const fldArrEntry: number[] = fldBooLittleEndian
    ? [
        0x12,
        0x01,
        0x03,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        fldNumOrientation,
        0x00,
        0x00,
        0x00,
      ]
    : [
        0x01,
        0x12,
        0x00,
        0x03,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        fldNumOrientation,
        0x00,
        0x00,
      ];
  const fldArrExif = [
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    ...fldArrTiff,
    ...fldArrEntry,
  ];
  const fldNumLength = fldArrExif.length + 2;
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    fldNumLength >> 8,
    fldNumLength & 0xff,
    ...fldArrExif,
    0xff,
    0xd9,
  ]);
}

const fldArrExpected: Array<[number, number, boolean]> = [
  [1, 0, false],
  [2, 0, true],
  [3, 180, false],
  [4, 180, true],
  [5, 90, true],
  [6, 90, false],
  [7, 270, true],
  [8, 270, false],
];

describe('vldParseExifOrientation', () => {
  it.each(fldArrExpected)(
    'maps little-endian value %i to %i degrees mirror %s',
    (fldNumValue, fldNumDegrees, fldBooMirror) => {
      expect(vldParseExifOrientation(fncMakeJpeg(fldNumValue, true))).toEqual({
        fldNumDegrees,
        fldBooMirror,
      });
    },
  );

  it.each(fldArrExpected)(
    'maps big-endian value %i to %i degrees mirror %s',
    (fldNumValue, fldNumDegrees, fldBooMirror) => {
      expect(vldParseExifOrientation(fncMakeJpeg(fldNumValue, false))).toEqual({
        fldNumDegrees,
        fldBooMirror,
      });
    },
  );

  it('resolves unknown values and malformed input to identity', () => {
    const fldObjIdentity = { fldNumDegrees: 0, fldBooMirror: false };
    expect(vldParseExifOrientation(fncMakeJpeg(9, true))).toEqual(
      fldObjIdentity,
    );
    expect(vldParseExifOrientation(new Uint8Array([]))).toEqual(fldObjIdentity);
    expect(
      vldParseExifOrientation(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toEqual(fldObjIdentity);
    // Truncated mid-EXIF.
    expect(vldParseExifOrientation(fncMakeJpeg(6, true).slice(0, 20))).toEqual(
      fldObjIdentity,
    );
    // JPEG with only an APP0 block (no EXIF).
    expect(
      vldParseExifOrientation(
        Uint8Array.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
          0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9,
        ]),
      ),
    ).toEqual(fldObjIdentity);
  });

  it('skips to later APP1 blocks', () => {
    const fldArrFirst = fncMakeJpeg(6, true);
    // Corrupt the first EXIF magic so the parser must continue.
    fldArrFirst[6] = 0x00;
    const fldArrSecond = fncMakeJpeg(3, true).slice(2);
    const fldArrBoth = Uint8Array.from([
      ...fldArrFirst.slice(0, fldArrFirst.length - 2),
      ...fldArrSecond,
    ]);
    expect(vldParseExifOrientation(fldArrBoth)).toEqual({
      fldNumDegrees: 180,
      fldBooMirror: false,
    });
  });
});

describe('fncDecodeBase64', () => {
  it('decodes padded and unpadded input', () => {
    expect(Array.from(fncDecodeBase64('TWFu'))).toEqual([77, 97, 110]);
    expect(Array.from(fncDecodeBase64('TWE='))).toEqual([77, 97]);
    expect(Array.from(fncDecodeBase64('TQ=='))).toEqual([77]);
  });

  it('ignores whitespace and stops at padding', () => {
    expect(Array.from(fncDecodeBase64('TW\nFu==ignored'))).toEqual([
      77, 97, 110,
    ]);
  });
});
