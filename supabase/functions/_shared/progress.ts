// Logosphere BITS — pipeline progress reporter (shared).
// Two targets, like the BASE waterfall logger: console lines
// (Supabase function logs, always) plus a Realtime broadcast
// to bits-pipeline:<run_id> (fire-and-forget, flushed before
// the response returns). Identifiers follow D6.

export type fldStrPipelineEvent =
  | 'start'
  | 'ok'
  | 'skip'
  | 'error'
  | 'done';

export type fldObjProgressEmit = {
  fldStrStage: string;
  fldStrEvent: fldStrPipelineEvent;
  fldNumMs?: number;
  fldStrDetail?: string;
  fldNumIndex?: number;
  fldNumTotal?: number;
};

export type fldObjProgress = {
  emit: (fldObjEvent: fldObjProgressEmit) => void;
  flush: () => Promise<void>;
};

export function fncConvProgress(fldStrRunId: string): fldObjProgress {
  const fldStrUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const fldStrKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const fldBooCanBroadcast = fldStrUrl !== '' && fldStrKey !== '';
  const fldStrTopic = `bits-pipeline:${fldStrRunId}`;
  const fldArrPending: Promise<unknown>[] = [];
  let fldNumSeq = 0;

  function emit(fldObjEvent: fldObjProgressEmit): void {
    fldNumSeq += 1;
    const fldObjPayload = {
      run_id: fldStrRunId,
      seq: fldNumSeq,
      ts: Date.now(),
      stage: fldObjEvent.fldStrStage,
      event: fldObjEvent.fldStrEvent,
      ms: fldObjEvent.fldNumMs,
      detail: fldObjEvent.fldStrDetail,
      item_index: fldObjEvent.fldNumIndex,
      item_total: fldObjEvent.fldNumTotal,
    };
    console.log(`[bits-pipeline] ${JSON.stringify(fldObjPayload)}`);
    if (!fldBooCanBroadcast) {
      return;
    }
    const fldObjSend = fetch(`${fldStrUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: fldStrKey,
        Authorization: `Bearer ${fldStrKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: fldStrTopic,
            event: 'step',
            payload: fldObjPayload,
            private: false,
          },
        ],
      }),
    }).catch(() => undefined);
    fldArrPending.push(fldObjSend);
  }

  async function flush(): Promise<void> {
    if (fldArrPending.length > 0) {
      await Promise.allSettled(fldArrPending);
    }
  }

  return { emit, flush };
}
