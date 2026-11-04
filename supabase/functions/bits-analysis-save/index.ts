// ============================================================
// EDGE FUNCTION: bits-analysis-save
// Logosphere BITS Â· approval recorder.
//
// Records the user's approval of one finished run: creates a
// product per merged result inside the run's target, writes
// the bibliography, contributors, moved photos, voice notes,
// and the estimate. Persons are always inserted fresh (names
// are not identity â€” homonyms exist), roles fall back to the
// generic contributor label, and untitled results save under
// an explicit Untitled name the user can rename. Replaying a
// saved run returns the stored product ids instead of saving
// twice. The review stage turns succeeded; ready voice
// texts from the transcribe stage promote into the
// transcription rows at voice version 1 (empty recordings
// leave no row and the status stays none). The merge price
// basis maps to the estimate row ('observed' becomes
// 'evidence', anything else 'estimate', so the database
// check holds), and every carried price observation lands
// in price_observations with its USD leg, as-seen leg,
// rate date, source, and market. Free-text biblio labels map
// to §03 codes where they exactly match (unknowns stay
// null, never guessed), and photo regions become content
// tag bits on the image rows. A requested set name creates
// the set through demo_create_set (same demo authorization
// as the client path) and attaches every saved product;
// replays compare the set name, so a different name
// conflicts instead of silently reusing the old set.
// ============================================================

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fncConvServiceClient, fncRunAuthorizeDemo } from '../_shared/auth.ts';
import {
  fncConvJsonResponse,
  fncRunPreflightResponse,
} from '../_shared/cors.ts';
import type { fldObjMuseResult } from '../_shared/prompts.ts';
import type { fldObjMinorPriceBands } from '../_shared/mapping.ts';
import type { fldObjPriceObservation } from '../_shared/prices.ts';
import {
  fncConvConditionCode,
  fncConvContentTags,
  fncConvCoverCode,
  fncConvFlagCode,
  fncConvPaperCode,
  fncConvPersonRoleCode,
  fncConvPublicationTypeCode,
} from '../_shared/codes.ts';
import {
  fncRunClaimStage,
  fncRunMarkStage,
  fncRunReadStagePayload,
} from '../_shared/stages.ts';

type fldObjSaveRequest = {
  session_id: unknown;
  run_id: unknown;
  new_set_name: unknown;
};

type fldObjReviewPayload = {
  product_ids: string[];
  set_id: string | null;
  new_set_name: string | null;
};

const fldNumMaxSetName = 200;

function fncConvCleanSetName(fldObjValue: unknown): string | null {
  if (fldObjValue === null || fldObjValue === undefined) {
    return null;
  }
  if (typeof fldObjValue !== 'string') {
    throw new Error('Logosphere BITS: set name is invalid.');
  }
  const fldStrTrimmed = fldObjValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error('Logosphere BITS: set name is missing.');
  }
  if (fldStrTrimmed.length > fldNumMaxSetName) {
    throw new Error('Logosphere BITS: set name is too long.');
  }
  return fldStrTrimmed;
}

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

type fldObjSavePrice = Omit<fldObjMinorPriceBands, 'basis'> & {
  basis?: string;
  error?: string | null;
  observations?: fldObjPriceObservation[];
  ai_estimate?: fldObjMinorPriceBands;
};

type fldObjMergedResult = {
  photo_ids: string[];
  biblio: fldObjMuseResult;
  price: fldObjSavePrice;
  evidence?: {
    photo_id: string;
    read: { regions?: unknown };
  }[];
};

type fldObjMergePayload = {
  results: fldObjMergedResult[];
  sources: { source: string; detail: string }[];
};

type fldObjTranscriptRow = {
  image_id: string;
  text: string | null;
  status: string;
  duration_sec: number | null;
  language?: string | null;
  uncertain_parts?: string[];
  error?: string | null;
};

type fldObjTranscribePayload = {
  transcripts: fldObjTranscriptRow[];
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

async function fncRunMovePhoto(
  fldObjClient: SupabaseClient,
  fldStrFromPath: string,
  fldStrToName: string,
): Promise<void> {
  const { error: fldObjError } = await fldObjClient.storage
    .from(fldStrPhotoBucket)
    .move(fncConvStorageName(fldStrFromPath, fldStrPhotoBucket), fldStrToName);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: photo move failed (${fldObjError.message}).`,
    );
  }
}

async function fncRunMoveVoice(
  fldObjClient: SupabaseClient,
  fldStrFromPath: string,
  fldStrToName: string,
): Promise<void> {
  const { error: fldObjError } = await fldObjClient.storage
    .from(fldStrVoiceBucket)
    .move(fncConvStorageName(fldStrFromPath, fldStrVoiceBucket), fldStrToName);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: voice move failed (${fldObjError.message}).`,
    );
  }
}

export async function fncRunHandleRequest(
  fldObjRequest: Request,
  fldObjInjectedClient?: SupabaseClient,
): Promise<Response> {
  if (fldObjRequest.method === 'OPTIONS') {
    return fncRunPreflightResponse();
  }
  const fldStrWorkerId = `bits-analysis-save:${crypto.randomUUID()}`;
  try {
    const fldObjBody = (await fldObjRequest.json()) as fldObjSaveRequest;
    const fldStrSessionId = typeof fldObjBody.session_id === 'string'
      ? fldObjBody.session_id
      : '';
    const fldStrRunId = typeof fldObjBody.run_id === 'string'
      ? fldObjBody.run_id.trim()
      : '';
    let fldStrSetName: string | null = null;
    try {
      fldStrSetName = fncConvCleanSetName(fldObjBody.new_set_name);
    } catch (fldObjError: unknown) {
      return fncConvJsonResponse(
        {
          status: 'error',
          error: fldObjError instanceof Error
            ? fldObjError.message
            : 'Invalid set name.',
        },
        400,
      );
    }
    if (fldStrRunId === '') {
      return fncConvJsonResponse(
        { status: 'error', error: 'Invalid save request.' },
        400,
      );
    }
    const fldObjClient = fldObjInjectedClient ?? fncConvServiceClient();
    await fncRunAuthorizeDemo(fldObjClient, fldStrSessionId, 'create', 'item');
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
    if (fldObjRun.status !== 'succeeded') {
      return fncConvJsonResponse(
        { status: 'error', error: 'Pipeline run is not finished.' },
        409,
      );
    }
    const fldObjMerge = await fncRunReadStagePayload<fldObjMergePayload>(
      fldObjClient,
      fldStrRunId,
      'merge',
    );
    if (fldObjMerge === null || fldObjMerge.results.length === 0) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Pipeline run has no merged results.' },
        409,
      );
    }
    const fldNumReviewVersion = await fncRunClaimStage(
      fldObjClient,
      fldStrRunId,
      'review',
      fldStrWorkerId,
    );
    if (fldObjRun.target_set_id !== null && fldStrSetName !== null) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Run already targets a set.' },
        409,
      );
    }
    if (fldNumReviewVersion === null) {
      const fldObjStored = await fncRunReadStagePayload<fldObjReviewPayload>(
        fldObjClient,
        fldStrRunId,
        'review',
      );
      if (fldObjStored === null) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Review stage is held by another worker.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      if ((fldObjStored.new_set_name ?? null) !== fldStrSetName) {
        return fncConvJsonResponse(
          {
            status: 'error',
            error: 'Run already saved with a different set name.',
            run_id: fldStrRunId,
          },
          409,
        );
      }
      return fncConvJsonResponse({
        status: 'ok',
        run_id: fldStrRunId,
        replayed: true,
        product_ids: fldObjStored.product_ids,
        set_id: fldObjStored.set_id ?? null,
      });
    }
    let fldStrSetId: string | null = fldObjRun.target_set_id;
    if (fldStrSetName !== null) {
      const { data: fldObjSetId, error: fldObjSetError } = await fldObjClient
        .rpc('demo_create_set', {
          p_session_id: fldStrSessionId,
          p_collection_id: fldObjRun.target_collection_id,
          p_name: fldStrSetName,
        });
      if (fldObjSetError || typeof fldObjSetId !== 'string') {
        throw new Error(
          `Logosphere BITS: set create failed (${
            fldObjSetError?.message ?? 'missing'
          }).`,
        );
      }
      fldStrSetId = fldObjSetId;
    }
    const { data: fldArrImageData, error: fldObjImagesError } =
      await fldObjClient
        .from('pipeline_run_images')
        .select(
          'id, sort_order, file_path, mime_type, rotation_degrees, voice_file_path',
        )
        .eq('run_id', fldStrRunId)
        .order('sort_order', { ascending: true });
    if (fldObjImagesError || !Array.isArray(fldArrImageData)) {
      throw new Error('Logosphere BITS: run images read failed.');
    }
    const fldObjImagesById = new Map<string, fldObjRunImageRow>();
    for (const fldObjRow of fldArrImageData as unknown as fldObjRunImageRow[]) {
      fldObjImagesById.set(fldObjRow.id, fldObjRow);
    }
    const fldObjTranscribe = await fncRunReadStagePayload<
      fldObjTranscribePayload
    >(
      fldObjClient,
      fldStrRunId,
      'transcribe',
    );
    const fldObjTextsByImage = new Map<string, fldObjTranscriptRow>();
    for (const fldObjRow of fldObjTranscribe?.transcripts ?? []) {
      fldObjTextsByImage.set(fldObjRow.image_id, fldObjRow);
    }
    const fldArrProductIds: string[] = [];
    for (
      let fldNumIndex = 0;
      fldNumIndex < fldObjMerge.results.length;
      fldNumIndex += 1
    ) {
      const fldObjResult = fldObjMerge.results[fldNumIndex]!;
      const fldStrName = fldObjResult.biblio.title ??
        `Untitled item ${fldNumIndex + 1}`;
      const { data: fldObjProduct, error: fldObjProductError } =
        await fldObjClient
          .from('products')
          .insert({
            collection_id: fldObjRun.target_collection_id,
            set_id: fldStrSetId,
            name: fldStrName,
          })
          .select('id')
          .maybeSingle();
      if (fldObjProductError || fldObjProduct === null) {
        throw new Error(
          `Logosphere BITS: product insert failed (${
            fldObjProductError?.message ?? 'missing'
          }).`,
        );
      }
      const fldStrProductId = (fldObjProduct as { id: string }).id;
      fldArrProductIds.push(fldStrProductId);
      const fldObjBiblio = fldObjResult.biblio;
      const { error: fldObjBiblioError } = await fldObjClient
        .from('product_bibliography')
        .insert({
          product_id: fldStrProductId,
          title: fldObjBiblio.title,
          subtitle: fldObjBiblio.subtitle,
          isbn10: fldObjBiblio.isbn10,
          isbn13: fldObjBiblio.isbn13,
          publisher: fldObjBiblio.publisher,
          publication_language: fldObjBiblio.publication_language,
          edition: fldObjBiblio.edition,
          printing: fldObjBiblio.printing,
          publication_year: fldObjBiblio.publication_year,
          original_publication_year: fldObjBiblio.original_publication_year,
          page_count: fldObjBiblio.page_count,
          publication_type: fldObjBiblio.publication_type,
          publication_type_code: fncConvPublicationTypeCode(
            fldObjBiblio.publication_type,
          ),
          description_text: fldObjBiblio.description,
          description_original_language: null,
          description_text_tr: fldObjBiblio.description_tr,
          description_text_en: fldObjBiblio.description_en,
          binding: fldObjBiblio.binding,
          cover_code: fncConvCoverCode(fldObjBiblio.binding),
          dust_jacket: fldObjBiblio.dust_jacket,
          dust_jacket_flag: fncConvFlagCode(fldObjBiblio.dust_jacket),
          paper: fldObjBiblio.paper,
          paper_code: fncConvPaperCode(fldObjBiblio.paper),
          dimensions: fldObjBiblio.dimensions,
          condition: fldObjBiblio.condition,
          condition_code: fncConvConditionCode(fldObjBiblio.condition),
          signature: fldObjBiblio.signature,
          dedication: fldObjBiblio.dedication,
          dewey_code: fldObjBiblio.dewey ?? null,
          dewey_source: fldObjBiblio.dewey == null
            ? null
            : (fldObjBiblio.dewey_verified === true
              ? 'reference'
              : 'ai-uncertain'),
        });
      if (fldObjBiblioError) {
        throw new Error(
          `Logosphere BITS: bibliography insert failed (${fldObjBiblioError.message}).`,
        );
      }
      let fldNumRoleOrder = 0;
      for (const fldObjContributor of fldObjBiblio.contributors) {
        if (fldObjContributor.name === null) {
          continue;
        }
        const { data: fldObjPerson, error: fldObjPersonError } =
          await fldObjClient
            .from('persons')
            .insert({ name: fldObjContributor.name })
            .select('id')
            .maybeSingle();
        if (fldObjPersonError || fldObjPerson === null) {
          throw new Error(
            `Logosphere BITS: person insert failed (${
              fldObjPersonError?.message ?? 'missing'
            }).`,
          );
        }
        const { error: fldObjRoleError } = await fldObjClient
          .from('product_person_roles')
          .insert({
            product_id: fldStrProductId,
            person_id: (fldObjPerson as { id: string }).id,
            role: fldObjContributor.role ?? 'contributor',
            role_code: fncConvPersonRoleCode(
              fldObjContributor.role ?? 'contributor',
            ),
            sort_order: fldNumRoleOrder,
          });
        if (fldObjRoleError) {
          throw new Error(
            `Logosphere BITS: role insert failed (${fldObjRoleError.message}).`,
          );
        }
        fldNumRoleOrder += 1;
      }
      const fldObjRegionsByPhoto = new Map<string, unknown>();
      for (const fldObjEv of fldObjResult.evidence ?? []) {
        if (
          typeof fldObjEv === 'object' && fldObjEv !== null &&
          typeof fldObjEv.photo_id === 'string'
        ) {
          fldObjRegionsByPhoto.set(fldObjEv.photo_id, fldObjEv.read?.regions);
        }
      }
      let fldNumImageOrder = 0;
      for (const fldStrPhotoId of fldObjResult.photo_ids) {
        const fldObjImage = fldObjImagesById.get(fldStrPhotoId);
        if (fldObjImage === undefined) {
          continue;
        }
        const fldStrImageId = crypto.randomUUID();
        const fldStrPhotoName = `p/${fldStrProductId}/${fldStrImageId}.jpg`;
        await fncRunMovePhoto(
          fldObjClient,
          fldObjImage.file_path,
          fldStrPhotoName,
        );
        const { error: fldObjImageError } = await fldObjClient
          .from('product_images')
          .insert({
            id: fldStrImageId,
            product_id: fldStrProductId,
            sort_order: fldNumImageOrder,
            file_path: `product-photos/${fldStrPhotoName}`,
            mime_type: 'image/jpeg',
            rotation_degrees: 0,
            content_tags: fncConvContentTags(
              fldObjRegionsByPhoto.get(fldStrPhotoId),
            ),
          });
        if (fldObjImageError) {
          throw new Error(
            `Logosphere BITS: product image insert failed (${fldObjImageError.message}).`,
          );
        }
        if (fldObjImage.voice_file_path !== null) {
          const fldStrVoiceId = crypto.randomUUID();
          const fldStrVoiceName = `v/${fldStrImageId}/${fldStrVoiceId}.m4a`;
          await fncRunMoveVoice(
            fldObjClient,
            fldObjImage.voice_file_path,
            fldStrVoiceName,
          );
          const fldObjSpoken = fldObjTextsByImage.get(fldObjImage.id);
          const fldBooReady = fldObjSpoken?.text !== null &&
            fldObjSpoken?.text !== undefined;
          const fldBooFailed = fldObjSpoken?.status === 'failed';
          const { error: fldObjVoiceError } = await fldObjClient
            .from('product_voice_notes')
            .insert({
              id: fldStrVoiceId,
              product_image_id: fldStrImageId,
              version: 1,
              file_path: `voice-notes/${fldStrVoiceName}`,
              mime_type: 'audio/mp4',
              duration_sec: fldObjSpoken?.duration_sec ?? null,
              transcription_status: fldBooReady
                ? 'ready'
                : (fldBooFailed ? 'failed' : 'none'),
            });
          if (fldObjVoiceError) {
            throw new Error(
              `Logosphere BITS: voice note insert failed (${fldObjVoiceError.message}).`,
            );
          }
          if (fldBooReady || fldBooFailed) {
            const { error: fldObjTextError } = await fldObjClient
              .from('voice_transcriptions')
              .insert({
                voice_note_id: fldStrVoiceId,
                version: 1,
                text: fldBooReady ? fldObjSpoken!.text as string : null,
                language: fldObjSpoken?.language ?? null,
                error: fldBooFailed ? fldObjSpoken?.error ?? null : null,
                uncertain_parts: fldObjSpoken?.uncertain_parts ?? [],
              });
            if (fldObjTextError) {
              throw new Error(
                `Logosphere BITS: transcription insert failed (${fldObjTextError.message}).`,
              );
            }
          }
        }
        fldNumImageOrder += 1;
      }
      const fldObjPrice = fldObjResult.price;
      const { error: fldObjPriceError } = await fldObjClient
        .from('price_estimates')
        .insert({
          product_id: fldStrProductId,
          replacement_new: fldObjPrice.replacement_new,
          market_min: fldObjPrice.market_min,
          market_max: fldObjPrice.market_max,
          market_recommended: fldObjPrice.market_recommended,
          market_median: fldObjPrice.market_median,
          currency: fldObjPrice.currency,
          price_basis: fldObjPrice.basis === 'observed'
            ? 'evidence'
            : 'estimate',
          source_price: null,
          source_currency: null,
          rate_date: null,
        });
      if (fldObjPriceError) {
        throw new Error(
          `Logosphere BITS: estimate insert failed (${fldObjPriceError.message}).`,
        );
      }
      const fldArrObservations = Array.isArray(fldObjPrice.observations)
        ? fldObjPrice.observations
        : [];
      for (const fldObjOb of fldArrObservations) {
        if (
          typeof fldObjOb !== 'object' || fldObjOb === null ||
          typeof fldObjOb.amount_minor !== 'number' ||
          fldObjOb.amount_minor <= 0 ||
          typeof fldObjOb.currency !== 'string' ||
          typeof fldObjOb.url !== 'string' ||
          typeof fldObjOb.observed_at !== 'string' ||
          typeof fldObjOb.source !== 'string'
        ) {
          continue;
        }
        const fldBooUsd = fldObjOb.usd_minor !== null &&
          fldObjOb.usd_minor > 0;
        const { error: fldObjObError } = await fldObjClient
          .from('price_observations')
          .insert({
            product_id: fldStrProductId,
            amount: fldBooUsd
              ? (fldObjOb.usd_minor as number)
              : fldObjOb.amount_minor,
            currency: fldBooUsd ? 'USD' : fldObjOb.currency,
            observed_at: fldObjOb.observed_at,
            url: fldObjOb.url,
            source_price: fldObjOb.amount_minor,
            source_currency: fldObjOb.currency,
            rate_date: fldObjOb.rate_date,
            source: fldObjOb.source,
            market: fldObjOb.market,
          });
        if (fldObjObError) {
          throw new Error(
            `Logosphere BITS: observation insert failed (${fldObjObError.message}).`,
          );
        }
      }
    }
    await fncRunMarkStage(
      fldObjClient,
      fldStrRunId,
      'review',
      fldNumReviewVersion,
      'succeeded',
      {
        product_ids: fldArrProductIds,
        set_id: fldStrSetId,
        new_set_name: fldStrSetName,
      },
    );
    return fncConvJsonResponse({
      status: 'ok',
      run_id: fldStrRunId,
      replayed: false,
      product_ids: fldArrProductIds,
      set_id: fldStrSetId,
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
