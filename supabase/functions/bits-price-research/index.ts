// ============================================================
// EDGE FUNCTION: bits-price-research
// Logosphere BITS Â· standalone estimate writer.
//
// Researches one saved product's used-market bands with Muse
// (model knowledge only, no web access, USD) and appends
// the estimate row with the ai-estimate basis. Rows are
// append-only: readers always take the latest, so research
// never rewrites history.
// ============================================================

import { fncConvServiceClient, fncRunAuthorizeDemo } from '../_shared/auth.ts';
import {
  fncConvJsonResponse,
  fncRunPreflightResponse,
} from '../_shared/cors.ts';
import { fncConvPricePrompt } from '../_shared/prompts.ts';
import type { fldObjMuseResult } from '../_shared/prompts.ts';
import { fncConvCleanPriceBands } from '../_shared/mapping.ts';
import { fncRunChainJson } from '../_shared/providers.ts';
import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

type fldObjResearchRequest = {
  session_id: unknown;
  product_id: unknown;
};

export async function fncRunHandleRequest(
  fldObjRequest: Request,
  fldObjInjectedClient?: SupabaseClient,
): Promise<Response> {
  if (fldObjRequest.method === 'OPTIONS') {
    return fncRunPreflightResponse();
  }
  try {
    const fldObjBody = (await fldObjRequest.json()) as fldObjResearchRequest;
    const fldStrSessionId = typeof fldObjBody.session_id === 'string'
      ? fldObjBody.session_id
      : '';
    const fldStrProductId = typeof fldObjBody.product_id === 'string'
      ? fldObjBody.product_id.trim()
      : '';
    if (fldStrProductId === '') {
      return fncConvJsonResponse(
        { status: 'error', error: 'Invalid research request.' },
        400,
      );
    }
    const fldObjClient = fldObjInjectedClient ?? fncConvServiceClient();
    await fncRunAuthorizeDemo(fldObjClient, fldStrSessionId, 'price', 'item');
    const { data: fldObjProduct, error: fldObjProductError } =
      await fldObjClient
        .from('products')
        .select('id, name')
        .eq('id', fldStrProductId)
        .maybeSingle();
    if (fldObjProductError || fldObjProduct === null) {
      return fncConvJsonResponse(
        { status: 'error', error: 'Unknown product.' },
        404,
      );
    }
    const { data: fldObjBiblio, error: fldObjBiblioError } = await fldObjClient
      .from('product_bibliography')
      .select(
        'title, publisher, publication_year, edition, condition, binding',
      )
      .eq('product_id', fldStrProductId)
      .maybeSingle();
    if (fldObjBiblioError) {
      throw new Error(
        `Logosphere BITS: bibliography read failed (${fldObjBiblioError.message}).`,
      );
    }
    const { data: fldArrRoles, error: fldObjRolesError } = await fldObjClient
      .from('product_person_roles')
      .select('role, persons ( name )')
      .eq('product_id', fldStrProductId)
      .order('sort_order', { ascending: true });
    if (fldObjRolesError) {
      throw new Error(
        `Logosphere BITS: contributors read failed (${fldObjRolesError.message}).`,
      );
    }
    const fldArrContributors: { name: string | null; role: string | null }[] =
      [];
    if (Array.isArray(fldArrRoles)) {
      for (
        const fldObjRow of fldArrRoles as {
          role: string;
          persons: { name: string } | { name: string }[] | null;
        }[]
      ) {
        const fldObjPersons = fldObjRow.persons;
        const fldStrName = Array.isArray(fldObjPersons)
          ? fldObjPersons[0]?.name ?? null
          : fldObjPersons?.name ?? null;
        if (fldStrName !== null) {
          fldArrContributors.push({ name: fldStrName, role: fldObjRow.role });
        }
      }
    }
    const fldObjSeed = (fldObjBiblio ?? {}) as Record<string, unknown>;
    const fldObjResultSeed = {
      title: (fldObjSeed.title as string | null) ?? null,
      contributors: fldArrContributors,
      publisher: (fldObjSeed.publisher as string | null) ?? null,
      publication_year: (fldObjSeed.publication_year as number | null) ?? null,
      edition: (fldObjSeed.edition as string | null) ?? null,
      condition: (fldObjSeed.condition as string | null) ?? null,
      binding: (fldObjSeed.binding as string | null) ?? null,
    };
    const fldObjAnswer = await fncRunChainJson<unknown>(
      fncConvPricePrompt(fldObjResultSeed as unknown as fldObjMuseResult),
      4000,
      'text',
    );
    const fldObjBands = fncConvCleanPriceBands(fldObjAnswer);
    const { data: fldObjInserted, error: fldObjInsertError } =
      await fldObjClient
        .from('price_estimates')
        .insert({
          product_id: fldStrProductId,
          replacement_new: fldObjBands.replacement_new,
          market_min: fldObjBands.market_min,
          market_max: fldObjBands.market_max,
          market_recommended: fldObjBands.market_recommended,
          market_median: fldObjBands.market_median,
          currency: fldObjBands.currency,
          price_basis: 'ai-estimate',
          source_price: null,
          source_currency: null,
          rate_date: null,
        })
        .select(
          'replacement_new, market_min, market_max, market_recommended, market_median, currency, price_basis',
        )
        .maybeSingle();
    if (fldObjInsertError || fldObjInserted === null) {
      throw new Error(
        `Logosphere BITS: estimate insert failed (${
          fldObjInsertError?.message ?? 'missing'
        }).`,
      );
    }
    return fncConvJsonResponse({
      status: 'ok',
      product_id: fldStrProductId,
      estimate: fldObjInserted,
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
