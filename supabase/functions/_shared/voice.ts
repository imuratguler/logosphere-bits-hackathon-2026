// Logosphere BITS — voice-note audio guards (shared).
// The pipeline permits M4A/AAC only: the sniffer reads the
// ftyp major brand, the parser walks moov boxes for mdhd
// duration and mp4a sample rate, and the validator enforces
// the Baseten audio caps (8-48 kHz, 5 minutes, 25 MB, 4
// files per call) before any byte leaves for inference.
// Unparseable duration or rate passes through honestly — a
// missing measurement is not an exceeded limit. Batching
// caps live here so vision (8 images) and audio (4 files)
// share one source. Identifiers follow D6.

export const fldNumVoiceMaxBytes = 25000000;
export const fldNumVoiceMaxSec = 300;
export const fldNumVoiceMinRateHz = 8000;
export const fldNumVoiceMaxRateHz = 48000;
export const fldNumVoiceMaxPerCall = 4;
export const fldNumImageMaxPerCall = 8;
export const fldNumVoiceSignedUrlSec = 300;
export const fldNumVoiceMaxDataUrlBytes = 1000000;

const fldArrM4aBrands = [
  'M4A ',
  'M4B ',
  'M4P ',
  'mp41',
  'mp42',
  'isom',
  'iso2',
];

export type fldObjM4aInfo = {
  durationSec: number | null;
  sampleRateHz: number | null;
};

export type fldObjVoiceValid = {
  format: 'm4a';
  durationSec: number | null;
  sampleRateHz: number | null;
};

type fldObjBox = {
  fldStrType: string;
  fldNumContentAt: number;
  fldNumContentEnd: number;
};

function fncConvReadU32(
  fldObjBytes: Uint8Array,
  fldNumAt: number,
): number | null {
  if (fldNumAt < 0 || fldNumAt + 4 > fldObjBytes.length) {
    return null;
  }
  return new DataView(
    fldObjBytes.buffer,
    fldObjBytes.byteOffset + fldNumAt,
    4,
  ).getUint32(0);
}

function fncConvBoxAt(
  fldObjBytes: Uint8Array,
  fldNumAt: number,
  fldNumEnd: number,
): fldObjBox | null {
  const fldNumSize = fncConvReadU32(fldObjBytes, fldNumAt);
  if (fldNumSize === null || fldNumAt + 8 > fldNumEnd) {
    return null;
  }
  const fldStrType = String.fromCharCode(
    fldObjBytes[fldNumAt + 4]!,
    fldObjBytes[fldNumAt + 5]!,
    fldObjBytes[fldNumAt + 6]!,
    fldObjBytes[fldNumAt + 7]!,
  );
  if (fldNumSize === 0) {
    return {
      fldStrType,
      fldNumContentAt: fldNumAt + 8,
      fldNumContentEnd: fldNumEnd,
    };
  }
  if (fldNumSize === 1) {
    if (fldNumAt + 16 > fldNumEnd || fldNumAt + 16 > fldObjBytes.length) {
      return null;
    }
    const fldObjView = new DataView(
      fldObjBytes.buffer,
      fldObjBytes.byteOffset + fldNumAt + 8,
      8,
    );
    const fldNumLarge = Number(fldObjView.getBigUint64(0));
    if (!Number.isSafeInteger(fldNumLarge) || fldNumLarge < 16) {
      return null;
    }
    return {
      fldStrType,
      fldNumContentAt: fldNumAt + 16,
      fldNumContentEnd: Math.min(fldNumAt + fldNumLarge, fldNumEnd),
    };
  }
  if (fldNumSize < 8) {
    return null;
  }
  return {
    fldStrType,
    fldNumContentAt: fldNumAt + 8,
    fldNumContentEnd: Math.min(fldNumAt + fldNumSize, fldNumEnd),
  };
}

function fncConvChildren(
  fldObjBytes: Uint8Array,
  fldNumStart: number,
  fldNumEnd: number,
): fldObjBox[] {
  const fldArrOut: fldObjBox[] = [];
  let fldNumAt = fldNumStart;
  while (fldNumAt + 8 <= fldNumEnd) {
    const fldObjBox = fncConvBoxAt(fldObjBytes, fldNumAt, fldNumEnd);
    if (fldObjBox === null || fldObjBox.fldNumContentEnd <= fldNumAt) {
      break;
    }
    fldArrOut.push(fldObjBox);
    fldNumAt = fldObjBox.fldNumContentEnd;
  }
  return fldArrOut;
}

function fncConvFirstChild(
  fldObjBytes: Uint8Array,
  fldObjParent: fldObjBox,
  fldStrType: string,
): fldObjBox | null {
  const fldArrChildren = fncConvChildren(
    fldObjBytes,
    fldObjParent.fldNumContentAt,
    fldObjParent.fldNumContentEnd,
  );
  return fldArrChildren.find((fldObjBox) =>
    fldObjBox.fldStrType === fldStrType
  ) ??
    null;
}

export function fncConvSniffVoiceFormat(
  fldObjBytes: Uint8Array,
): 'm4a' | null {
  if (fldObjBytes.length < 12) {
    return null;
  }
  const fldStrType = String.fromCharCode(
    fldObjBytes[4]!,
    fldObjBytes[5]!,
    fldObjBytes[6]!,
    fldObjBytes[7]!,
  );
  if (fldStrType !== 'ftyp') {
    return null;
  }
  const fldStrBrand = String.fromCharCode(
    fldObjBytes[8]!,
    fldObjBytes[9]!,
    fldObjBytes[10]!,
    fldObjBytes[11]!,
  );
  return fldArrM4aBrands.includes(fldStrBrand) ? 'm4a' : null;
}

function fncConvMdhdDuration(
  fldObjBytes: Uint8Array,
  fldObjMdhd: fldObjBox,
): number | null {
  const fldNumVersion = fldObjBytes[fldObjMdhd.fldNumContentAt];
  if (fldNumVersion === 0) {
    const fldNumScale = fncConvReadU32(
      fldObjBytes,
      fldObjMdhd.fldNumContentAt + 12,
    );
    const fldNumTicks = fncConvReadU32(
      fldObjBytes,
      fldObjMdhd.fldNumContentAt + 16,
    );
    if (fldNumScale === null || fldNumTicks === null || fldNumScale === 0) {
      return null;
    }
    return Math.floor(fldNumTicks / fldNumScale);
  }
  if (fldNumVersion === 1) {
    const fldNumScale = fncConvReadU32(
      fldObjBytes,
      fldObjMdhd.fldNumContentAt + 20,
    );
    if (fldNumScale === null || fldNumScale === 0) {
      return null;
    }
    const fldNumAt = fldObjMdhd.fldNumContentAt + 24;
    if (fldNumAt + 8 > fldObjBytes.length) {
      return null;
    }
    const fldNumTicks = Number(
      new DataView(
        fldObjBytes.buffer,
        fldObjBytes.byteOffset + fldNumAt,
        8,
      ).getBigUint64(0),
    );
    if (!Number.isSafeInteger(fldNumTicks)) {
      return null;
    }
    return Math.floor(fldNumTicks / fldNumScale);
  }
  return null;
}

function fncConvMp4aRate(
  fldObjBytes: Uint8Array,
  fldObjMp4a: fldObjBox,
): number | null {
  const fldNumRaw = fncConvReadU32(
    fldObjBytes,
    fldObjMp4a.fldNumContentAt + 24,
  );
  if (fldNumRaw === null) {
    return null;
  }
  const fldNumRate = fldNumRaw >>> 16;
  return fldNumRate > 0 ? fldNumRate : null;
}

export function fncConvParseM4aInfo(fldObjBytes: Uint8Array): fldObjM4aInfo {
  const fldObjEmpty: fldObjM4aInfo = { durationSec: null, sampleRateHz: null };
  const fldArrTop = fncConvChildren(fldObjBytes, 0, fldObjBytes.length);
  const fldObjMoov =
    fldArrTop.find((fldObjBox) => fldObjBox.fldStrType === 'moov') ?? null;
  if (fldObjMoov === null) {
    return fldObjEmpty;
  }
  const fldObjTrak = fncConvFirstChild(fldObjBytes, fldObjMoov, 'trak');
  if (fldObjTrak === null) {
    return fldObjEmpty;
  }
  const fldObjMdia = fncConvFirstChild(fldObjBytes, fldObjTrak, 'mdia');
  if (fldObjMdia === null) {
    return fldObjEmpty;
  }
  const fldObjMdhd = fncConvFirstChild(fldObjBytes, fldObjMdia, 'mdhd');
  const fldObjMinf = fncConvFirstChild(fldObjBytes, fldObjMdia, 'minf');
  const fldObjStbl = fldObjMinf === null
    ? null
    : fncConvFirstChild(fldObjBytes, fldObjMinf, 'stbl');
  const fldObjStsd = fldObjStbl === null
    ? null
    : fncConvFirstChild(fldObjBytes, fldObjStbl, 'stsd');
  let fldNumRate: number | null = null;
  if (fldObjStsd !== null) {
    const fldArrEntries = fncConvChildren(
      fldObjBytes,
      fldObjStsd.fldNumContentAt + 8,
      fldObjStsd.fldNumContentEnd,
    );
    const fldObjMp4a = fldArrEntries.find((fldObjBox) =>
      fldObjBox.fldStrType === 'mp4a'
    ) ?? null;
    if (fldObjMp4a !== null) {
      fldNumRate = fncConvMp4aRate(fldObjBytes, fldObjMp4a);
    }
  }
  return {
    durationSec: fldObjMdhd === null
      ? null
      : fncConvMdhdDuration(fldObjBytes, fldObjMdhd),
    sampleRateHz: fldNumRate,
  };
}

export function fncRunValidateVoiceBytes(
  fldObjBytes: Uint8Array,
): fldObjVoiceValid {
  if (fldObjBytes.length === 0) {
    throw new Error('Logosphere BITS: empty voice file.');
  }
  if (fldObjBytes.length > fldNumVoiceMaxBytes) {
    throw new Error('Logosphere BITS: voice file exceeds 25 MB.');
  }
  const fldStrFormat = fncConvSniffVoiceFormat(fldObjBytes);
  if (fldStrFormat === null) {
    throw new Error(
      'Logosphere BITS: unsupported voice format (M4A/AAC only).',
    );
  }
  const fldObjInfo = fncConvParseM4aInfo(fldObjBytes);
  if (
    fldObjInfo.durationSec !== null &&
    fldObjInfo.durationSec > fldNumVoiceMaxSec
  ) {
    throw new Error('Logosphere BITS: voice recording exceeds 5 minutes.');
  }
  if (
    fldObjInfo.sampleRateHz !== null &&
    (fldObjInfo.sampleRateHz < fldNumVoiceMinRateHz ||
      fldObjInfo.sampleRateHz > fldNumVoiceMaxRateHz)
  ) {
    throw new Error('Logosphere BITS: voice sample rate out of 8-48 kHz.');
  }
  return {
    format: fldStrFormat,
    durationSec: fldObjInfo.durationSec,
    sampleRateHz: fldObjInfo.sampleRateHz,
  };
}

export function fncConvBatches<T>(fldArrItems: T[], fldNumSize: number): T[][] {
  if (fldNumSize < 1 || fldArrItems.length === 0) {
    return [];
  }
  const fldArrBatches: T[][] = [];
  for (
    let fldNumAt = 0;
    fldNumAt < fldArrItems.length;
    fldNumAt += fldNumSize
  ) {
    fldArrBatches.push(fldArrItems.slice(fldNumAt, fldNumAt + fldNumSize));
  }
  return fldArrBatches;
}
