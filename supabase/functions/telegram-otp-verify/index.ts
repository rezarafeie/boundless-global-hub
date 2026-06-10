// Verify OTP code typed by the user; if account is new, create chat_users + academy_users and issue session.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  // Always return 200 so supabase.functions.invoke doesn't swallow the body as a non-2xx error;
  // clients should branch on `data.error` / `data.needs_email`.
  return new Response(JSON.stringify(data), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateUserId(supabase: any): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const id = String(Math.floor(Math.random() * 1e11)).padStart(11, '0');
    const { data } = await supabase.from('chat_users').select('id').eq('user_id', id).maybeSingle();
    if (!data) return id;
  }
  return String(Date.now()).slice(-11);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = await req.json().catch(() => ({}));
    const { token, code, email, firstName } = body as {
      token?: string; code?: string; email?: string; firstName?: string;
    };
    if (!token || !code) return json({ error: 'token and code are required' }, 400);

    const { data: row } = await supabase
      .from('telegram_login_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (!row) return json({ error: 'invalid_token' }, 400);
    if (new Date(row.expires_at) < new Date()) return json({ error: 'expired' }, 400);
    if (!row.telegram_chat_id) return json({ error: 'not_bound_yet' }, 400);
    if (!row.otp_code || row.otp_code !== code.trim()) return json({ error: 'invalid_code' }, 400);

    // Find existing user
    let { data: user } = await supabase
      .from('chat_users')
      .select('*')
      .eq('telegram_chat_id', row.telegram_chat_id)
      .maybeSingle();

    if (!user) {
      const fname = (firstName ?? row.first_name ?? row.telegram_username ?? 'Telegram User').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ needs_email: true, first_name: row.first_name, telegram_username: row.telegram_username }, 200);
      }
      // Check duplicate email
      const { data: existingByEmail } = await supabase
        .from('chat_users').select('id').eq('email', email).maybeSingle();
      if (existingByEmail) {
        return json({ error: 'email_in_use' }, 400);
      }
      const user_id = await generateUserId(supabase);
      const { data: inserted, error: insErr } = await supabase
        .from('chat_users')
        .insert({
          name: fname,
          first_name: fname,
          last_name: '',
          full_name: fname,
          email,
          phone: '',
          country_code: '+0',
          user_id,
          telegram_chat_id: row.telegram_chat_id,
          telegram_username: row.telegram_username ?? null,
          signup_source: 'telegram',
          is_approved: true,
          role: 'user',
        })
        .select()
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      user = inserted;

      // Also create academy_users row (best-effort)
      await supabase.from('academy_users').insert({
        first_name: fname, last_name: '', email, phone: '', role: 'student',
      });
    } else {
      // Sync username if changed
      if (row.telegram_username && row.telegram_username !== user.telegram_username) {
        await supabase.from('chat_users')
          .update({ telegram_username: row.telegram_username })
          .eq('id', user.id);
      }
    }

    // Create session
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const { error: sErr } = await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token: sessionToken,
      is_active: true,
      last_activity: new Date().toISOString(),
    });
    if (sErr) return json({ error: sErr.message }, 500);

    // Consume token
    await supabase.from('telegram_login_tokens')
      .update({ verified: true, otp_code: null, updated_at: new Date().toISOString() })
      .eq('token', token);

    return json({
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        country_code: user.country_code,
        username: user.username,
        telegram_chat_id: user.telegram_chat_id,
        telegram_username: user.telegram_username,
      },
    });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
