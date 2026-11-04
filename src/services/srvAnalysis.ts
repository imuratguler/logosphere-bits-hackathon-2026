/**
 * Logosphere BITS — analysis pipeline client (hermetic service).
 *
 * Thin caller over the four edge functions plus the draft
 * upload and the live broadcast channel: create the run,
 * upload normalized photos and voice notes to their
 * deterministic draft paths (upsert, so replays are safe),
 * run the pipeline, subscribe to its steps, save the
 * approved results, and research saved-product prices. Every
 * function answer is shape-checked; a status of error
 * surfaces the server message. Throws on transport, shape,
 * or server failures.
 * Naming follows D6 (srv / fld roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { fncDecodeBase64 } from '../validation/vldExifOrientation';
import type {
  fldObjAnalysisAiBands,
  fldObjAnalysisBiblio,
  fldObjAnalysisDuplicate,
  fldObjAnalysisEvidence,
  fldObjAnalysisItem,
  fldObjAnalysisObservation,
  fldObjAnalysisPayload,
  fldObjAnalysisPrice,
  fldObjAnalysisRunImage,
  fldObjAnalysisSource,
  fldObjContributor,
  fldObjPipelineStep,
  fldStrPipelineMode,
} from '../types/typModels';

export type fldObjAnalysisSaveResult = {
  fldArrProductIds: string[];
  fldStrSetId: string | null;
};

export type fldObjAnalysisCreateArgs = {
  fldStrSessionId: string;
  fldStrIdempotencyKey: string;
  fldStrMode: fldStrPipelineMode;
  fldStrCollectionId: string;
  fldStrSetId: string | null;
  fldArrImages: {
    fldStrClientImageId: string;
    fldNumSortOrder: number;
    fldStrMimeType: string;
    fldNumRotationDegrees: number;
    fldBooHasVoice: boolean;
  }[];
};

export type fldObjAnalysisUpload = {
  fldStrStoragePath: string;
  fldStrLocalPath: string;
  fldStrMimeType: string;
};

function fncRunIsRecord(
  fldObjValue: unknown,
): fldObjValue is Record<string, unknown> {
  return typeof fldObjValue === 'object' && fldObjValue !== null;
}

function fncConvText(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrTrimmed = fldObjValue.trim();
  return fldStrTrimmed === '' ? null : fldStrTrimmed;
}

function fncConvStorageName(fldStrFilePath: string): {
  fldStrBucket: string;
  fldStrName: string;
} {
  const fldNumSlash = fldStrFilePath.indexOf('/');
  if (fldNumSlash < 0) {
    throw new Error(
      'Logosphere BITS: draft path is missing its bucket prefix.',
    );
  }
  return {
    fldStrBucket: fldStrFilePath.slice(0, fldNumSlash),
    fldStrName: fldStrFilePath.slice(fldNumSlash + 1),
  };
}

function fncConvRunImage(fldObjValue: unknown): fldObjAnalysisRunImage {
  if (!fncRunIsRecord(fldObjValue)) {
    throw new Error(
      'Logosphere BITS: run images returned an unexpected shape.',
    );
  }
  const fldStrId = fncConvText(fldObjValue.id);
  const fldStrFilePath = fncConvText(fldObjValue.file_path);
  if (fldStrId === null || fldStrFilePath === null) {
    throw new Error(
      'Logosphere BITS: run images returned an unexpected shape.',
    );
  }
  const fldObjVoice = fldObjValue.voice_file_path;
  return {
    fldStrId,
    fldStrFilePath,
    fldStrVoiceFilePath: typeof fldObjVoice === 'string' ? fldObjVoice : null,
  };
}

function fncConvContributor(fldObjValue: unknown): fldObjContributor | null {
  if (!fncRunIsRecord(fldObjValue)) {
    return null;
  }
  const fldStrPerson = fncConvText(fldObjValue.name);
  if (fldStrPerson === null) {
    return null;
  }
  return {
    fldStrPerson,
    fldStrRole: fncConvText(fldObjValue.role) ?? '',
  };
}

function fncConvBiblio(fldObjValue: unknown): fldObjAnalysisBiblio {
  const fldObjRow = fncRunIsRecord(fldObjValue) ? fldObjValue : {};
  const fldObjContributors = Array.isArray(fldObjRow.contributors)
    ? fldObjRow.contributors
    : [];
  const fldObjConfidence = fldObjRow.confidence;
  return {
    fldStrTitle: fncConvText(fldObjRow.title),
    fldStrSubtitle: fncConvText(fldObjRow.subtitle),
    fldStrIsbn10: fncConvText(fldObjRow.isbn10),
    fldStrIsbn13: fncConvText(fldObjRow.isbn13),
    fldStrPublisher: fncConvText(fldObjRow.publisher),
    fldStrPublicationLanguage: fncConvText(fldObjRow.publication_language),
    fldStrEdition: fncConvText(fldObjRow.edition),
    fldStrPrinting: fncConvText(fldObjRow.printing),
    fldNumPublicationYear:
      typeof fldObjRow.publication_year === 'number'
        ? fldObjRow.publication_year
        : null,
    fldNumOriginalPublicationYear:
      typeof fldObjRow.original_publication_year === 'number'
        ? fldObjRow.original_publication_year
        : null,
    fldNumPageCount:
      typeof fldObjRow.page_count === 'number' ? fldObjRow.page_count : null,
    fldStrPublicationType: fncConvText(fldObjRow.publication_type),
    fldStrDescription: fncConvText(fldObjRow.description),
    fldStrDescriptionTr: fncConvText(fldObjRow.description_tr),
    fldStrDescriptionEn: fncConvText(fldObjRow.description_en),
    fldArrContributors: fldObjContributors
      .map(fncConvContributor)
      .filter(
        (fldObjEntry): fldObjEntry is fldObjContributor => fldObjEntry !== null,
      ),
    fldStrBinding: fncConvText(fldObjRow.binding),
    fldStrDustJacket: fncConvText(fldObjRow.dust_jacket),
    fldStrPaper: fncConvText(fldObjRow.paper),
    fldStrDimensions: fncConvText(fldObjRow.dimensions),
    fldStrCondition: fncConvText(fldObjRow.condition),
    fldStrSignature: fncConvText(fldObjRow.signature),
    fldStrDedication: fncConvText(fldObjRow.dedication),
    fldNumConfidence:
      typeof fldObjConfidence === 'number' &&
      fldObjConfidence >= 0 &&
      fldObjConfidence <= 1
        ? fldObjConfidence
        : null,
    fldStrRationale: fncConvText(fldObjRow.rationale),
  };
}

function fncConvRatio(fldObjValue: unknown): number | null {
  return typeof fldObjValue === 'number' && fldObjValue >= 0 && fldObjValue <= 1
    ? fldObjValue
    : null;
}

function fncConvMinor(fldObjValue: unknown): number | null {
  if (typeof fldObjValue !== 'number' || !Number.isInteger(fldObjValue)) {
    return null;
  }
  return fldObjValue < 0 ? null : fldObjValue;
}

function fncConvObservation(
  fldObjValue: unknown,
): fldObjAnalysisObservation | null {
  if (!fncRunIsRecord(fldObjValue)) {
    return null;
  }
  if (
    typeof fldObjValue.amount_minor !== 'number' ||
    !Number.isInteger(fldObjValue.amount_minor) ||
    typeof fldObjValue.currency !== 'string' ||
    typeof fldObjValue.source !== 'string' ||
    typeof fldObjValue.url !== 'string' ||
    typeof fldObjValue.observed_at !== 'string'
  ) {
    return null;
  }
  const fldObjMarket = fldObjValue.market;
  return {
    fldNumAmountMinor: fldObjValue.amount_minor,
    fldStrCurrency: fldObjValue.currency,
    fldNumUsdMinor: fncConvMinor(fldObjValue.usd_minor),
    fldStrSource: fldObjValue.source,
    fldStrUrl: fldObjValue.url,
    fldStrMarket:
      fldObjMarket === 'new' || fldObjMarket === 'used' ? fldObjMarket : null,
    fldStrObservedAt: fldObjValue.observed_at,
    fldNumRate: typeof fldObjValue.rate === 'number' ? fldObjValue.rate : null,
    fldStrRateDate: fncConvText(fldObjValue.rate_date),
  };
}

function fncConvAiBands(fldObjValue: unknown): fldObjAnalysisAiBands {
  const fldObjRow = fncRunIsRecord(fldObjValue) ? fldObjValue : {};
  return {
    fldNumReplacementNew: fncConvMinor(fldObjRow.replacement_new),
    fldNumMarketMin: fncConvMinor(fldObjRow.market_min),
    fldNumMarketMax: fncConvMinor(fldObjRow.market_max),
    fldNumMarketMedian: fncConvMinor(fldObjRow.market_median),
    fldNumMarketRecommended: fncConvMinor(fldObjRow.market_recommended),
    fldStrCurrency: fncConvText(fldObjRow.currency) ?? 'USD',
    fldNumConfidence: fncConvRatio(fldObjRow.confidence),
  };
}

function fncConvPrice(fldObjValue: unknown): fldObjAnalysisPrice {
  const fldObjRow = fncRunIsRecord(fldObjValue) ? fldObjValue : {};
  const fldArrObservations = Array.isArray(fldObjRow.observations)
    ? fldObjRow.observations
        .map(fncConvObservation)
        .filter(
          (fldObjEntry): fldObjEntry is fldObjAnalysisObservation =>
            fldObjEntry !== null,
        )
    : [];
  return {
    fldNumReplacementNew: fncConvMinor(fldObjRow.replacement_new),
    fldNumMarketMin: fncConvMinor(fldObjRow.market_min),
    fldNumMarketMax: fncConvMinor(fldObjRow.market_max),
    fldNumMarketMedian: fncConvMinor(fldObjRow.market_median),
    fldNumMarketRecommended: fncConvMinor(fldObjRow.market_recommended),
    fldStrCurrency: fncConvText(fldObjRow.currency) ?? 'USD',
    fldNumConfidence: fncConvRatio(fldObjRow.confidence),
    fldStrBasis: fncConvText(fldObjRow.basis) ?? 'estimate',
    fldStrError: fncConvText(fldObjRow.error),
    fldArrObservations,
    fldObjAiEstimate: fncConvAiBands(fldObjRow.ai_estimate),
  };
}

function fncConvEvidence(fldObjValue: unknown): fldObjAnalysisEvidence[] {
  if (!Array.isArray(fldObjValue)) {
    return [];
  }
  const fldArrOut: fldObjAnalysisEvidence[] = [];
  fldObjValue.forEach(fldObjEntry => {
    if (!fncRunIsRecord(fldObjEntry)) {
      return;
    }
    if (typeof fldObjEntry.photo_id !== 'string') {
      return;
    }
    let fldObjCatalog: fldObjAnalysisEvidence['fldObjCatalog'] = null;
    if (fncRunIsRecord(fldObjEntry.catalog)) {
      const fldObjRecord = fncRunIsRecord(fldObjEntry.catalog.record)
        ? fldObjEntry.catalog.record
        : null;
      fldObjCatalog = {
        fldStrSource: fncConvText(fldObjEntry.catalog.source),
        fldStrReason: fncConvText(fldObjEntry.catalog.reason),
        fldStrRecordTitle:
          fldObjRecord === null ? null : fncConvText(fldObjRecord.title),
      };
    }
    fldArrOut.push({
      fldStrPhotoId: fldObjEntry.photo_id,
      fldStrVoiceText: fncConvText(fldObjEntry.voice_text),
      fldObjCatalog,
    });
  });
  return fldArrOut;
}

function fncConvDuplicate(
  fldObjValue: unknown,
): fldObjAnalysisDuplicate | null {
  if (!fncRunIsRecord(fldObjValue)) {
    return null;
  }
  if (!Array.isArray(fldObjValue.merged_from)) {
    return null;
  }
  return {
    fldArrMergedFrom: fldObjValue.merged_from.filter(
      (fldObjIndex): fldObjIndex is number =>
        typeof fldObjIndex === 'number' &&
        Number.isInteger(fldObjIndex) &&
        fldObjIndex >= 0,
    ),
    fldStrReason: fncConvText(fldObjValue.reason),
    fldNumConfidence: fncConvRatio(fldObjValue.confidence),
  };
}

function fncConvItem(fldObjValue: unknown): fldObjAnalysisItem {
  if (!fncRunIsRecord(fldObjValue)) {
    throw new Error(
      'Logosphere BITS: analysis results returned an unexpected shape.',
    );
  }
  const fldObjPhotoIds = Array.isArray(fldObjValue.photo_ids)
    ? fldObjValue.photo_ids.filter(
        (fldObjEntry): fldObjEntry is string => typeof fldObjEntry === 'string',
      )
    : [];
  const fldArrNeedsReview = Array.isArray(fldObjValue.needs_review)
    ? fldObjValue.needs_review.filter(
        (fldObjEntry): fldObjEntry is string =>
          typeof fldObjEntry === 'string' && fldObjEntry.trim() !== '',
      )
    : [];
  return {
    fldArrPhotoIds: fldObjPhotoIds,
    fldObjBiblio: fncConvBiblio(fldObjValue.biblio),
    fldObjPrice: fncConvPrice(fldObjValue.price),
    fldArrEvidence: fncConvEvidence(fldObjValue.evidence),
    fldObjDuplicate: fncConvDuplicate(fldObjValue.duplicate),
    fldArrNeedsReview,
  };
}

function fncConvSource(fldObjValue: unknown): fldObjAnalysisSource | null {
  if (!fncRunIsRecord(fldObjValue)) {
    return null;
  }
  const fldStrSource = fncConvText(fldObjValue.source);
  const fldStrDetail = fncConvText(fldObjValue.detail);
  if (fldStrSource === null || fldStrDetail === null) {
    return null;
  }
  return { fldStrSource, fldStrDetail };
}

async function fncRunInvoke(
  fldObjClient: SupabaseClient,
  fldStrFunction: string,
  fldObjBody: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data: fldObjData, error: fldObjError } =
    await fldObjClient.functions.invoke(fldStrFunction, { body: fldObjBody });
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} failed (${fldObjError.message}).`,
    );
  }
  if (!fncRunIsRecord(fldObjData)) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape.`,
    );
  }
  if (fldObjData.status === 'error') {
    const fldStrMessage = fncConvText(fldObjData.error) ?? 'unknown error';
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} failed (${fldStrMessage}).`,
    );
  }
  if (fldObjData.status !== 'ok') {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape.`,
    );
  }
  return fldObjData;
}

export async function srvApiCreateAnalysisRun(
  fldObjClient: SupabaseClient,
  fldObjArgs: fldObjAnalysisCreateArgs,
): Promise<{ fldStrRunId: string; fldArrImages: fldObjAnalysisRunImage[] }> {
  if (fldObjArgs.fldStrSessionId.trim() === '') {
    throw new Error('Logosphere BITS: demo session is missing.');
  }
  if (fldObjArgs.fldStrIdempotencyKey.trim() === '') {
    throw new Error('Logosphere BITS: idempotency key is missing.');
  }
  const fldObjData = await fncRunInvoke(fldObjClient, 'bits-pipeline-create', {
    session_id: fldObjArgs.fldStrSessionId,
    idempotency_key: fldObjArgs.fldStrIdempotencyKey,
    mode: fldObjArgs.fldStrMode,
    target_collection_id: fldObjArgs.fldStrCollectionId,
    target_set_id: fldObjArgs.fldStrSetId,
    images: fldObjArgs.fldArrImages.map(fldObjImage => ({
      client_image_id: fldObjImage.fldStrClientImageId,
      sort_order: fldObjImage.fldNumSortOrder,
      mime_type: fldObjImage.fldStrMimeType,
      rotation_degrees: fldObjImage.fldNumRotationDegrees,
      has_voice: fldObjImage.fldBooHasVoice,
    })),
  });
  const fldStrRunId = fncConvText(fldObjData.run_id);
  if (fldStrRunId === null || !Array.isArray(fldObjData.images)) {
    throw new Error(
      'Logosphere BITS: bits-pipeline-create returned an unexpected shape.',
    );
  }
  return {
    fldStrRunId,
    fldArrImages: fldObjData.images.map(fncConvRunImage),
  };
}

export async function srvApiUploadAnalysisFiles(
  fldObjClient: SupabaseClient,
  fldArrUploads: fldObjAnalysisUpload[],
): Promise<void> {
  for (const fldObjUpload of fldArrUploads) {
    const { fldStrBucket, fldStrName } = fncConvStorageName(
      fldObjUpload.fldStrStoragePath,
    );
    // The runtime has no fetchable file:// Blobs (no
    // ReadableStream): files ride the blob-util layer as
    // base64 and go up as raw bytes, the BASE pattern.
    let fldArrBytes: Uint8Array;
    try {
      const fldStrBase64 = await ReactNativeBlobUtil.fs.readFile(
        fldObjUpload.fldStrLocalPath,
        'base64',
      );
      fldArrBytes = fncDecodeBase64(fldStrBase64);
    } catch {
      throw new Error(
        'Logosphere BITS: draft file is unreadable ' +
          `(${fldObjUpload.fldStrLocalPath}).`,
      );
    }
    // Draft replaces run delete-then-insert (never upsert): live
    // acceptance proved the storage upsert path unusable for the
    // private voice bucket while plain inserts pass, so a stale
    // object is cleared first and a missing one is simply
    // ignored. Server-issued draft paths only.
    try {
      await fldObjClient.storage.from(fldStrBucket).remove([fldStrName]);
    } catch {
      // A missing or locked stale object never blocks the fresh write.
    }
    const { error: fldObjError } = await fldObjClient.storage
      .from(fldStrBucket)
      .upload(fldStrName, fldArrBytes, {
        contentType: fldObjUpload.fldStrMimeType,
        upsert: false,
      });
    if (fldObjError) {
      throw new Error(
        `Logosphere BITS: draft upload failed (${fldObjError.message}).`,
      );
    }
  }
}

export async function srvApiRunAnalysis(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrRunId: string,
): Promise<fldObjAnalysisPayload> {
  if (fldStrSessionId.trim() === '' || fldStrRunId.trim() === '') {
    throw new Error('Logosphere BITS: analysis run needs session and run.');
  }
  const fldObjData = await fncRunInvoke(fldObjClient, 'bits-analysis-run', {
    session_id: fldStrSessionId,
    run_id: fldStrRunId,
  });
  const fldObjMode = fldObjData.mode;
  if (
    (fldObjMode !== 'singleProduct' && fldObjMode !== 'multiProduct') ||
    !Array.isArray(fldObjData.results) ||
    fldObjData.results.length === 0
  ) {
    throw new Error(
      'Logosphere BITS: bits-analysis-run returned an unexpected shape.',
    );
  }
  const fldObjSources = Array.isArray(fldObjData.sources)
    ? fldObjData.sources
    : [];
  return {
    fldStrRunId,
    fldStrMode: fldObjMode,
    fldArrResults: fldObjData.results.map(fncConvItem),
    fldArrSources: fldObjSources
      .map(fncConvSource)
      .filter(
        (fldObjEntry): fldObjEntry is fldObjAnalysisSource =>
          fldObjEntry !== null,
      ),
  };
}

export function srvApiSubscribeAnalysisRun(
  fldObjClient: SupabaseClient,
  fldStrRunId: string,
  fldHandOnStep: (fldObjStep: fldObjPipelineStep) => void,
): () => void {
  const fldObjChannel = fldObjClient
    .channel(`bits-pipeline:${fldStrRunId}`)
    .on(
      'broadcast',
      { event: 'step' },
      (fldObjMessage: { payload: unknown }) => {
        const fldObjPayload = fncRunIsRecord(fldObjMessage.payload)
          ? fldObjMessage.payload
          : {};
        fldHandOnStep({
          fldStrRunId,
          fldNumSeq:
            typeof fldObjPayload.seq === 'number' ? fldObjPayload.seq : 0,
          fldStrStage: fncConvText(fldObjPayload.stage) ?? 'unknown',
          fldStrEvent: fncConvText(fldObjPayload.event) ?? 'unknown',
          fldStrDetail: fncConvText(fldObjPayload.detail),
        });
      },
    )
    .subscribe();
  return () => {
    // Best-effort unsubscribe; a failure here has no recovery.
    fldObjClient.removeChannel(fldObjChannel).catch(() => {});
  };
}

export async function srvApiSaveAnalysisRun(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrRunId: string,
  fldStrSetName?: string | null,
): Promise<fldObjAnalysisSaveResult> {
  if (fldStrSessionId.trim() === '' || fldStrRunId.trim() === '') {
    throw new Error('Logosphere BITS: save needs session and run.');
  }
  const fldStrName =
    typeof fldStrSetName === 'string' ? fldStrSetName.trim() : '';
  const fldObjData = await fncRunInvoke(fldObjClient, 'bits-analysis-save', {
    session_id: fldStrSessionId,
    run_id: fldStrRunId,
    new_set_name: fldStrName === '' ? null : fldStrName,
  });
  if (
    !Array.isArray(fldObjData.product_ids) ||
    fldObjData.product_ids.length === 0
  ) {
    throw new Error(
      'Logosphere BITS: bits-analysis-save returned an unexpected shape.',
    );
  }
  const fldArrIds = fldObjData.product_ids.filter(
    (fldObjEntry): fldObjEntry is string => typeof fldObjEntry === 'string',
  );
  if (fldArrIds.length === 0) {
    throw new Error(
      'Logosphere BITS: bits-analysis-save returned an unexpected shape.',
    );
  }
  return {
    fldArrProductIds: fldArrIds,
    fldStrSetId: fncConvText(fldObjData.set_id),
  };
}

export async function srvApiResearchProductPrices(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrProductId: string,
): Promise<void> {
  if (fldStrSessionId.trim() === '' || fldStrProductId.trim() === '') {
    throw new Error('Logosphere BITS: research needs session and product.');
  }
  await fncRunInvoke(fldObjClient, 'bits-price-research', {
    session_id: fldStrSessionId,
    product_id: fldStrProductId,
  });
}
