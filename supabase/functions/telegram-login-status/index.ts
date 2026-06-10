// Poll endpoint: returns whether the user opened the bot and bound their chat_id to the token.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data, error } = await supabase
      .from('telegram_login_tokens')
      .select('telegram_chat_id, telegram_username, first_name, expires_at, phone_verified, pending_phone, pending_country_code')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ bound: false, expired: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const expired = new Date(data.expires_at) < new Date();
    return new Response(JSON.stringify({
      bound: !!data.telegram_chat_id && !expired,
      expired,
      telegram_username: data.telegram_username,
      first_name: data.first_name,
      phone_verified: !!data.phone_verified,
      phone_from_telegram: data.phone_verified ? data.pending_phone : null,
      country_code_from_telegram: data.phone_verified ? data.pending_country_code : null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
