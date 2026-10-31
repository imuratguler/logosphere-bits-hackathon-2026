/**
 * Logosphere BITS — HIDDEN corporate document service.
 *
 * Org-scoped document management over the controlled
 * corporate-docs bucket (migration 20261031192236): members list,
 * upload, and remove only their own organization's documents, and
 * every row carries a bucket+path identity the server CHECK binds
 * to its org folder. Uploads go bytes-first (bucket, then row), so
 * a failed registration never leaves a row pointing at missing
 * bytes; removals go row-first, so bytes are never deleted ahead
 * of their row. Reads and writes stay inside corporate_documents
 * plus the corporate-docs bucket — shared demo tables are never
 * named. Signatures take no persona, session, or flag.
 * Naming follows D6 (fld / srv / fnc roots); snake_case names are
 * the database column contract and stay as-is.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type fldObjAccountDocument = {
  fldStrId: string;
  fldStrOrganizationId: string;
  fldStrName: string;
  fldStrFilePath: string;
  fldStrMimeType: string | null;
  fldNumByteSize: number | null;
};

export type fldObjAccountDocumentUpload = {
  fldStrOrganizationId: string;
  fldStrName: string;
  fldStrFileName: string;
  fldStrMimeType?: string;
  fldObjBytes: Uint8Array;
};

export type fldObjAccountDocumentRef = {
  fldStrOrganizationId: string;
  fldStrDocumentId: string;
};

type fldObjAccountDocumentRow = {
  id: string;
  organization_id: string;
  name: string;
  file_path: string;
  mime_type: string | null;
  byte_size: number | null;
};

const fldStrDocumentsBucket = 'corporate-docs';

function fncRunRequireText(fldStrValue: string, fldStrLabel: string): string {
  const fldStrTrimmed = fldStrValue.trim();
  if (fldStrTrimmed === '') {
    throw new Error(
      `Logosphere BITS: account document ${fldStrLabel} is missing or blank.`,
    );
  }
  return fldStrTrimmed;
}

export function fncConvSanitizeFileName(fldStrFileName: string): string {
  const fldStrCleaned = fldStrFileName
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return fldStrCleaned === '' ? 'document' : fldStrCleaned.slice(0, 120);
}

export function fncRunRandomUuid(): string {
  const fldArrDigits = '0123456789abcdef';
  let fldStrId = '';
  for (let fldNumIndex = 0; fldNumIndex < 32; fldNumIndex += 1) {
    fldStrId += fldArrDigits[Math.floor(Math.random() * 16)];
  }
  return (
    `${fldStrId.slice(0, 8)}-${fldStrId.slice(8, 12)}-4` +
    `${fldStrId.slice(13, 16)}-8${fldStrId.slice(17, 20)}-` +
    fldStrId.slice(20, 32)
  );
}

function fncRunIsDocumentRow(
  fldObjValue: unknown,
): fldObjValue is fldObjAccountDocumentRow {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjRow = fldObjValue as Partial<fldObjAccountDocumentRow>;
  return (
    typeof fldObjRow.id === 'string' &&
    typeof fldObjRow.organization_id === 'string' &&
    typeof fldObjRow.name === 'string' &&
    typeof fldObjRow.file_path === 'string' &&
    (typeof fldObjRow.mime_type === 'string' || fldObjRow.mime_type === null) &&
    (typeof fldObjRow.byte_size === 'number' || fldObjRow.byte_size === null)
  );
}

function fncConvRowToDocument(
  fldObjRow: fldObjAccountDocumentRow,
): fldObjAccountDocument {
  return {
    fldStrId: fldObjRow.id,
    fldStrOrganizationId: fldObjRow.organization_id,
    fldStrName: fldObjRow.name,
    fldStrFilePath: fldObjRow.file_path,
    fldStrMimeType: fldObjRow.mime_type,
    fldNumByteSize: fldObjRow.byte_size,
  };
}

export async function srvApiGetAccountDocuments(
  fldObjClient: SupabaseClient,
  fldStrOrganizationId: string,
): Promise<fldObjAccountDocument[]> {
  const fldStrOrgId = fncRunRequireText(
    fldStrOrganizationId,
    'organization id',
  );
  const { data: fldObjRows, error: fldObjError } = await fldObjClient
    .from('corporate_documents')
    .select('id, organization_id, name, file_path, mime_type, byte_size')
    .eq('organization_id', fldStrOrgId)
    .order('created_at', { ascending: false });
  if (fldObjError) {
    throw new Error(
      'Logosphere BITS: document list unavailable ' +
        `(corporate_documents read failed: ${fldObjError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRows)) {
    throw new Error(
      'Logosphere BITS: corporate_documents returned an unexpected ' +
        'shape (need a row list).',
    );
  }
  return fldObjRows.map(fldObjRow => {
    if (!fncRunIsDocumentRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: corporate_documents returned an unexpected ' +
          'shape (need id + organization_id + name + file_path + ' +
          'mime_type + byte_size).',
      );
    }
    return fncConvRowToDocument(fldObjRow);
  });
}

export async function srvApiUploadAccountDocument(
  fldObjClient: SupabaseClient,
  fldObjUpload: fldObjAccountDocumentUpload,
): Promise<fldObjAccountDocument> {
  const fldStrOrgId = fncRunRequireText(
    fldObjUpload.fldStrOrganizationId,
    'organization id',
  );
  const fldStrName = fncRunRequireText(fldObjUpload.fldStrName, 'name');
  const fldStrFileName = fncConvSanitizeFileName(fldObjUpload.fldStrFileName);
  const { data: fldObjUserData, error: fldObjUserError } =
    await fldObjClient.auth.getUser();
  if (fldObjUserError) {
    throw new Error(
      'Logosphere BITS: document upload failed ' +
        `(identity read failed: ${fldObjUserError.message}).`,
    );
  }
  const fldStrUserId = fldObjUserData?.user?.id;
  if (typeof fldStrUserId !== 'string' || fldStrUserId === '') {
    throw new Error(
      'Logosphere BITS: document upload failed (no identity was returned).',
    );
  }
  const fldStrDocumentId = fncRunRandomUuid();
  const fldStrObjectName = `org/${fldStrOrgId}/${fldStrDocumentId}/${fldStrFileName}`;
  const { error: fldObjBytesError } = await fldObjClient.storage
    .from(fldStrDocumentsBucket)
    .upload(fldStrObjectName, fldObjUpload.fldObjBytes, {
      contentType: fldObjUpload.fldStrMimeType ?? 'application/octet-stream',
      upsert: false,
    });
  if (fldObjBytesError) {
    throw new Error(
      'Logosphere BITS: document upload failed ' +
        `(bytes failed: ${fldObjBytesError.message}).`,
    );
  }
  const fldStrFilePath = `${fldStrDocumentsBucket}/${fldStrObjectName}`;
  const { data: fldObjRow, error: fldObjRowError } = await fldObjClient
    .from('corporate_documents')
    .insert({
      id: fldStrDocumentId,
      organization_id: fldStrOrgId,
      name: fldStrName,
      file_path: fldStrFilePath,
      mime_type: fldObjUpload.fldStrMimeType ?? null,
      byte_size: fldObjUpload.fldObjBytes.byteLength,
      created_by: fldStrUserId,
    })
    .select('id, organization_id, name, file_path, mime_type, byte_size')
    .single();
  if (fldObjRowError) {
    throw new Error(
      'Logosphere BITS: document upload failed ' +
        `(row failed: ${fldObjRowError.message}).`,
    );
  }
  if (!fncRunIsDocumentRow(fldObjRow)) {
    throw new Error(
      'Logosphere BITS: corporate_documents returned an unexpected ' +
        'shape (need the registered row).',
    );
  }
  return fncConvRowToDocument(fldObjRow);
}

export async function srvApiRemoveAccountDocument(
  fldObjClient: SupabaseClient,
  fldObjRef: fldObjAccountDocumentRef,
): Promise<void> {
  const fldStrOrgId = fncRunRequireText(
    fldObjRef.fldStrOrganizationId,
    'organization id',
  );
  const fldStrDocumentId = fncRunRequireText(
    fldObjRef.fldStrDocumentId,
    'document id',
  );
  const { data: fldObjRow, error: fldObjReadError } = await fldObjClient
    .from('corporate_documents')
    .select('id, organization_id, name, file_path, mime_type, byte_size')
    .eq('id', fldStrDocumentId)
    .eq('organization_id', fldStrOrgId)
    .maybeSingle();
  if (fldObjReadError) {
    throw new Error(
      'Logosphere BITS: document removal failed ' +
        `(corporate_documents read failed: ${fldObjReadError.message}).`,
    );
  }
  if (fldObjRow === null || !fncRunIsDocumentRow(fldObjRow)) {
    throw new Error('Logosphere BITS: unknown document.');
  }
  if (fldObjRow.organization_id !== fldStrOrgId) {
    throw new Error('Logosphere BITS: unknown document.');
  }
  const fldStrPrefix = `${fldStrDocumentsBucket}/`;
  if (!fldObjRow.file_path.startsWith(fldStrPrefix)) {
    throw new Error(
      'Logosphere BITS: document removal failed (row points outside ' +
        'the documents bucket).',
    );
  }
  const { error: fldObjDeleteError } = await fldObjClient
    .from('corporate_documents')
    .delete()
    .eq('id', fldStrDocumentId)
    .eq('organization_id', fldStrOrgId);
  if (fldObjDeleteError) {
    throw new Error(
      'Logosphere BITS: document removal failed ' +
        `(row failed: ${fldObjDeleteError.message}).`,
    );
  }
  const { error: fldObjBytesError } = await fldObjClient.storage
    .from(fldStrDocumentsBucket)
    .remove([fldObjRow.file_path.slice(fldStrPrefix.length)]);
  if (fldObjBytesError) {
    throw new Error(
      'Logosphere BITS: document row removed but bytes failed ' +
        `(${fldObjBytesError.message}).`,
    );
  }
}
