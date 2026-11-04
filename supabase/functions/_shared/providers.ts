// Logosphere BITS — provider chain (shared).
// Every JSON call runs one fixed order, each step directly,
// falling through on ANY step failure (missing key,
// transport, HTTP error, empty answer, unparsable JSON):
// DeepSeek flash-vision-fast, DeepSeek flash-vision,
// Muse 1026 on Baseten, Muse spark-open on the Meta API,
// Gemini 2.5 flash, Gemini 3.5 flash. Audio has no
// DeepSeek leg (no audio API) and runs the rest in the
// same relative order. Every attempt lands in the module
// log with provider, model, outcome, error kind, and
// latency; values are never logged. Callers snapshot
// per-stage slices into payloads by monotonic sequence
// (safe under the 200-row cap and concurrent runs); the
// log keeps the last 200 rows so warm isolates cannot
// grow it. Identifiers follow D6.

import {
  fldObjMuseMessage,
  fldStrMuseBaseUrl,
  fldStrMuseModel,
  fncConvMuseJson,
  fncRunCountProviderRequest,
  fncRunNoteUsage,
} from './muse.ts';

export const fldStrDeepseekBaseUrl = 'https://api.deepseek.com';
export const fldStrDeepseekFastModel = 'deepseek-flash-vision-fast';
export const fldStrDeepseekModel = 'deepseek-flash-vision';
export const fldStrMetaApiSparkOpen = 'meta-models/muse-spark-open';
export const fldStrGeminiBaseUrl =
  'https://generativelanguage.googleapis.com/v1beta/openai';
export const fldStrGeminiFastModel = 'gemini-2.5-flash';
export const fldStrGeminiModel = 'gemini-3.5-flash';

const fldNumChainTimeoutMs = 120000;
const fldNumChainLogCap = 200;

export type fldStrChainKind = 'text' | 'vision' | 'audio';

export type fldObjChainStep = {
  provider: 'deepseek' | 'muse-baseten' | 'meta-api' | 'gemini';
  model: string;
  baseUrl: string;
  key: string;
  auth: 'bearer' | 'goog-key';
};

export type fldObjChainAttempt = {
  seq: number;
  provider: 'deepseek' | 'muse-baseten' | 'meta-api' | 'gemini';
  model: string;
  ok: boolean;
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
  const fldStrMetaBase = Deno.env.get('LOGOSPHERE_BITS_META_API_BASE_URL') ??
    '';
  const fldStrGeminiKey = Deno.env.get('LOGOSPHERE_BITS_GEMINI_API_KEY') ?? '';
  const fldArrSteps: fldObjChainStep[] = [];
  if (fldStrKind !== 'audio') {
    fldArrSteps.push({
      provider: 'deepseek',
      model: fldStrDeepseekFastModel,
      baseUrl: fldStrDeepseekBaseUrl,
      key: fldStrDeepseekKey,
      auth: 'bearer',
    });
    fldArrSteps.push({
      provider: 'deepseek',
      model: fldStrDeepseekModel,
      baseUrl: fldStrDeepseekBaseUrl,
      key: fldStrDeepseekKey,
      auth: 'bearer',
    });
  }
  fldArrSteps.push({
    provider: 'muse-baseten',
    model: fldStrMuseModel,
    baseUrl: fldStrMuseBaseUrl,
    key: fldStrBasetenKey,
    auth: 'bearer',
  });
  fldArrSteps.push({
    provider: 'meta-api',
    model: fldStrMetaApiSparkOpen,
    baseUrl: fldStrMetaBase,
    key: fldStrMetaKey,
    auth: 'bearer',
  });
  fldArrSteps.push({
    provider: 'gemini',
    model: fldStrGeminiFastModel,
    baseUrl: fldStrGeminiBaseUrl,
    key: fldStrGeminiKey,
    auth: 'goog-key',
  });
  fldArrSteps.push({
    provider: 'gemini',
    model: fldStrGeminiModel,
    baseUrl: fldStrGeminiBaseUrl,
    key: fldStrGeminiKey,
    auth: 'goog-key',
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

async function fncRunChainStep<T>(
  fldObjStep: fldObjChainStep,
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
): Promise<T> {
  if (fldObjStep.key === '') {
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} key is not configured.`,
    );
  }
  if (fldObjStep.baseUrl === '') {
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} endpoint is not configured.`,
    );
  }
  fncRunCountProviderRequest();
  const fldObjHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (fldObjStep.auth === 'goog-key') {
    fldObjHeaders['x-goog-api-key'] = fldObjStep.key;
  } else {
    fldObjHeaders['Authorization'] = `Bearer ${fldObjStep.key}`;
  }
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(
      `${fldObjStep.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: fldObjHeaders,
        body: JSON.stringify({
          model: fldObjStep.model,
          messages: fldArrMessages,
          temperature: 0,
          max_tokens: fldNumMaxTokens,
        }),
        signal: AbortSignal.timeout(fldNumChainTimeoutMs),
      },
    );
  } catch (fldObjError: unknown) {
    const fldStrDetail = fldObjError instanceof Error
      ? fldObjError.message
      : String(fldObjError);
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} transport (${fldStrDetail}).`,
    );
  }
  if (!fldObjResponse.ok) {
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} HTTP ${fldObjResponse.status}.`,
    );
  }
  const fldObjBody = (await fldObjResponse.json()) as {
    choices?: { message?: { content?: unknown } }[];
    usage?: unknown;
  };
  fncRunNoteUsage(fldObjBody.usage);
  const fldObjContent = fldObjBody.choices?.[0]?.message?.content;
  if (typeof fldObjContent !== 'string' || fldObjContent.trim() === '') {
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} returned an empty answer.`,
    );
  }
  try {
    return fncConvMuseJson<T>(fldObjContent);
  } catch {
    throw new Error(
      `Logosphere BITS: ${fldObjStep.provider} returned unparsable JSON.`,
    );
  }
}

export async function fncRunChainJson<T>(
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens: number,
  fldStrKind: fldStrChainKind,
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
      );
      fncRunNoteAttempt({
        provider: fldObjStep.provider,
        model: fldObjStep.model,
        ok: true,
        error: null,
        latencyMs: Date.now() - fldNumStart,
      });
      return fldObjAnswer;
    } catch (fldObjError: unknown) {
      const fldStrMessage = fldObjError instanceof Error
        ? fldObjError.message
        : String(fldObjError);
      fncRunNoteAttempt({
        provider: fldObjStep.provider,
        model: fldObjStep.model,
        ok: false,
        error: fldStrMessage.slice(0, 160),
        latencyMs: Date.now() - fldNumStart,
      });
      // A missing key/endpoint is an absent leg, not the
      // call's failure: the last real provider error wins
      // so callers see what actually went wrong.
      if (!fldStrMessage.includes('not configured')) {
        fldObjLastRealError = fldObjError;
      }
      fldObjLastError = fldObjError;
    }
  }
  throw fldObjLastRealError ?? fldObjLastError;
}
