// Reply to an Instagram comment via NovinHub. Accepts provider_comment_id directly (no DB lookup).
import { nhFetch } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { provider_comment_id, text } = await req.json();
    if (!provider_comment_id || !text) {
      return new Response(JSON.stringify({ error: 'provider_comment_id and text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await nhFetch(`/comment/${provider_comment_id}/reply`, {
      method: 'POST', body: JSON.stringify({ text }),
    }).catch(async () => {
      return await nhFetch(`/comment/${provider_comment_id}/answer`, {
        method: 'POST', body: JSON.stringify({ text }),
      });
    });

    return new Response(JSON.stringify({ ok: true, res }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
