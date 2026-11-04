// ============================================================
// EDGE FUNCTION: bits-analysis-run
// Logosphere BITS Â· pipeline orchestrator.
//
// Runs one created run to completion: verifies the uploaded
// draft photos, transcribes the draft voice notes with Muse
// audio (M4A/AAC only, 4 per call) before any image query,
// reads the photos with Muse vision in batches of 8,
// looks each ISBN up in the local catalog cache and one
// remote catalog, finalizes full-schema results with Muse
// (voice texts ride as labeled user declarations), gathers real
// price sightings per candidate (Google Books sale info plus
// accepted catalog detail pages) with a deterministic rayic
// while Muse still gives a separate AI estimate (partial
// failures store nulls), decides multi duplicates with a separate
// Muse call after every price lands, and merges everything
// into the review payload with per-photo evidence. Each
// stage is claimed through the lease RPC, so a retried call
// reuses terminal payloads instead of paying twice. The
// review stage stays pending until bits-analysis-save
// records the user's approval. Progress broadcasts live on
// bits-pipeline:<run_id>. Every model call runs the
// provider chain (DeepSeek flash-fast, DeepSeek flash,
// Muse spark-open, Baseten 1026; audio skips DeepSeek)
// and each stage payload keeps its chain attempts.
// ============================================================

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fncConvServiceClient, fncRunAuthorizeDemo } from '../_shared/auth.ts';
import {
  fncConvJsonResponse,
  fncRunPreflightResponse,
} from '../_shared/cors.ts';
import {
  fldObjDuplicateCandidate,
  fldObjMusePhotoRead,
  fldObjMuseResult,
  fldObjVoiceDeclaration,
  fncConvDuplicateMessages,
  fncConvFinalMessages,
  fncConvPreReadMessages,
  fncConvPricePrompt,
  fncConvTranscribeMessages,
} from '../_shared/prompts.ts';
import {
  fldObjMinorPriceBands,
  fncConvCleanDuplicateGroups,
  fncConvCleanIsbnStrict,
  fncConvCleanPhotoRead,
  fncConvCleanPriceBands,
  fncConvCleanResult,
  fncConvCleanTranscriptRow,
  fncConvFieldOrigins,
  fncConvMedianMinor,
  fncConvValidateResultCount,
} from '../_shared/mapping.ts';
import {
  fldObjCatalogEntry,
  fncConvNormalizeTitle,
  fncConvTitlesMatch,
} from '../_shared/catalog.ts';
import {
  fldObjWaterfallReject,
  fncRunWaterfall,
} from '../_shared/waterfall.ts';
import { fncRunCheckDewey } from '../_shared/dewey.ts';
import {
  fldObjFxRate,
  fldObjPriceObservation,
  fncConvNewMedian,
  fncConvRayic,
  fncRunFxToUsd,
  fncRunGatherObservations,
} from '../_shared/prices.ts';
import { fncConvMuseUsage } from '../_shared/muse.ts';
import {
  fldObjChainAttempt,
  fncConvChainAttemptsAfter,
  fncConvChainLastSeq,
  fncRunChainJson,
} from '../_shared/providers.ts';
import {
  fldNumImageMaxPerCall,
  fldNumVoiceMaxDataUrlBytes,
  fldNumVoiceMaxPerCall,
  fldNumVoiceSignedUrlSec,
  fncConvBatches,
  fncRunValidateVoiceBytes,
} from '../_shared/voice.ts';
import { fldObjProgress, fncConvProgress } from '../_shared/progress.ts';
import {
  fncRunClaimStage,
  fncRunMarkRun,
  fncRunMarkStage,
  fncRunReadStagePayload,
} from '../_shared/stages.ts';

type fldObjRunRequest = {
  session_id: unknown;
  run_id: unknown;
};

type fldObjRunRow = {
  id: string;
  mode: 'singleProduct' | 'multiProduct';
  status: string;
  target_collection_id: string;
  target_set_id: string | null;
};

type fldObjRunImageRow = {
  id: string;
  sort_order: number;
  file_path: string;
  mime_type: string;
  rotation_degrees: number;
  voice_file_path: string | null;
};

type fldObjCatalogRow = {
  image_id: string;
  isbn10: string | null;
  isbn13: string | null;
  record: fldObjCatalogEntry | null;
  source: string | null;
  reason: string | null;
  rejected: fldObjWaterfallReject[];
  candidate_isbn10: string | null;
  candidate_isbn13: string | null;
  detail_url: string | null;
};

type fldObjCatalogPayload = {
  records: fldObjCatalogRow[];
};

type fldObjCandidatePrice = Omit<fldObjMinorPriceBands, 'basis'> & {
  basis: string;
  error: string | null;
  observations: fldObjPriceObservation[];
  ai_estimate: fldObjMinorPriceBands;
};

type fldObjPricePayload = {
  prices: fldObjCandidatePrice[];
  chain: fldObjChainAttempt[];
};

type fldObjDuplicateDecision = {
  members: number[];
  reason: string | null;
  confidence: number | null;
  action: 'merged' | 'split';
  note: string | null;
};

type fldObjDuplicatePayload = {
  groups: fldObjDuplicateDecision[];
  usage: {
    requests: number;
    retries: number;
    total_tokens: number;
    tokens_seen: boolean;
  };
  chain: fldObjChainAttempt[];
};

type fldObjPhotoEvidence = {
  photo_id: string;
  read: fldObjMusePhotoRead;
  catalog: {
    record: fldObjCatalogEntry | null;
    source: string | null;
    reason: string | null;
  } | null;
  voice_text: string | null;
};

type fldObjMergedResult = {
  photo_ids: string[];
  biblio: fldObjMuseResult;
  price: fldObjCandidatePrice;
  evidence: fldObjPhotoEvidence[];
  needs_review: string[];
  duplicate: {
    merged_from: number[];
    reason: string | null;
    confidence: number | null;
  } | null;
};

type fldObjMergePayload = {
  results: fldObjMergedResult[];
  sources: { source: string; detail: string }[];
};

type fldObjTranscript = {
  image_id: string;
  voice_file_path: string;
  voice_version: number;
  text: string | null;
  status: 'ready' | 'empty' | 'failed';
  duration_sec: number | null;
  language: string | null;
  uncertain_parts: string[];
  error: string | null;
};

type fldObjTranscribePayload = {
  transcripts: fldObjTranscript[];
  usage: {
    requests: number;
    retries: number;
    total_tokens: number;
    tokens_seen: boolean;
  };
  chain: fldObjChainAttempt[];
};

const fldStrPhotoBucket = 'product-photos';
const fldStrVoiceBucket = 'voice-notes';

function fncConvStorageName(
  fldStrFilePath: string,
  fldStrBucket: string,
): string {
  const fldStrPrefix = `${fldStrBucket}/`;
  if (fldStrFilePath.startsWith(fldStrPrefix)) {
    return fldStrFilePath.slice(fldStrPrefix.length);
  }
  return fldStrFilePath;
}

function fncConvBase64(fldObjBytes: Uint8Array): string {
  let fldStrBinary = '';
  const fldNumChunk = 0x8000;
  for (
    let fldNumAt = 0;
    fldNumAt < fldObjBytes.length;
    fldNumAt += fldNumChunk
  ) {
    fldStrBinary += String.fromCharCode(
      ...fldObjBytes.subarray(fldNumAt, fldNumAt + fldNumChunk),
    );
  }
  return btoa(fldStrBinary);
}

async function fncRunDownloadPhoto(
  fldObjClient: SupabaseClient,
  fldStrFilePath: string,
): Promise<Uint8Array> {
  const { data: fldObjBlob, error: fldObjError } = await fldObjClient.storage
    .from(fldStrPhotoBucket)
    .download(fncConvStorageName(fldStrFilePath, fldStrPhotoBucket));
  if (fldObjError || !fldObjBlob) {
    throw new Error(
      `Logosphere BITS: draft photo missing (${fldStrFilePath}).`,
    );
  }
  return new Uint8Array(await fldObjBlob.arrayBuffer());
}

async function fncRunDownloadVoice(
  fldObjClient: SupabaseClient,
  fldStrFilePath: string,
): Promise<Uint8Array> {
  const { data: fldObjBlob, error: fldObjError } = await fldObjClient.storage
    .from(fldStrVoiceBucket)
    .download(fncConvStorageName(fldStrFilePath, fldStrVoiceBucket));
  if (fldObjError || !fldObjBlob) {
    throw new Error(
      `Logosphere BITS: draft voice missing (${fldStrFilePath}).`,
    );
  }
  return new Uint8Array(await fldObjBlob.arrayBuffer());
}

async function fncRunVoiceAudioUrl(
  fldObjClient: SupabaseClient,
  fldStrFilePath: string,
  fldObjBytes: Uint8Array,
): Promise<string> {
  const { data: fldObjSigned, error: fldObjError } = await fldObjClient.storage
    .from(fldStrVoiceBucket)
    .createSignedUrl(
      fncConvStorageName(fldStrFilePath, fldStrVoiceBucket),
      fldNumVoiceSignedUrlSec,
    );
  if (!fldObjError && fldObjSigned?.signedUrl) {
    return fldObjSigned.signedUrl;
  }
  if (fldObjBytes.length <= fldNumVoiceMaxDataUrlBytes) {
    return `data:audio/mp4;base64,${fncConvBase64(fldObjBytes)}`;
  }
  throw new Error('Logosphere BITS: voice link failed.');
}

function fncConvResultPhotos(
  fldStrMode: 'singleProduct' | 'multiProduct',
  fldArrImages: fldObjRunImageRow[],
  fldNumResultIndex: number,
): string[] {
  if (fldStrMode === 'singleProduct') {
    return fldArrImages.map((fldObjImage) => fldObjImage.id);
  }
  const fldObjImage = fldArrImages[fldNumResultIndex];
  return fldObjImage === undefined ? [] : [fldObjImage.id];
}

function fncConvNullPrice(fldStrError: string | null): fldObjCandidatePrice {
  return {
    replacement_new: null,
    market_min: null,
    market_max: null,
    market_median: null,
    market_recommended: null,
    currency: 'USD',
    confidence: null,
    basis: 'ai-estimate',
    error: fldStrError,
    observations: [],
    ai_estimate: fncConvCleanPriceBands({}),
  };
}

function fncConvStoredObservations(
  fldObjValue: unknown,
): fldObjPriceObservation[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrOut: fldObjPriceObservation[] = [];
  for (const fldObjEntry of fldObjValue) {
    if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
      continue;
    }
    const fldObjRow = fldObjEntry as Record<string, unknown>;
    if (
      typeof fldObjRow['amount_minor'] !== 'number' ||
      typeof fldObjRow['currency'] !== 'string' ||
      typeof fldObjRow['source'] !== 'string' ||
      typeof fldObjRow['url'] !== 'string' ||
      typeof fldObjRow['observed_at'] !== 'string'
    ) {
      continue;
    }
    fldArrOut.push({
      amount_minor: fldObjRow['amount_minor'] as number,
      currency: fldObjRow['currency'] as string,
      usd_minor: typeof fldObjRow['usd_minor'] === 'number'
        ? (fldObjRow['usd_minor'] as number)
        : null,
      source: fldObjRow['source'] as string,
      url: fldObjRow['url'] as string,
      market: fldObjRow['market'] === 'new' || fldObjRow['market'] === 'used'
        ? fldObjRow['market']
        : null,
      observed_at: fldObjRow['observed_at'] as string,
      rate: typeof fldObjRow['rate'] === 'number'
        ? (fldObjRow['rate'] as number)
        : null,
      rate_date: typeof fldObjRow['rate_date'] === 'string'
        ? (fldObjRow['rate_date'] as string)
        : null,
    });
  }
  return fldArrOut;
}

function fncConvStoredPrice(fldObjValue: unknown): fldObjCandidatePrice {
  const fldObjRow = typeof fldObjValue === 'object' && fldObjValue !== null
    ? (fldObjValue as Record<string, unknown>)
    : {};
  const fldObjClean = {
    replacement_new: typeof fldObjRow['replacement_new'] === 'number'
      ? (fldObjRow['replacement_new'] as number)
      : null,
    market_min: typeof fldObjRow['market_min'] === 'number'
      ? (fldObjRow['market_min'] as number)
      : null,
    market_max: typeof fldObjRow['market_max'] === 'number'
      ? (fldObjRow['market_max'] as number)
      : null,
    market_median: typeof fldObjRow['market_median'] === 'number'
      ? (fldObjRow['market_median'] as number)
      : null,
    market_recommended: typeof fldObjRow['market_recommended'] === 'number'
      ? (fldObjRow['market_recommended'] as number)
      : null,
    currency: typeof fldObjRow['currency'] === 'string'
      ? (fldObjRow['currency'] as string)
      : 'USD',
    confidence: typeof fldObjRow['confidence'] === 'number'
      ? (fldObjRow['confidence'] as number)
      : null,
    basis: typeof fldObjRow['basis'] === 'string'
      ? (fldObjRow['basis'] as string)
      : 'estimate',
    error: typeof fldObjRow['error'] === 'string'
      ? (fldObjRow['error'] as string)
      : null,
    observations: fncConvStoredObservations(fldObjRow['observations']),
    ai_estimate: fncConvCleanPriceBands(fldObjRow['ai_estimate']),
  };
  return fldObjClean;
}

function fncConvGroupNote(
  fldArrMembers: number[],
  fldArrResults: fldObjMuseResult[],
  fldArrPrices: fldObjCandidatePrice[],
): string | null {
  const fldObjCurrencies = new Set(
    fldArrMembers.map((fldNumIndex) =>
      fldArrPrices[fldNumIndex]?.currency ?? 'USD'
    ),
  );
  if (fldObjCurrencies.size > 1) {
    return 'currency-mismatch';
  }
  const fldObjIsbns = new Set(
    fldArrMembers
      .map((fldNumIndex) => fldArrResults[fldNumIndex]?.isbn13 ?? null)
      .filter((fldObjIsbn): fldObjIsbn is string => fldObjIsbn !== null),
  );
  if (fldObjIsbns.size > 1) {
    return 'edition-mismatch';
  }
  const fldArrTitles = fldArrMembers
    .map((fldNumIndex) => fldArrResults[fldNumIndex]?.title ?? null)
    .filter((fldObjTitle): fldObjTitle is string => fldObjTitle !== null);
  for (let fldNumLeft = 0; fldNumLeft < fldArrTitles.length; fldNumLeft += 1) {
    for (
      let fldNumRight = fldNumLeft + 1;
      fldNumRight < fldArrTitles.length;
      fldNumRight += 1
    ) {
      if (
        !fncConvTitlesMatch(
          fldArrTitles[fldNumLeft]!,
          fldArrTitles[fldNumRight]!,
        )
      ) {
        return 'edition-mismatch';
      }
    }
  }
  // Two stock copies of one ISBN stay two products: when
  // both members name a signature or a dedication and the
  // names disagree, the photos show different copies.
  for (const fldStrField of ['signature', 'dedication'] as const) {
    const fldObjCopies = new Set(
      fldArrMembers
        .map((fldNumIndex) =>
          fncConvNormalizeTitle(
            fldArrResults[fldNumIndex]?.[fldStrField] ?? null,
          )
        )
        .filter((fldStrName) => fldStrName !== ''),
    );
    if (fldObjCopies.size > 1) {
      return 'copy-mismatch';
    }
  }
  return null;
}

async function fncRunFailRun(
  fldObjClient: SupabaseClient,
  fldObjProgress: fldObjProgress,
  fldStrRunId: string,
  fldStrStage: string,
  fldNumVersion: number,
  fldObjError: unknown,
): Promise<Response> {
  const fldStrMessage = fldObjError instanceof Error
    ? fldObjError.message
    : String(fldObjError);
  // Chain provider failures stay retryable (a fresh invocation
  // resumes); only missing keys/endpoints are permanent, since
  // no retry can configure them.
  const fldBooChainProvider = (fldStrMessage.includes('muse-baseten') ||
    fldStrMessage.includes('muse-api') ||
    fldStrMessage.includes('deepseek')) &&
    !fldStrMessage.includes('not configured');
  const fldBooRetryable = fldStrMessage.includes('Muse call failed') ||
    fldBooChainProvider ||
    fldStrMessage.includes('unparsable JSON') ||
    fldStrMessage.includes('empty answer') ||
    fldStrMessage.includes('voice link failed');
  await fncRunMarkStage(
    fldObjClient,
    fldStrRunId,
    fldStrStage,
    fldNumVersion,
    fldBooRetryable ? 'failedRetryable' : 'failedPermanent',
    null,
    { fldStrCode: 'stage-failed', fldStrMessage },
  );
  await fncRunMarkRun(
    fldObjClient,
    fldStrRunId,
    fldBooRetryable ? 'failedRetryable' : 'failedPermanent',
  );
  fldObjProgress.emit({
    fldStrStage,
    fldStrEvent: 'error',
    fldStrDetail: fldStrMessage,
  });
  await fldObjProgress.flush();
  return fncConvJsonResponse(
    {
      status: 'error',
      error: fldStrMessage,
      run_id: fldStrRunId,
      failed_stage: fldStrStage,
    },
    500,
  );
}

export async function fncRunHandleRequest(
  fldObjRequest: Request,
  fldObjInjectedClient?: SupabaseClient,
): Promise<Response> {
  if (fldObjRequest.method === 'OPTIONS') {
    return fncRunPreflightResponse();
  }
  const fldStrWorkerId = `bits-analysis-run:${crypto.randomUUID()}`;
  try {
    const fldObjBody = (await fldObjRequest.json()) as fldObjRunRequest;
    const fldStrSessionId = typeof fldObjBody.session_id === 'string'
      ? fldObjBody.session_id
      : '';
    const fldStrRunId = typeof fldObjBody.run_id === 'string'
      ? fldObjBody.run_id.trim()
      : '';
    if (fldStrRunId === '') {
      return fncConvJsonResponse(
        { status: 'error', error: 'Invalid analysis request.' },
        400,
      );
    }
    const fldObjClient = fldObjInjectedClient ?? fncConvServiceClient();
    await fncRunAuthorizeDemo(
      fldObjClient,
      fldStrSessionId,
      'create',
      'collection',
    );
    const { data: fldObjRunData, error: fldObjRunError } = await fldObjClient
      .from('pipeline_runs')
      .select('id, mode, status, target_collection_id, target_set_id')
      .eq('id', fldStrRunId)
      .maybeSingle();
    if (fldObjRunError || fldObjRunData === null) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Unknown pipeline run.' },
        404,
      );
    }
    const fldObjRun = fldObjRunData as unknown as fldObjRunRow;
    const { data: fldArrImageData, error: fldObjImagesError } =
      await fldObjClient
        .from('pipeline_run_images')
        .select(
          'id, sort_order, file_path, mime_type, rotation_degrees, voice_file_path',
        )
        .eq('run_id', fldStrRunId)
        .order('sort_order', { ascending: true });
    if (
      fldObjImagesError || !Array.isArray(fldArrImageData) ||
      fldArrImageData.length === 0
    ) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Pipeline run has no images.' },
        400,
      );
    }
    const fldArrImages = fldArrImageData as unknown as fldObjRunImageRow[];
    const fldObjProgress = fncConvProgress(fldStrRunId);
    if (fldObjRun.status === 'succeeded') {
      const fldObjMerge = await fncRunReadStagePayload<fldObjMergePayload>(
        fldObjClient,
        fldStrRunId,
        'merge',
      );
      if (fldObjMerge !== null) {
        await fldObjProgress.flush();
        return fncConvJsonResponse({
          status: 'ok',
          run_id: fldStrRunId,
          replayed: true,
          mode: fldObjRun.mode,
          results: fldObjMerge.results,
          sources: fldObjMerge.sources,
        });
      }
    }
    await fncRunMarkRun(fldObjClient, fldStrRunId, 'running');

    // upload: verify every draft photo. Voices are verified
    // (downloaded, validated, transcribed) in the transcribe
    // stage, so a failed voice never pays for a photo read.
    const fldNumUploadVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'upload',
      fldStrWorkerId,
    );
    const fldArrPhotoBytes: Uint8Array[] = [];
    if (fldNumUploadVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<{ sizes: number[] }>(
        fldObjClient,
        fldStrRunId,
        'upload',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Upload stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      for (const fldObjImage of fldArrImages) {
        fldArrPhotoBytes.push(
          await fncRunDownloadPhoto(fldObjClient, fldObjImage.file_path),
        );
      }
    } else {
      try {
        fldObjProgress.emit({ fldStrStage: 'upload', fldStrEvent: 'start' });
        const fldArrSizes: number[] = [];
        for (const fldObjImage of fldArrImages) {
          const fldObjBytes = await fncRunDownloadPhoto(
            fldObjClient,
            fldObjImage.file_path,
          );
          fldArrSizes.push(fldObjBytes.length);
          fldArrPhotoBytes.push(fldObjBytes);
        }
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'upload',
          fldNumUploadVersion,
          'succeeded',
          {
            sizes: fldArrSizes,
          },
        );
        fldObjProgress.emit({ fldStrStage: 'upload', fldStrEvent: 'ok' });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'upload',
          fldNumUploadVersion,
          fldObjError,
        );
      }
    }

    // transcribe: Muse speech-to-text over the draft voice
    // notes, before any image query. Each recording pairs with
    // its fixed image UUID at voice version 1; empty or
    // unintelligible recordings store null, never invented
    // text. No voices means no call.
    const fldNumTranscribeVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'transcribe',
      fldStrWorkerId,
    );
    let fldArrTranscripts: fldObjTranscript[] = [];
    if (fldNumTranscribeVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<
        fldObjTranscribePayload
      >(
        fldObjClient,
        fldStrRunId,
        'transcribe',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Transcribe stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrTranscripts = fldObjStored.transcripts ?? [];
    } else {
      try {
        fldObjProgress.emit({
          fldStrStage: 'transcribe',
          fldStrEvent: 'start',
        });
        const fldArrVoiced = fldArrImages.filter(
          (fldObjImage) => fldObjImage.voice_file_path !== null,
        );
        if (fldArrVoiced.length === 0) {
          await fncRunMarkStage(
            fldObjClient,
            fldStrRunId,
            'transcribe',
            fldNumTranscribeVersion,
            'cancelled',
            { skipped: 'no-voice', voice_files: 0 },
          );
          fldObjProgress.emit({
            fldStrStage: 'transcribe',
            fldStrEvent: 'skip',
            fldStrDetail: 'no-voice',
          });
        } else {
          const fldArrItems: {
            fldObjImage: fldObjRunImageRow;
            fldStrUrl: string;
            fldNumDuration: number | null;
          }[] = [];
          for (const fldObjImage of fldArrVoiced) {
            // A broken voice note never blocks the photo flow: it
            // lands as a failed transcript row and stays visible.
            try {
              const fldObjBytes = await fncRunDownloadVoice(
                fldObjClient,
                fldObjImage.voice_file_path as string,
              );
              const fldObjValid = fncRunValidateVoiceBytes(fldObjBytes);
              fldArrItems.push({
                fldObjImage,
                fldStrUrl: await fncRunVoiceAudioUrl(
                  fldObjClient,
                  fldObjImage.voice_file_path as string,
                  fldObjBytes,
                ),
                fldNumDuration: fldObjValid.durationSec,
              });
            } catch (fldObjError: unknown) {
              fldArrTranscripts.push({
                image_id: fldObjImage.id,
                voice_file_path: fldObjImage.voice_file_path as string,
                voice_version: 1,
                text: null,
                status: 'failed',
                duration_sec: null,
                language: null,
                uncertain_parts: [],
                error: fldObjError instanceof Error
                  ? fldObjError.message
                  : 'Logosphere BITS: voice note failed.',
              });
              fldObjProgress.emit({
                fldStrStage: 'transcribe',
                fldStrEvent: 'error',
                fldStrDetail: fldObjImage.id,
              });
            }
          }
          const fldObjUsageBefore = fncConvMuseUsage();
          const fldNumChainBefore = fncConvChainLastSeq();
          const fldArrBatches = fncConvBatches(
            fldArrItems,
            fldNumVoiceMaxPerCall,
          );
          for (const fldArrBatch of fldArrBatches) {
            const fldObjAnswer = await fncRunChainJson<
              { transcripts: unknown }
            >(
              fncConvTranscribeMessages(
                fldArrBatch.map((fldObjItem) => fldObjItem.fldStrUrl),
              ),
              4000,
              'audio',
            );
            const fldArrTexts = fldObjAnswer.transcripts;
            if (
              !Array.isArray(fldArrTexts) ||
              fldArrTexts.length !== fldArrBatch.length
            ) {
              throw new Error(
                'Logosphere BITS: Muse transcribe returned a mismatched answer.',
              );
            }
            fldArrBatch.forEach((fldObjItem, fldNumIndex) => {
              const fldObjRow = fncConvCleanTranscriptRow(
                fldArrTexts[fldNumIndex],
              );
              fldArrTranscripts.push({
                image_id: fldObjItem.fldObjImage.id,
                voice_file_path: fldObjItem.fldObjImage
                  .voice_file_path as string,
                voice_version: 1,
                text: fldObjRow.text,
                status: fldObjRow.text === null ? 'empty' : 'ready',
                duration_sec: fldObjItem.fldNumDuration,
                language: fldObjRow.language,
                uncertain_parts: fldObjRow.uncertain_parts,
                error: null,
              });
            });
          }
          const fldObjUsageAfter = fncConvMuseUsage();
          const fldNumTexts = fldArrTranscripts.filter(
            (fldObjRow) => fldObjRow.text !== null,
          ).length;
          await fncRunMarkStage(
            fldObjClient,
            fldStrRunId,
            'transcribe',
            fldNumTranscribeVersion,
            'succeeded',
            {
              transcripts: fldArrTranscripts,
              usage: {
                requests: fldObjUsageAfter.fldNumRequests -
                  fldObjUsageBefore.fldNumRequests,
                retries: fldObjUsageAfter.fldNumRetries -
                  fldObjUsageBefore.fldNumRetries,
                total_tokens: fldObjUsageAfter.fldNumTotalTokens -
                  fldObjUsageBefore.fldNumTotalTokens,
                tokens_seen: fldObjUsageAfter.fldBooTokensSeen,
              },
              chain: fncConvChainAttemptsAfter(fldNumChainBefore),
            },
          );
          fldObjProgress.emit({
            fldStrStage: 'transcribe',
            fldStrEvent: 'ok',
            fldStrDetail:
              `${fldArrTranscripts.length} voices, ${fldNumTexts} texts`,
          });
        }
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'transcribe',
          fldNumTranscribeVersion,
          fldObjError,
        );
      }
    }

    // preRead: Muse vision over the draft photos, in batches
    // of 8 (the per-call image cap), order preserved.
    const fldNumPreReadVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'preRead',
      fldStrWorkerId,
    );
    let fldArrReads: fldObjMusePhotoRead[] = [];
    if (fldNumPreReadVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<
        { reads: fldObjMusePhotoRead[] }
      >(
        fldObjClient,
        fldStrRunId,
        'preRead',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Pre-read stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrReads = fldObjStored.reads;
    } else {
      try {
        fldObjProgress.emit({ fldStrStage: 'preRead', fldStrEvent: 'start' });
        const fldArrPhotoBatches = fncConvBatches(
          fldArrPhotoBytes,
          fldNumImageMaxPerCall,
        );
        for (const fldArrBatch of fldArrPhotoBatches) {
          const fldObjAnswer = await fncRunChainJson<{ reads: unknown }>(
            fncConvPreReadMessages(
              fldArrBatch.map((fldObjBytes) => fncConvBase64(fldObjBytes)),
              fldObjRun.mode,
            ),
            4000,
            'vision',
          );
          if (
            !Array.isArray(fldObjAnswer.reads) ||
            fldObjAnswer.reads.length === 0
          ) {
            throw new Error(
              'Logosphere BITS: Muse pre-read returned no reads.',
            );
          }
          for (const fldObjRead of fldObjAnswer.reads) {
            fldArrReads.push(fncConvCleanPhotoRead(fldObjRead));
          }
        }
        if (fldArrReads.length !== fldArrImages.length) {
          throw new Error(
            'Logosphere BITS: Muse pre-read returned a mismatched answer.',
          );
        }
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'preRead',
          fldNumPreReadVersion,
          'succeeded',
          { reads: fldArrReads },
        );
        fldObjProgress.emit({ fldStrStage: 'preRead', fldStrEvent: 'ok' });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'preRead',
          fldNumPreReadVersion,
          fldObjError,
        );
      }
    }

    // catalog: strict-ISBN waterfall per photo (local cache,
    // Open Library, Google Books; title fallback without a
    // valid ISBN). Every try is audit-logged; a miss stores
    // null with a reason and never fails the run.
    const fldNumCatalogVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'catalog',
      fldStrWorkerId,
    );
    let fldArrCatalog: fldObjCatalogRow[] = [];
    if (fldNumCatalogVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<fldObjCatalogPayload>(
        fldObjClient,
        fldStrRunId,
        'catalog',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Catalog stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrCatalog = fldObjStored.records ?? [];
    } else {
      try {
        fldObjProgress.emit({ fldStrStage: 'catalog', fldStrEvent: 'start' });
        for (
          let fldNumIndex = 0;
          fldNumIndex < fldArrImages.length;
          fldNumIndex += 1
        ) {
          const fldObjImage = fldArrImages[fldNumIndex]!;
          const fldObjRead = fldArrReads[fldNumIndex] ??
            fncConvCleanPhotoRead({});
          const fldStrIsbn10 = fncConvCleanIsbnStrict(fldObjRead.isbn10);
          const fldStrIsbn13 = fncConvCleanIsbnStrict(fldObjRead.isbn13);
          const fldArrAuthors = fldObjRead.contributors
            .map((fldObjPerson) => fldObjPerson.name)
            .filter((fldObjName): fldObjName is string => fldObjName !== null);
          let fldObjHit;
          try {
            fldObjHit = await fncRunWaterfall(
              fldObjClient,
              fldStrRunId,
              fldObjImage.id,
              {
                isbn10: fldStrIsbn10,
                isbn13: fldStrIsbn13,
                title: fldObjRead.title,
                authors: fldArrAuthors,
                publisher: fldObjRead.publisher,
                language: fldObjRead.publication_language,
                edition: fldObjRead.edition,
              },
            );
          } catch {
            fldObjHit = {
              candidate: null,
              source: null,
              reason: 'catalog-error',
              rejected: [],
            };
          }
          const fldObjCandidate = fldObjHit.candidate;
          fldArrCatalog.push({
            image_id: fldObjImage.id,
            isbn10: fldStrIsbn10,
            isbn13: fldStrIsbn13,
            record: fldObjCandidate === null ? null : {
              title: fldObjCandidate.title,
              publishers: fldObjCandidate.publisher === null
                ? []
                : [fldObjCandidate.publisher],
              publish_year: fldObjCandidate.publish_year,
              pages: fldObjCandidate.pages,
            },
            source: fldObjHit.source,
            reason: fldObjHit.reason,
            rejected: fldObjHit.rejected,
            candidate_isbn10: fldObjCandidate?.isbn10 ?? null,
            candidate_isbn13: fldObjCandidate?.isbn13 ?? null,
            detail_url: fldObjCandidate?.url || null,
          });
        }
        const fldNumHits = fldArrCatalog.filter(
          (fldObjRow) => fldObjRow.record !== null,
        ).length;
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'catalog',
          fldNumCatalogVersion,
          'succeeded',
          { records: fldArrCatalog },
        );
        fldObjProgress.emit({
          fldStrStage: 'catalog',
          fldStrEvent: 'ok',
          fldStrDetail: `${fldNumHits} records, ${
            fldArrCatalog.length - fldNumHits
          } misses`,
        });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'catalog',
          fldNumCatalogVersion,
          fldObjError,
        );
      }
    }

    // finalDiagnose: one isolated call per candidate. Single
    // merges every read with every voice and catalog row; multi
    // sends each photo only its own read, voice, catalog row,
    // and rejected summary — a voice claim never travels to a
    // sibling candidate. Each answer carries exactly one
    // result; ISBNs must come from the lens or an accepted
    // record, Dewey is reference-checked, and per-field
    // origins land in field_evidence.
    const fldNumFinalVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'finalDiagnose',
      fldStrWorkerId,
    );
    let fldArrResults: fldObjMuseResult[] = [];
    if (fldNumFinalVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<
        { results: fldObjMuseResult[] }
      >(
        fldObjClient,
        fldStrRunId,
        'finalDiagnose',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Finalize stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrResults = fldObjStored.results;
    } else {
      try {
        fldObjProgress.emit({
          fldStrStage: 'finalDiagnose',
          fldStrEvent: 'start',
        });
        const fldNumChainBefore = fncConvChainLastSeq();
        const fldArrUnits = fldObjRun.mode === 'singleProduct'
          ? [{
            fldArrReads: fldArrReads,
            fldArrImageIds: fldArrImages.map((fldObjImage) => fldObjImage.id),
          }]
          : fldArrReads.map((fldObjRead, fldNumIndex) => ({
            fldArrReads: [fldObjRead],
            fldArrImageIds: [fldArrImages[fldNumIndex]!.id],
          }));
        const fldArrOut: fldObjMuseResult[] = [];
        for (
          let fldNumUnit = 0;
          fldNumUnit < fldArrUnits.length;
          fldNumUnit += 1
        ) {
          const fldObjUnit = fldArrUnits[fldNumUnit]!;
          const fldArrDeclarations: fldObjVoiceDeclaration[] = fldArrTranscripts
            .filter((fldObjRow) =>
              fldObjRow.text !== null &&
              fldObjUnit.fldArrImageIds.includes(fldObjRow.image_id)
            )
            .map((fldObjRow) => ({
              image_id: fldObjRow.image_id,
              text: fldObjRow.text as string,
            }));
          const fldArrUnitCatalog = fldArrCatalog.filter((fldObjRow) =>
            fldObjUnit.fldArrImageIds.includes(fldObjRow.image_id)
          );
          const fldObjOrigins: Record<string, string> = {};
          for (const fldObjRead of fldObjUnit.fldArrReads) {
            for (
              const fldStrField of [
                'title',
                'subtitle',
                'isbn10',
                'isbn13',
                'publisher',
                'publication_language',
                'edition',
                'printing',
                'publication_year',
                'original_publication_year',
                'page_count',
                'publication_type',
                'description',
                'binding',
                'dust_jacket',
                'paper',
                'dimensions',
                'condition',
                'signature',
                'dedication',
              ] as (keyof fldObjMusePhotoRead)[]
            ) {
              if (
                fldObjRead[fldStrField] !== null &&
                fldObjOrigins[fldStrField] === undefined
              ) {
                fldObjOrigins[fldStrField] = 'photo_read';
              }
            }
          }
          for (const fldObjRow of fldArrUnitCatalog) {
            if (fldObjRow.record !== null) {
              for (
                const fldStrField of [
                  'title',
                  'publisher',
                  'publication_year',
                  'page_count',
                ]
              ) {
                if (fldObjOrigins[fldStrField] === undefined) {
                  fldObjOrigins[fldStrField] = 'catalog_record';
                }
              }
            }
          }
          const fldArrEmpty = [
            'title',
            'subtitle',
            'isbn10',
            'isbn13',
            'publisher',
            'publication_language',
            'edition',
            'printing',
            'publication_year',
            'original_publication_year',
            'page_count',
            'publication_type',
            'description',
            'binding',
            'dust_jacket',
            'paper',
            'dimensions',
            'condition',
            'signature',
            'dedication',
          ].filter((fldStrField) => fldObjOrigins[fldStrField] === undefined);
          const fldObjAnswer = await fncRunChainJson<{ results: unknown }>(
            fncConvFinalMessages(
              fldObjUnit.fldArrReads,
              fldObjRun.mode,
              fldArrDeclarations,
              {
                imageOrder: fldObjUnit.fldArrImageIds.map((fldStrId) => {
                  const fldObjImage = fldArrImages.find((fldObjEntry) =>
                    fldObjEntry.id === fldStrId
                  )!;
                  return {
                    image_id: fldStrId,
                    sort_order: fldObjImage.sort_order,
                    mime_type: fldObjImage.mime_type,
                    has_voice: fldArrTranscripts.some((fldObjRow) =>
                      fldObjRow.image_id === fldStrId &&
                      fldObjRow.text !== null
                    ),
                  };
                }),
                catalog: fldArrUnitCatalog.map((fldObjRow) => ({
                  image_id: fldObjRow.image_id,
                  record: fldObjRow.record,
                  source: fldObjRow.source,
                  reason: fldObjRow.reason,
                  rejected: fldObjRow.rejected ?? [],
                })),
                origins: fldObjOrigins,
                emptyFields: fldArrEmpty,
                conflicts: fldObjUnit.fldArrReads.map((
                  fldObjRead,
                  fldNumAt,
                ) => ({
                  image_id: fldObjUnit.fldArrImageIds[fldNumAt]!,
                  conflicts: fldObjRead.conflicts ?? [],
                })).filter((fldObjEntry) => fldObjEntry.conflicts.length > 0),
              },
            ),
            4000,
            'text',
          );
          const fldArrRaw = fncConvValidateResultCount(
            fldObjAnswer.results,
            1,
          );
          const fldObjResult = fncConvCleanResult(fldArrRaw[0]);
          const fldArrAllowedIsbn = [
            ...fldObjUnit.fldArrReads.flatMap((fldObjRead) => [
              fncConvCleanIsbnStrict(fldObjRead.isbn10),
              fncConvCleanIsbnStrict(fldObjRead.isbn13),
            ]),
            ...fldArrUnitCatalog.flatMap((fldObjRow) => [
              fncConvCleanIsbnStrict(fldObjRow.candidate_isbn10 ?? null),
              fncConvCleanIsbnStrict(fldObjRow.candidate_isbn13 ?? null),
            ]),
          ].filter((fldStrIsbn): fldStrIsbn is string => fldStrIsbn !== null);
          const fldArrNulledIsbn: { field: string; value: string }[] = [];
          for (const fldStrField of ['isbn10', 'isbn13'] as const) {
            const fldStrValue = fldObjResult[fldStrField];
            if (
              fldStrValue !== null &&
              !fldArrAllowedIsbn.includes(fldStrValue)
            ) {
              fldArrNulledIsbn.push({ field: fldStrField, value: fldStrValue });
              fldObjResult[fldStrField] = null;
            }
          }
          const fldObjDewey = await fncRunCheckDewey(
            fldObjClient,
            fldObjResult.dewey,
          );
          fldObjResult.dewey = fldObjDewey.code;
          fldObjResult.dewey_verified = fldObjDewey.verified;
          const fldObjMergedRead: fldObjMusePhotoRead = fldObjUnit.fldArrReads
            .reduce((fldObjAcc, fldObjRead) => {
              for (
                const fldStrField of [
                  'title',
                  'subtitle',
                  'isbn10',
                  'isbn13',
                  'publisher',
                  'publication_language',
                  'edition',
                  'printing',
                  'publication_year',
                  'original_publication_year',
                  'page_count',
                  'publication_type',
                  'description',
                  'binding',
                  'dust_jacket',
                  'paper',
                  'dimensions',
                  'condition',
                  'signature',
                  'dedication',
                ] as (keyof fldObjMusePhotoRead)[]
              ) {
                if (
                  fldObjAcc[fldStrField] === null &&
                  fldObjRead[fldStrField] !== null
                ) {
                  (fldObjAcc as Record<string, unknown>)[fldStrField] =
                    fldObjRead[fldStrField];
                }
              }
              for (const fldObjPerson of fldObjRead.contributors) {
                if (
                  fldObjPerson.name !== null &&
                  !fldObjAcc.contributors.some((fldObjKept) =>
                    fldObjKept.name === fldObjPerson.name
                  )
                ) {
                  fldObjAcc.contributors.push(fldObjPerson);
                }
              }
              return fldObjAcc;
            }, fncConvCleanPhotoRead({}));
          const fldObjFirstCatalog = fldArrUnitCatalog.find((fldObjRow) =>
            fldObjRow.record !== null
          ) ?? null;
          const fldStrVoiceText = fldArrDeclarations.map((fldObjEntry) =>
            fldObjEntry.text
          ).join('\n');
          const fldArrOrigins = fncConvFieldOrigins(
            fldObjMergedRead,
            fldObjFirstCatalog === null ? null : {
              title: fldObjFirstCatalog.record!.title,
              publishers: fldObjFirstCatalog.record!.publishers,
              publish_year: fldObjFirstCatalog.record!.publish_year,
              pages: fldObjFirstCatalog.record!.pages,
            },
            fldStrVoiceText === '' ? null : fldStrVoiceText,
            fldObjResult,
          );
          for (const fldObjNulled of fldArrNulledIsbn) {
            fldArrOrigins.push({
              field: fldObjNulled.field,
              origin: 'catalog_rejected',
              detail: {
                reason: 'unsupported-isbn',
                value: fldObjNulled.value,
              },
            });
          }
          if (fldObjResult.dewey !== null) {
            fldArrOrigins.push({
              field: 'dewey',
              origin: 'ai_fill',
              detail: {
                verified: fldObjDewey.verified,
                parent: fldObjDewey.parent,
              },
            });
          }
          try {
            await fldObjClient.from('field_evidence').insert(
              fldArrOrigins.map((fldObjEntry) => ({
                run_id: fldStrRunId,
                candidate_index: fldNumUnit,
                field_name: fldObjEntry.field,
                origin: fldObjEntry.origin,
                origin_detail: {
                  ...fldObjEntry.detail,
                  image_ids: fldObjUnit.fldArrImageIds,
                },
              })),
            );
          } catch {
            // A lost trace batch never blocks the verified result.
          }
          fldArrOut.push(fldObjResult);
        }
        fldArrResults = fldArrOut;
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'finalDiagnose',
          fldNumFinalVersion,
          'succeeded',
          {
            results: fldArrResults,
            chain: fncConvChainAttemptsAfter(fldNumChainBefore),
          },
        );
        fldObjProgress.emit({
          fldStrStage: 'finalDiagnose',
          fldStrEvent: 'ok',
        });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'finalDiagnose',
          fldNumFinalVersion,
          fldObjError,
        );
      }
    }

    // price: Muse knowledge bands per result, in USD, in
    // parallel. One failed candidate stores null bands with
    // its error and the run continues; every candidate
    // failing fails the run instead.
    const fldNumPriceVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'price',
      fldStrWorkerId,
    );
    let fldArrPrices: fldObjCandidatePrice[] = [];
    if (fldNumPriceVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<fldObjPricePayload>(
        fldObjClient,
        fldStrRunId,
        'price',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Price stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrPrices = (fldObjStored.prices ?? []).map((fldObjPrice) =>
        fncConvStoredPrice(fldObjPrice)
      );
    } else {
      try {
        fldObjProgress.emit({ fldStrStage: 'price', fldStrEvent: 'start' });
        const fldNumChainBefore = fncConvChainLastSeq();
        const fldObjFxCache = new Map<string, fldObjFxRate | null>();
        const fldArrTried = await Promise.all(
          fldArrResults.map(async (fldObjResult, fldNumIndex) => {
            try {
              const fldArrPhotoIds = fncConvResultPhotos(
                fldObjRun.mode,
                fldArrImages,
                fldNumIndex,
              );
              const fldStrIsbn = fncConvCleanIsbnStrict(fldObjResult.isbn13) ??
                fncConvCleanIsbnStrict(fldObjResult.isbn10);
              const fldArrTargets: { source: string; url: string }[] = [];
              const fldObjSeen = new Set<string>();
              for (const fldObjRow of fldArrCatalog) {
                const fldStrUrl = fldObjRow.detail_url ?? null;
                if (
                  !fldArrPhotoIds.includes(fldObjRow.image_id) ||
                  fldStrUrl === null || fldObjSeen.has(fldStrUrl)
                ) {
                  continue;
                }
                fldObjSeen.add(fldStrUrl);
                fldArrTargets.push({
                  source: fldObjRow.source ?? 'catalog',
                  url: fldStrUrl,
                });
              }
              const fldArrObs = await fncRunGatherObservations(
                fldStrIsbn,
                fldArrTargets,
                fldObjFxCache,
              );
              const fldObjRayic = fncConvRayic(
                fldArrObs,
                fldObjResult.condition,
              );
              const fldObjAnswer = await fncRunChainJson<unknown>(
                fncConvPricePrompt(fldObjResult),
                4000,
                'text',
              );
              let fldObjAi = fncConvCleanPriceBands(fldObjAnswer);
              if (fldObjAi.currency !== 'USD') {
                const fldObjAiFx = await fncRunFxToUsd(
                  fldObjAi.currency,
                  fldObjFxCache,
                );
                if (fldObjAiFx !== null) {
                  const fncConvLeg = (
                    fldNumLeg: number | null,
                  ): number | null =>
                    fldNumLeg === null
                      ? null
                      : Math.round(fldNumLeg * fldObjAiFx.rate);
                  fldObjAi = {
                    ...fldObjAi,
                    replacement_new: fncConvLeg(fldObjAi.replacement_new),
                    market_min: fncConvLeg(fldObjAi.market_min),
                    market_max: fncConvLeg(fldObjAi.market_max),
                    market_median: fncConvLeg(fldObjAi.market_median),
                    market_recommended: fncConvLeg(
                      fldObjAi.market_recommended,
                    ),
                    currency: 'USD',
                  };
                }
              }
              const fldBooAiUsd = fldObjAi.currency === 'USD';
              const fldNumNew = fncConvNewMedian(fldArrObs);
              const fldBooObserved = fldObjRayic.count > 0;
              // AI legs join USD bands only in USD; an
              // unconvertible foreign AI estimate stands alone
              // in its own currency instead of poisoning the
              // rayic with mixed-currency legs.
              const fncConvLeg = (
                fldNumRayic: number | null,
                fldNumAi: number | null,
              ): number | null =>
                fldNumRayic ??
                  (fldBooAiUsd || !fldBooObserved ? fldNumAi : null);
              return {
                replacement_new: fncConvLeg(
                  fldNumNew,
                  fldObjAi.replacement_new,
                ),
                market_min: fncConvLeg(fldObjRayic.min, fldObjAi.market_min),
                market_max: fncConvLeg(fldObjRayic.max, fldObjAi.market_max),
                market_median: fncConvLeg(
                  fldObjRayic.median,
                  fldObjAi.market_median,
                ),
                market_recommended: fncConvLeg(
                  fldObjRayic.recommended,
                  fldObjAi.market_recommended,
                ),
                currency: fldBooObserved || fldBooAiUsd
                  ? 'USD'
                  : fldObjAi.currency,
                confidence: fldBooObserved ? 0.7 : fldObjAi.confidence,
                basis: fldBooObserved ? 'observed' : 'ai-estimate',
                error: null as string | null,
                observations: fldArrObs,
                ai_estimate: fldObjAi,
              };
            } catch (fldObjError: unknown) {
              const fldStrMessage = fldObjError instanceof Error
                ? fldObjError.message
                : String(fldObjError);
              return fncConvNullPrice(fldStrMessage);
            }
          }),
        );
        const fldArrFailed = fldArrTried.filter(
          (fldObjPrice) => fldObjPrice.error !== null,
        );
        if (
          fldArrTried.length > 0 && fldArrFailed.length === fldArrTried.length
        ) {
          throw new Error(
            fldArrFailed[0]!.error ?? 'Logosphere BITS: price lookup failed.',
          );
        }
        fldArrPrices = fldArrTried;
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'price',
          fldNumPriceVersion,
          'succeeded',
          {
            prices: fldArrPrices,
            chain: fncConvChainAttemptsAfter(fldNumChainBefore),
          },
        );
        fldObjProgress.emit({
          fldStrStage: 'price',
          fldStrEvent: 'ok',
          fldStrDetail: fldArrFailed.length === 0
            ? `${fldArrTried.length} estimates`
            : `${fldArrFailed.length} of ${fldArrTried.length} failed`,
        });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'price',
          fldNumPriceVersion,
          fldObjError,
        );
      }
    }

    // duplicate: a separate Muse decision over the priced
    // candidates, multi runs only. Only views of the SAME
    // physical copy may merge — two stock copies of one ISBN
    // stay two products. Groups must survive the server
    // guards (same currency, same edition, no conflicting
    // signature or dedication) or split back into separate
    // candidates with a reason; low-confidence merges and
    // source or voice gaps flag needs_review instead of
    // passing silently.
    const fldNumDuplicateVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'duplicate',
      fldStrWorkerId,
    );
    let fldArrDuplicate: fldObjDuplicateDecision[] = [];
    if (fldNumDuplicateVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<fldObjDuplicatePayload>(
        fldObjClient,
        fldStrRunId,
        'duplicate',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Duplicate stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      fldArrDuplicate = fldObjStored.groups ?? [];
    } else if (fldObjRun.mode === 'singleProduct') {
      await fncRunMarkStage(
        fldObjClient,
        fldStrRunId,
        'duplicate',
        fldNumDuplicateVersion,
        'cancelled',
        { skipped: 'single-product' },
      );
      fldObjProgress.emit({
        fldStrStage: 'duplicate',
        fldStrEvent: 'skip',
        fldStrDetail: 'single-product',
      });
    } else {
      try {
        fldObjProgress.emit({
          fldStrStage: 'duplicate',
          fldStrEvent: 'start',
        });
        const fldArrCandidates: fldObjDuplicateCandidate[] = fldArrResults.map(
          (fldObjResult, fldNumIndex) => ({
            index: fldNumIndex,
            title: fldObjResult.title,
            isbn13: fldObjResult.isbn13,
            publisher: fldObjResult.publisher,
            publication_year: fldObjResult.publication_year,
            edition: fldObjResult.edition,
            binding: fldObjResult.binding,
            condition: fldObjResult.condition,
            signature: fldObjResult.signature,
            dedication: fldObjResult.dedication,
            currency: fldArrPrices[fldNumIndex]?.currency ?? 'USD',
          }),
        );
        const fldObjUsageBefore = fncConvMuseUsage();
        const fldNumChainBefore = fncConvChainLastSeq();
        const fldObjAnswer = await fncRunChainJson<unknown>(
          fncConvDuplicateMessages(fldArrCandidates),
          4000,
          'text',
        );
        const fldObjUsageAfter = fncConvMuseUsage();
        fldArrDuplicate = fncConvCleanDuplicateGroups(
          fldObjAnswer,
          fldArrResults.length,
        ).map((fldObjGroup) => {
          const fldStrNote = fncConvGroupNote(
            fldObjGroup.members,
            fldArrResults,
            fldArrPrices,
          );
          return {
            ...fldObjGroup,
            action: (fldStrNote === null ? 'merged' : 'split') as
              | 'merged'
              | 'split',
            note: fldStrNote,
          };
        });
        const fldNumMerged = fldArrDuplicate.filter(
          (fldObjGroup) => fldObjGroup.action === 'merged',
        ).length;
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'duplicate',
          fldNumDuplicateVersion,
          'succeeded',
          {
            groups: fldArrDuplicate,
            usage: {
              requests: fldObjUsageAfter.fldNumRequests -
                fldObjUsageBefore.fldNumRequests,
              retries: fldObjUsageAfter.fldNumRetries -
                fldObjUsageBefore.fldNumRetries,
              total_tokens: fldObjUsageAfter.fldNumTotalTokens -
                fldObjUsageBefore.fldNumTotalTokens,
              tokens_seen: fldObjUsageAfter.fldBooTokensSeen,
            },
            chain: fncConvChainAttemptsAfter(fldNumChainBefore),
          },
        );
        fldObjProgress.emit({
          fldStrStage: 'duplicate',
          fldStrEvent: 'ok',
          fldStrDetail:
            `${fldArrDuplicate.length} groups, ${fldNumMerged} merged`,
        });
      } catch (fldObjError: unknown) {
        return await fncRunFailRun(
          fldObjClient,
          fldObjProgress,
          fldStrRunId,
          'duplicate',
          fldNumDuplicateVersion,
          fldObjError,
        );
      }
    }

    // merge: assembly of the review payload with duplicate
    // groups applied and per-photo evidence attached.
    const fldNumMergeVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'merge',
      fldStrWorkerId,
    );
    let fldObjMerge: fldObjMergePayload | null = null;
    if (fldNumMergeVersion === null) {
      fldObjMerge = await fncRunReadStagePayload<fldObjMergePayload>(
        fldObjClient,
        fldStrRunId,
        'merge',
      );
      if (fldObjMerge === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Merge stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
    } else {
      const fldObjCatalogByImage = new Map<string, fldObjCatalogRow>();
      for (const fldObjRow of fldArrCatalog) {
        fldObjCatalogByImage.set(fldObjRow.image_id, fldObjRow);
      }
      const fldObjTextsByImage = new Map<string, string>();
      for (const fldObjRow of fldArrTranscripts) {
        if (fldObjRow.text !== null) {
          fldObjTextsByImage.set(fldObjRow.image_id, fldObjRow.text);
        }
      }
      const fldObjImageOrder = new Map<string, number>();
      fldArrImages.forEach((fldObjImage, fldNumIndex) => {
        fldObjImageOrder.set(fldObjImage.id, fldNumIndex);
      });
      const fncConvEvidence = (fldStrPhotoId: string): fldObjPhotoEvidence => {
        const fldNumIndex = fldObjImageOrder.get(fldStrPhotoId) ?? -1;
        const fldObjFound = fldObjCatalogByImage.get(fldStrPhotoId);
        return {
          photo_id: fldStrPhotoId,
          read: fldNumIndex < 0
            ? fncConvCleanPhotoRead({})
            : fldArrReads[fldNumIndex] ?? fncConvCleanPhotoRead({}),
          catalog: fldObjFound === undefined ? null : {
            record: fldObjFound.record,
            source: fldObjFound.source,
            reason: fldObjFound.reason,
          },
          voice_text: fldObjTextsByImage.get(fldStrPhotoId) ?? null,
        };
      };
      const fldObjSplitNote = new Map<number, string>();
      for (const fldObjGroup of fldArrDuplicate) {
        if (fldObjGroup.action !== 'split') {
          continue;
        }
        for (const fldNumMember of fldObjGroup.members) {
          fldObjSplitNote.set(
            fldNumMember,
            fldObjGroup.note ?? 'duplicate-split',
          );
        }
      }
      const fldObjVoiceFailed = new Set<string>();
      for (const fldObjRow of fldArrTranscripts) {
        if (fldObjRow.status === 'failed') {
          fldObjVoiceFailed.add(fldObjRow.image_id);
        }
      }
      const fncConvReview = (
        fldArrPhotoIds: string[],
        fldArrMemberIndexes: number[],
        fldNumConfidence: number | null,
      ): string[] => {
        const fldArrReasons: string[] = [];
        if (
          fldArrPhotoIds.length > 0 &&
          fldArrPhotoIds.every((fldStrPhotoId) =>
            fldObjCatalogByImage.get(fldStrPhotoId)?.record == null
          )
        ) {
          fldArrReasons.push('no-catalog-source');
        }
        if (
          fldArrPhotoIds.some((fldStrPhotoId) =>
            fldObjVoiceFailed.has(fldStrPhotoId)
          )
        ) {
          fldArrReasons.push('voice-failed');
        }
        for (const fldNumMember of fldArrMemberIndexes) {
          const fldStrNote = fldObjSplitNote.get(fldNumMember);
          if (fldStrNote !== undefined) {
            fldArrReasons.push(`duplicate-split:${fldStrNote}`);
          }
        }
        if (fldNumConfidence !== null && fldNumConfidence < 0.8) {
          fldArrReasons.push('uncertain-duplicate');
        }
        return [...new Set(fldArrReasons)];
      };
      const fldArrUnits = fldArrResults.map((fldObjResult, fldNumIndex) => ({
        photo_ids: fncConvResultPhotos(
          fldObjRun.mode,
          fldArrImages,
          fldNumIndex,
        ),
        biblio: fldObjResult,
        price: fldArrPrices[fldNumIndex] ?? fncConvNullPrice(null),
        index: fldNumIndex,
      }));
      const fldArrMerged: fldObjMergedResult[] = [];
      const fldObjConsumed = new Set<number>();
      if (fldObjRun.mode === 'multiProduct') {
        const fldArrMergedGroups = fldArrDuplicate
          .filter((fldObjGroup) => fldObjGroup.action === 'merged')
          .sort((fldObjLeft, fldObjRight) =>
            fldObjLeft.members[0]! - fldObjRight.members[0]!
          );
        for (const fldObjGroup of fldArrMergedGroups) {
          const fldArrMembers = fldObjGroup.members
            .map((fldNumIndex) => fldArrUnits[fldNumIndex]!)
            .filter((fldObjUnit) => fldObjUnit !== undefined);
          if (fldArrMembers.length < 2) {
            continue;
          }
          for (const fldObjUnit of fldArrMembers) {
            fldObjConsumed.add(fldObjUnit.index);
          }
          const fldArrPhotos = [
            ...new Set(
              fldArrMembers.flatMap((fldObjUnit) => fldObjUnit.photo_ids),
            ),
          ].sort((fldStrLeft, fldStrRight) =>
            (fldObjImageOrder.get(fldStrLeft) ?? 0) -
            (fldObjImageOrder.get(fldStrRight) ?? 0)
          );
          const fldObjPrimary = [...fldArrMembers].sort(
            (fldObjLeft, fldObjRight) =>
              (fldObjRight.biblio.confidence ?? -1) -
                (fldObjLeft.biblio.confidence ?? -1) ||
              fldObjLeft.index - fldObjRight.index,
          )[0]!;
          const fldArrKnown = fldArrMembers
            .map((fldObjUnit) => fldObjUnit.price.confidence)
            .filter((fldObjValue): fldObjValue is number =>
              typeof fldObjValue === 'number'
            );
          fldArrMerged.push({
            photo_ids: fldArrPhotos,
            biblio: fldObjPrimary.biblio,
            price: {
              replacement_new: fncConvMedianMinor(
                fldArrMembers.map((fldObjUnit) =>
                  fldObjUnit.price.replacement_new
                ),
              ),
              market_min: fncConvMedianMinor(
                fldArrMembers.map((fldObjUnit) => fldObjUnit.price.market_min),
              ),
              market_max: fncConvMedianMinor(
                fldArrMembers.map((fldObjUnit) => fldObjUnit.price.market_max),
              ),
              market_median: fncConvMedianMinor(
                fldArrMembers.map((fldObjUnit) =>
                  fldObjUnit.price.market_median
                ),
              ),
              market_recommended: fncConvMedianMinor(
                fldArrMembers.map((fldObjUnit) =>
                  fldObjUnit.price.market_recommended
                ),
              ),
              currency: fldObjPrimary.price.currency,
              confidence: fldArrKnown.length === 0
                ? null
                : Math.min(...fldArrKnown),
              basis: fldArrMembers.some((fldObjUnit) =>
                  fldObjUnit.price.basis === 'observed'
                )
                ? 'observed'
                : 'ai-estimate',
              error: null,
              observations: fldArrMembers.flatMap((fldObjUnit) =>
                fldObjUnit.price.observations
              ),
              ai_estimate: {
                replacement_new: fncConvMedianMinor(
                  fldArrMembers.map((fldObjUnit) =>
                    fldObjUnit.price.ai_estimate.replacement_new
                  ),
                ),
                market_min: fncConvMedianMinor(
                  fldArrMembers.map((fldObjUnit) =>
                    fldObjUnit.price.ai_estimate.market_min
                  ),
                ),
                market_max: fncConvMedianMinor(
                  fldArrMembers.map((fldObjUnit) =>
                    fldObjUnit.price.ai_estimate.market_max
                  ),
                ),
                market_median: fncConvMedianMinor(
                  fldArrMembers.map((fldObjUnit) =>
                    fldObjUnit.price.ai_estimate.market_median
                  ),
                ),
                market_recommended: fncConvMedianMinor(
                  fldArrMembers.map((fldObjUnit) =>
                    fldObjUnit.price.ai_estimate.market_recommended
                  ),
                ),
                currency: fldObjPrimary.price.ai_estimate.currency,
                confidence: fldObjPrimary.price.ai_estimate.confidence,
                basis: 'ai-estimate',
              },
            },
            evidence: fldArrPhotos.map(fncConvEvidence),
            needs_review: fncConvReview(
              fldArrPhotos,
              fldObjGroup.members,
              fldObjGroup.confidence,
            ),
            duplicate: {
              merged_from: fldObjGroup.members,
              reason: fldObjGroup.reason,
              confidence: fldObjGroup.confidence,
            },
          });
        }
      }
      for (const fldObjUnit of fldArrUnits) {
        if (fldObjConsumed.has(fldObjUnit.index)) {
          continue;
        }
        fldArrMerged.push({
          photo_ids: fldObjUnit.photo_ids,
          biblio: fldObjUnit.biblio,
          price: fldObjUnit.price,
          evidence: fldObjUnit.photo_ids.map(fncConvEvidence),
          needs_review: fncConvReview(
            fldObjUnit.photo_ids,
            [fldObjUnit.index],
            null,
          ),
          duplicate: null,
        });
      }
      const fldNumLocalHits = fldArrCatalog.filter(
        (fldObjRow) => fldObjRow.source === 'local-cache',
      ).length;
      const fldNumRemoteTried = fldArrCatalog.filter(
        (fldObjRow) =>
          fldObjRow.reason !== 'no-isbn' && fldObjRow.reason !== 'no-query',
      ).length;
      const fldNumRemoteHits = fldArrCatalog.filter(
        (fldObjRow) =>
          fldObjRow.source !== null && fldObjRow.source !== 'local-cache',
      ).length;
      const fldNumMergedGroups = fldArrDuplicate.filter(
        (fldObjGroup) => fldObjGroup.action === 'merged',
      ).length;
      fldObjMerge = {
        results: fldArrMerged,
        sources: [
          {
            source: 'device-photo',
            detail: `${fldArrImages.length} draft photos`,
          },
          { source: 'isbn-normalize', detail: 'local ISBN checksum' },
          ...(fldArrTranscripts.length > 0
            ? [{
              source: 'muse-transcribe',
              detail: `${fldArrTranscripts.length} voice notes`,
            }]
            : []),
          {
            source: 'muse-preread',
            detail: 'meta-models/muse-spark-open-1026',
          },
          ...(fldNumLocalHits > 0
            ? [{
              source: 'catalog-cache',
              detail: `${fldNumLocalHits} local hits`,
            }]
            : []),
          ...(fldNumRemoteTried > 0
            ? [{
              source: 'catalog-waterfall',
              detail: `${fldNumRemoteHits} remote hits, ${
                fldNumRemoteTried - fldNumRemoteHits
              } misses`,
            }]
            : []),
          {
            source: 'muse-finalize',
            detail: 'meta-models/muse-spark-open-1026',
          },
          {
            source: 'muse-price',
            detail: 'ai-estimate USD, no live source',
          },
          ...(fldObjRun.mode === 'multiProduct'
            ? [{
              source: 'muse-duplicate',
              detail:
                `${fldArrDuplicate.length} groups, ${fldNumMergedGroups} merged`,
            }]
            : []),
        ],
      };
      await fncRunMarkStage(
        fldObjClient,
        fldStrRunId,
        'merge',
        fldNumMergeVersion,
        'succeeded',
        fldObjMerge,
      );
      fldObjProgress.emit({ fldStrStage: 'merge', fldStrEvent: 'ok' });
    }

    await fncRunMarkRun(fldObjClient, fldStrRunId, 'succeeded');
    fldObjProgress.emit({ fldStrStage: 'review', fldStrEvent: 'start' });
    await fldObjProgress.flush();
    return fncConvJsonResponse({
      status: 'ok',
      run_id: fldStrRunId,
      replayed: false,
      mode: fldObjRun.mode,
      results: fldObjMerge.results,
      sources: fldObjMerge.sources,
    });
  } catch (fldObjError: unknown) {
    const fldStrMessage = fldObjError instanceof Error
      ? fldObjError.message
      : String(fldObjError);
    const fldNumStatus = fldStrMessage.includes('demo session rejected')
      ? 403
      : 500;
    return fncConvJsonResponse(
      { status: 'error', error: fldStrMessage },
      fldNumStatus,
    );
  }
}

if (import.meta.main) {
  Deno.serve((fldObjRequest) => fncRunHandleRequest(fldObjRequest));
}
