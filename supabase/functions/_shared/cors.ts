// Logosphere BITS — edge JSON + CORS envelope (shared).
// Every function answers OPTIONS with the CORS preflight and
// wraps bodies as UTF-8 JSON. Identifiers follow D6.

export const fldObjCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

export function fncConvJsonResponse(
  fldObjBody: unknown,
  fldNumStatus = 200,
): Response {
  return new Response(JSON.stringify(fldObjBody), {
    status: fldNumStatus,
    headers: { ...fldObjCorsHeaders, 'Content-Type': 'application/json' },
  });
}

export function fncRunPreflightResponse(): Response {
  return new Response('ok', { headers: fldObjCorsHeaders });
}
