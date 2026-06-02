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
  const RAW_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  if (!BOT_TOKEN) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Telegram only allows [A-Za-z0-9_-], 1-256 chars. Sanitize the secret.
  let SECRET = RAW_SECRET.replace(/[^A-Za-z0-9_-]/g, '');
  if (SECRET.length < 1) {
    // Derive a safe deterministic secret from the bot token if none configured
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('webhook:' + BOT_TOKEN));
    SECRET = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);
  }
  if (SECRET.length > 256) SECRET = SECRET.slice(0, 256);

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
