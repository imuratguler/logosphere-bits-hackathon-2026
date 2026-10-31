/**
 * Logosphere BITS — shared workspace move tree and atomic moves.
 *
 * Reads the whole workspace tree (libraries, collections, sets) for
 * the move picker and executes moves through the ready atomic RPCs:
 * collections via demo_move_collection (reparent; contents ride
 * along), sets via demo_move_set (one set plus its exact members),
 * products via demo_bulk_move_products (to another collection; set
 * links clear) or demo_set_membership (to a set in the same
 * collection; already-assigned products are skipped). Versions are
 * read fresh inside every call, so each write carries optimistic
 * concurrency; a concurrent change surfaces as the server's version
 * conflict. Multi-item moves run one RPC per item (products share
 * one bulk call); the first failure aborts the batch. Takes no
 * persona parameter and applies no ownership filter: the queries
 * are identical for every persona by signature. Reads stay inside
 * the public demo scope with explicit columns and never touch
 * private tables.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are the
 * database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjMoveTreeNode = {
  fldStrId: string;
  fldStrName: string;
  fldStrKind: 'library' | 'collection';
  fldStrParentId: string | null;
};

export type fldObjMoveTreeSet = {
  fldStrId: string;
  fldStrName: string;
  fldStrCollectionId: string;
};

export type fldObjMoveTreeProduct = {
  fldStrId: string;
  fldStrCollectionId: string;
  fldStrSetId: string | null;
};

export type fldObjMoveTree = {
  fldArrNodes: fldObjMoveTreeNode[];
  fldArrSets: fldObjMoveTreeSet[];
  fldArrProducts: fldObjMoveTreeProduct[];
};

export type fldObjMoveResult = {
  fldStrId: string;
  fldNumVersion: number;
};

export type fldObjMergeTarget =
  | { fldStrKind: 'existing'; fldStrCollectionId: string }
  | { fldStrKind: 'new'; fldStrName: string; fldStrParentId: string };

export type fldObjMergeSummary = {
  fldObjTarget: fldObjMoveResult;
  fldNumCollections: number;
  fldNumSets: number;
  fldNumProducts: number;
  fldArrDeleted: string[];
};

type fldObjMoveNodeRow = {
  id: string;
  name: string;
  kind: 'library' | 'collection';
  parent_id: string | null;
};

type fldObjMoveSetRow = {
  id: string;
  name: string;
  collection_id: string;
};

type fldObjMoveVersionRow = {
  id: string;
  version: number;
  set_id?: string | null;
};

type fldObjMoveTreeProductRow = {
  id: string;
  collection_id: string;
  set_id: string | null;
};

function fncRunIsMoveNodeRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMoveNodeRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as {
    id?: unknown;
    name?: unknown;
    kind?: unknown;
    parent_id?: unknown;
  };
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.name === 'string' &&
    (fldObjRow.kind === 'library' || fldObjRow.kind === 'collection') &&
    (fldObjRow.parent_id === null || typeof fldObjRow.parent_id === 'string')
  );
}

function fncRunIsMoveSetRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMoveSetRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMoveSetRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.name === 'string' &&
    typeof fldObjRow.collection_id === 'string'
  );
}

function fncRunIsMoveVersionRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMoveVersionRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjMoveVersionRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.version === 'number' &&
    (fldObjRow.set_id === undefined ||
      fldObjRow.set_id === null ||
      typeof fldObjRow.set_id === 'string')
  );
}

function fncRunIsMoveTreeProductRow(
  fldObjValue: unknown,
): fldObjValue is fldObjMoveTreeProductRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as {
    id?: unknown;
    collection_id?: unknown;
    set_id?: unknown;
  };
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.collection_id === 'string' &&
    (fldObjRow.set_id === null || typeof fldObjRow.set_id === 'string')
  );
}

function fncConvRpcMoveResult(
  fldObjValue: unknown,
  fldStrFunction: string,
): fldObjMoveResult {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        `(need id + version).`,
    );
  }
  const fldObjRow = fldObjValue as { id?: unknown; version?: unknown };
  if (
    typeof fldObjRow.id !== 'string' ||
    typeof fldObjRow.version !== 'number'
  ) {
    throw new Error(
      `Logosphere BITS: ${fldStrFunction} returned an unexpected shape ` +
        `(need id + version).`,
    );
  }
  return { fldStrId: fldObjRow.id, fldNumVersion: fldObjRow.version };
}

function fncRunCheckMoveArgs(
  fldStrSessionId: string,
  fldArrIds: string[],
  fldStrTargetId: string,
  fldStrTargetLabel: string,
): void {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then move again.',
    );
  }
  if (fldArrIds.length === 0) {
    throw new Error('Logosphere BITS: demo move needs at least one item.');
  }
  if (fldArrIds.some(fldStrId => fldStrId.trim() === '')) {
    throw new Error('Logosphere BITS: demo move item ID is missing or blank.');
  }
  if (fldStrTargetId.trim() === '') {
    throw new Error(
      `Logosphere BITS: demo move target ${fldStrTargetLabel} is missing or blank.`,
    );
  }
}

export async function srvApiGetDemoMoveTree(
  fldObjClient: SupabaseClient,
  fldStrWorkspaceId: string,
): Promise<fldObjMoveTree> {
  if (fldStrWorkspaceId.trim() === '') {
    throw new Error('Logosphere BITS: demo workspace ID is missing or blank.');
  }
  const { data: fldObjNodeRows, error: fldObjNodeError } = await fldObjClient
    .from('nodes')
    .select('id, name, kind, parent_id')
    .eq('workspace_id', fldStrWorkspaceId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjNodeError) {
    throw new Error(
      `Logosphere BITS: demo move tree unavailable (nodes read failed: ` +
        `${fldObjNodeError.message}).`,
    );
  }
  if (!Array.isArray(fldObjNodeRows)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape (need a row list).',
    );
  }
  const fldArrNodes = fldObjNodeRows.map(fldObjRow => {
    if (!fncRunIsMoveNodeRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: nodes returned an unexpected shape ' +
          '(need id + name + kind + parent_id).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrName: fldObjRow.name,
      fldStrKind: fldObjRow.kind,
      fldStrParentId: fldObjRow.parent_id,
    };
  });
  const fldArrCollectionIds = fldArrNodes
    .filter(fldObjNode => fldObjNode.fldStrKind === 'collection')
    .map(fldObjNode => fldObjNode.fldStrId);
  if (fldArrCollectionIds.length === 0) {
    return { fldArrNodes, fldArrSets: [], fldArrProducts: [] };
  }
  const { data: fldObjSetRows, error: fldObjSetError } = await fldObjClient
    .from('sets')
    .select('id, name, collection_id')
    .in('collection_id', fldArrCollectionIds)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (fldObjSetError) {
    throw new Error(
      `Logosphere BITS: demo move tree unavailable (sets read failed: ` +
        `${fldObjSetError.message}).`,
    );
  }
  if (!Array.isArray(fldObjSetRows)) {
    throw new Error(
      'Logosphere BITS: sets returned an unexpected shape (need a row list).',
    );
  }
  const fldArrSets = fldObjSetRows.map(fldObjRow => {
    if (!fncRunIsMoveSetRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: sets returned an unexpected shape ' +
          '(need id + name + collection_id).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrName: fldObjRow.name,
      fldStrCollectionId: fldObjRow.collection_id,
    };
  });
  const { data: fldObjProductRows, error: fldObjProductError } =
    await fldObjClient
      .from('products')
      .select('id, collection_id, set_id')
      .in('collection_id', fldArrCollectionIds);
  if (fldObjProductError) {
    throw new Error(
      `Logosphere BITS: demo move tree unavailable (products read failed: ` +
        `${fldObjProductError.message}).`,
    );
  }
  if (!Array.isArray(fldObjProductRows)) {
    throw new Error(
      'Logosphere BITS: products returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrProducts = fldObjProductRows.map(fldObjRow => {
    if (!fncRunIsMoveTreeProductRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: products returned an unexpected shape ' +
          '(need id + collection_id + set_id).',
      );
    }
    return {
      fldStrId: fldObjRow.id,
      fldStrCollectionId: fldObjRow.collection_id,
      fldStrSetId: fldObjRow.set_id,
    };
  });
  return { fldArrNodes, fldArrSets, fldArrProducts };
}

async function fncRunReadNodeVersion(
  fldObjClient: SupabaseClient,
  fldStrId: string,
): Promise<number> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('id, version')
    .eq('id', fldStrId)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo move unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    throw new Error('Logosphere BITS: demo collection was not found.');
  }
  if (!fncRunIsMoveVersionRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape ' +
        '(need id + version).',
    );
  }
  return fldObjRow.version;
}

async function fncRunReadSetVersion(
  fldObjClient: SupabaseClient,
  fldStrId: string,
): Promise<{ fldNumVersion: number; fldArrMembers: fldObjMoveVersionRow[] }> {
  const { data: fldObjRow, error: fldObjError } = await fldObjClient
    .from('sets')
    .select('id, version')
    .eq('id', fldStrId)
    .maybeSingle();
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo move unavailable (sets read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (fldObjRow === null) {
    throw new Error('Logosphere BITS: demo set was not found.');
  }
  if (!fncRunIsMoveVersionRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: sets returned an unexpected shape ' +
        '(need id + version).',
    );
  }
  const { data: fldObjMemberRows, error: fldObjMemberError } =
    await fldObjClient
      .from('products')
      .select('id, version')
      .eq('set_id', fldStrId);
  if (fldObjMemberError) {
    throw new Error(
      `Logosphere BITS: demo move unavailable (products read failed: ` +
        `${fldObjMemberError.message}).`,
    );
  }
  if (!Array.isArray(fldObjMemberRows)) {
    throw new Error(
      'Logosphere BITS: products returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrMembers = fldObjMemberRows.map(fldObjMember => {
    if (!fncRunIsMoveVersionRow(fldObjMember)) {
      throw new Error(
        'Logosphere BITS: products returned an unexpected shape ' +
          '(need id + version).',
      );
    }
    return fldObjMember;
  });
  return { fldNumVersion: fldObjRow.version, fldArrMembers };
}

async function fncRunReadProductVersions(
  fldObjClient: SupabaseClient,
  fldArrIds: string[],
  fldBooWithSet: boolean,
): Promise<fldObjMoveVersionRow[]> {
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('products')
    .select(fldBooWithSet ? 'id, version, set_id' : 'id, version')
    .in('id', fldArrIds);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo move unavailable (products read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: products returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrRows = fldObjRows.map(fldObjRow => {
    if (!fncRunIsMoveVersionRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: products returned an unexpected shape ' +
          '(need id + version).',
      );
    }
    return fldObjRow;
  });
  const fldObjFound = new Set(fldArrRows.map(fldObjRow => fldObjRow.id));
  for (const fldStrId of fldArrIds) {
    if (!fldObjFound.has(fldStrId)) {
      throw new Error(`Logosphere BITS: unknown product ${fldStrId}.`);
    }
  }
  return fldArrRows;
}

export async function srvApiMoveDemoCollections(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
  fldStrTargetParentId: string,
): Promise<fldObjMoveResult[]> {
  fncRunCheckMoveArgs(fldStrSessionId, fldArrIds, fldStrTargetParentId, 'ID');
  const fldArrMoved: fldObjMoveResult[] = [];
  for (const fldStrId of fldArrIds) {
    const fldNumVersion = await fncRunReadNodeVersion(fldObjClient, fldStrId);
    const { data: fldObjRpcData, error: fldObjRpcError } =
      await fldObjClient.rpc('demo_move_collection', {
        p_session_id: fldStrSessionId,
        p_collection_id: fldStrId,
        p_expected_version: fldNumVersion,
        p_target_parent_id: fldStrTargetParentId,
      });
    if (fldObjRpcError) {
      throw new Error(
        `Logosphere BITS: demo collection move failed ` +
          `(demo_move_collection failed: ${fldObjRpcError.message}).`,
      );
    }
    fldArrMoved.push(
      fncConvRpcMoveResult(fldObjRpcData, 'demo_move_collection'),
    );
  }
  return fldArrMoved;
}

export async function srvApiMoveDemoSets(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
  fldStrTargetCollectionId: string,
): Promise<fldObjMoveResult[]> {
  fncRunCheckMoveArgs(
    fldStrSessionId,
    fldArrIds,
    fldStrTargetCollectionId,
    'collection ID',
  );
  const fldArrMoved: fldObjMoveResult[] = [];
  for (const fldStrId of fldArrIds) {
    const fldObjCurrent = await fncRunReadSetVersion(fldObjClient, fldStrId);
    const { data: fldObjRpcData, error: fldObjRpcError } =
      await fldObjClient.rpc('demo_move_set', {
        p_session_id: fldStrSessionId,
        p_set_id: fldStrId,
        p_expected_version: fldObjCurrent.fldNumVersion,
        p_target_collection_id: fldStrTargetCollectionId,
        p_product_items: fldObjCurrent.fldArrMembers.map(fldObjMember => ({
          id: fldObjMember.id,
          version: fldObjMember.version,
        })),
      });
    if (fldObjRpcError) {
      throw new Error(
        `Logosphere BITS: demo set move failed (demo_move_set failed: ` +
          `${fldObjRpcError.message}).`,
      );
    }
    const fldObjData = fldObjRpcData as { set?: unknown };
    if (typeof fldObjData !== 'object' || fldObjData === null) {
      throw new Error(
        'Logosphere BITS: demo_move_set returned an unexpected shape ' +
          '(need the moved set).',
      );
    }
    fldArrMoved.push(fncConvRpcMoveResult(fldObjData.set, 'demo_move_set'));
  }
  return fldArrMoved;
}

export async function srvApiMoveDemoProductsToCollection(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
  fldStrTargetCollectionId: string,
): Promise<fldObjMoveResult[]> {
  fncRunCheckMoveArgs(
    fldStrSessionId,
    fldArrIds,
    fldStrTargetCollectionId,
    'collection ID',
  );
  const fldArrRows = await fncRunReadProductVersions(
    fldObjClient,
    fldArrIds,
    false,
  );
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_bulk_move_products',
    {
      p_session_id: fldStrSessionId,
      p_target_collection_id: fldStrTargetCollectionId,
      p_items: fldArrRows.map(fldObjRow => ({
        id: fldObjRow.id,
        version: fldObjRow.version,
      })),
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo product move failed ` +
        `(demo_bulk_move_products failed: ${fldObjRpcError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRpcData)) {
    throw new Error(
      'Logosphere BITS: demo_bulk_move_products returned an unexpected ' +
        'shape (need a result list).',
    );
  }
  return fldObjRpcData.map(fldObjItem =>
    fncConvRpcMoveResult(fldObjItem, 'demo_bulk_move_products'),
  );
}

export async function srvApiMoveDemoProductsToSet(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
  fldStrTargetSetId: string,
): Promise<fldObjMoveResult[]> {
  fncRunCheckMoveArgs(fldStrSessionId, fldArrIds, fldStrTargetSetId, 'set ID');
  const fldArrRows = await fncRunReadProductVersions(
    fldObjClient,
    fldArrIds,
    true,
  );
  const fldArrChanged = fldArrRows.filter(
    fldObjRow => fldObjRow.set_id !== fldStrTargetSetId,
  );
  if (fldArrChanged.length === 0) {
    return [];
  }
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_set_membership',
    {
      p_session_id: fldStrSessionId,
      p_set_id: fldStrTargetSetId,
      p_items: fldArrChanged.map(fldObjRow => ({
        id: fldObjRow.id,
        version: fldObjRow.version,
      })),
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo product move failed (demo_set_membership ` +
        `failed: ${fldObjRpcError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRpcData)) {
    throw new Error(
      'Logosphere BITS: demo_set_membership returned an unexpected shape ' +
        '(need a result list).',
    );
  }
  return fldObjRpcData.map(fldObjItem =>
    fncConvRpcMoveResult(fldObjItem, 'demo_set_membership'),
  );
}

export async function srvApiMergeDemoCollections(
  fldObjClient: SupabaseClient,
  fldStrSessionId: string,
  fldArrIds: string[],
  fldObjTarget: fldObjMergeTarget,
): Promise<fldObjMergeSummary> {
  if (fldStrSessionId.trim() === '') {
    throw new Error(
      'Logosphere BITS: demo session ID is missing or blank. Reselect ' +
        'the demo persona to mint a session, then merge again.',
    );
  }
  if (fldArrIds.length < 2) {
    throw new Error(
      'Logosphere BITS: demo merge needs at least two collections.',
    );
  }
  if (fldArrIds.some(fldStrId => fldStrId.trim() === '')) {
    throw new Error(
      'Logosphere BITS: demo merge collection ID is missing or blank.',
    );
  }
  if (
    fldObjTarget.fldStrKind === 'new' &&
    fldObjTarget.fldStrName.trim() === ''
  ) {
    throw new Error('Logosphere BITS: demo merge name is missing or blank.');
  }
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('nodes')
    .select('id, version')
    .in('id', fldArrIds);
  if (fldObjError) {
    throw new Error(
      `Logosphere BITS: demo merge unavailable (nodes read failed: ` +
        `${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: nodes returned an unexpected shape (need a row list).',
    );
  }
  const fldArrVersions = fldObjRows.map(fldObjRow => {
    if (!fncRunIsMoveVersionRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: nodes returned an unexpected shape ' +
          '(need id + version).',
      );
    }
    return { id: fldObjRow.id, version: fldObjRow.version };
  });
  const fldObjFound = new Set(fldArrVersions.map(fldObjRow => fldObjRow.id));
  for (const fldStrId of fldArrIds) {
    if (!fldObjFound.has(fldStrId)) {
      throw new Error(`Logosphere BITS: unknown collection ${fldStrId}.`);
    }
  }
  const { data: fldObjRpcData, error: fldObjRpcError } = await fldObjClient.rpc(
    'demo_merge_collections',
    {
      p_session_id: fldStrSessionId,
      p_source_ids: fldArrIds,
      p_expected_versions: fldArrVersions,
      p_target_collection_id:
        fldObjTarget.fldStrKind === 'existing'
          ? fldObjTarget.fldStrCollectionId
          : null,
      p_new_name:
        fldObjTarget.fldStrKind === 'new' ? fldObjTarget.fldStrName : null,
      p_new_parent_id:
        fldObjTarget.fldStrKind === 'new' ? fldObjTarget.fldStrParentId : null,
    },
  );
  if (fldObjRpcError) {
    throw new Error(
      `Logosphere BITS: demo collection merge failed ` +
        `(demo_merge_collections failed: ${fldObjRpcError.message}).`,
    );
  }
  if (typeof fldObjRpcData !== 'object' || fldObjRpcData === null) {
    throw new Error(
      'Logosphere BITS: demo_merge_collections returned an unexpected ' +
        'shape (need the merge summary).',
    );
  }
  const fldObjSummary = fldObjRpcData as {
    target?: unknown;
    moved?: { collections?: unknown; sets?: unknown; products?: unknown };
    deleted?: unknown;
  };
  const fldObjMoved = fldObjSummary.moved;
  if (
    typeof fldObjMoved !== 'object' ||
    fldObjMoved === null ||
    typeof fldObjMoved.collections !== 'number' ||
    typeof fldObjMoved.sets !== 'number' ||
    typeof fldObjMoved.products !== 'number' ||
    !Array.isArray(fldObjSummary.deleted) ||
    fldObjSummary.deleted.some(fldObjId => typeof fldObjId !== 'string')
  ) {
    throw new Error(
      'Logosphere BITS: demo_merge_collections returned an unexpected ' +
        'shape (need moved counts and deleted ids).',
    );
  }
  return {
    fldObjTarget: fncConvRpcMoveResult(
      fldObjSummary.target,
      'demo_merge_collections',
    ),
    fldNumCollections: fldObjMoved.collections,
    fldNumSets: fldObjMoved.sets,
    fldNumProducts: fldObjMoved.products,
    fldArrDeleted: fldObjSummary.deleted as string[],
  };
}
