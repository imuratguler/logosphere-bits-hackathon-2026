/**
 * Logosphere BITS — hidden corporate document service tests (hermetic).
 *
 * Table reads, rpc, Auth identity, and bucket calls run against a
 * fake client: no network, no rows, no bytes. Filenames and rows
 * are fictional.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  fncConvSanitizeFileName,
  fncRunRandomUuid,
  srvApiGetAccountDocuments,
  srvApiRemoveAccountDocument,
  srvApiUploadAccountDocument,
} from '../src/services/srvAccountDocuments';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const fldStrSeedDoc = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

type fldObjFakeDocuments = {
  fldObjClient: SupabaseClient;
  fldObjFrom: jest.Mock;
  fldObjUpload: jest.Mock;
  fldObjRemove: jest.Mock;
  fldObjGetUser: jest.Mock;
};

function fncConvDocumentRow() {
  return {
    id: fldStrSeedDoc,
    organization_id: fldStrSeedOrg,
    name: 'Articles of association',
    file_path: `corporate-docs/org/${fldStrSeedOrg}/${fldStrSeedDoc}/articles.pdf`,
    mime_type: 'application/pdf',
    byte_size: 12,
  };
}

function fncConvFakeDocuments(fldObjScript: {
  single?: unknown;
  singleError?: { message: string } | null;
  rows?: unknown;
  rowsError?: { message: string } | null;
  inserted?: unknown;
  insertedError?: { message: string } | null;
  writeError?: { message: string } | null;
  userId?: string | null;
  userError?: { message: string } | null;
  uploadError?: { message: string } | null;
  removeError?: { message: string } | null;
}): fldObjFakeDocuments {
  const fldObjInsertBuilder = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: fldObjScript.inserted ?? null,
      error: fldObjScript.insertedError ?? null,
    }),
  };
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnValue(fldObjInsertBuilder),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: fldObjScript.single ?? null,
      error: fldObjScript.singleError ?? null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: fldObjScript.single ?? null,
      error: fldObjScript.singleError ?? null,
    }),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) =>
      Promise.resolve({
        data: fldObjScript.rows ?? null,
        error: fldObjScript.rowsError ?? fldObjScript.writeError ?? null,
      }).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  const fldObjUpload = jest.fn().mockResolvedValue({
    data: { path: 'org/x' },
    error: fldObjScript.uploadError ?? null,
  });
  const fldObjRemove = jest.fn().mockResolvedValue({
    data: [{ name: 'org/x' }],
    error: fldObjScript.removeError ?? null,
  });
  const fldObjGetUser = jest.fn().mockResolvedValue({
    data: {
      user:
        fldObjScript.userId === null
          ? null
          : { id: fldObjScript.userId ?? 'user-real-1' },
    },
    error: fldObjScript.userError ?? null,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      auth: { getUser: fldObjGetUser },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: fldObjUpload,
          remove: fldObjRemove,
        }),
      },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjUpload,
    fldObjRemove,
    fldObjGetUser,
  };
}

describe('hidden corporate document service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists the org documents newest first', async () => {
    const fldObjFake = fncConvFakeDocuments({ rows: [fncConvDocumentRow()] });

    const fldArrDocs = await srvApiGetAccountDocuments(
      fldObjFake.fldObjClient,
      fldStrSeedOrg,
    );
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('corporate_documents');
    expect(fldObjBuilder.select).toHaveBeenCalledWith(
      'id, organization_id, name, file_path, mime_type, byte_size',
    );
    expect(fldObjBuilder.eq).toHaveBeenCalledWith(
      'organization_id',
      fldStrSeedOrg,
    );
    expect(fldObjBuilder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(fldArrDocs).toEqual([
      {
        fldStrId: fldStrSeedDoc,
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: 'Articles of association',
        fldStrFilePath: fncConvDocumentRow().file_path,
        fldStrMimeType: 'application/pdf',
        fldNumByteSize: 12,
      },
    ]);
  });

  it('rejects a blank org id before any call', async () => {
    const fldObjFake = fncConvFakeDocuments({ rows: [] });

    await expect(
      srvApiGetAccountDocuments(fldObjFake.fldObjClient, '   '),
    ).rejects.toThrow('account document organization id is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces list errors naming the table', async () => {
    const fldObjFake = fncConvFakeDocuments({
      rowsError: { message: 'db down' },
    });

    await expect(
      srvApiGetAccountDocuments(fldObjFake.fldObjClient, fldStrSeedOrg),
    ).rejects.toThrow(
      'document list unavailable (corporate_documents read failed: db down).',
    );
  });

  it('rejects malformed document rows', async () => {
    const fldObjFake = fncConvFakeDocuments({
      rows: [{ id: fldStrSeedDoc }],
    });

    await expect(
      srvApiGetAccountDocuments(fldObjFake.fldObjClient, fldStrSeedOrg),
    ).rejects.toThrow('need id + organization_id + name + file_path');
  });

  it('sanitizes filenames to a single safe segment', () => {
    expect(fncConvSanitizeFileName('articles of association.pdf')).toBe(
      'articles-of-association.pdf',
    );
    expect(fncConvSanitizeFileName('../../etc/passwd')).toBe(
      '..-..-etc-passwd',
    );
    expect(fncConvSanitizeFileName('a/b\\c.pdf')).toBe('a-b-c.pdf');
    expect(fncConvSanitizeFileName('   ')).toBe('document');
    for (const fldStrName of [
      fncConvSanitizeFileName('../../x'),
      fncConvSanitizeFileName('a/b'),
      fncConvSanitizeFileName(''),
    ]) {
      expect(fldStrName).not.toMatch(/[/\\]/);
    }
  });

  it('mints version-4 uuid document ids', () => {
    const fldStrFirst = fncRunRandomUuid();
    const fldStrSecond = fncRunRandomUuid();
    const fldObjShape =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(fldStrFirst).toMatch(fldObjShape);
    expect(fldStrSecond).toMatch(fldObjShape);
    expect(fldStrSecond).not.toBe(fldStrFirst);
  });

  it('uploads bytes first, then registers the row', async () => {
    const fldObjRow = fncConvDocumentRow();
    const fldObjFake = fncConvFakeDocuments({ inserted: fldObjRow });
    const fldObjBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);

    const fldObjDoc = await srvApiUploadAccountDocument(
      fldObjFake.fldObjClient,
      {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: 'Articles',
        fldStrFileName: 'articles final.pdf',
        fldStrMimeType: 'application/pdf',
        fldObjBytes,
      },
    );

    expect(fldObjFake.fldObjGetUser).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjUpload).toHaveBeenCalledTimes(1);
    const fldArrUploadArgs = fldObjFake.fldObjUpload.mock.calls[0];
    expect(fldArrUploadArgs[0]).toMatch(
      new RegExp(`^org/${fldStrSeedOrg}/[0-9a-f-]{36}/articles-final\\.pdf$`),
    );
    expect(fldArrUploadArgs[1]).toBe(fldObjBytes);
    expect(fldArrUploadArgs[2]).toEqual({
      contentType: 'application/pdf',
      upsert: false,
    });
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('corporate_documents');
    expect(fldObjBuilder.insert).toHaveBeenCalledWith({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      organization_id: fldStrSeedOrg,
      name: 'Articles',
      file_path: expect.stringMatching(
        new RegExp(
          `^corporate-docs/org/${fldStrSeedOrg}/[0-9a-f-]{36}/articles-final\\.pdf$`,
        ),
      ),
      mime_type: 'application/pdf',
      byte_size: 6,
      created_by: 'user-real-1',
    });
    expect(fldObjFake.fldObjUpload.mock.invocationCallOrder[0]).toBeLessThan(
      fldObjBuilder.insert.mock.invocationCallOrder[0],
    );
    expect(fldObjDoc.fldStrId).toBe(fldStrSeedDoc);
  });

  it('requires upload fields before any call', async () => {
    const fldObjFake = fncConvFakeDocuments({ inserted: fncConvDocumentRow() });

    await expect(
      srvApiUploadAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: '   ',
        fldStrFileName: 'articles.pdf',
        fldObjBytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow('account document name is missing or blank');
    expect(fldObjFake.fldObjGetUser).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjUpload).not.toHaveBeenCalled();
  });

  it('stops upload when identity is missing', async () => {
    const fldObjFake = fncConvFakeDocuments({
      inserted: fncConvDocumentRow(),
      userId: null,
    });

    await expect(
      srvApiUploadAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: 'Articles',
        fldStrFileName: 'articles.pdf',
        fldObjBytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow('no identity was returned');
    expect(fldObjFake.fldObjUpload).not.toHaveBeenCalled();
  });

  it('stops upload when bytes fail, before any row', async () => {
    const fldObjFake = fncConvFakeDocuments({
      inserted: fncConvDocumentRow(),
      uploadError: { message: 'bucket down' },
    });

    await expect(
      srvApiUploadAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: 'Articles',
        fldStrFileName: 'articles.pdf',
        fldObjBytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow('bytes failed: bucket down');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });

  it('surfaces row registration failure after bytes', async () => {
    const fldObjFake = fncConvFakeDocuments({
      insertedError: { message: 'not a member' },
    });

    await expect(
      srvApiUploadAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrName: 'Articles',
        fldStrFileName: 'articles.pdf',
        fldObjBytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow('row failed: not a member');
  });

  it('removes the row before the bytes', async () => {
    const fldObjFake = fncConvFakeDocuments({ single: fncConvDocumentRow() });

    await srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
      fldStrOrganizationId: fldStrSeedOrg,
      fldStrDocumentId: fldStrSeedDoc,
    });

    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.delete).toHaveBeenCalledTimes(1);
    expect(fldObjBuilder.eq).toHaveBeenCalledWith('id', fldStrSeedDoc);
    expect(fldObjBuilder.eq).toHaveBeenCalledWith(
      'organization_id',
      fldStrSeedOrg,
    );
    expect(fldObjFake.fldObjRemove).toHaveBeenCalledWith([
      `org/${fldStrSeedOrg}/${fldStrSeedDoc}/articles.pdf`,
    ]);
    expect(fldObjBuilder.delete.mock.invocationCallOrder[0]).toBeLessThan(
      fldObjFake.fldObjRemove.mock.invocationCallOrder[0],
    );
  });

  it('rejects unknown documents before any delete', async () => {
    const fldObjFake = fncConvFakeDocuments({ single: null });

    await expect(
      srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrDocumentId: fldStrSeedDoc,
      }),
    ).rejects.toThrow('unknown document');
    const fldObjBuilder = fldObjFake.fldObjFrom.mock.results[0]?.value;
    expect(fldObjBuilder.delete).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjRemove).not.toHaveBeenCalled();
  });

  it('rejects cross-org removal', async () => {
    const fldObjFake = fncConvFakeDocuments({
      single: {
        ...fncConvDocumentRow(),
        organization_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      },
    });

    await expect(
      srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrDocumentId: fldStrSeedDoc,
      }),
    ).rejects.toThrow('unknown document');
    expect(fldObjFake.fldObjRemove).not.toHaveBeenCalled();
  });

  it('rejects rows pointing outside the documents bucket', async () => {
    const fldObjFake = fncConvFakeDocuments({
      single: {
        ...fncConvDocumentRow(),
        file_path: 'product-photos/p/x/img.jpg',
      },
    });

    await expect(
      srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrDocumentId: fldStrSeedDoc,
      }),
    ).rejects.toThrow('points outside the documents bucket');
    expect(fldObjFake.fldObjRemove).not.toHaveBeenCalled();
  });

  it('reports bytes failure after the row is gone', async () => {
    const fldObjFake = fncConvFakeDocuments({
      single: fncConvDocumentRow(),
      removeError: { message: 'storage down' },
    });

    await expect(
      srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrDocumentId: fldStrSeedDoc,
      }),
    ).rejects.toThrow('row removed but bytes failed (storage down).');
  });

  it('keeps signatures free of persona, session, and flag parameters', () => {
    expect(srvApiGetAccountDocuments.length).toBe(2);
    expect(srvApiUploadAccountDocument.length).toBe(2);
    expect(srvApiRemoveAccountDocument.length).toBe(2);
  });

  it('stays inside the documents table and bucket', async () => {
    const fldObjFake = fncConvFakeDocuments({
      rows: [fncConvDocumentRow()],
      single: fncConvDocumentRow(),
      inserted: fncConvDocumentRow(),
    });
    const fldObjStorageFrom = (
      fldObjFake.fldObjClient.storage as unknown as { from: jest.Mock }
    ).from;

    await srvApiGetAccountDocuments(fldObjFake.fldObjClient, fldStrSeedOrg);
    await srvApiUploadAccountDocument(fldObjFake.fldObjClient, {
      fldStrOrganizationId: fldStrSeedOrg,
      fldStrName: 'Articles',
      fldStrFileName: 'articles.pdf',
      fldObjBytes: new Uint8Array([1]),
    });
    await srvApiRemoveAccountDocument(fldObjFake.fldObjClient, {
      fldStrOrganizationId: fldStrSeedOrg,
      fldStrDocumentId: fldStrSeedDoc,
    });

    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    const fldArrBuckets = fldObjStorageFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    expect(fldArrTables).toEqual([
      'corporate_documents',
      'corporate_documents',
      'corporate_documents',
      'corporate_documents',
    ]);
    expect(fldArrBuckets).toEqual(['corporate-docs', 'corporate-docs']);
    for (const fldStrName of [...fldArrTables, ...fldArrBuckets]) {
      expect(String(fldStrName)).not.toMatch(/demo_|profiles/);
    }
  });
});
