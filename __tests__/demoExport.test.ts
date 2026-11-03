/**
 * Logosphere BITS — demo catalog export tests (hermetic).
 *
 * The row mapper is pure and covered exactly: fixed 15-column
 * English rows, USD-only price cells, evidence/AI labels, sale
 * states, and a closed key allowlist (no profile, persona,
 * media link, private path, credential, or identifier value
 * may ride along). Workbook bytes round-trip through the real
 * xlsx builder; scope collection, the cache write, and the
 * share sheet run against fakes. Seed values are public,
 * non-secret.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

jest.mock('../src/services/srvDemoProductDetails', () => ({
  srvApiGetDemoProductDetails: jest.fn(),
}));

jest.mock('../src/services/srvDemoWorkspace', () => ({
  srvApiGetDemoWorkspace: jest.fn(),
}));

jest.mock('../src/services/srvDemoMove', () => ({
  srvApiGetDemoMoveTree: jest.fn(),
}));

const mockFncWriteFile = jest.fn();
const mockFncExists = jest.fn();
const mockFncMkdir = jest.fn();

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache' },
      writeFile: (...fldArrArgs: unknown[]) => mockFncWriteFile(...fldArrArgs),
      exists: (...fldArrArgs: unknown[]) => mockFncExists(...fldArrArgs),
      mkdir: (...fldArrArgs: unknown[]) => mockFncMkdir(...fldArrArgs),
    },
  },
}));

const mockFncShareOpen = jest.fn();

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {
    open: (...fldArrArgs: unknown[]) => mockFncShareOpen(...fldArrArgs),
  },
}));

import {
  fldArrExportColumns,
  fncConvDetailsToExportRow,
  srvApiBuildExportFile,
  srvApiCollectExportProductIds,
  srvApiExportAndShare,
  srvApiFetchExportRows,
  srvApiShareExportFile,
} from '../src/services/srvDemoExport';
import { srvApiGetDemoMoveTree } from '../src/services/srvDemoMove';
import { srvApiGetDemoProductDetails } from '../src/services/srvDemoProductDetails';
import { srvApiGetDemoWorkspace } from '../src/services/srvDemoWorkspace';
import type { fldObjProductDetails } from '../src/types/typModels';

const fldStrSeedProduct = '55555555-5555-5555-5555-555555555501';
const fldStrSeedSet = '44444444-4444-4444-4444-444444444444';
const fldStrSeedCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSeedChild = '33333333-3333-3333-3333-333333333334';
const fldObjFakeClient = {} as unknown as SupabaseClient;

function fncConvSeedDetails(
  fldObjOverrides: Record<string, unknown> = {},
): fldObjProductDetails {
  return {
    fldObjProduct: {
      fldStrId: fldStrSeedProduct,
      fldStrName: 'The Demo Codex',
      fldDatCreatedAt: '2026-10-28T00:00:00Z',
      fldDatUpdatedAt: '2026-10-28T00:00:00Z',
      fldStrCollectionId: fldStrSeedCollection,
      fldStrSetId: null,
      fldObjBibliographicData: {
        fldStrTitle: 'The Demo Codex',
        fldStrSubtitle: null,
        fldStrIsbn10: '0123456789',
        fldStrIsbn13: '9780123456789',
        fldStrPublisher: 'Logosphere Press',
        fldStrPublicationLanguage: 'en',
        fldStrEdition: 'First',
        fldStrPrinting: null,
        fldNumPublicationYear: 2026,
        fldArrContributors: [
          { fldStrPerson: 'Ada Scribe', fldStrRole: 'Author' },
          { fldStrPerson: 'Bo Etcher', fldStrRole: 'Illustrator' },
        ],
        fldNumOriginalPublicationYear: null,
        fldNumPageCount: 320,
        fldStrPublicationType: null,
        fldObjDescription: null,
        fldStrBinding: null,
        fldStrDustJacket: null,
        fldStrPaper: null,
        fldStrDimensions: null,
        fldStrCondition: 'Fine',
        fldStrSignature: null,
        fldStrDedication: null,
      },
      fldObjPricing: {
        fldNumReplacementNew: 1999,
        fldNumMarketMin: 500,
        fldNumMarketMax: 1500,
        fldNumMarketRecommended: 900,
        fldNumMarketMedian: 800,
        fldStrCurrency: 'USD',
        fldNumSourcePrice: null,
        fldStrSourceCurrency: null,
        fldDatRateDate: null,
        fldStrPriceBasis: 'evidence',
      },
      fldObjSaleStatus: {
        fldNumTagPrice: 950,
        fldBooIsActive: true,
        fldStrTransactionScope: 'product',
        fldDatTransactionAt: '2026-10-28T00:00:00Z',
        fldStrTransactionId: 'tx-1',
      },
      ...((fldObjOverrides.fldObjProduct as Record<string, unknown>) ?? {}),
    },
    fldArrImages: [],
    fldArrObservations: [],
  };
}

function fncConvSeedTree() {
  return {
    fldArrNodes: [
      {
        fldStrId: fldStrSeedCollection,
        fldStrName: 'Root',
        fldStrKind: 'collection' as const,
        fldStrParentId: null,
      },
      {
        fldStrId: fldStrSeedChild,
        fldStrName: 'Child',
        fldStrKind: 'collection' as const,
        fldStrParentId: fldStrSeedCollection,
      },
    ],
    fldArrSets: [
      {
        fldStrId: fldStrSeedSet,
        fldStrName: 'Rare Folios',
        fldStrCollectionId: fldStrSeedCollection,
      },
    ],
    fldArrProducts: [
      {
        fldStrId: 'p-loose-root',
        fldStrCollectionId: fldStrSeedCollection,
        fldStrSetId: null,
      },
      {
        fldStrId: 'p-set-member',
        fldStrCollectionId: fldStrSeedCollection,
        fldStrSetId: fldStrSeedSet,
      },
      {
        fldStrId: 'p-nested',
        fldStrCollectionId: fldStrSeedChild,
        fldStrSetId: null,
      },
    ],
  };
}

describe('export row mapping', () => {
  it('keeps exactly the fifteen public columns', () => {
    expect([...fldArrExportColumns]).toEqual([
      'Title',
      'Contributors',
      'ISBN-13',
      'ISBN-10',
      'Publisher',
      'Year',
      'Edition',
      'Condition',
      'Source type',
      'New (USD)',
      'Min (USD)',
      'Max (USD)',
      'Recommended (USD)',
      'Tag price (USD)',
      'Sale status',
    ]);
  });

  it('maps a full product to its row cells', () => {
    expect(fncConvDetailsToExportRow(fncConvSeedDetails())).toEqual({
      Title: 'The Demo Codex',
      Contributors: 'Ada Scribe (Author); Bo Etcher (Illustrator)',
      'ISBN-13': '9780123456789',
      'ISBN-10': '0123456789',
      Publisher: 'Logosphere Press',
      Year: '2026',
      Edition: 'First',
      Condition: 'Fine',
      'Source type': 'Evidence',
      'New (USD)': '19.99',
      'Min (USD)': '5.00',
      'Max (USD)': '15.00',
      'Recommended (USD)': '9.00',
      'Tag price (USD)': '9.50',
      'Sale status': 'Active',
    });
  });

  it('falls back to the product name and blanks without pricing or sale', () => {
    const fldObjDetails = fncConvSeedDetails();
    fldObjDetails.fldObjProduct.fldObjBibliographicData.fldStrTitle = null;
    fldObjDetails.fldObjProduct.fldObjBibliographicData.fldArrContributors =
      null;
    fldObjDetails.fldObjProduct.fldObjPricing = null;
    fldObjDetails.fldObjProduct.fldObjSaleStatus = null;

    const fldObjRow = fncConvDetailsToExportRow(fldObjDetails);
    expect(fldObjRow.Title).toBe('The Demo Codex');
    expect(fldObjRow.Contributors).toBe('');
    expect(fldObjRow['Source type']).toBe('');
    expect(fldObjRow['New (USD)']).toBe('');
    expect(fldObjRow['Min (USD)']).toBe('');
    expect(fldObjRow['Max (USD)']).toBe('');
    expect(fldObjRow['Recommended (USD)']).toBe('');
    expect(fldObjRow['Tag price (USD)']).toBe('');
    expect(fldObjRow['Sale status']).toBe('Not listed');
    expect(Object.keys(fldObjRow).sort()).toEqual(
      [...fldArrExportColumns].sort(),
    );
  });

  it('labels AI estimates and inactive listings', () => {
    const fldObjDetails = fncConvSeedDetails();
    if (fldObjDetails.fldObjProduct.fldObjPricing !== null) {
      fldObjDetails.fldObjProduct.fldObjPricing.fldStrPriceBasis =
        'ai-estimate';
    }
    if (fldObjDetails.fldObjProduct.fldObjSaleStatus !== null) {
      fldObjDetails.fldObjProduct.fldObjSaleStatus.fldBooIsActive = false;
    }

    const fldObjRow = fncConvDetailsToExportRow(fldObjDetails);
    expect(fldObjRow['Source type']).toBe('AI estimate');
    expect(fldObjRow['Sale status']).toBe('Inactive');
  });

  it('blanks the USD cells for non-USD estimates', () => {
    const fldObjDetails = fncConvSeedDetails();
    if (fldObjDetails.fldObjProduct.fldObjPricing !== null) {
      fldObjDetails.fldObjProduct.fldObjPricing.fldStrCurrency = 'EUR';
    }

    const fldObjRow = fncConvDetailsToExportRow(fldObjDetails);
    expect(fldObjRow['New (USD)']).toBe('');
    expect(fldObjRow['Min (USD)']).toBe('');
    expect(fldObjRow['Max (USD)']).toBe('');
    expect(fldObjRow['Recommended (USD)']).toBe('');
    expect(fldObjRow['Tag price (USD)']).toBe('9.50');
  });

  it('carries no identifier, link, path, or credential value', () => {
    const fldObjRow = fncConvDetailsToExportRow(fncConvSeedDetails());
    const fldStrJoined = Object.values(fldObjRow).join('\n');
    expect(fldStrJoined).not.toMatch(/55555555-5555/);
    expect(fldStrJoined).not.toMatch(/tx-1/);
    expect(fldStrJoined).not.toMatch(/https?:\/\//);
    expect(fldStrJoined).not.toMatch(/content:\/\//);
    expect(fldStrJoined).not.toMatch(/file:\/\//);
    expect(fldStrJoined).not.toMatch(/\.mp4|\.m4a|\.aac/i);
    expect(fldStrJoined).not.toMatch(/2026-10-28T00:00:00Z/);
  });
});

describe('export workbook', () => {
  it('writes the header order and rows to a readable sheet', () => {
    const fldObjFile = srvApiBuildExportFile(
      [fncConvDetailsToExportRow(fncConvSeedDetails())],
      'product',
      new Date('2026-11-03T08:50:00'),
    );

    expect(fldObjFile.fldStrFileName).toBe(
      'bits-product-export-20261103-085000.xlsx',
    );
    expect(fldObjFile.fldStrMime).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    const fldObjWorkbook = XLSX.read(fldObjFile.fldStrBase64, {
      type: 'base64',
    });
    expect(fldObjWorkbook.SheetNames).toEqual(['Catalog']);
    const fldObjSheet = fldObjWorkbook.Sheets.Catalog;
    if (fldObjSheet === undefined) {
      throw new Error('Logosphere BITS: export sheet is missing.');
    }
    const fldArrRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      fldObjSheet,
      { header: 1 },
    );
    expect(fldArrRows[0]).toEqual([...fldArrExportColumns]);
    expect(fldArrRows[1]).toEqual([
      'The Demo Codex',
      'Ada Scribe (Author); Bo Etcher (Illustrator)',
      '9780123456789',
      '0123456789',
      'Logosphere Press',
      '2026',
      'First',
      'Fine',
      'Evidence',
      '19.99',
      '5.00',
      '15.00',
      '9.00',
      '9.50',
      'Active',
    ]);
  });

  it('writes headers only when there are no rows', () => {
    const fldObjFile = srvApiBuildExportFile(
      [],
      'set',
      new Date('2026-11-03T08:50:00'),
    );

    expect(fldObjFile.fldStrFileName).toBe(
      'bits-set-export-20261103-085000.xlsx',
    );
    const fldObjWorkbook = XLSX.read(fldObjFile.fldStrBase64, {
      type: 'base64',
    });
    const fldObjSheet = fldObjWorkbook.Sheets.Catalog;
    if (fldObjSheet === undefined) {
      throw new Error('Logosphere BITS: export sheet is missing.');
    }
    expect(XLSX.utils.sheet_to_json(fldObjSheet, { header: 1 })).toEqual([
      [...fldArrExportColumns],
    ]);
  });
});

describe('export scope collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(srvApiGetDemoWorkspace).mockResolvedValue({
      fldStrId: 'workspace-1',
      fldStrName: 'Demo',
    });
    jest.mocked(srvApiGetDemoMoveTree).mockResolvedValue(fncConvSeedTree());
  });

  it('passes a single product straight through', async () => {
    await expect(
      srvApiCollectExportProductIds(
        fldObjFakeClient,
        'product',
        fldStrSeedProduct,
      ),
    ).resolves.toEqual([fldStrSeedProduct]);
    expect(srvApiGetDemoMoveTree).not.toHaveBeenCalled();
  });

  it('rejects a blank subject id before any read', async () => {
    await expect(
      srvApiCollectExportProductIds(fldObjFakeClient, 'set', '  '),
    ).rejects.toThrow('subject ID is blank');
    expect(srvApiGetDemoWorkspace).not.toHaveBeenCalled();
  });

  it('collects only the set members and rejects unknown sets', async () => {
    await expect(
      srvApiCollectExportProductIds(fldObjFakeClient, 'set', fldStrSeedSet),
    ).resolves.toEqual(['p-set-member']);
    await expect(
      srvApiCollectExportProductIds(fldObjFakeClient, 'set', 'missing-set'),
    ).rejects.toThrow('export set is unknown');
  });

  it('collects the whole nested subtree including non-leaf products', async () => {
    await expect(
      srvApiCollectExportProductIds(
        fldObjFakeClient,
        'collection',
        fldStrSeedCollection,
      ),
    ).resolves.toEqual(['p-loose-root', 'p-set-member', 'p-nested']);
    await expect(
      srvApiCollectExportProductIds(
        fldObjFakeClient,
        'collection',
        'missing-collection',
      ),
    ).rejects.toThrow('export collection is unknown');
  });

  it('collects a child subtree alone', async () => {
    await expect(
      srvApiCollectExportProductIds(
        fldObjFakeClient,
        'collection',
        fldStrSeedChild,
      ),
    ).resolves.toEqual(['p-nested']);
  });
});

describe('export share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFncExists.mockResolvedValue(false);
    mockFncMkdir.mockResolvedValue(undefined);
    mockFncWriteFile.mockResolvedValue(undefined);
    mockFncShareOpen.mockResolvedValue({ success: true });
    jest
      .mocked(srvApiGetDemoProductDetails)
      .mockResolvedValue(fncConvSeedDetails());
  });

  it('writes the workbook to the cache and shares its file URI', async () => {
    const fldObjFile = srvApiBuildExportFile(
      [fncConvDetailsToExportRow(fncConvSeedDetails())],
      'collection',
      new Date('2026-11-03T08:50:00'),
    );

    const fldStrPath = await srvApiShareExportFile(fldObjFile);

    expect(fldStrPath).toBe(
      '/cache/bits-exports/bits-collection-export-20261103-085000.xlsx',
    );
    expect(mockFncMkdir).toHaveBeenCalledWith('/cache/bits-exports');
    expect(mockFncWriteFile).toHaveBeenCalledWith(
      fldStrPath,
      fldObjFile.fldStrBase64,
      'base64',
    );
    expect(mockFncShareOpen).toHaveBeenCalledWith({
      url: `file://${fldStrPath}`,
      filename: 'bits-collection-export-20261103-085000.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      failOnCancel: false,
    });
  });

  it('skips the directory creation when the cache dir exists', async () => {
    mockFncExists.mockResolvedValue(true);
    const fldObjFile = srvApiBuildExportFile(
      [],
      'product',
      new Date('2026-11-03T08:50:00'),
    );

    await srvApiShareExportFile(fldObjFile);

    expect(mockFncMkdir).not.toHaveBeenCalled();
    expect(mockFncShareOpen).toHaveBeenCalledTimes(1);
  });

  it('fetches one row per product in order', async () => {
    const fldArrRows = await srvApiFetchExportRows(fldObjFakeClient, [
      'p-loose-root',
      'p-nested',
    ]);

    expect(fldArrRows).toHaveLength(2);
    expect(
      jest
        .mocked(srvApiGetDemoProductDetails)
        .mock.calls.map(fldArrCall => fldArrCall[1]),
    ).toEqual(['p-loose-root', 'p-nested']);
  });

  it('reports empty scopes without touching the share sheet', async () => {
    jest.mocked(srvApiGetDemoWorkspace).mockResolvedValue({
      fldStrId: 'workspace-1',
      fldStrName: 'Demo',
    });
    jest.mocked(srvApiGetDemoMoveTree).mockResolvedValue({
      fldArrNodes: [
        {
          fldStrId: fldStrSeedCollection,
          fldStrName: 'Root',
          fldStrKind: 'collection' as const,
          fldStrParentId: null,
        },
      ],
      fldArrSets: [
        {
          fldStrId: fldStrSeedSet,
          fldStrName: 'Rare Folios',
          fldStrCollectionId: fldStrSeedCollection,
        },
      ],
      fldArrProducts: [],
    });

    await expect(
      srvApiExportAndShare(fldObjFakeClient, 'set', fldStrSeedSet),
    ).resolves.toBe('empty');
    expect(mockFncShareOpen).not.toHaveBeenCalled();
    expect(srvApiGetDemoProductDetails).not.toHaveBeenCalled();
  });

  it('shares a single product end to end', async () => {
    await expect(
      srvApiExportAndShare(fldObjFakeClient, 'product', fldStrSeedProduct),
    ).resolves.toBe('shared');
    expect(srvApiGetDemoProductDetails).toHaveBeenCalledTimes(1);
    expect(mockFncShareOpen).toHaveBeenCalledTimes(1);
  });
});
