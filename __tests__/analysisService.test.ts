/**
 * Logosphere BITS — analysis service tests (run/save mapping).
 *
 * The fake client answers functions.invoke; no network runs.
 * Run answers map the extended fields (price confidence,
 * basis, error, per-photo evidence, duplicate rationale)
 * with honest legacy defaults, and save carries the set
 * name plus the returned set id.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  srvApiRunAnalysis,
  srvApiSaveAnalysisRun,
} from '../src/services/srvAnalysis';

function fncConvClient(fldObjData: unknown) {
  const fldObjInvoke = jest.fn().mockResolvedValue({
    data: fldObjData,
    error: null,
  });
  return {
    fldObjInvoke,
    fldObjClient: {
      functions: { invoke: fldObjInvoke },
    } as unknown as SupabaseClient,
  };
}

function fncConvRunAnswer(): Record<string, unknown> {
  return {
    status: 'ok',
    mode: 'multiProduct',
    results: [
      {
        photo_ids: ['photo-a'],
        biblio: { title: 'The Demo Codex' },
        price: {
          replacement_new: 1200,
          market_min: null,
          market_max: null,
          market_median: null,
          market_recommended: 900,
          currency: 'USD',
          confidence: 0.4,
          basis: 'ai-estimate',
          error: null,
        },
        evidence: [
          {
            photo_id: 'photo-a',
            voice_text: 'No pencil marks',
            catalog: {
              source: 'openlibrary',
              reason: null,
              record: { title: 'The Demo Codex' },
            },
          },
        ],
        duplicate: {
          merged_from: [0, 1],
          reason: 'Same ISBN',
          confidence: 0.9,
        },
      },
    ],
    sources: [{ source: 'device-photo', detail: '2 draft photos' }],
  };
}

describe('analysis service', () => {
  it('maps the extended run fields', async () => {
    const { fldObjClient } = fncConvClient(fncConvRunAnswer());
    const fldObjPayload = await srvApiRunAnalysis(
      fldObjClient,
      'session-1',
      'run-1',
    );

    expect(fldObjPayload.fldStrMode).toBe('multiProduct');
    const fldObjItem = fldObjPayload.fldArrResults[0];
    if (fldObjItem === undefined) {
      throw new Error('Logosphere BITS: run answer was not mapped.');
    }
    expect(fldObjItem.fldObjPrice.fldNumConfidence).toBe(0.4);
    expect(fldObjItem.fldObjPrice.fldStrBasis).toBe('ai-estimate');
    expect(fldObjItem.fldObjPrice.fldStrError).toBeNull();
    expect(fldObjItem.fldObjPrice.fldNumMarketMin).toBeNull();
    expect(fldObjItem.fldArrEvidence).toEqual([
      {
        fldStrPhotoId: 'photo-a',
        fldStrVoiceText: 'No pencil marks',
        fldObjCatalog: {
          fldStrSource: 'openlibrary',
          fldStrReason: null,
          fldStrRecordTitle: 'The Demo Codex',
        },
      },
    ]);
    expect(fldObjItem.fldObjDuplicate).toEqual({
      fldArrMergedFrom: [0, 1],
      fldStrReason: 'Same ISBN',
      fldNumConfidence: 0.9,
    });
  });

  it('defaults legacy run answers honestly', async () => {
    const fldObjAnswer = fncConvRunAnswer();
    const fldObjResult = (
      fldObjAnswer.results as Record<string, unknown>[]
    )[0] as Record<string, unknown>;
    fldObjResult.price = { replacement_new: 1200, currency: 'USD' };
    delete fldObjResult.evidence;
    delete fldObjResult.duplicate;
    const { fldObjClient } = fncConvClient(fldObjAnswer);
    const fldObjPayload = await srvApiRunAnalysis(
      fldObjClient,
      'session-1',
      'run-1',
    );

    const fldObjItem = fldObjPayload.fldArrResults[0];
    if (fldObjItem === undefined) {
      throw new Error('Logosphere BITS: run answer was not mapped.');
    }
    expect(fldObjItem.fldObjPrice.fldNumConfidence).toBeNull();
    expect(fldObjItem.fldObjPrice.fldStrBasis).toBe('estimate');
    expect(fldObjItem.fldArrEvidence).toEqual([]);
    expect(fldObjItem.fldObjDuplicate).toBeNull();
  });

  it('maps observations, AI bands, and review flags', async () => {
    const fldObjAnswer = fncConvRunAnswer();
    const fldObjResult = (
      fldObjAnswer.results as Record<string, unknown>[]
    )[0] as Record<string, unknown>;
    fldObjResult.price = {
      ...(fldObjResult.price as Record<string, unknown>),
      basis: 'observed',
      observations: [
        {
          amount_minor: 43470,
          currency: 'TRY',
          usd_minor: 1250,
          source: 'kitapyurdu',
          url: 'https://shop.test/ky-1',
          market: 'new',
          observed_at: '2026-11-04T10:00:00.000Z',
          rate: 0.02875,
          rate_date: '2026-11-03',
        },
        { broken: true },
      ],
      ai_estimate: {
        replacement_new: 1999,
        market_min: 500,
        market_max: null,
        market_median: null,
        market_recommended: null,
        currency: 'USD',
        confidence: 0.5,
      },
    };
    fldObjResult.needs_review = ['no-catalog-source', 7, ''];
    const { fldObjClient } = fncConvClient(fldObjAnswer);
    const fldObjPayload = await srvApiRunAnalysis(
      fldObjClient,
      'session-1',
      'run-1',
    );

    const fldObjItem = fldObjPayload.fldArrResults[0];
    if (fldObjItem === undefined) {
      throw new Error('Logosphere BITS: run answer was not mapped.');
    }
    expect(fldObjItem.fldObjPrice.fldStrBasis).toBe('observed');
    expect(fldObjItem.fldObjPrice.fldArrObservations).toEqual([
      {
        fldNumAmountMinor: 43470,
        fldStrCurrency: 'TRY',
        fldNumUsdMinor: 1250,
        fldStrSource: 'kitapyurdu',
        fldStrUrl: 'https://shop.test/ky-1',
        fldStrMarket: 'new',
        fldStrObservedAt: '2026-11-04T10:00:00.000Z',
        fldNumRate: 0.02875,
        fldStrRateDate: '2026-11-03',
      },
    ]);
    expect(fldObjItem.fldObjPrice.fldObjAiEstimate).toEqual({
      fldNumReplacementNew: 1999,
      fldNumMarketMin: 500,
      fldNumMarketMax: null,
      fldNumMarketMedian: null,
      fldNumMarketRecommended: null,
      fldStrCurrency: 'USD',
      fldNumConfidence: 0.5,
    });
    expect(fldObjItem.fldArrNeedsReview).toEqual(['no-catalog-source']);
  });

  it('defaults missing price research fields honestly', async () => {
    const fldObjAnswer = fncConvRunAnswer();
    const fldObjResult = (
      fldObjAnswer.results as Record<string, unknown>[]
    )[0] as Record<string, unknown>;
    delete fldObjResult.needs_review;
    const { fldObjClient } = fncConvClient(fldObjAnswer);
    const fldObjPayload = await srvApiRunAnalysis(
      fldObjClient,
      'session-1',
      'run-1',
    );

    const fldObjItem = fldObjPayload.fldArrResults[0];
    if (fldObjItem === undefined) {
      throw new Error('Logosphere BITS: run answer was not mapped.');
    }
    expect(fldObjItem.fldObjPrice.fldArrObservations).toEqual([]);
    expect(fldObjItem.fldObjPrice.fldObjAiEstimate).toEqual({
      fldNumReplacementNew: null,
      fldNumMarketMin: null,
      fldNumMarketMax: null,
      fldNumMarketMedian: null,
      fldNumMarketRecommended: null,
      fldStrCurrency: 'USD',
      fldNumConfidence: null,
    });
    expect(fldObjItem.fldArrNeedsReview).toEqual([]);
  });

  it('saves with the set name and returns the set id', async () => {
    const { fldObjClient, fldObjInvoke } = fncConvClient({
      status: 'ok',
      product_ids: ['prod-1', 'prod-2'],
      set_id: 'set-1',
    });
    const fldObjDone = await srvApiSaveAnalysisRun(
      fldObjClient,
      'session-1',
      'run-1',
      'Boxed Trilogy',
    );

    expect(fldObjInvoke).toHaveBeenCalledWith('bits-analysis-save', {
      body: {
        session_id: 'session-1',
        run_id: 'run-1',
        new_set_name: 'Boxed Trilogy',
      },
    });
    expect(fldObjDone).toEqual({
      fldArrProductIds: ['prod-1', 'prod-2'],
      fldStrSetId: 'set-1',
    });
  });

  it('sends no set name for plain saves', async () => {
    const { fldObjClient, fldObjInvoke } = fncConvClient({
      status: 'ok',
      product_ids: ['prod-1'],
      set_id: null,
    });
    const fldObjDone = await srvApiSaveAnalysisRun(
      fldObjClient,
      'session-1',
      'run-1',
      null,
    );

    expect(fldObjInvoke).toHaveBeenCalledWith('bits-analysis-save', {
      body: {
        session_id: 'session-1',
        run_id: 'run-1',
        new_set_name: null,
      },
    });
    expect(fldObjDone.fldStrSetId).toBeNull();
  });
});
