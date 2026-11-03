// Logosphere BITS — voice-note audio guard tests (Deno).
// A minimal synthetic M4A (ftyp + moov/trak/mdia/mdhd and
// stsd/mp4a) proves format sniffing plus duration and rate
// parsing; oversized, overlong, off-rate, and non-M4A
// inputs must fail closed. Batching caps follow the Baseten
// contract (4 audio, 8 images per call).

import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  fldNumImageMaxPerCall,
  fldNumVoiceMaxBytes,
  fldNumVoiceMaxPerCall,
  fldNumVoiceMaxSec,
  fncConvBatches,
  fncConvParseM4aInfo,
  fncConvSniffVoiceFormat,
  fncRunValidateVoiceBytes,
} from './voice.ts';

function fncConvBox(
  fldStrType: string,
  fldObjContent: Uint8Array,
): Uint8Array {
  const fldObjOut = new Uint8Array(8 + fldObjContent.length);
  const fldObjView = new DataView(fldObjOut.buffer);
  fldObjView.setUint32(0, fldObjOut.length);
  for (let fldNumAt = 0; fldNumAt < 4; fldNumAt += 1) {
    fldObjOut[4 + fldNumAt] = fldStrType.charCodeAt(fldNumAt);
  }
  fldObjOut.set(fldObjContent, 8);
  return fldObjOut;
}

function fncConvJoin(fldArrParts: Uint8Array[]): Uint8Array {
  let fldNumTotal = 0;
  for (const fldObjPart of fldArrParts) {
    fldNumTotal += fldObjPart.length;
  }
  const fldObjOut = new Uint8Array(fldNumTotal);
  let fldNumAt = 0;
  for (const fldObjPart of fldArrParts) {
    fldObjOut.set(fldObjPart, fldNumAt);
    fldNumAt += fldObjPart.length;
  }
  return fldObjOut;
}

function fncConvM4a(
  fldNumTimescale: number,
  fldNumDuration: number,
  fldNumRateHz: number,
): Uint8Array {
  const fldObjFtyp = fncConvBox(
    'ftyp',
    new Uint8Array([
      0x4d,
      0x34,
      0x41,
      0x20,
      0x00,
      0x00,
      0x00,
      0x00,
      0x4d,
      0x34,
      0x41,
      0x20,
    ]),
  );
  const fldObjMdhdContent = new Uint8Array(24);
  const fldObjMdhdView = new DataView(fldObjMdhdContent.buffer);
  fldObjMdhdView.setUint32(12, fldNumTimescale);
  fldObjMdhdView.setUint32(16, fldNumDuration);
  const fldObjMdhd = fncConvBox('mdhd', fldObjMdhdContent);
  const fldObjMp4aContent = new Uint8Array(28);
  const fldObjMp4aView = new DataView(fldObjMp4aContent.buffer);
  fldObjMp4aView.setUint16(22, 2);
  fldObjMp4aView.setUint32(24, fldNumRateHz * 65536);
  const fldObjMp4a = fncConvBox('mp4a', fldObjMp4aContent);
  const fldObjStsdContent = fncConvJoin([
    new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
    fldObjMp4a,
  ]);
  const fldObjTrak = fncConvBox(
    'trak',
    fncConvBox(
      'mdia',
      fncConvJoin([
        fldObjMdhd,
        fncConvBox(
          'minf',
          fncConvBox('stbl', fncConvBox('stsd', fldObjStsdContent)),
        ),
      ]),
    ),
  );
  return fncConvJoin([fldObjFtyp, fncConvBox('moov', fldObjTrak)]);
}

Deno.test('voice sniff accepts the M4A brand', () => {
  assertEquals(fncConvSniffVoiceFormat(fncConvM4a(44100, 44100, 44100)), 'm4a');
});

Deno.test('voice sniff rejects non-M4A bytes', () => {
  assertEquals(
    fncConvSniffVoiceFormat(new Uint8Array([0x49, 0x44, 0x33, 0x03])),
    null,
  );
  assertEquals(fncConvSniffVoiceFormat(new Uint8Array(0)), null);
});

Deno.test('voice parse reads duration and sample rate', () => {
  const fldObjInfo = fncConvParseM4aInfo(fncConvM4a(44100, 88200, 44100));
  assertEquals(fldObjInfo.durationSec, 2);
  assertEquals(fldObjInfo.sampleRateHz, 44100);
});

Deno.test('voice validation accepts a normal note', () => {
  const fldObjValid = fncRunValidateVoiceBytes(fncConvM4a(44100, 44100, 44100));
  assertEquals(fldObjValid.format, 'm4a');
  assertEquals(fldObjValid.durationSec, 1);
  assertEquals(fldObjValid.sampleRateHz, 44100);
});

Deno.test('voice validation fails closed on bad inputs', () => {
  assertThrows(
    () => fncRunValidateVoiceBytes(new Uint8Array(0)),
    Error,
    'empty voice file',
  );
  assertThrows(
    () => fncRunValidateVoiceBytes(new Uint8Array([1, 2, 3, 4])),
    Error,
    'unsupported voice format',
  );
  assertThrows(
    () =>
      fncRunValidateVoiceBytes(
        fncConvM4a(44100, 44100 * (fldNumVoiceMaxSec + 1), 44100),
      ),
    Error,
    'exceeds 5 minutes',
  );
  assertThrows(
    () => fncRunValidateVoiceBytes(fncConvM4a(44100, 44100, 64000)),
    Error,
    '8-48 kHz',
  );
  const fldObjBig = new Uint8Array(fldNumVoiceMaxBytes + 1);
  fldObjBig.set([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], 0);
  assertThrows(
    () => fncRunValidateVoiceBytes(fldObjBig),
    Error,
    'exceeds 25 MB',
  );
});

Deno.test('voice batching caps audio at four and images at eight', () => {
  assertEquals(fldNumVoiceMaxPerCall, 4);
  assertEquals(fldNumImageMaxPerCall, 8);
  const fldArrNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const fldArrBatches = fncConvBatches(fldArrNine, fldNumImageMaxPerCall);
  assertEquals(fldArrBatches.length, 2);
  assertEquals(fldArrBatches[0]!.length, 8);
  assertEquals(fldArrBatches[1], [9]);
  assert(fncConvBatches([], 4).length === 0);
});
