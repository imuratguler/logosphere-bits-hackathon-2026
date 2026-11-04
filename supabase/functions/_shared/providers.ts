// Logosphere BITS — provider chain (shared).
// Every JSON call runs one fixed order, each step directly,
// falling through on ANY step failure (missing key,
// transport, HTTP error, empty answer, unparsable JSON):
// DeepSeek flash-fast, DeepSeek flash, Muse spark-open on
// the Muse API, Muse 1026 on Baseten. Audio has no
// DeepSeek leg (no audio API) and runs the two Muse steps
// only. Every attempt lands in the module log with
// provider, model, outcome, error kind, and latency;
// values are never logged. Callers snapshot per-stage
// slices into payloads by monotonic sequence (safe under
// the 200-row cap and concurrent runs); the log keeps the
// last 200 rows so warm isolates cannot grow it.
// Identifiers follow D6.

import {
  fldObjMuseMessage,
  fldStrMuseBaseUrl,
  fldStrMuseModel,
  fncConvMuseJson,
  fncRunCountProviderRequest,
  fncRunNoteUsage,
} from './muse.ts';

export const fldStrDeepseekBaseUrl = 'https://api.deepseek.com';
export const fldStrDeepseekFastModel = 'deepseek-flash-fast';
export const fldStrDeepseekModel = 'deepseek-flash';
export const fldStrMuseApiSparkOpen = 'meta-models/muse-spark-open';

const fldNumChainTimeoutMs = 120000;
const fldNumChainLogCap = 200;

export type fldStrChainKind = 'text' | 'vision' | 'audio';

export type fldObjChainStep = {
  provider: 'deepseek' | 'muse-api' | 'muse-baseten';
  model: string;
  baseUrl: string;
  key: string;
};

export type fldObjChainAttempt = {
  seq: number;
  provider: 'deepseek' | 'muse-api' | 'muse-baseten';
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
  const fldStrMuseApiKey = Deno.env.get('LOGOSPHERE_BITS_MUSE_API_KEY') ?? '';
  const fldStrMuseApiBase = Deno.env.get('LOGOSPHERE_BITS_MUSE_API_BASE_URL') ??
    '';
  const fldStrBasetenKey = Deno.env.get('LOGOSPHERE_BITS_BASETEN_API_KEY') ??
    '';
  const fldArrSteps: fldObjChainStep[] = [];
  if (fldStrKind !== 'audio') {
    fldArrSteps.push({
      provider: 'deepseek',
      model: fldStrDeepseekFastModel,
      baseUrl: fldStrDeepseekBaseUrl,
      key: fldStrDeepseekKey,
    });
    fldArrSteps.push({
      provider: 'deepseek',
      model: fldStrDeepseekModel,
      baseUrl: fldStrDeepseekBaseUrl,
      key: fldStrDeepseekKey,
    });
  }
  fldArrSteps.push({
    provider: 'muse-api',
    model: fldStrMuseApiSparkOpen,
    baseUrl: fldStrMuseApiBase,
    key: fldStrMuseApiKey,
  });
  fldArrSteps.push({
    provider: 'muse-baseten',
    model: fldStrMuseModel,
    baseUrl: fldStrMuseBaseUrl,
    key: fldStrBasetenKey,
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
  let fldObjResponse: Response;
  try {
    fldObjResponse = await fetch(
      `${fldObjStep.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${fldObjStep.key}`,
        },
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
      fldObjLastError = fldObjError;
    }
  }
  throw fldObjLastError;
}
