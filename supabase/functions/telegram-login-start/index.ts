// Create a one-time login token for the Telegram bot deep-link login flow.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Generate token (url-safe, ~22 chars)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    const { error } = await supabase.from('telegram_login_tokens').insert({ token });
    if (error) throw error;

    // Get bot username from admin_settings
    const { data: s } = await supabase
      .from('admin_settings')
      .select('telegram_bot_username')
      .eq('id', 1)
      .maybeSingle();
    const botUsername = ((s as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, '');
    const bot_url = `https://telegram.me/${botUsername}?start=login_${token}`;

    return new Response(JSON.stringify({ token, bot_url, bot_username: botUsername }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
