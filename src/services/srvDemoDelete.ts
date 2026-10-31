/**
 * Logosphere BITS — shared atomic deletes with media counts.
 *
 * Removes collections (childless only), sets, and products through
 * the ready atomic RPCs: demo_delete_collections, demo_delete_sets,
 * and demo_delete_products. Each call deletes one selection in a
 * single server transaction — media bytes by id-scoped prefix,
 * media rows innermost-first, then products, sets, and nodes — so a
 * failure never leaves a partial delete behind. Versions are read
 * fresh inside every call, so each write carries optimistic
 * concurrency; a concurrent change surfaces as the server's version
 * conflict. Media counts come from a separate preview read (photo
 * and voice rows only, no bytes) so the confirmation can state the
 * affected content. Takes no persona parameter and applies no
 * ownership filter: the queries are identical for every persona by
 * signature. Reads stay inside the public demo scope with explicit
 * columns and never touch private tables.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { srvApiGetDemoMoveTree } from './srvDemoMove';

export type fldObjDeleteSummary = {
  fldNumCollections: number;
  fldNumSets: number;
  fldNumProducts: number;
  fldNumPhotos: number;
  fldNumVoices: number;
};

export type fldObjMediaCounts = {
  fldNumPhotos: number;
  fldNumVoices: number;
};

type fldObjDeleteVersionRow = {
  id: string;
  version: number;
};

type fldObjMediaIdRow = {
  id: string;
};

function fncRunIsDeleteVersionRow(
  fldObjValue: unknown,
): fldObjValue is fldObjDeleteVersionRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjDeleteVersionRow>;
  return (
    typeof fldObjRow.id === 'string' && typeof fldObjRow.version === 'number'
  );
}

function fncRunIsMediaIdRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMediaIdRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMediaIdRow>;
  return typeof fldObjRow.id === 'string';
}

async function fncRunReadDeleteVersions(
  fldObjClient: SupabaseClient,
  fldStrTable: 'nodes' | 'sets' | 'products',
  fldArrIds: string[],
): Promise<fldObjDeleteVersionRow[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from(fldStrTable)
    .select('id, version')
    .in('id', fldArrIds);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo delete unavailable (${fldStrTable} read ` +
        `failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      `Logosphere BITS: ${fldStrTable} returned an unexpected shape ` +
        '(need a row list).',
    );
  }
  const fldArrVersions = fldObjRows.map(fldObjRow => {
    if (!fncRunIsDeleteVersionRow(fldObjRow)) {
      throw new Error(
        `Logosphere BITS: ${fldStrTable} returned an unexpected shape ` +
          '(need id + version).',
      );
    }
    return { id: fldObjRow.id, version: fldObjRow.version };
  });
  const fldObjFound = new Set(fldArrVersions.map(fldObjRow => fldObjRow.id));
  const fldStrMissingUnit =
    fldStrTable === 'nodes'
      ? 'collection'
      : fldStrTable === 'sets'
      ? 'set'
      : 'product';
  for (const fldStrId of fldArrIds) {
    if (!fldObjFound.has(fldStrId)) {
      throw new Error(
        `Logosphere BITS: unknown ${fldStrMissingUnit} ${fldStrId}.`,
      );
    }
  }
  return fldArrVersions;
}

function fncRunCheckDeleteSession(fldStrSessionId: string): void {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then delete again.',
    );
  }
}

function fncRunCheckDeleteIds(fldArrIds: string[], fldStrUnit: string): void {
  if (fldArrIds.length === 0) {
    throw new Error(
      `Logosphere BITS: demo delete needs at least one ${fldStrUnit}.`,
    );
  }
  if (fldArrIds.some(fldStrId => fldStrId.trim() === '')) {
    throw new Error(
      'Logosphere BITS: demo delete source ID is missing or blank.',
    );
  }
}

function fncConvRpcDeleteSummary(
  fldObjRpcData: unknown,
  fldStrFunction: string,
): fldObjDeleteSummary {
  if (typeof fldObjRpcData !== 'object' || fldObjRpcData === null) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        '(need the delete summary).',
    );
  }
  const fldObjDeleted = (fldObjRpcData as { deleted?: unknown }).deleted as {
    collections?: unknown;
    sets?: unknown;
    products?: unknown;
    photos?: unknown;
    voices?: unknown;
  } | null;
  if (
    typeof fldObjDeleted !== 'object' ||
    fldObjDeleted === null ||
    typeof fldObjDeleted.collections !== 'number' ||
    typeof fldObjDeleted.sets !== 'number' ||
    typeof fldObjDeleted.products !== 'number' ||
    typeof fldObjDeleted.photos !== 'number' ||
    typeof fldObjDeleted.voices !== 'number'
  ) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        '(need deleted counts).',
    );
  }
  return {
    fldNumCollections: fldObjDeleted.collections,
    fldNumSets: fldObjDeleted.sets,
    fldNumProducts: fldObjDeleted.products,
    fldNumPhotos: fldObjDeleted.photos,
    fldNumVoices: fldObjDeleted.voices,
  };
}

export async function srvApiGetDemoMediaCounts(
  fldObjClient: SupabaseClient,
  fldArrProductIds: string[],
): Promise<fldObjMediaCounts> {
  if (fldArrProductIds.length === 0) {
    return { fldNumPhotos: 0, fldNumVoices: 0 };
  }
  const { data: fldObjImageRows, error: fldObjImageError } = await fldObjClient
    .from('product_images')
    .select('id')
    .in('product_id', fldArrProductIds);
  if (fldObjImageError) {
    throw new Error(
      `Logosphere BITS: demo delete preview unavailable (product_images ` +
        `read failed: ${fldObjImageError.message}).`,
    );
  }
  if (!Array.isArray(fldObjImageRows)) {
    throw new Error(
      'Logosphere BITS: product_images returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrImageIds = fldObjImageRows.map(fldObjRow => {
    if (!fncRunIsMediaIdRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: product_images returned an unexpected shape ' +
          '(need id).',
      );
    }
    return fldObjRow.id;
  });
  if (fldArrImageIds.length === 0) {
    return { fldNumPhotos: 0, fldNumVoices: 0 };
  }
  const { data: fldObjVoiceRows, error: fldObjVoiceError } = await fldObjClient
    .from('product_voice_notes')
    .select('id')
    .in('product_image_id', fldArrImageIds);
  if (fldObjVoiceError) {
    throw new Error(
      `Logosphere BITS: demo delete preview unavailable ` +
        `(product_voice_notes read failed: ${fldObjVoiceError.message}).`,
    );
  }
  if (!Array.isArray(fldObjVoiceRows)) {
    throw new Error(
      'Logosphere BITS: product_voice_notes returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  for (const fldObjRow of fldObjVoiceRows) {
    if (!fncRunIsMediaIdRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: product_voice_notes returned an unexpected ' +
          'shape (need id).',
      );
    }
  }
  return {
    fldNumPhotos: fldArrImageIds.length,
    fldNumVoices: fldObjVoiceRows.length,
  };
}

export async function srvApiDeleteDemoCollections(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldStrWorkspaceId: string,
  fldArrIds: string[],
): Promise<fldObjDeleteSummary> {
  fncRunCheckDeleteSession(fldStrSessionId);
  fncRunCheckDeleteIds(fldArrIds, 'collection');
  const fldObjTree = await srvApiGetDemoMoveTree(
    fldObjClient,
    fldStrWorkspaceId,
  );
  const fldObjScope = new Set(fldArrIds);
  const fldArrSetIds = fldObjTree.fldArrSets
    .filter(fldObjSet => fldObjScope.has(fldObjSet.fldStrCollectionId))
    .map(fldObjSet => fldObjSet.fldStrId);
  const fldArrProductIds = fldObjTree.fldArrProducts
    .filter(fldObjProduct => fldObjScope.has(fldObjProduct.fldStrCollectionId))
    .map(fldObjProduct => fldObjProduct.fldStrId);
  const fldArrNodeVersions = await fncRunReadDeleteVersions(
    fldObjClient,
    'nodes',
    fldArrIds,
  );
  const fldArrSetVersions =
    fldArrSetIds.length === 0
      ? []
      : await fncRunReadDeleteVersions(fldObjClient, 'sets', fldArrSetIds);
  const fldArrProductVersions =
    fldArrProductIds.length === 0
      ? []
      : await fncRunReadDeleteVersions(
          fldObjClient,
          'products',
          fldArrProductIds,
        );
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_delete_collections',
    {
      p_session_id: fldStrSessionId,
      p_collection_ids: fldArrIds,
      p_expected_versions: [
        ...fldArrNodeVersions,
        ...fldArrSetVersions,
        ...fldArrProductVersions,
      ],
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo delete failed (demo_delete_collections ` +
        `failed: ${fldObjRpcError.message}).`,
    );
  }
  return fncConvRpcDeleteSummary(fldObjRpcData, 'demo_delete_collections');
}

export async function srvApiDeleteDemoSets(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
): Promise<fldObjDeleteSummary> {
  fncRunCheckDeleteSession(fldStrSessionId);
  fncRunCheckDeleteIds(fldArrIds, 'set');
  const fldArrSetVersions = await fncRunReadDeleteVersions(
    fldObjClient,
    'sets',
    fldArrIds,
  );
  const { data: fldObjMemberRows, error: fldObjMemberError } =
    await fldObjClient
      .from('products')
      .select('id, version')
      .in('set_id', fldArrIds);
  if (fldObjMemberError) {
    throw new Error(
      `Logosphere BITS: demo delete unavailable (products read failed: ` +
        `${fldObjMemberError.message}).`,
    );
  }
  if (!Array.isArray(fldObjMemberRows)) {
    throw new Error(
      'Logosphere BITS: products returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrProductVersions = fldObjMemberRows.map(fldObjRow => {
    if (!fncRunIsDeleteVersionRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: products returned an unexpected shape ' +
          '(need id + version).',
      );
    }
    return { id: fldObjRow.id, version: fldObjRow.version };
  });
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_delete_sets',
    {
      p_session_id: fldStrSessionId,
      p_set_ids: fldArrIds,
      p_expected_versions: [...fldArrSetVersions, ...fldArrProductVersions],
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo delete failed (demo_delete_sets failed: ` +
        `${fldObjRpcError.message}).`,
    );
  }
  return fncConvRpcDeleteSummary(fldObjRpcData, 'demo_delete_sets');
}

export async function srvApiDeleteDemoProducts(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
): Promise<fldObjDeleteSummary> {
  fncRunCheckDeleteSession(fldStrSessionId);
  fncRunCheckDeleteIds(fldArrIds, 'product');
  const fldArrProductVersions = await fncRunReadDeleteVersions(
    fldObjClient,
    'products',
    fldArrIds,
  );
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_delete_products',
    {
      p_session_id: fldStrSessionId,
      p_product_ids: fldArrIds,
      p_expected_versions: fldArrProductVersions,
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo delete failed (demo_delete_products failed: ` +
        `${fldObjRpcError.message}).`,
    );
  }
  return fncConvRpcDeleteSummary(fldObjRpcData, 'demo_delete_products');
}
