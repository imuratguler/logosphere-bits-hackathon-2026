// Logosphere BITS — Muse Spark client over Baseten (shared).
// Pins follow D5 exactly: model meta-models/muse-spark-open-1026
// on https://inference.baseten.co/v1, OpenAI-compatible chat
// completions, Bearer key from LOGOSPHERE_BITS_BASETEN_API_KEY.
// (If Baseten answers 401, the recorded fallback is the MUSE
// key — values are never logged.) Image parts ride as base64
// data URLs; every call asks for JSON only and the parser
// strips fences before parsing. Identifiers follow D6.

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

export type fldObjMusePart = fldObjMuseTextPart | fldObjMuseImagePart;

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

export async function fncRunMuseJson<T>(
  fldArrMessages: fldObjMuseMessage[],
  fldNumMaxTokens = 4000,
): Promise<T> {
  const fldObjResponse = await fetch(
    `${fldStrMuseBaseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fncConvMuseKey()}`,
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
  if (!fldObjResponse.ok) {
    throw new Error(
      `Logosphere BITS: Muse call failed (HTTP ${fldObjResponse.status}).`,
    );
  }
  const fldObjBody = (await fldObjResponse.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const fldObjContent = fldObjBody.choices?.[0]?.message?.content;
  if (typeof fldObjContent !== 'string' || fldObjContent.trim() === '') {
    throw new Error('Logosphere BITS: Muse returned an empty answer.');
  }
  return fncConvMuseJson<T>(fldObjContent);
}
