// One-shot helper to register the bot webhook with Telegram.
// Call: GET /functions/v1/telegram-set-webhook
import { sendMessage } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  if (!BOT_TOKEN) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: SECRET,
      allowed_updates: ['message', 'edited_message', 'callback_query'],
      drop_pending_updates: true,
    }),
  });
  const data = await res.json();

  // Also fetch webhook info for confirmation
  const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`).then(r => r.json());

  return new Response(JSON.stringify({ setWebhook: data, info, webhookUrl }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
