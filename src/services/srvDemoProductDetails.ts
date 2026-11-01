/**
 * Logosphere BITS — saved-product detail read (hermetic service).
 *
 * Composes one product's read-only detail from the demo-read
 * tables: the product row, its 1:1 bibliography (missing rows
 * stay all-null, never fabricated), contributors via the
 * person-role junction, ordered images with public bucket
 * URLs (cover is the lowest sort order), the latest price
 * estimate, all price observations (newest first), and the
 * latest sale row. Every amount stays minor-unit; null stays
 * null. Sources stay empty: waterfall evidence arrives with
 * a later step. Throws when the product id is blank, the
 * product is missing, or any read fails.
 * Naming follows D6 (srv / fld roots).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  fldObjBibliographicData,
  fldObjContributor,
  fldObjPriceObservation,
  fldObjPricing,
  fldObjProduct,
  fldObjProductDetails,
  fldObjProductImage,
  fldObjSaleStatus,
  fldStrPriceBasis,
} from '../types/typModels';

const fldStrPhotoBucket = 'product-photos';

type fldObjProductRow = {
  id: string;
  collection_id: string;
  set_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
};

type fldObjBibliographyRow = {
  title: string | null;
  subtitle: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher: string | null;
  publication_language: string | null;
  edition: string | null;
  printing: string | null;
  publication_year: number | null;
  original_publication_year: number | null;
  page_count: number | null;
  publication_type: string | null;
  description_text: string | null;
  description_original_language: string | null;
  description_text_tr: string | null;
  description_text_en: string | null;
  binding: string | null;
  dust_jacket: string | null;
  paper: string | null;
  dimensions: string | null;
  condition: string | null;
  signature: string | null;
  dedication: string | null;
};

type fldObjRoleRow = {
  role: string;
  sort_order: number;
  persons: { name: string } | { name: string }[] | null;
};

type fldObjImageRow = {
  id: string;
  sort_order: number;
  file_path: string;
  rotation_degrees: number;
};

type fldObjEstimateRow = {
  replacement_new: number | null;
  market_min: number | null;
  market_max: number | null;
  market_recommended: number | null;
  market_median: number | null;
  currency: string;
  price_basis: string | null;
  source_price: number | null;
  source_currency: string | null;
  rate_date: string | null;
};

type fldObjObservationRow = {
  id: string;
  amount: number;
  currency: string;
  observed_at: string | null;
  url: string | null;
  source_price: number | null;
  source_currency: string | null;
  rate_date: string | null;
};

type fldObjSaleRow = {
  id: string;
  tag_price: number | null;
  is_active: boolean;
  transaction_scope: string | null;
  transaction_at: string | null;
};

function fncRunIsRecord(
  fldObjValue: unknown,
): fldObjValue is Record<string, unknown> {
  return typeof fldObjValue === 'object' && fldObjValue !== null;
}

function fncRunIsProductRow(
  fldObjValue: unknown,
): fldObjValue is fldObjProductRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return (
    typeof fldObjValue.id === 'string' &&
    typeof fldObjValue.collection_id === 'string' &&
    typeof fldObjValue.name === 'string'
  );
}

function fncRunIsBibliographyRow(
  fldObjValue: unknown,
): fldObjValue is fldObjBibliographyRow {
  return fncRunIsRecord(fldObjValue);
}

function fncRunIsRoleRow(fldObjValue: unknown): fldObjValue is fldObjRoleRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return typeof fldObjValue.role === 'string';
}

function fncRunIsImageRow(fldObjValue: unknown): fldObjValue is fldObjImageRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return (
    typeof fldObjValue.id === 'string' &&
    typeof fldObjValue.file_path === 'string'
  );
}

function fncRunIsEstimateRow(
  fldObjValue: unknown,
): fldObjValue is fldObjEstimateRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return typeof fldObjValue.currency === 'string';
}

function fncRunIsObservationRow(
  fldObjValue: unknown,
): fldObjValue is fldObjObservationRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return (
    typeof fldObjValue.id === 'string' &&
    typeof fldObjValue.amount === 'number' &&
    typeof fldObjValue.currency === 'string'
  );
}

function fncRunIsSaleRow(fldObjValue: unknown): fldObjValue is fldObjSaleRow {
  if (!fncRunIsRecord(fldObjValue)) {
    return false;
  }
  return (
    typeof fldObjValue.id === 'string' &&
    typeof fldObjValue.is_active === 'boolean'
  );
}

function fncConvMinorOrNull(fldNumValue: number | null): number | null {
  if (fldNumValue === null) {
    return null;
  }
  return Number(fldNumValue);
}

function fncConvPriceBasis(
  fldStrValue: string | null,
): fldStrPriceBasis | null {
  if (fldStrValue === 'estimate' || fldStrValue === 'evidence') {
    return fldStrValue;
  }
  return null;
}

function fncConvEmptyBibliography(): fldObjBibliographicData {
  return {
    fldStrTitle: null,
    fldStrSubtitle: null,
    fldStrIsbn10: null,
    fldStrIsbn13: null,
    fldStrPublisher: null,
    fldStrPublicationLanguage: null,
    fldStrEdition: null,
    fldStrPrinting: null,
    fldNumPublicationYear: null,
    fldArrContributors: null,
    fldNumOriginalPublicationYear: null,
    fldNumPageCount: null,
    fldStrPublicationType: null,
    fldObjDescription: null,
    fldStrBinding: null,
    fldStrDustJacket: null,
    fldStrPaper: null,
    fldStrDimensions: null,
    fldStrCondition: null,
    fldStrSignature: null,
    fldStrDedication: null,
  };
}

function fncConvBibliography(
  fldObjRow: fldObjBibliographyRow,
  fldArrContributors: fldObjContributor[] | null,
): fldObjBibliographicData {
  const fldBooHasDescription =
    fldObjRow.description_text !== null ||
    fldObjRow.description_text_tr !== null ||
    fldObjRow.description_text_en !== null;
  return {
    fldStrTitle: fldObjRow.title,
    fldStrSubtitle: fldObjRow.subtitle,
    fldStrIsbn10: fldObjRow.isbn10,
    fldStrIsbn13: fldObjRow.isbn13,
    fldStrPublisher: fldObjRow.publisher,
    fldStrPublicationLanguage: fldObjRow.publication_language,
    fldStrEdition: fldObjRow.edition,
    fldStrPrinting: fldObjRow.printing,
    fldNumPublicationYear: fldObjRow.publication_year,
    fldArrContributors,
    fldNumOriginalPublicationYear: fldObjRow.original_publication_year,
    fldNumPageCount: fldObjRow.page_count,
    fldStrPublicationType: fldObjRow.publication_type,
    fldObjDescription: fldBooHasDescription
      ? {
          fldStrText: fldObjRow.description_text ?? '',
          fldStrOriginalLanguage: fldObjRow.description_original_language ?? '',
          fldStrTextTr: fldObjRow.description_text_tr,
          fldStrTextEn: fldObjRow.description_text_en,
        }
      : null,
    fldStrBinding: fldObjRow.binding,
    fldStrDustJacket: fldObjRow.dust_jacket,
    fldStrPaper: fldObjRow.paper,
    fldStrDimensions: fldObjRow.dimensions,
    fldStrCondition: fldObjRow.condition,
    fldStrSignature: fldObjRow.signature,
    fldStrDedication: fldObjRow.dedication,
  };
}

function fncConvContributorName(
  fldObjPersons: fldObjRoleRow['persons'],
): string | null {
  if (fldObjPersons === null) {
    return null;
  }
  if (Array.isArray(fldObjPersons)) {
    return fldObjPersons[0]?.name ?? null;
  }
  return fldObjPersons.name;
}

function fncConvStorageName(fldStrFilePath: string): string {
  const fldStrPrefix = `${fldStrPhotoBucket}/`;
  if (fldStrFilePath.startsWith(fldStrPrefix)) {
    return fldStrFilePath.slice(fldStrPrefix.length);
  }
  return fldStrFilePath;
}

function fncConvPricing(fldObjRow: fldObjEstimateRow): fldObjPricing {
  return {
    fldNumReplacementNew: fncConvMinorOrNull(fldObjRow.replacement_new),
    fldNumMarketMin: fncConvMinorOrNull(fldObjRow.market_min),
    fldNumMarketMax: fncConvMinorOrNull(fldObjRow.market_max),
    fldNumMarketRecommended: fncConvMinorOrNull(fldObjRow.market_recommended),
    fldNumMarketMedian: fncConvMinorOrNull(fldObjRow.market_median),
    fldStrCurrency: fldObjRow.currency,
    fldNumSourcePrice: fncConvMinorOrNull(fldObjRow.source_price),
    fldStrSourceCurrency: fldObjRow.source_currency,
    fldDatRateDate: fldObjRow.rate_date,
    fldStrPriceBasis: fncConvPriceBasis(fldObjRow.price_basis),
  };
}

function fncConvObservation(
  fldObjRow: fldObjObservationRow,
): fldObjPriceObservation {
  return {
    fldStrId: fldObjRow.id,
    fldNumAmount: Number(fldObjRow.amount),
    fldStrCurrency: fldObjRow.currency,
    fldDatObservedAt: fldObjRow.observed_at,
    fldStrUrl: fldObjRow.url,
    fldNumSourcePrice: fncConvMinorOrNull(fldObjRow.source_price),
    fldStrSourceCurrency: fldObjRow.source_currency,
    fldDatRateDate: fldObjRow.rate_date,
  };
}

function fncConvSaleStatus(fldObjRow: fldObjSaleRow): fldObjSaleStatus {
  return {
    fldNumTagPrice: fncConvMinorOrNull(fldObjRow.tag_price),
    fldBooIsActive: fldObjRow.is_active,
    fldStrTransactionScope: fldObjRow.transaction_scope,
    fldDatTransactionAt: fldObjRow.transaction_at,
    fldStrTransactionId: fldObjRow.id,
  };
}

export async function srvApiGetDemoProductDetails(
  fldObjClient: SupabaseClient,
  fldStrProductId: string,
): Promise<fldObjProductDetails> {
  if (fldStrProductId.trim() === '') {
    throw new Error('Logosphere BITS: demo product ID is missing or blank.');
  }
  const { data: fldObjProductData, error: fldObjProductError } =
    await fldObjClient
      .from('products')
      .select('id, collection_id, set_id, name, created_at, updated_at')
      .eq('id', fldStrProductId)
      .maybeSingle();
  if (fldObjProductError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(products read failed: ${fldObjProductError.message}).`,
    );
  }
  if (fldObjProductData === null) {
    throw new Error('Logosphere BITS: demo product is missing.');
  }
  if (!fncRunIsProductRow(fldObjProductData)) {
    throw new Error(
      'Logosphere BITS: product returned an unexpected shape ' +
        '(need id + collection + name).',
    );
  }

  const { data: fldObjBiblioData, error: fldObjBiblioError } =
    await fldObjClient
      .from('product_bibliography')
      .select(
        'title, subtitle, isbn10, isbn13, publisher, publication_language, ' +
          'edition, printing, publication_year, original_publication_year, ' +
          'page_count, publication_type, description_text, ' +
          'description_original_language, description_text_tr, ' +
          'description_text_en, binding, dust_jacket, paper, dimensions, ' +
          'condition, signature, dedication',
      )
      .eq('product_id', fldStrProductId)
      .maybeSingle();
  if (fldObjBiblioError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(bibliography read failed: ${fldObjBiblioError.message}).`,
    );
  }
  if (fldObjBiblioData !== null && !fncRunIsBibliographyRow(fldObjBiblioData)) {
    throw new Error(
      'Logosphere BITS: bibliography returned an unexpected shape ' +
        '(need a row object).',
    );
  }

  const { data: fldObjRoleRows, error: fldObjRoleError } = await fldObjClient
    .from('product_person_roles')
    .select('role, sort_order, persons ( name )')
    .eq('product_id', fldStrProductId)
    .order('sort_order', { ascending: true });
  if (fldObjRoleError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(contributors read failed: ${fldObjRoleError.message}).`,
    );
  }
  if (!Array.isArray(fldObjRoleRows)) {
    throw new Error(
      'Logosphere BITS: contributors returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrContributors: fldObjContributor[] | null = (() => {
    const fldArrMapped: fldObjContributor[] = [];
    for (const fldObjRow of fldObjRoleRows) {
      if (!fncRunIsRoleRow(fldObjRow)) {
        throw new Error(
          'Logosphere BITS: contributors returned an unexpected shape ' +
            '(need role rows).',
        );
      }
      const fldStrPerson = fncConvContributorName(fldObjRow.persons);
      if (fldStrPerson !== null && fldStrPerson !== '') {
        fldArrMapped.push({
          fldStrPerson,
          fldStrRole: fldObjRow.role,
        });
      }
    }
    return fldArrMapped.length === 0 ? null : fldArrMapped;
  })();

  const { data: fldObjImageRows, error: fldObjImageError } = await fldObjClient
    .from('product_images')
    .select('id, sort_order, file_path, rotation_degrees')
    .eq('product_id', fldStrProductId)
    .order('sort_order', { ascending: true });
  if (fldObjImageError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(images read failed: ${fldObjImageError.message}).`,
    );
  }
  if (!Array.isArray(fldObjImageRows)) {
    throw new Error(
      'Logosphere BITS: images returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrImages: fldObjProductImage[] = [];
  for (const fldObjRow of fldObjImageRows) {
    if (!fncRunIsImageRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: images returned an unexpected shape ' +
          '(need id + file path).',
      );
    }
    fldArrImages.push({
      fldStrId: fldObjRow.id,
      fldNumSortOrder: fldObjRow.sort_order,
      fldStrFilePath: fldObjRow.file_path,
      fldStrUrl: fldObjClient.storage
        .from(fldStrPhotoBucket)
        .getPublicUrl(fncConvStorageName(fldObjRow.file_path)).data.publicUrl,
      fldNumRotationDegrees: fldObjRow.rotation_degrees,
    });
  }

  const { data: fldObjEstimateRows, error: fldObjEstimateError } =
    await fldObjClient
      .from('price_estimates')
      .select(
        'replacement_new, market_min, market_max, market_recommended, ' +
          'market_median, currency, price_basis, source_price, ' +
          'source_currency, rate_date',
      )
      .eq('product_id', fldStrProductId)
      .order('created_at', { ascending: false })
      .limit(1);
  if (fldObjEstimateError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(estimates read failed: ${fldObjEstimateError.message}).`,
    );
  }
  if (!Array.isArray(fldObjEstimateRows)) {
    throw new Error(
      'Logosphere BITS: estimates returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldObjEstimateRow: unknown = fldObjEstimateRows[0];
  if (
    fldObjEstimateRow !== undefined &&
    !fncRunIsEstimateRow(fldObjEstimateRow)
  ) {
    throw new Error(
      'Logosphere BITS: estimates returned an unexpected shape ' +
        '(need currency).',
    );
  }
  const fldObjPricing: fldObjPricing | null =
    fldObjEstimateRow === undefined ? null : fncConvPricing(fldObjEstimateRow);

  const { data: fldObjObservationRows, error: fldObjObservationError } =
    await fldObjClient
      .from('price_observations')
      .select(
        'id, amount, currency, observed_at, url, source_price, ' +
          'source_currency, rate_date',
      )
      .eq('product_id', fldStrProductId)
      .order('created_at', { ascending: false });
  if (fldObjObservationError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(observations read failed: ${fldObjObservationError.message}).`,
    );
  }
  if (!Array.isArray(fldObjObservationRows)) {
    throw new Error(
      'Logosphere BITS: observations returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldArrObservations: fldObjPriceObservation[] = [];
  for (const fldObjRow of fldObjObservationRows) {
    if (!fncRunIsObservationRow(fldObjRow)) {
      throw new Error(
        'Logosphere BITS: observations returned an unexpected shape ' +
          '(need id + amount + currency).',
      );
    }
    fldArrObservations.push(fncConvObservation(fldObjRow));
  }

  const { data: fldObjSaleRows, error: fldObjSaleError } = await fldObjClient
    .from('sale_transactions')
    .select('id, tag_price, is_active, transaction_scope, transaction_at')
    .eq('product_id', fldStrProductId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (fldObjSaleError) {
    throw new Error(
      'Logosphere BITS: demo product details unavailable ' +
        `(sale read failed: ${fldObjSaleError.message}).`,
    );
  }
  if (!Array.isArray(fldObjSaleRows)) {
    throw new Error(
      'Logosphere BITS: sale rows returned an unexpected shape ' +
        '(need a row list).',
    );
  }
  const fldObjSaleRow: unknown = fldObjSaleRows[0];
  if (fldObjSaleRow !== undefined && !fncRunIsSaleRow(fldObjSaleRow)) {
    throw new Error(
      'Logosphere BITS: sale rows returned an unexpected shape ' +
        '(need id + active flag).',
    );
  }
  const fldObjSaleStatus: fldObjSaleStatus | null =
    fldObjSaleRow === undefined ? null : fncConvSaleStatus(fldObjSaleRow);

  const fldObjProduct: fldObjProduct = {
    fldStrId: fldObjProductData.id,
    fldStrName: fldObjProductData.name,
    fldDatCreatedAt: fldObjProductData.created_at,
    fldDatUpdatedAt: fldObjProductData.updated_at,
    fldStrCollectionId: fldObjProductData.collection_id,
    fldStrSetId: fldObjProductData.set_id,
    fldObjBibliographicData:
      fldObjBiblioData === null
        ? { ...fncConvEmptyBibliography(), fldArrContributors }
        : fncConvBibliography(fldObjBiblioData, fldArrContributors),
    fldObjPricing,
    fldObjSaleStatus,
  };
  return { fldObjProduct, fldArrImages, fldArrObservations };
}
