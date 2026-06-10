// Verify the 6-digit code typed by the user. If account is new, return needs_contact
// so the frontend can collect phone/email and trigger a second OTP via SMS or email.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { token, code } = await req.json().catch(() => ({}));
    if (!token || !code) return json({ error: 'token and code are required' });

    const { data: row } = await supabase
      .from('telegram_login_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (!row) return json({ error: 'invalid_token' });
    if (new Date(row.expires_at) < new Date()) return json({ error: 'expired' });
    if (!row.telegram_chat_id) return json({ error: 'not_bound_yet' });
    if (!row.otp_code || row.otp_code !== String(code).trim()) return json({ error: 'invalid_code' });

    // Find existing user by telegram_chat_id
    const { data: user } = await supabase
      .from('chat_users')
      .select('*')
      .eq('telegram_chat_id', row.telegram_chat_id)
      .maybeSingle();

    if (!user) {
      // New account → need phone (+ email for non-Iranian). Don't create yet.
      return json({
        needs_contact: true,
        first_name: row.first_name,
        telegram_username: row.telegram_username,
        phone_from_telegram: row.pending_phone && row.phone_verified ? row.pending_phone : null,
        country_code_from_telegram: row.pending_country_code,
      });
    }

    // Sync username if changed
    if (row.telegram_username && row.telegram_username !== user.telegram_username) {
      await supabase.from('chat_users')
        .update({ telegram_username: row.telegram_username })
        .eq('id', user.id);
    }

    // Existing user → issue session right away
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const { error: sErr } = await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token: sessionToken,
      is_active: true,
      last_activity: new Date().toISOString(),
    });
    if (sErr) return json({ error: sErr.message });

    await supabase.from('telegram_login_tokens')
      .update({ verified: true, otp_code: null, updated_at: new Date().toISOString() })
      .eq('token', token);

    return json({
      sessionToken,
      user: {
        id: user.id, name: user.name, first_name: user.first_name, last_name: user.last_name,
        email: user.email, phone: user.phone, country_code: user.country_code,
        username: user.username, telegram_chat_id: user.telegram_chat_id,
        telegram_username: user.telegram_username,
      },
    });
  } catch (e) {
    console.error('telegram-otp-verify exception', e);
    return json({ error: String((e as Error).message ?? e) });
  }
});
