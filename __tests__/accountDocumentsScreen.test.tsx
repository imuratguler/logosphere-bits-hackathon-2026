/**
 * Logosphere BITS — hidden corporate document screen tests (hermetic).
 *
 * Renders the hidden screen directly (never through the demo
 * navigator) with react-test-renderer: list, read, delete, and
 * bucket calls run against a fake client, so no network is
 * touched. Covers loading, the document list, the empty org, load
 * retry, confirmed removal with row-then-bytes order, cancel, and
 * removal failure with the list kept.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('../src/config/cfgSupabaseEnv', () => ({
  fldStrSupabaseProjectAddress: 'https://localhost:54321',
  fldStrSupabaseAnonKey: 'dummy-anon-key',
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const fldObjStore = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((fldStrKey: string) =>
        Promise.resolve(fldObjStore.get(fldStrKey) ?? null),
      ),
      setItem: jest.fn((fldStrKey: string, fldStrValue: string) => {
        fldObjStore.set(fldStrKey, fldStrValue);
        return Promise.resolve();
      }),
      removeItem: jest.fn((fldStrKey: string) => {
        fldObjStore.delete(fldStrKey);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        fldObjStore.clear();
        return Promise.resolve();
      }),
    },
  };
});

import { vwButton } from '../src/components/vwButton';
import { vwDeleteConfirmModal } from '../src/components/vwDeleteConfirmModal';
import { vwEmptyState } from '../src/components/vwEmptyState';
import { vwText } from '../src/components/vwText';
import { fldObjStringsEn } from '../src/i18n/intTranslations';
import { scrAccountDocuments } from '../src/screens/scrAccountDocuments';

const fldStrSeedOrg = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const fldStrSeedDoc = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

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

function fncConvFakeClient(fldObjScript: {
  rows?: unknown;
  rowsError?: { message: string } | null;
  single?: unknown;
  writeError?: { message: string } | null;
  removeError?: { message: string } | null;
}) {
  let fldNumListCalls = 0;
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: fldObjScript.single ?? fncConvDocumentRow(),
      error: null,
    }),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) => {
      fldNumListCalls += 1;
      const fldBooDeleteCall = fldNumListCalls === 2;
      return Promise.resolve(
        fldBooDeleteCall
          ? { data: null, error: fldObjScript.writeError ?? null }
          : {
              data: fldObjScript.rows ?? [fncConvDocumentRow()],
              error: fldObjScript.rowsError ?? null,
            },
      ).then(fldObjResolve, fldObjReject);
    },
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  const fldObjRemove = jest.fn().mockResolvedValue({
    data: [{ name: 'org/x' }],
    error: fldObjScript.removeError ?? null,
  });
  const fldObjStorageFrom = jest.fn().mockReturnValue({
    remove: fldObjRemove,
  });
  return {
    fldObjClient: {
      from: fldObjFrom,
      storage: { from: fldObjStorageFrom },
    } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
    fldObjRemove,
    fldObjStorageFrom,
  };
}

async function fncRunRender(fldObjClient: SupabaseClient) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(scrAccountDocuments, {
        fldObjStrings: fldObjStringsEn,
        fldObjClient,
        fldStrOrganizationId: fldStrSeedOrg,
        fldStrOrganizationName: 'Acme',
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  await ReactTestRenderer.act(async () => {});
  await ReactTestRenderer.act(async () => {});
  return fldObjRenderer;
}

describe('hidden corporate document screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the org documents with their paths', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('corporate_documents');
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Articles of association');
    expect(fldArrTexts).toContain(fncConvDocumentRow().file_path);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the empty org without documents', async () => {
    const fldObjFake = fncConvFakeClient({ rows: [] });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    expect(fldObjRenderer.root.findByType(vwEmptyState).props.fldStrTitle).toBe(
      'No documents yet',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows load errors with retry', async () => {
    const fldObjFake = fncConvFakeClient({
      rowsError: { message: 'db down' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    const fldObjError = fldObjRenderer.root.findByType(vwEmptyState);
    expect(fldObjError.props.fldStrTitle).toBe('Could not load documents');
    expect(fldObjError.props.fldStrMessage).toContain('db down');

    const fldNumFromBefore = fldObjFake.fldObjFrom.mock.calls.length;
    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(
      fldNumFromBefore,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('confirms removal and deletes the row before the bytes', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrSummary).toBe('Articles of association');

    await ReactTestRenderer.act(async () => {
      fldObjModal.props.actHandOnConfirm();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    expect(fldObjFake.fldObjBuilder.delete).toHaveBeenCalledTimes(1);
    expect(fldObjFake.fldObjRemove).toHaveBeenCalledWith([
      `org/${fldStrSeedOrg}/${fldStrSeedDoc}/articles.pdf`,
    ]);
    expect(
      fldObjFake.fldObjBuilder.delete.mock.invocationCallOrder[0],
    ).toBeLessThan(fldObjFake.fldObjRemove.mock.invocationCallOrder[0]);
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);
    expect(fldObjFake.fldObjFrom.mock.calls.length).toBeGreaterThan(2);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('cancels removal without any delete', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    ReactTestRenderer.act(() => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnCancel();
    });

    expect(fldObjFake.fldObjBuilder.delete).not.toHaveBeenCalled();
    expect(fldObjFake.fldObjRemove).not.toHaveBeenCalled();
    expect(
      fldObjRenderer.root.findByType(vwDeleteConfirmModal).props.fldBooVisible,
    ).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('keeps the list and shows removal failure', async () => {
    const fldObjFake = fncConvFakeClient({
      writeError: { message: 'not a member' },
    });
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    const fldObjModal = fldObjRenderer.root.findByType(vwDeleteConfirmModal);
    expect(fldObjModal.props.fldBooVisible).toBe(true);
    expect(fldObjModal.props.fldStrError).toContain('not a member');
    expect(fldObjFake.fldObjRemove).not.toHaveBeenCalled();
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Articles of association');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('stays inside the documents table and bucket', async () => {
    const fldObjFake = fncConvFakeClient({});
    const fldObjRenderer = await fncRunRender(fldObjFake.fldObjClient);

    ReactTestRenderer.act(() => {
      fldObjRenderer.root.findByType(vwButton).props.actHandOnPress();
    });
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwDeleteConfirmModal)
        .props.actHandOnConfirm();
    });
    await ReactTestRenderer.act(async () => {});
    await ReactTestRenderer.act(async () => {});

    const fldArrTables = fldObjFake.fldObjFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    const fldArrBuckets = fldObjFake.fldObjStorageFrom.mock.calls.map(
      fldArrCall => fldArrCall[0],
    );
    expect(fldArrTables.length).toBeGreaterThan(0);
    for (const fldStrName of fldArrTables) {
      expect(fldStrName).toBe('corporate_documents');
    }
    expect(fldArrBuckets).toEqual(['corporate-docs']);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
