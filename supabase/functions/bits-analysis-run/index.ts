// ============================================================
// EDGE FUNCTION: bits-analysis-run
// Logosphere BITS Â· pipeline orchestrator.
//
// Runs one created run to completion: verifies the uploaded
// draft photos, transcribes the draft voice notes with Muse
// audio (M4A/AAC only, 4 per call) before any image query,
// reads the photos with Muse vision in batches of 8,
// normalizes ISBNs, finalizes full-schema results with Muse
// (voice texts ride as labeled user declarations), estimates
// price bands with Muse, and merges everything into the
// review payload. Each stage is claimed through the lease
// RPC, so a retried call reuses terminal payloads instead
// of paying twice. The review stage stays pending until
// bits-analysis-save records the user's approval. Progress
// broadcasts live on bits-pipeline:<run_id>.
// ============================================================

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fncConvServiceClient, fncRunAuthorizeDemo } from '../_shared/auth.ts';
import {
  fncConvJsonResponse,
  fncRunPreflightResponse,
} from '../_shared/cors.ts';
import {
  fldObjMusePhotoRead,
  fldObjMuseResult,
  fldObjVoiceDeclaration,
  fncConvFinalMessages,
  fncConvPreReadMessages,
  fncConvPricePrompt,
  fncConvTranscribeMessages,
} from '../_shared/prompts.ts';
import {
  fldObjMinorPriceBands,
  fncConvCleanIsbn,
  fncConvCleanPhotoRead,
  fncConvCleanPriceBands,
  fncConvCleanResult,
  fncConvCleanTranscript,
} from '../_shared/mapping.ts';
import { fncConvMuseUsage, fncRunMuseJson } from '../_shared/muse.ts';
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

type fldObjMergedResult = {
  photo_ids: string[];
  biblio: fldObjMuseResult;
  price: fldObjMinorPriceBands;
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
  status: 'ready' | 'empty';
  duration_sec: number | null;
};

type fldObjTranscribePayload = {
  transcripts: fldObjTranscript[];
  usage: {
    requests: number;
    retries: number;
    total_tokens: number;
    tokens_seen: boolean;
  };
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
  const fldBooRetryable = fldStrMessage.includes('Muse call failed') ||
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
          }
          const fldObjUsageBefore = fncConvMuseUsage();
          const fldArrBatches = fncConvBatches(
            fldArrItems,
            fldNumVoiceMaxPerCall,
          );
          for (const fldArrBatch of fldArrBatches) {
            const fldObjAnswer = await fncRunMuseJson<
              { transcripts: unknown }
            >(
              fncConvTranscribeMessages(
                fldArrBatch.map((fldObjItem) => fldObjItem.fldStrUrl),
              ),
              4000,
              { fldNumRetries: 2 },
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
              const fldStrText = fncConvCleanTranscript(
                fldArrTexts[fldNumIndex],
              );
              fldArrTranscripts.push({
                image_id: fldObjItem.fldObjImage.id,
                voice_file_path: fldObjItem.fldObjImage
                  .voice_file_path as string,
                voice_version: 1,
                text: fldStrText,
                status: fldStrText === null ? 'empty' : 'ready',
                duration_sec: fldObjItem.fldNumDuration,
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
          const fldObjAnswer = await fncRunMuseJson<{ reads: unknown }>(
            fncConvPreReadMessages(
              fldArrBatch.map((fldObjBytes) => fncConvBase64(fldObjBytes)),
              fldObjRun.mode,
            ),
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

    // catalog: pure ISBN normalization per read (no AI call).
    const fldNumCatalogVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'catalog',
      fldStrWorkerId,
    );
    if (fldNumCatalogVersion !== null) {
      try {
        fldObjProgress.emit({ fldStrStage: 'catalog', fldStrEvent: 'start' });
        const fldArrPairs = fldArrReads.map((fldObjRead) => ({
          isbn10: fncConvCleanIsbn(fldObjRead.isbn10),
          isbn13: fncConvCleanIsbn(fldObjRead.isbn13),
        }));
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'catalog',
          fldNumCatalogVersion,
          'succeeded',
          { pairs: fldArrPairs },
        );
        fldObjProgress.emit({ fldStrStage: 'catalog', fldStrEvent: 'ok' });
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

    // finalDiagnose: Muse merges reads into full-schema results.
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
        const fldArrDeclarations: fldObjVoiceDeclaration[] = fldArrTranscripts
          .filter((fldObjRow) => fldObjRow.text !== null)
          .map((fldObjRow) => ({
            image_id: fldObjRow.image_id,
            text: fldObjRow.text as string,
          }));
        const fldObjAnswer = await fncRunMuseJson<{ results: unknown }>(
          fncConvFinalMessages(fldArrReads, fldObjRun.mode, fldArrDeclarations),
        );
        if (
          !Array.isArray(fldObjAnswer.results) ||
          fldObjAnswer.results.length === 0
        ) {
          throw new Error(
            'Logosphere BITS: Muse finalize returned no results.',
          );
        }
        fldArrResults = fldObjAnswer.results.map((fldObjResult) =>
          fncConvCleanResult(fldObjResult)
        );
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'finalDiagnose',
          fldNumFinalVersion,
          'succeeded',
          { results: fldArrResults },
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

    // price: Muse bands per result, in parallel.
    const fldNumPriceVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'price',
      fldStrWorkerId,
    );
    let fldArrPrices: fldObjMinorPriceBands[] = [];
    if (fldNumPriceVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<
        { prices: fldObjMinorPriceBands[] }
      >(
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
      fldArrPrices = fldObjStored.prices;
    } else {
      try {
        fldObjProgress.emit({ fldStrStage: 'price', fldStrEvent: 'start' });
        fldArrPrices = await Promise.all(
          fldArrResults.map(async (fldObjResult) => {
            const fldObjAnswer = await fncRunMuseJson<unknown>(
              fncConvPricePrompt(fldObjResult),
            );
            return fncConvCleanPriceBands(fldObjAnswer);
          }),
        );
        await fncRunMarkStage(
          fldObjClient,
          fldStrRunId,
          'price',
          fldNumPriceVersion,
          'succeeded',
          { prices: fldArrPrices },
        );
        fldObjProgress.emit({ fldStrStage: 'price', fldStrEvent: 'ok' });
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

    // merge: pure assembly of the review payload.
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
      const fldArrMerged: fldObjMergedResult[] = fldArrResults.map(
        (fldObjResult, fldNumIndex) => ({
          photo_ids: fncConvResultPhotos(
            fldObjRun.mode,
            fldArrImages,
            fldNumIndex,
          ),
          biblio: fldObjResult,
          price: fldArrPrices[fldNumIndex] ?? {
            replacement_new: null,
            market_min: null,
            market_max: null,
            market_median: null,
            market_recommended: null,
            currency: 'USD',
          },
        }),
      );
      fldObjMerge = {
        results: fldArrMerged,
        sources: [
          {
            source: 'device-photo',
            detail: `${fldArrImages.length} draft photos`,
          },
          { source: 'isbn-normalize', detail: 'local ISBN check' },
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
          {
            source: 'muse-finalize',
            detail: 'meta-models/muse-spark-open-1026',
          },
          { source: 'muse-price', detail: 'estimate basis, no web access' },
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
