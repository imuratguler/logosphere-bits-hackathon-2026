// Logosphere BITS — provider chain (shared).
// Every JSON call runs one fixed order, each step directly,
// falling through on ANY step failure: DeepSeek
// flash-vision-fast, DeepSeek flash-vision, Muse 1026 on
// Baseten, Muse spark-1.3 on the Meta API, DeepSeek
// v4-pro last. Audio runs only Baseten 1026 then Meta
// spark-1.2 (no DeepSeek anywhere; Gemini legs removed —
// the key returns 402 prepayment-depleted, marked
// unavailable, flow never stops on it).
// Labels stay internal: the wire carries each provider's
// real model id through its own request converter (bodies
// are never shared blindly). A step wins only on parsed,
// schema-accepted JSON; truncated responses never win.
// Every attempt lands in the module log with sequence,
// kind, label, provider, sent model id, HTTP status,
// outcome, error class, and latency; values are never
// logged. Callers snapshot per-stage slices by monotonic
// sequence; the log keeps the last 200 rows so warm
// isolates cannot grow it. Identifiers follow D6.

import {
  fldObjMuseMessage,
  fldObjMusePart,
  fldStrMuseBaseUrl,
  fldStrMuseModel,
  fncConvMuseJson,
  fncRunCountProviderRequest,
  fncRunNoteUsage,
} from './muse.ts';

export const fldStrDeepseekBaseUrl = 'https://api.deepseek.com';
export const fldStrDeepseekSentModel = 'deepseek-flash';
export const fldStrDeepseekProModel = 'deepseek-v4-pro';
export const fldStrMetaApiBaseUrl = 'https://api.meta.ai/v1';
export const fldStrMetaApiSparkModel = 'muse-spark-1.3';
export const fldStrMetaApiAudioModel = 'muse-spark-1.2';
export const fldStrGeminiBaseUrl =
  'https://generativelanguage.googleapis.com/v1beta/openai';
export const fldStrGemini31Model = 'gemini-3.1-flash-lite';
export const fldStrGemini35Model = 'gemini-3.5-flash-lite';
export const fldStrGemini25Model = 'gemini-2.5-flash-lite';

const fldNumChainTimeoutMs = 120000;
const fldNumChainLogCap = 200;

export type fldStrChainKind = 'text' | 'vision' | 'audio' | 'final';

export type fldStrChainProvider =
  | 'deepseek'
  | 'muse-baseten'
  | 'meta-api'
  | 'gemini';

export type fldObjChainStep = {
  label: string;
  provider: fldStrChainProvider;
  model: string;
  baseUrl: string;
  key: string;
};

export type fldStrChainErrorKind =
  | 'none'
  | 'no-key'
  | 'no-endpoint'
  | 'http-400'
  | 'http-401'
  | 'http-404'
  | 'http-other'
  | 'timeout'
  | 'transport'
  | 'empty'
  | 'truncated'
  | 'parse'
  | 'schema';

export type fldObjChainAttempt = {
  seq: number;
  kind: fldStrChainKind;
  label: string;
  provider: fldStrChainProvider;
  model: string;
  httpStatus: number | null;
  ok: boolean;
  errorKind: fldStrChainErrorKind;
  error: string | null;
  latencyMs: number;
};

export function fncConvChainSteps(
  fldStrKind: fldStrChainKind,
): fldObjChainStep[] {
  const fldStrDeepseekKey = Deno.env.get('LOGOSPHERE_BITS_DEEPSEEK_API_KEY') ??
    '';
  const fldStrBasetenKey = Deno.env.get('LOGOSPHERE_BITS_BASETEN_API_KEY') ??
    '';
  const fldStrMetaKey = Deno.env.get('LOGOSPHERE_BITS_MUSE_API_KEY') ?? '';
  const fldArrSteps: fldObjChainStep[] = [];
  if (fldStrKind === 'audio') {
    // Audio carries no DeepSeek leg and no Gemini leg: Baseten
    // 1026 first, Meta spark-1.2 second (1.2 is the audio
    // model; 1.3 rejects voice input). A winner stops the
    // chain at once; it is never re-tested on later legs.
    fldArrSteps.push({
      label: 'baseten-1026',
      provider: 'muse-baseten',
      model: fldStrMuseModel,
      baseUrl: fldStrMuseBaseUrl,
      key: fldStrBasetenKey,
    });
    fldArrSteps.push({
      label: 'meta-spark-1.2',
      provider: 'meta-api',
      model: fldStrMetaApiAudioModel,
      baseUrl: fldStrMetaApiBaseUrl,
      key: fldStrMetaKey,
    });
    return fldArrSteps;
  }
  // Text, vision, and final share one order: DeepSeek flash
  // legs, Baseten 1026, Meta spark-1.3, DeepSeek v4-pro last.
  // Every stage restarts from the first leg; a winner stops
  // the chain at once and is never re-tested elsewhere.
  fldArrSteps.push({
    label: 'deepseek-flash-vision-fast',
    provider: 'deepseek',
    model: fldStrDeepseekSentModel,
    baseUrl: fldStrDeepseekBaseUrl,
    key: fldStrDeepseekKey,
  });
  fldArrSteps.push({
    label: 'deepseek-flash-vision',
    provider: 'deepseek',
    model: fldStrDeepseekSentModel,
    baseUrl: fldStrDeepseekBaseUrl,
    key: fldStrDeepseekKey,
  });
  fldArrSteps.push({
    label: 'baseten-1026',
    provider: 'muse-baseten',
    model: fldStrMuseModel,
    baseUrl: fldStrMuseBaseUrl,
    key: fldStrBasetenKey,
  });
  fldArrSteps.push({
    label: 'meta-spark-1.3',
    provider: 'meta-api',
    model: fldStrMetaApiSparkModel,
    baseUrl: fldStrMetaApiBaseUrl,
    key: fldStrMetaKey,
  });
  fldArrSteps.push({
    label: 'deepseek-v4-pro',
    provider: 'deepseek',
    model: fldStrDeepseekProModel,
    baseUrl: fldStrDeepseekBaseUrl,
    key: fldStrDeepseekKey,
  });
  return fldArrSteps;
}

const fldArrChainAttempts: fldObjChainAttempt[] = [];
let fldNumChainSeq = 0;

export function fncConvChainAttempts(): fldObjChainAttempt[] {
  return [...fldArrChainAttempts];
}

export function fncConvChainLastSeq(): number {
  return fldNumChainSeq;
}

export function fncConvChainAttemptsAfter(
  fldNumSeq: number,
): fldObjChainAttempt[] {
  return fldArrChainAttempts.filter(
    (fldObjAttempt) => fldObjAttempt.seq > fldNumSeq,
  );
}

function fncRunNoteAttempt(
  fldObjAttempt: Omit<fldObjChainAttempt, 'seq'>,
): void {
  fldNumChainSeq += 1;
  fldArrChainAttempts.push({ ...fldObjAttempt, seq: fldNumChainSeq });
  while (fldArrChainAttempts.length > fldNumChainLogCap) {
    fldArrChainAttempts.shift();
  }
}

type fldObjStepRequest = {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

function fncConvDeepseekRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): fldObjStepRequest {
  const fldObjBody: Record<string, unknown> = {
    model: fldObjStep.model,
    messages: fldArrMessages,
    max_tokens: fldNumMaxTokens,
  };
  if (fldObjStep.label === 'deepseek-flash-vision-fast') {
    fldObjBody['temperature'] = 0;
    fldObjBody['reasoning_effort'] = 'none';
  } else if (fldObjStep.label === 'deepseek-flash-vision') {
    fldObjBody['temperature'] = 0;
  }
  return {
    url: `${fldObjStep.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fldObjStep.key}`,
    },
    body: fldObjBody,
  };
}

function fncConvBasetenRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): fldObjStepRequest {
  return {
    url: `${fldObjStep.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fldObjStep.key}`,
    },
    body: {
      model: fldObjStep.model,
      messages: fldArrMessages,
      temperature: 0,
      max_tokens: fldNumMaxTokens,
    },
  };
}

function fncConvMetaRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): fldObjStepRequest {
  return {
    url: `${fldObjStep.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fldObjStep.key}`,
    },
    body: {
      model: fldObjStep.model,
      messages: fldArrMessages,
      temperature: 0,
      max_tokens: fldNumMaxTokens,
    },
  };
}

function fncConvGeminiRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): fldObjStepRequest {
  return {
    url: `${fldObjStep.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fldObjStep.key}`,
      'x-goog-api-key': fldObjStep.key,
    },
    body: {
      model: fldObjStep.model,
      messages: fldArrMessages,
      temperature: 0,
      max_tokens: fldNumMaxTokens,
    },
  };
}

export type fldObjProviderRequest = fldObjStepRequest;

export type fldObjResolvedAudio = { mime: string; base64: string };

// The chain accepts both OpenAI content shapes: a plain string or
// an array of blocks. Array answers concatenate their text blocks;
// anything else stays empty so the chain moves to the next leg.
export function fncConvTextContent(fldObjContent: unknown): string | null {
  if (typeof fldObjContent === 'string') {
    return fldObjContent;
  }
  if (!Array.isArray(fldObjContent)) {
    return null;
  }
  const fldArrTexts: string[] = [];
  for (const fldObjBlock of fldObjContent) {
    if (
      typeof fldObjBlock === 'object' && fldObjBlock !== null &&
      typeof (fldObjBlock as { text?: unknown }).text === 'string'
    ) {
      fldArrTexts.push((fldObjBlock as { text: string }).text);
    }
  }
  return fldArrTexts.length > 0 ? fldArrTexts.join('') : null;
}

function fncConvDataAudio(fldStrUrl: string): fldObjResolvedAudio | null {
  const fldObjMatch = /^data:([^;,]+);base64,(.+)$/.exec(fldStrUrl);
  if (!fldObjMatch) {
    return null;
  }
  return { mime: fldObjMatch[1]!, base64: fldObjMatch[2]! };
}

// Audio legs never forward the raw audio_url block blindly: every
// recording resolves to bytes first, then each provider gets its own
// native shape (data URLs inline without any network fetch).
export async function fncRunResolveAudio(
  fldArrMessages: fldObjMuseMessage[],
): Promise<fldObjResolvedAudio[]> {
  const fldArrResolved: fldObjResolvedAudio[] = [];
  for (const fldObjMessage of fldArrMessages) {
    if (typeof fldObjMessage.content === 'string') {
      continue;
    }
    for (const fldObjPart of fldObjMessage.content) {
      if (fldObjPart.type !== 'audio_url') {
        continue;
      }
      const fldStrUrl = fldObjPart.audio_url?.url ?? '';
      const fldObjInline = fncConvDataAudio(fldStrUrl);
      if (fldObjInline) {
        fldArrResolved.push(fldObjInline);
        continue;
      }
      const fldObjResponse = await fetch(fldStrUrl, {
        signal: AbortSignal.timeout(60000),
      });
      if (!fldObjResponse.ok) {
        throw new Error(
          `Logosphere BITS: voice download HTTP ${fldObjResponse.status}.`,
        );
      }
      const fldObjBytes = new Uint8Array(await fldObjResponse.arrayBuffer());
      let fldStrBinary = '';
      for (const fldNumByte of fldObjBytes) {
        fldStrBinary += String.fromCharCode(fldNumByte);
      }
      const fldStrMime = fldObjResponse.headers.get('content-type')
        ?.split(';')[0]?.trim() || 'audio/mp4';
      fldArrResolved.push({ mime: fldStrMime, base64: btoa(fldStrBinary) });
    }
  }
  return fldArrResolved;
}

function fncConvAudioFormat(fldStrMime: string): string {
  const fldStrSub = fldStrMime.split('/')[1]?.toLowerCase() ?? '';
  if (
    fldStrSub === 'wav' || fldStrSub === 'x-wav' || fldStrSub === 'wave' ||
    fldStrSub === 'mp3' || fldStrSub === 'mpeg' || fldStrSub === 'flac' ||
    fldStrSub === 'ogg' || fldStrSub === 'opus' || fldStrSub === 'webm'
  ) {
    return fldStrSub === 'x-wav' || fldStrSub === 'wave'
      ? 'wav'
      : fldStrSub === 'mpeg'
      ? 'mp3'
      : fldStrSub;
  }
  return fldStrSub === '' ? 'mp4' : fldStrSub;
}

function fncConvAudioMessages(
  fldArrMessages: fldObjMuseMessage[],
  fldArrAudio: fldObjResolvedAudio[],
  fncConvPart: (fldObjAudio: fldObjResolvedAudio) => fldObjMusePart,
): fldObjMuseMessage[] {
  let fldNumAudio = 0;
  return fldArrMessages.map((fldObjMessage) => {
    if (typeof fldObjMessage.content === 'string') {
      return fldObjMessage;
    }
    return {
      ...fldObjMessage,
      content: fldObjMessage.content.map((fldObjPart) => {
        if (fldObjPart.type !== 'audio_url') {
          return fldObjPart;
        }
        const fldObjAudio = fldArrAudio[fldNumAudio];
        fldNumAudio += 1;
        if (!fldObjAudio) {
          return fldObjPart;
        }
        return fncConvPart(fldObjAudio);
      }),
    };
  });
}

// Audio entry point. Baseten 1026 keeps the proven shape: the
// original audio_url block untouched (signed storage URL or
// small data URL, exactly what transcribed real speech
// before). Meta gets OpenAI input_audio with the honest
// mime-derived format after resolving the bytes.
export async function fncRunProviderAudioRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): Promise<fldObjStepRequest> {
  if (fldObjStep.provider === 'meta-api') {
    const fldArrAudio = await fncRunResolveAudio(fldArrMessages);
    const fldArrNative = fncConvAudioMessages(
      fldArrMessages,
      fldArrAudio,
      (fldObjAudio) => ({
        type: 'input_audio',
        input_audio: {
          data: fldObjAudio.base64,
          format: fncConvAudioFormat(fldObjAudio.mime),
        },
      }),
    );
    return fncConvMetaRequest(fldObjStep, fldArrNative, fldNumMaxTokens);
  }
  if (fldObjStep.provider === 'deepseek') {
    return fncConvDeepseekRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  }
  if (fldObjStep.provider === 'gemini') {
    return fncConvGeminiRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  }
  return fncConvBasetenRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
}

export function fncConvProviderRequest(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): fldObjStepRequest {
  if (fldObjStep.provider === 'deepseek') {
    return fncConvDeepseekRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  }
  if (fldObjStep.provider === 'muse-baseten') {
    return fncConvBasetenRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  }
  if (fldObjStep.provider === 'meta-api') {
    return fncConvMetaRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  }
  return fncConvGeminiRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
}

export function fncConvHttpErrorKind(
  fldNumStatus: number,
): fldStrChainErrorKind {
  if (fldNumStatus === 400) {
    return 'http-400';
  }
  if (fldNumStatus === 401) {
    return 'http-401';
  }
  if (fldNumStatus === 404) {
    return 'http-404';
  }
  return 'http-other';
}

type fldObjStepFailure = {
  kind: fldStrChainErrorKind;
  status: number | null;
  message: string;
};

async function fncRunChainStep<T>(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
  fncValidate: ((fldObjAnswer: T) => boolean) | undefined,
  fldStrKind: fldStrChainKind,
): Promise<T> {
  if (fldObjStep.key === '') {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'no-key',
      status: null,
      message: `Logosphere BITS: ${fldObjStep.provider} key is not configured.`,
    };
    throw fldObjFailure;
  }
  if (fldObjStep.baseUrl === '') {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'no-endpoint',
      status: null,
      message:
        `Logosphere BITS: ${fldObjStep.provider} endpoint is not configured.`,
    };
    throw fldObjFailure;
  }
  const fldObjRequest = fldStrKind === 'audio'
    ? await fncRunProviderAudioRequest(
      fldObjStep,
      fldArrMessages,
      fldNumMaxTokens,
    )
    : fncConvProviderRequest(fldObjStep, fldArrMessages, fldNumMaxTokens);
  fncRunCountProviderRequest();
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(fldObjRequest.url, {
      method: 'POST',
      headers: fldObjRequest.headers,
      body: JSON.stringify(fldObjRequest.body),
      signal: AbortSignal.timeout(fldNumChainTimeoutMs),
    });
  } catch (fldObjError: unknown) {
    const fldBooTimeout = fldObjError instanceof Error &&
      fldObjError.name === 'TimeoutError';
    const fldStrDetail = fldObjError instanceof Error
      ? fldObjError.message
      : String(fldObjError);
    const fldObjFailure: fldObjStepFailure = {
      kind: fldBooTimeout ? 'timeout' : 'transport',
      status: null,
      message: `Logosphere BITS: ${fldObjStep.provider} ${
        fldBooTimeout ? 'timed out' : 'transport'
      } (${fldStrDetail}).`,
    };
    throw fldObjFailure;
  }
  if (!fldObjResponse.ok) {
    const fldObjFailure: fldObjStepFailure = {
      kind: fncConvHttpErrorKind(fldObjResponse.status),
      status: fldObjResponse.status,
      message:
        `Logosphere BITS: ${fldObjStep.provider} HTTP ${fldObjResponse.status}.`,
    };
    throw fldObjFailure;
  }
  const fldObjBody = (await fldObjResponse.json()) as {
    choices?: {
      message?: { content?: unknown };
      finish_reason?: unknown;
    }[];
    usage?: unknown;
  };
  fncRunNoteUsage(fldObjBody.usage);
  const fldObjChoice = fldObjBody.choices?.[0];
  if (fldObjChoice?.finish_reason === 'length') {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'truncated',
      status: fldObjResponse.status,
      message:
        `Logosphere BITS: ${fldObjStep.provider} response was truncated.`,
    };
    throw fldObjFailure;
  }
  const fldStrContent = fncConvTextContent(fldObjChoice?.message?.content);
  if (fldStrContent === null || fldStrContent.trim() === '') {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'empty',
      status: fldObjResponse.status,
      message:
        `Logosphere BITS: ${fldObjStep.provider} returned an empty answer.`,
    };
    throw fldObjFailure;
  }
  let fldObjAnswer: T;
  try {
    fldObjAnswer = fncConvMuseJson<T>(fldStrContent);
  } catch {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'parse',
      status: fldObjResponse.status,
      message:
        `Logosphere BITS: ${fldObjStep.provider} returned unparsable JSON.`,
    };
    throw fldObjFailure;
  }
  if (fncValidate !== undefined && !fncValidate(fldObjAnswer)) {
    const fldObjFailure: fldObjStepFailure = {
      kind: 'schema',
      status: fldObjResponse.status,
      message: `Logosphere BITS: ${fldObjStep.provider} failed schema check.`,
    };
    throw fldObjFailure;
  }
  return fldObjAnswer;
}

function fncConvStepFailure(fldObjError: unknown): fldObjStepFailure {
  if (
    typeof fldObjError === 'object' && fldObjError !== null &&
    typeof (fldObjError as fldObjStepFailure).message === 'string' &&
    typeof (fldObjError as fldObjStepFailure).kind === 'string'
  ) {
    return fldObjError as fldObjStepFailure;
  }
  const fldStrMessage = fldObjError instanceof Error
    ? fldObjError.message
    : String(fldObjError);
  return { kind: 'transport', status: null, message: fldStrMessage };
}

export async function fncRunChainJson<T>(
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
  fldStrKind: fldStrChainKind,
  fncValidate?: (fldObjAnswer: T) => boolean,
): Promise<T> {
  let fldObjLastError: unknown = new Error(
    'Logosphere BITS: no provider answered.',
  );
  let fldObjLastRealError: unknown = null;
  for (const fldObjStep of fncConvChainSteps(fldStrKind)) {
    const fldNumStart = Date.now();
    try {
      const fldObjAnswer = await fncRunChainStep<T>(
        fldObjStep,
        fldArrMessages,
        fldNumMaxTokens,
        fncValidate,
        fldStrKind,
      );
      fncRunNoteAttempt({
        kind: fldStrKind,
        label: fldObjStep.label,
        provider: fldObjStep.provider,
        model: fldObjStep.model,
        httpStatus: 200,
        ok: true,
        errorKind: 'none',
        error: null,
        latencyMs: Date.now() - fldNumStart,
      });
      return fldObjAnswer;
    } catch (fldObjError: unknown) {
      const fldObjFailure = fncConvStepFailure(fldObjError);
      fncRunNoteAttempt({
        kind: fldStrKind,
        label: fldObjStep.label,
        provider: fldObjStep.provider,
        model: fldObjStep.model,
        httpStatus: fldObjFailure.status,
        ok: false,
        errorKind: fldObjFailure.kind,
        error: fldObjFailure.message.slice(0, 160),
        latencyMs: Date.now() - fldNumStart,
      });
      // A missing key/endpoint is an absent leg, not the
      // call's failure: the last real provider error wins
      // so callers see what actually went wrong.
      if (
        fldObjFailure.kind !== 'no-key' &&
        fldObjFailure.kind !== 'no-endpoint'
      ) {
        fldObjLastRealError = new Error(fldObjFailure.message);
      }
      fldObjLastError = new Error(fldObjFailure.message);
    }
  }
  throw fldObjLastRealError ?? fldObjLastError;
}
