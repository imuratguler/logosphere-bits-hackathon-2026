// ============================================================
// EDGE FUNCTION: bits-pipeline-create
// Logosphere BITS Â· run creation with idempotency.
//
// The client mints the idempotency key plus one UUID per draft
// image, then calls here BEFORE uploading: the function
// authorizes the demo session, validates the target, inserts
// the run (replayed keys resolve to the existing run, never a
// second one), registers the image rows with deterministic
// draft paths, and marks the draft stage. The client uploads
// each file to its returned path, then calls bits-analysis-run.
// ============================================================

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fncConvServiceClient, fncRunAuthorizeDemo } from '../_shared/auth.ts';
import {
  fncConvJsonResponse,
  fncRunPreflightResponse,
} from '../_shared/cors.ts';
import { fncRunMarkStage } from '../_shared/stages.ts';

const fldNumMaxImages = 10;
const fldObjUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fldArrAllowedMime = ['image/jpeg', 'image/png'];
const fldArrAllowedRotation = [0, 90, 180, 270];

type fldObjCreateImageRequest = {
  client_image_id: unknown;
  sort_order: unknown;
  mime_type: unknown;
  rotation_degrees: unknown;
  has_voice: unknown;
};

type fldObjCreateRequest = {
  session_id: unknown;
  idempotency_key: unknown;
  mode: unknown;
  target_collection_id: unknown;
  target_set_id: unknown;
  images: unknown;
};

type fldObjImageRow = {
  id: string;
  sort_order: number;
  file_path: string;
  mime_type: string;
  rotation_degrees: number;
  voice_file_path: string | null;
};

function fncConvCleanId(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrTrimmed = fldObjValue.trim();
  return fldObjUuidPattern.test(fldStrTrimmed) ? fldStrTrimmed : null;
}

function fncConvCleanKey(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrTrimmed = fldObjValue.trim();
  if (fldStrTrimmed === '' || fldStrTrimmed.length > 128) {
    return null;
  }
  return fldStrTrimmed;
}

function fncConvCleanImages(fldObjValue: unknown): fldObjImageRow[] | null {
  if (!Array.isArray(fldObjValue)) {
    return null;
  }
  if (fldObjValue.length === 0 || fldObjValue.length > fldNumMaxImages) {
    return null;
  }
  const fldArrRows: fldObjImageRow[] = [];
  const fldObjSeen = new Set<string>();
  for (const fldObjEntry of fldObjValue as fldObjCreateImageRequest[]) {
    if (typeof fldObjEntry !== 'object' || fldObjEntry === null) {
      return null;
    }
    const fldStrId = fncConvCleanId(fldObjEntry.client_image_id);
    if (fldStrId === null || fldObjSeen.has(fldStrId)) {
      return null;
    }
    fldObjSeen.add(fldStrId);
    if (
      typeof fldObjEntry.sort_order !== 'number' ||
      !Number.isInteger(fldObjEntry.sort_order) ||
      (fldObjEntry.sort_order as number) < 0
    ) {
      return null;
    }
    if (
      typeof fldObjEntry.mime_type !== 'string' ||
      !fldArrAllowedMime.includes(fldObjEntry.mime_type)
    ) {
      return null;
    }
    if (
      !fldArrAllowedRotation.includes(fldObjEntry.rotation_degrees as number)
    ) {
      return null;
    }
    fldArrRows.push({
      id: fldStrId,
      sort_order: fldObjEntry.sort_order as number,
      file_path: '',
      mime_type: fldObjEntry.mime_type,
      rotation_degrees: fldObjEntry.rotation_degrees as number,
      voice_file_path: null,
    });
    if (fldObjEntry.has_voice === true) {
      fldArrRows[fldArrRows.length - 1]!.voice_file_path = '';
    }
  }
  return fldArrRows;
}

async function fncRunTargetExists(
  fldObjClient: SupabaseClient,
  fldStrCollectionId: string,
  fldStrSetId: string | null,
): Promise<boolean> {
  const { data: fldObjCollection, error: fldObjCollectionError } =
    await fldObjClient
      .from('nodes')
      .select('id')
      .eq('id', fldStrCollectionId)
      .eq('kind', 'collection')
      .maybeSingle();
  if (fldObjCollectionError || fldObjCollection === null) {
    return false;
  }
  if (fldStrSetId === null) {
    return true;
  }
  const { data: fldObjSet, error: fldObjSetError } = await fldObjClient
    .from('sets')
    .select('id')
    .eq('id', fldStrSetId)
    .eq('collection_id', fldStrCollectionId)
    .maybeSingle();
  return !fldObjSetError && fldObjSet !== null;
}

export async function fncRunHandleRequest(
  fldObjRequest: Request,
  fldObjInjectedClient?: SupabaseClient,
): Promise<Response> {
  if (fldObjRequest.method === 'OPTIONS') {
    return fncRunPreflightResponse();
  }
  try {
    const fldObjBody = (await fldObjRequest.json()) as fldObjCreateRequest;
    const fldStrSessionId = typeof fldObjBody.session_id === 'string'
      ? fldObjBody.session_id
      : '';
    const fldStrKey = fncConvCleanKey(fldObjBody.idempotency_key);
    const fldObjMode = fldObjBody.mode;
    const fldStrCollectionId = fncConvCleanId(fldObjBody.target_collection_id);
    const fldObjSetRaw = fldObjBody.target_set_id;
    const fldStrSetId = fldObjSetRaw === null || fldObjSetRaw === undefined
      ? null
      : fncConvCleanId(fldObjSetRaw);
    const fldArrImages = fncConvCleanImages(fldObjBody.images);
    if (
      fldStrKey === null ||
      (fldObjMode !== 'singleProduct' && fldObjMode !== 'multiProduct') ||
      fldStrCollectionId === null ||
      (fldObjSetRaw !== null &&
        fldObjSetRaw !== undefined &&
        fldStrSetId === null) ||
      fldArrImages === null
    ) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Invalid pipeline creation request.' },
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
    if (
      !(await fncRunTargetExists(fldObjClient, fldStrCollectionId, fldStrSetId))
    ) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Unknown analysis target.' },
        400,
      );
    }
    const { error: fldObjInsertError } = await fldObjClient
      .from('pipeline_runs')
      .upsert(
        {
          mode: fldObjMode,
          idempotency_key: fldStrKey,
          target_collection_id: fldStrCollectionId,
          target_set_id: fldStrSetId,
          demo_session_id: fldStrSessionId,
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      );
    if (fldObjInsertError) {
      throw new Error(
        `Logosphere BITS: run insert failed (${fldObjInsertError.message}).`,
      );
    }
    const { data: fldObjRun, error: fldObjRunError } = await fldObjClient
      .from('pipeline_runs')
      .select('id, mode, status')
      .eq('idempotency_key', fldStrKey)
      .maybeSingle();
    if (fldObjRunError || fldObjRun === null) {
      throw new Error('Logosphere BITS: created run is missing.');
    }
    const fldStrRunId = (fldObjRun as { id: string }).id;
    const { data: fldArrExisting, error: fldObjExistingError } =
      await fldObjClient
        .from('pipeline_run_images')
        .select(
          'id, sort_order, file_path, mime_type, rotation_degrees, voice_file_path',
        )
        .eq('run_id', fldStrRunId)
        .order('sort_order', { ascending: true });
    if (fldObjExistingError) {
      throw new Error(
        `Logosphere BITS: run images read failed (${fldObjExistingError.message}).`,
      );
    }
    if (Array.isArray(fldArrExisting) && fldArrExisting.length > 0) {
      return fncConvJsonResponse({
        status: 'ok',
        run_id: fldStrRunId,
        replayed: true,
        images: fldArrExisting,
      });
    }
    const fldArrRows = fldArrImages.map((fldObjImage) => ({
      id: fldObjImage.id,
      run_id: fldStrRunId,
      sort_order: fldObjImage.sort_order,
      file_path: `product-photos/draft/${fldStrRunId}/${fldObjImage.id}.jpg`,
      mime_type: fldObjImage.mime_type,
      rotation_degrees: fldObjImage.rotation_degrees,
      voice_file_path: fldObjImage.voice_file_path === null
        ? null
        : `voice-notes/draft/${fldStrRunId}/${fldObjImage.id}.m4a`,
    }));
    const { error: fldObjImagesError } = await fldObjClient
      .from('pipeline_run_images')
      .insert(fldArrRows);
    if (fldObjImagesError) {
      throw new Error(
        `Logosphere BITS: run images insert failed (${fldObjImagesError.message}).`,
      );
    }
    await fncRunMarkStage(fldObjClient, fldStrRunId, 'draft', 1, 'succeeded', {
      image_ids: fldArrRows.map((fldObjRow) => fldObjRow.id),
    });
    return fncConvJsonResponse({
      status: 'ok',
      run_id: fldStrRunId,
      replayed: false,
      images: fldArrRows,
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
