/**
 * Logosphere BITS - demo catalog export (collect + build + save).
 *
 * One flow for product, set, and collection scopes: gather the
 * in-scope product ids through the ready read services, fetch
 * each product's saved detail, map every product to a fixed
 * 15-column English row, build an RFC 4180 CSV document (BOM +
 * CRLF for spreadsheet apps), stage the file under the app
 * cache through the blob-util file layer, and copy it into the
 * public Downloads collection through the blob-util media
 * layer (MediaStore on Android 10+, legacy path below; the
 * caller informs the user with the returned file name). No row
 * carries profile, persona, media link, private path,
 * credential, or identifier values - only the listed catalog
 * columns.
 * Naming follows D6 (fld / srv / fnc roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { srvApiGetDemoMoveTree } from './srvDemoMove';
import { srvApiGetDemoProductDetails } from './srvDemoProductDetails';
import { srvApiGetDemoWorkspace } from './srvDemoWorkspace';
import type { fldObjProductDetails } from '../types/typModels';

export type fldStrExportSubject = 'product' | 'set' | 'collection';

export type fldObjExportFile = {
  fldStrCsv: string;
  fldStrFileName: string;
  fldStrMime: string;
};

export type fldStrExportOutcome = 'saved' | 'empty';

export type fldObjExportResult = {
  fldStrOutcome: fldStrExportOutcome;
  fldStrFileName: string | null;
};

export const fldStrExportMime = 'text/csv';

export const fldArrExportColumns: readonly string[] = [
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
];

const fldStrExportDirName = 'bits-exports';

function fncConvText(fldStrValue: string | null): string {
  return fldStrValue ?? '';
}

function fncConvMinorToMajor(fldNumMinor: number | null): string {
  if (fldNumMinor === null) {
    return '';
  }
  return (fldNumMinor / 100).toFixed(2);
}

function fncConvSourceType(fldObjDetails: fldObjProductDetails): string {
  const fldObjPricing = fldObjDetails.fldObjProduct.fldObjPricing;
  if (fldObjPricing === null) {
    return '';
  }
  if (
    fldObjPricing.fldStrPriceBasis === 'evidence' ||
    fldObjPricing.fldStrPriceBasis === 'sourced'
  ) {
    return 'Evidence';
  }
  if (
    fldObjPricing.fldStrPriceBasis === 'estimate' ||
    fldObjPricing.fldStrPriceBasis === 'ai-estimate'
  ) {
    return 'AI estimate';
  }
  return '';
}

function fncConvUsdCell(
  fldObjDetails: fldObjProductDetails,
  fldNumMinor: number | null,
): string {
  const fldObjPricing = fldObjDetails.fldObjProduct.fldObjPricing;
  if (fldObjPricing === null || fldObjPricing.fldStrCurrency !== 'USD') {
    return '';
  }
  return fncConvMinorToMajor(fldNumMinor);
}

function fncConvSaleStatus(fldObjDetails: fldObjProductDetails): string {
  const fldObjSale = fldObjDetails.fldObjProduct.fldObjSaleStatus;
  if (fldObjSale === null) {
    return 'Not listed';
  }
  return fldObjSale.fldBooIsActive ? 'Active' : 'Inactive';
}

export function fncConvDetailsToExportRow(
  fldObjDetails: fldObjProductDetails,
): Record<string, string> {
  const fldObjProduct = fldObjDetails.fldObjProduct;
  const fldObjBiblio = fldObjProduct.fldObjBibliographicData;
  const fldObjPricing = fldObjProduct.fldObjPricing;
  const fldObjSale = fldObjProduct.fldObjSaleStatus;
  const fldStrContributors = (fldObjBiblio.fldArrContributors ?? [])
    .map(
      fldObjContributor =>
        `${fldObjContributor.fldStrPerson} (${fldObjContributor.fldStrRole})`,
    )
    .join('; ');
  return {
    Title: fldObjBiblio.fldStrTitle ?? fldObjProduct.fldStrName,
    Contributors: fldStrContributors,
    'ISBN-13': fncConvText(fldObjBiblio.fldStrIsbn13),
    'ISBN-10': fncConvText(fldObjBiblio.fldStrIsbn10),
    Publisher: fncConvText(fldObjBiblio.fldStrPublisher),
    Year:
      fldObjBiblio.fldNumPublicationYear === null
        ? ''
        : String(fldObjBiblio.fldNumPublicationYear),
    Edition: fncConvText(fldObjBiblio.fldStrEdition),
    Condition: fncConvText(fldObjBiblio.fldStrCondition),
    'Source type': fncConvSourceType(fldObjDetails),
    'New (USD)': fncConvUsdCell(
      fldObjDetails,
      fldObjPricing?.fldNumReplacementNew ?? null,
    ),
    'Min (USD)': fncConvUsdCell(
      fldObjDetails,
      fldObjPricing?.fldNumMarketMin ?? null,
    ),
    'Max (USD)': fncConvUsdCell(
      fldObjDetails,
      fldObjPricing?.fldNumMarketMax ?? null,
    ),
    'Recommended (USD)': fncConvUsdCell(
      fldObjDetails,
      fldObjPricing?.fldNumMarketRecommended ?? null,
    ),
    'Tag price (USD)': fncConvMinorToMajor(fldObjSale?.fldNumTagPrice ?? null),
    'Sale status': fncConvSaleStatus(fldObjDetails),
  };
}

function fncRunBranchProductIds(
  fldStrBranchId: string,
  fldStrKind: 'set' | 'collection',
  fldObjTree: {
    fldArrNodes: { fldStrId: string; fldStrParentId: string | null }[];
    fldArrProducts: {
      fldStrId: string;
      fldStrCollectionId: string;
      fldStrSetId: string | null;
    }[];
    fldArrSets: { fldStrId: string }[];
  },
): string[] {
  if (fldStrKind === 'set') {
    if (
      !fldObjTree.fldArrSets.some(
        fldObjSet => fldObjSet.fldStrId === fldStrBranchId,
      )
    ) {
      throw new Error('Logosphere BITS: demo export set is unknown.');
    }
    return fldObjTree.fldArrProducts
      .filter(fldObjProduct => fldObjProduct.fldStrSetId === fldStrBranchId)
      .map(fldObjProduct => fldObjProduct.fldStrId);
  }
  const fldObjChildren = new Map<string, string[]>();
  const fldObjKnown = new Set<string>();
  for (const fldObjNode of fldObjTree.fldArrNodes) {
    fldObjKnown.add(fldObjNode.fldStrId);
    if (fldObjNode.fldStrParentId !== null) {
      const fldArrSiblings =
        fldObjChildren.get(fldObjNode.fldStrParentId) ?? [];
      fldArrSiblings.push(fldObjNode.fldStrId);
      fldObjChildren.set(fldObjNode.fldStrParentId, fldArrSiblings);
    }
  }
  if (!fldObjKnown.has(fldStrBranchId)) {
    throw new Error('Logosphere BITS: demo export collection is unknown.');
  }
  const fldObjScope = new Set<string>([fldStrBranchId]);
  const fldArrStack = [fldStrBranchId];
  while (fldArrStack.length > 0) {
    const fldStrCurrent = fldArrStack.pop() as string;
    for (const fldStrChild of fldObjChildren.get(fldStrCurrent) ?? []) {
      if (!fldObjScope.has(fldStrChild)) {
        fldObjScope.add(fldStrChild);
        fldArrStack.push(fldStrChild);
      }
    }
  }
  return fldObjTree.fldArrProducts
    .filter(fldObjProduct => fldObjScope.has(fldObjProduct.fldStrCollectionId))
    .map(fldObjProduct => fldObjProduct.fldStrId);
}

export async function srvApiCollectExportProductIds(
  fldObjClient: SupabaseClient,
  fldStrSubject: fldStrExportSubject,
  fldStrSubjectId: string,
): Promise<string[]> {
  if (fldStrSubjectId.trim() === '') {
    throw new Error('Logosphere BITS: demo export subject ID is blank.');
  }
  if (fldStrSubject === 'product') {
    return [fldStrSubjectId];
  }
  const fldObjWorkspace = await srvApiGetDemoWorkspace(fldObjClient);
  const fldObjTree = await srvApiGetDemoMoveTree(
    fldObjClient,
    fldObjWorkspace.fldStrId,
  );
  return fncRunBranchProductIds(fldStrSubjectId, fldStrSubject, fldObjTree);
}

export async function srvApiFetchExportRows(
  fldObjClient: SupabaseClient,
  fldArrProductIds: string[],
): Promise<Record<string, string>[]> {
  const fldArrRows: Record<string, string>[] = [];
  for (const fldStrProductId of fldArrProductIds) {
    const fldObjDetails = await srvApiGetDemoProductDetails(
      fldObjClient,
      fldStrProductId,
    );
    fldArrRows.push(fncConvDetailsToExportRow(fldObjDetails));
  }
  return fldArrRows;
}

function fncConvFileStamp(fldObjNow: Date): string {
  const fldStrPad = (fldNumValue: number): string =>
    String(fldNumValue).padStart(2, '0');
  return (
    `${fldObjNow.getFullYear()}${fldStrPad(fldObjNow.getMonth() + 1)}` +
    `${fldStrPad(fldObjNow.getDate())}-${fldStrPad(fldObjNow.getHours())}` +
    `${fldStrPad(fldObjNow.getMinutes())}${fldStrPad(fldObjNow.getSeconds())}`
  );
}

function fncConvCsvCell(fldStrValue: string): string {
  if (!/[",\n\r]/.test(fldStrValue)) {
    return fldStrValue;
  }
  return `"${fldStrValue.replace(/"/g, '""')}"`;
}

export function fncConvRowsToExportCsv(
  fldArrRows: Record<string, string>[],
): string {
  const fldArrLines = [
    fldArrExportColumns.map(fncConvCsvCell).join(','),
    ...fldArrRows.map(fldObjRow =>
      fldArrExportColumns
        .map(fldStrColumn => fncConvCsvCell(fldObjRow[fldStrColumn] ?? ''))
        .join(','),
    ),
  ];
  return `\uFEFF${fldArrLines.join('\r\n')}`;
}

export function srvApiBuildExportFile(
  fldArrRows: Record<string, string>[],
  fldStrSubject: fldStrExportSubject,
  fldObjNow: Date = new Date(),
): fldObjExportFile {
  const fldStrFileSubject =
    fldStrSubject === 'product' ? 'item' : fldStrSubject;
  return {
    fldStrCsv: fncConvRowsToExportCsv(fldArrRows),
    fldStrFileName: `bits-${fldStrFileSubject}-export-${fncConvFileStamp(
      fldObjNow,
    )}.csv`,
    fldStrMime: fldStrExportMime,
  };
}

export async function srvApiSaveExportFile(
  fldObjFile: fldObjExportFile,
): Promise<string> {
  const fldStrDir = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fldStrExportDirName}`;
  if (!(await ReactNativeBlobUtil.fs.exists(fldStrDir))) {
    await ReactNativeBlobUtil.fs.mkdir(fldStrDir);
  }
  const fldStrPath = `${fldStrDir}/${fldObjFile.fldStrFileName}`;
  await ReactNativeBlobUtil.fs.writeFile(
    fldStrPath,
    fldObjFile.fldStrCsv,
    'utf8',
  );
  const fldStrUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
    {
      name: fldObjFile.fldStrFileName,
      parentFolder: '',
      mimeType: fldObjFile.fldStrMime,
    },
    'Download',
    fldStrPath,
  );
  return fldStrUri;
}

export async function srvApiExportAndSave(
  fldObjClient: SupabaseClient,
  fldStrSubject: fldStrExportSubject,
  fldStrSubjectId: string,
): Promise<fldObjExportResult> {
  const fldArrProductIds = await srvApiCollectExportProductIds(
    fldObjClient,
    fldStrSubject,
    fldStrSubjectId,
  );
  if (fldArrProductIds.length === 0) {
    return { fldStrOutcome: 'empty', fldStrFileName: null };
  }
  const fldArrRows = await srvApiFetchExportRows(
    fldObjClient,
    fldArrProductIds,
  );
  const fldObjFile = srvApiBuildExportFile(fldArrRows, fldStrSubject);
  await srvApiSaveExportFile(fldObjFile);
  return { fldStrOutcome: 'saved', fldStrFileName: fldObjFile.fldStrFileName };
}
