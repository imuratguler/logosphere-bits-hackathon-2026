// Logosphere BITS — Muse Spark client over Baseten (shared).
// Pins follow D5 exactly: model meta-models/muse-spark-open-1026
// on https://inference.baseten.co/v1, OpenAI-compatible chat
// completions, Bearer key from LOGOSPHERE_BITS_BASETEN_API_KEY.
// (If Baseten answers 401, the recorded fallback is the MUSE
// key — values are never logged.) Image parts ride as base64
// data URLs; audio parts ride as audio_url URLs (signed
// storage links or small data URLs, never logged). Every
// call asks for JSON only and the parser strips fences
// before parsing. A module-level technical counter tracks
// requests, retries, and reported tokens; callers snapshot
// it into stage payloads. Transient failures (HTTP 429/5xx,
// network) retry with backoff when the caller asks.
// Identifiers follow D6.

export const fldStrMuseModel = 'meta-models/muse-spark-open-1026';
export const fldStrMuseBaseUrl = 'https://inference.baseten.co/v1';

const fldNumMuseTimeoutMs = 120000;

export type fldObjMuseTextPart = {
  type: 'text';
  text: string;
};

export type fldObjMuseImagePart = {
  type: 'image_url';
  image_url: { url: string };
};

export type fldObjMuseAudioPart = {
  type: 'audio_url';
  audio_url: { url: string };
};

export type fldObjMusePart =
  | fldObjMuseTextPart
  | fldObjMuseImagePart
  | fldObjMuseAudioPart;

export type fldObjMuseMessage = {
  role: 'system' | 'user';
  content: string | fldObjMusePart[];
};

function fncConvMuseKey(): string {
  const fldStrKey = Deno.env.get('LOGOSPHERE_BITS_BASETEN_API_KEY') ?? '';
  if (fldStrKey === '') {
    throw new Error('Logosphere BITS: Baseten key is not configured.');
  }
  return fldStrKey;
}

function fncConvJsonText(fldStrRaw: string): string {
  const fldStrTrimmed = fldStrRaw.trim();
  const fldObjFenced = fldStrTrimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return (fldObjFenced?.[1] ?? fldStrTrimmed).trim();
}

export function fncConvMuseJson<T>(fldStrRaw: string): T {
  const fldStrText = fncConvJsonText(fldStrRaw);
  try {
    return JSON.parse(fldStrText) as T;
  } catch {
    throw new Error('Logosphere BITS: Muse returned unparsable JSON.');
  }
}

export type fldObjMuseUsage = {
  fldNumRequests: number;
  fldNumRetries: number;
  fldNumPromptTokens: number;
  fldNumCompletionTokens: number;
  fldNumTotalTokens: number;
  fldBooTokensSeen: boolean;
};

export type fldObjMuseCallOptions = {
  fldNumRetries?: number;
  fldNumRetryDelayMs?: number;
};

const fldObjMuseUsage: fldObjMuseUsage = {
  fldNumRequests: 0,
  fldNumRetries: 0,
  fldNumPromptTokens: 0,
  fldNumCompletionTokens: 0,
  fldNumTotalTokens: 0,
  fldBooTokensSeen: false,
};

export function fncConvMuseUsage(): fldObjMuseUsage {
  return { ...fldObjMuseUsage };
}

export function fncRunMuseUsageReset(): void {
  fldObjMuseUsage.fldNumRequests = 0;
  fldObjMuseUsage.fldNumRetries = 0;
  fldObjMuseUsage.fldNumPromptTokens = 0;
  fldObjMuseUsage.fldNumCompletionTokens = 0;
  fldObjMuseUsage.fldNumTotalTokens = 0;
  fldObjMuseUsage.fldBooTokensSeen = false;
}

function fncRunNoteUsage(fldObjUsage: unknown): void {
  if (typeof fldObjUsage !== 'object' || fldObjUsage === null) {
    return;
  }
  const fldObjRow = fldObjUsage as Record<string, unknown>;
  const fldNumPrompt = fldObjRow['prompt_tokens'];
  const fldNumCompletion = fldObjRow['completion_tokens'];
  const fldNumTotal = fldObjRow['total_tokens'];
  let fldBooSeen = false;
  if (typeof fldNumPrompt === 'number' && Number.isFinite(fldNumPrompt)) {
    fldObjMuseUsage.fldNumPromptTokens += Math.max(0, Math.round(fldNumPrompt));
    fldBooSeen = true;
  }
  if (
    typeof fldNumCompletion === 'number' && Number.isFinite(fldNumCompletion)
  ) {
    fldObjMuseUsage.fldNumCompletionTokens += Math.max(
      0,
      Math.round(fldNumCompletion),
    );
    fldBooSeen = true;
  }
  if (typeof fldNumTotal === 'number' && Number.isFinite(fldNumTotal)) {
    fldObjMuseUsage.fldNumTotalTokens += Math.max(0, Math.round(fldNumTotal));
    fldBooSeen = true;
  }
  if (fldBooSeen) {
    fldObjMuseUsage.fldBooTokensSeen = true;
  }
}

function fncConvRetryableStatus(fldNumStatus: number): boolean {
  return fldNumStatus === 429 || fldNumStatus >= 500;
}

function fncRunSleep(fldNumMs: number): Promise<void> {
  return new Promise((fldObjResolve) => setTimeout(fldObjResolve, fldNumMs));
}

export async function fncRunMuseJson<T>(
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens = 4000,
  fldObjOptions?: fldObjMuseCallOptions,
): Promise<T> {
  const fldNumRetries = Math.max(0, fldObjOptions?.fldNumRetries ?? 0);
  const fldNumBaseDelayMs = Math.max(
    0,
    fldObjOptions?.fldNumRetryDelayMs ?? 1000,
  );
  const fldStrKey = fncConvMuseKey();
  let fldNumAttempt = 0;
  for (;;) {
    fldObjMuseUsage.fldNumRequests += 1;
    let fldObjResponse: Response;
    try {
      fldObjResponse = await fetch(
        `${fldStrMuseBaseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${fldStrKey}`,
          },
          body: JSON.stringify({
            model: fldStrMuseModel,
            messages: fldArrMessages,
            temperature: 0,
            max_tokens: fldNumMaxTokens,
          }),
          signal: AbortSignal.timeout(fldNumMuseTimeoutMs),
        },
      );
    } catch (fldObjError: unknown) {
      if (fldNumAttempt < fldNumRetries) {
        fldNumAttempt += 1;
        fldObjMuseUsage.fldNumRetries += 1;
        await fncRunSleep(fldNumBaseDelayMs * 2 ** (fldNumAttempt - 1));
        continue;
      }
      // Network and timeout failures (AbortSignal "Signal timed
      // out.") surface as Muse call failures so stage handling
      // marks the run retryable instead of bricking it; a fresh
      // invocation resumes from the failed stage.
      const fldStrDetail = fldObjError instanceof Error
        ? fldObjError.message
        : String(fldObjError);
      throw new Error(
        `Logosphere BITS: Muse call failed (${fldStrDetail}).`,
      );
    }
    if (!fldObjResponse.ok) {
      if (
        fldNumAttempt < fldNumRetries &&
        fncConvRetryableStatus(fldObjResponse.status)
      ) {
        fldNumAttempt += 1;
        fldObjMuseUsage.fldNumRetries += 1;
        await fncRunSleep(fldNumBaseDelayMs * 2 ** (fldNumAttempt - 1));
        continue;
      }
      throw new Error(
        `Logosphere BITS: Muse call failed (HTTP ${fldObjResponse.status}).`,
      );
    }
    const fldObjBody = (await fldObjResponse.json()) as {
      choices?: { message?: { content?: unknown } }[];
      usage?: unknown;
    };
    fncRunNoteUsage(fldObjBody.usage);
    const fldObjContent = fldObjBody.choices?.[0]?.message?.content;
    if (typeof fldObjContent !== 'string' || fldObjContent.trim() === '') {
      throw new Error('Logosphere BITS: Muse returned an empty answer.');
    }
    return fncConvMuseJson<T>(fldObjContent);
  }
}
