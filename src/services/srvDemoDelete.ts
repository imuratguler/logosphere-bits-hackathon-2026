/**
 * Logosphere BITS — shared atomic deletes with media counts.
 *
 * Removes collections (childless only), sets, and products through
 * the ready atomic RPCs: demo_delete_collections, demo_delete_sets,
 * and demo_delete_products. Each call deletes one selection's SQL
 * rows in a single server transaction — media rows
 * innermost-first, then products, sets, and nodes — so a failure
 * never leaves a partial delete behind. Media bytes cannot go
 * through direct storage DML (the platform forbids it), so the RPC
 * records scoped delete grants and returns the exact file list
 * plus id-scoped prefixes; the bytes are then removed here through
 * the Storage API, which the grant policy gates to live grants
 * only. A byte failure keeps the pending list for an idempotent
 * retry (the same grants cover it for one hour) and can never
 * spill onto another job's files. Versions are read fresh inside
 * every call, so each write carries optimistic concurrency; a
 * concurrent change surfaces as the server's version conflict.
 * Media counts come from a separate preview read (photo and voice
 * rows only, no bytes) so the confirmation can state the affected
 * content. Takes no persona parameter and applies no ownership
 * filter: the queries are identical for every persona by
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
  fldNumFilesRemoved: number;
  fldArrFailedFiles: fldObjDeleteFileRef[];
  fldArrFailedPrefixes: fldObjDeletePrefixRef[];
};

export type fldObjDeleteFileRef = {
  fldStrBucket: string;
  fldStrName: string;
};

export type fldObjDeletePrefixRef = {
  fldStrBucket: string;
  fldStrPrefix: string;
};

export type fldObjDeleteFileOutcome = {
  fldNumFilesRemoved: number;
  fldArrFailedFiles: fldObjDeleteFileRef[];
  fldArrFailedPrefixes: fldObjDeletePrefixRef[];
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
): {
  fldNumCollections: number;
  fldNumSets: number;
  fldNumProducts: number;
  fldNumPhotos: number;
  fldNumVoices: number;
  fldArrFiles: fldObjDeleteFileRef[];
  fldArrPrefixes: fldObjDeletePrefixRef[];
} {
  if (typeof fldObjRpcData !== 'object' || fldObjRpcData === null) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        '(need the delete summary).',
    );
  }
  const fldObjSummary = fldObjRpcData as {
    deleted?: unknown;
    files?: unknown;
    prefixes?: unknown;
  };
  const fldObjDeleted = fldObjSummary.deleted as {
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
  if (
    !Array.isArray(fldObjSummary.files) ||
    fldObjSummary.files.some(
      fldObjFile =>
        typeof fldObjFile !== 'object' ||
        fldObjFile === null ||
        typeof (fldObjFile as { bucket?: unknown }).bucket !== 'string' ||
        typeof (fldObjFile as { name?: unknown }).name !== 'string',
    )
  ) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        '(need granted files).',
    );
  }
  if (
    !Array.isArray(fldObjSummary.prefixes) ||
    fldObjSummary.prefixes.some(
      fldObjPrefix =>
        typeof fldObjPrefix !== 'object' ||
        fldObjPrefix === null ||
        typeof (fldObjPrefix as { bucket?: unknown }).bucket !== 'string' ||
        typeof (fldObjPrefix as { prefix?: unknown }).prefix !== 'string',
    )
  ) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        '(need granted prefixes).',
    );
  }
  return {
    fldNumCollections: fldObjDeleted.collections,
    fldNumSets: fldObjDeleted.sets,
    fldNumProducts: fldObjDeleted.products,
    fldNumPhotos: fldObjDeleted.photos,
    fldNumVoices: fldObjDeleted.voices,
    fldArrFiles: (
      fldObjSummary.files as { bucket: string; name: string }[]
    ).map(fldObjFile => ({
      fldStrBucket: fldObjFile.bucket,
      fldStrName: fldObjFile.name,
    })),
    fldArrPrefixes: (
      fldObjSummary.prefixes as { bucket: string; prefix: string }[]
    ).map(fldObjPrefix => ({
      fldStrBucket: fldObjPrefix.bucket,
      fldStrPrefix: fldObjPrefix.prefix,
    })),
  };
}

async function fncRunRemoveDeleteFiles(
  fldObjClient: SupabaseClient,
  fldArrFiles: fldObjDeleteFileRef[],
  fldArrPrefixes: fldObjDeletePrefixRef[],
): Promise<fldObjDeleteFileOutcome> {
  let fldNumRemoved = 0;
  const fldObjPending = new Map<string, fldObjDeleteFileRef>();
  const fldArrFailedPrefixes: fldObjDeletePrefixRef[] = [];
  const fldObjNamesByBucket = new Map<string, string[]>();
  for (const fldObjFile of fldArrFiles) {
    const fldArrNames = fldObjNamesByBucket.get(fldObjFile.fldStrBucket) ?? [];
    fldArrNames.push(fldObjFile.fldStrName);
    fldObjNamesByBucket.set(fldObjFile.fldStrBucket, fldArrNames);
  }
  for (const [fldStrBucket, fldArrNames] of fldObjNamesByBucket) {
    const { data: fldObjRemoved, error: fldObjError } =
      await fldObjClient.storage.from(fldStrBucket).remove(fldArrNames);
    if (fldObjError) {
      for (const fldStrName of fldArrNames) {
        fldObjPending.set(`${fldStrBucket}\n${fldStrName}`, {
          fldStrBucket,
          fldStrName,
        });
      }
    } else if (Array.isArray(fldObjRemoved)) {
      fldNumRemoved += fldObjRemoved.length;
    }
  }
  for (const fldObjPrefix of fldArrPrefixes) {
    const { data: fldObjListed, error: fldObjListError } =
      await fldObjClient.storage
        .from(fldObjPrefix.fldStrBucket)
        .list(fldObjPrefix.fldStrPrefix, { limit: 1000 });
    if (fldObjListError || !Array.isArray(fldObjListed)) {
      fldArrFailedPrefixes.push(fldObjPrefix);
      continue;
    }
    const fldArrNames = fldObjListed
      .filter(
        fldObjEntry =>
          typeof fldObjEntry === 'object' &&
          fldObjEntry !== null &&
          typeof (fldObjEntry as { name?: unknown }).name === 'string',
      )
      .map(
        fldObjEntry =>
          fldObjPrefix.fldStrPrefix + (fldObjEntry as { name: string }).name,
      );
    if (fldArrNames.length === 0) {
      continue;
    }
    const { data: fldObjSwept, error: fldObjSweepError } =
      await fldObjClient.storage
        .from(fldObjPrefix.fldStrBucket)
        .remove(fldArrNames);
    if (fldObjSweepError) {
      for (const fldStrName of fldArrNames) {
        const fldStrKey = `${fldObjPrefix.fldStrBucket}\n${fldStrName}`;
        if (!fldObjPending.has(fldStrKey)) {
          fldObjPending.set(fldStrKey, {
            fldStrBucket: fldObjPrefix.fldStrBucket,
            fldStrName,
          });
        }
      }
      fldArrFailedPrefixes.push(fldObjPrefix);
    } else {
      if (Array.isArray(fldObjSwept)) {
        fldNumRemoved += fldObjSwept.length;
      }
      for (const fldStrName of fldArrNames) {
        fldObjPending.delete(`${fldObjPrefix.fldStrBucket}\n${fldStrName}`);
      }
    }
  }
  return {
    fldNumFilesRemoved: fldNumRemoved,
    fldArrFailedFiles: [...fldObjPending.values()],
    fldArrFailedPrefixes,
  };
}

async function fncRunDeleteRowsThenFiles(
  fldObjClient: SupabaseClient,
  fldStrFunction: string,
  fldObjArgs: Record<string, unknown>,
): Promise<fldObjDeleteSummary> {
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    fldStrFunction,
    fldObjArgs,
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo delete failed (${fldStrFunction} failed: ` +
        `${fldObjRpcError.message}).`,
    );
  }
  const fldObjParsed = fncConvRpcDeleteSummary(fldObjRpcData, fldStrFunction);
  const fldObjOutcome = await fncRunRemoveDeleteFiles(
    fldObjClient,
    fldObjParsed.fldArrFiles,
    fldObjParsed.fldArrPrefixes,
  );
  return {
    fldNumCollections: fldObjParsed.fldNumCollections,
    fldNumSets: fldObjParsed.fldNumSets,
    fldNumProducts: fldObjParsed.fldNumProducts,
    fldNumPhotos: fldObjParsed.fldNumPhotos,
    fldNumVoices: fldObjParsed.fldNumVoices,
    fldNumFilesRemoved: fldObjOutcome.fldNumFilesRemoved,
    fldArrFailedFiles: fldObjOutcome.fldArrFailedFiles,
    fldArrFailedPrefixes: fldObjOutcome.fldArrFailedPrefixes,
  };
}

export async function srvApiRetryDemoDeleteFiles(
  fldObjClient: SupabaseClient,
  fldArrFiles: fldObjDeleteFileRef[],
  fldArrPrefixes: fldObjDeletePrefixRef[],
): Promise<fldObjDeleteFileOutcome> {
  return fncRunRemoveDeleteFiles(fldObjClient, fldArrFiles, fldArrPrefixes);
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
  return fncRunDeleteRowsThenFiles(fldObjClient, 'demo_delete_collections', {
    p_session_id: fldStrSessionId,
    p_collection_ids: fldArrIds,
    p_expected_versions: [
      ...fldArrNodeVersions,
      ...fldArrSetVersions,
      ...fldArrProductVersions,
    ],
  });
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
  return fncRunDeleteRowsThenFiles(fldObjClient, 'demo_delete_sets', {
    p_session_id: fldStrSessionId,
    p_set_ids: fldArrIds,
    p_expected_versions: [...fldArrSetVersions, ...fldArrProductVersions],
  });
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
  return fncRunDeleteRowsThenFiles(fldObjClient, 'demo_delete_products', {
    p_session_id: fldStrSessionId,
    p_product_ids: fldArrIds,
    p_expected_versions: fldArrProductVersions,
  });
}
