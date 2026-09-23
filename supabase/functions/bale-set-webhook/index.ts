// Registers the Bale bot webhook. Call: GET /functions/v1/bale-set-webhook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const BOT_TOKEN = Deno.env.get('BALE_BOT_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  if (!BOT_TOKEN) {
    return json({ error: 'BALE_BOT_TOKEN not configured' }, 400);
  }

  const webhookUrl = `${SUPABASE_URL}/functions/v1/bale-webhook`;
  const api = `https://tapi.bale.ai/bot${BOT_TOKEN}`;

  const setWebhook = await fetch(`${api}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  }).then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) }));

  const info = await fetch(`${api}/getWebhookInfo`).then((r) => r.json()).catch(() => null);
  const me = await fetch(`${api}/getMe`).then((r) => r.json()).catch(() => null);

  return json({ setWebhook, info, me, webhookUrl });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
