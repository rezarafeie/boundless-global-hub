// Two-step registration finalization for Telegram login.
// mode=send_otp: requires phone+countryCode (+ email for non +98). If the Telegram bot
//   already collected a contact (phone_verified=true) we skip OTP and create the user.
//   Otherwise we generate a 6-digit code and send SMS (Kavenegar for +98) or email (Gmail).
// mode=verify_otp: validates the code we just sent and creates the user + session.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GMAIL_CLIENT_ID = '242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com';
const GMAIL_CLIENT_SECRET = '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';
const KAVENEGAR_KEY = '2F4B6676516B71793064726B626D644153507A55504C4D61776B6A31613858706A6E473952616F766477343D';

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizePhone(phone: string, countryCode: string): string {
  let clean = String(phone).replace(/\s|-/g, '');
  if (countryCode === '+98' && clean.startsWith('0')) clean = clean.slice(1);
  if (clean.startsWith('+')) clean = clean.slice(1);
  if (clean.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${clean.slice(countryCode.length - 1)}`;
  }
  return `${countryCode}${clean}`;
}

async function generateUserId(supabase: any): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const id = String(Math.floor(Math.random() * 1e11)).padStart(11, '0');
    const { data } = await supabase.from('chat_users').select('id').eq('user_id', id).maybeSingle();
    if (!data) return id;
  }
  return String(Date.now()).slice(-11);
}

async function sendSmsOtp(formattedPhone: string, code: string) {
  // Iran format: Kavenegar expects 9xxxxxxxxx; we already normalized to +98XXXXXXXXXX
  const receptor = formattedPhone.replace(/^\+98/, '');
  const url = `https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/verify/lookup.json?receptor=${receptor}&token=${code}&template=academylogin`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(`Kavenegar failed: ${JSON.stringify(data)}`);
  return data;
}

async function sendEmailOtp(supabase: any, email: string, name: string, code: string) {
  const { data: creds } = await supabase.from('gmail_credentials').select('*').limit(1).maybeSingle();
  if (!creds) throw new Error('email_provider_not_configured');

  let accessToken = creds.access_token;
  if (new Date() >= new Date(creds.token_expires_at)) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: creds.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const refresh = await r.json();
    if (!r.ok) throw new Error(`Token refresh failed: ${JSON.stringify(refresh)}`);
    accessToken = refresh.access_token;
    await supabase.from('gmail_credentials').update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + refresh.expires_in * 1000).toISOString(),
    }).eq('id', creds.id);
  }

  const subject = `Your Rafiei Academy verification code: ${code}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px">
      <h2 style="margin:0 0 16px;color:#111">Rafiei Academy verification</h2>
      <p style="color:#444">Hi ${name || 'there'}, use this one-time code to finish signing in:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;padding:16px;background:#fff;border-radius:8px;margin:16px 0">
        ${code}
      </div>
      <p style="color:#888;font-size:12px">The code expires in 10 minutes. If you didn't request this, ignore the email.</p>
    </div>`;
  const raw = `From: Rafiei Academy <${creds.email_address}>\r\nTo: ${email}\r\nSubject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`;
  const base64 = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_');
  const send = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64 }),
  });
  if (!send.ok) throw new Error(`Gmail send failed: ${await send.text()}`);
}

async function createUserAndSession(supabase: any, row: any) {
  const fname = (row.pending_first_name || row.first_name || row.telegram_username || 'Telegram User').trim();
  const email = row.pending_email || null;
  const phone = row.pending_phone!;
  const country = row.pending_country_code || '+0';

  // Duplicate checks
  if (email) {
    const { data: byEmail } = await supabase.from('chat_users').select('id').eq('email', email).maybeSingle();
    if (byEmail) return { error: 'email_in_use' };
  }
  const { data: byPhone } = await supabase.from('chat_users').select('id').eq('phone', phone).maybeSingle();
  if (byPhone) return { error: 'phone_in_use' };

  const user_id = await generateUserId(supabase);
  const { data: inserted, error: insErr } = await supabase
    .from('chat_users')
    .insert({
      name: fname, first_name: fname, last_name: '', full_name: fname,
      email, phone, country_code: country, user_id,
      telegram_chat_id: row.telegram_chat_id,
      telegram_username: row.telegram_username ?? null,
      signup_source: 'telegram',
      is_approved: true,
      role: 'user',
    })
    .select()
    .single();
  if (insErr) {
    console.error('chat_users insert failed', insErr);
    return { error: insErr.message };
  }
  const user = inserted;

  if (email) {
    const { error: acadErr } = await supabase.from('academy_users').insert({
      first_name: fname, last_name: '', email, phone, role: 'student',
    });
    if (acadErr) console.error('academy_users insert failed (non-fatal)', acadErr);
  }

  const sessionToken = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const { error: sErr } = await supabase.from('user_sessions').insert({
    user_id: user.id, session_token: sessionToken, is_active: true,
    last_activity: new Date().toISOString(),
  });
  if (sErr) return { error: sErr.message };

  await supabase.from('telegram_login_tokens').update({
    verified: true, otp_code: null, contact_otp_code: null,
    updated_at: new Date().toISOString(),
  }).eq('token', row.token);

  return {
    sessionToken,
    user: {
      id: user.id, name: user.name, first_name: user.first_name, last_name: user.last_name,
      email: user.email, phone: user.phone, country_code: user.country_code,
      username: user.username, telegram_chat_id: user.telegram_chat_id,
      telegram_username: user.telegram_username,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = await req.json().catch(() => ({}));
    const { mode, token } = body as { mode?: string; token?: string };
    if (!token) return json({ error: 'token required' });

    const { data: row } = await supabase
      .from('telegram_login_tokens').select('*').eq('token', token).maybeSingle();
    if (!row) return json({ error: 'invalid_token' });
    if (new Date(row.expires_at) < new Date()) return json({ error: 'expired' });
    if (!row.telegram_chat_id) return json({ error: 'not_bound_yet' });

    if (mode === 'send_otp') {
      const { phone, countryCode, email, firstName } = body as {
        phone?: string; countryCode?: string; email?: string; firstName?: string;
      };
      if (!phone || !countryCode || !firstName) return json({ error: 'missing_fields' });
      const isIran = countryCode === '+98';
      if (!isIran) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ error: 'invalid_email' });
        }
      }
      const formattedPhone = normalizePhone(phone, countryCode);

      // Duplicate phone check up front
      const { data: byPhone } = await supabase.from('chat_users').select('id')
        .eq('phone', formattedPhone).maybeSingle();
      if (byPhone) return json({ error: 'phone_in_use' });
      if (email) {
        const { data: byEmail } = await supabase.from('chat_users').select('id')
          .eq('email', email).maybeSingle();
        if (byEmail) return json({ error: 'email_in_use' });
      }

      // Persist pending values
      await supabase.from('telegram_login_tokens').update({
        pending_phone: formattedPhone,
        pending_country_code: countryCode,
        pending_email: email ?? null,
        pending_first_name: firstName,
        updated_at: new Date().toISOString(),
      }).eq('token', token);

      // If the Telegram bot already verified the same phone via "Share contact", skip OTP.
      if (row.phone_verified && row.pending_phone === formattedPhone) {
        const result = await createUserAndSession(supabase, {
          ...row, pending_phone: formattedPhone, pending_country_code: countryCode,
          pending_email: email ?? null, pending_first_name: firstName, token,
        });
        if ('error' in result) return json(result);
        return json({ ...result, channel: 'auto' });
      }

      // Generate + send OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await supabase.from('telegram_login_tokens').update({
        contact_otp_code: code,
        contact_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).eq('token', token);

      try {
        if (isIran) {
          await sendSmsOtp(formattedPhone, code);
          return json({ sent: true, channel: 'sms', destination: formattedPhone });
        }
        await sendEmailOtp(supabase, email!, firstName, code);
        return json({ sent: true, channel: 'email', destination: email });
      } catch (e) {
        console.error('OTP send failed', e);
        return json({ error: 'send_failed', detail: String((e as Error).message ?? e) });
      }
    }

    if (mode === 'verify_otp') {
      const { code } = body as { code?: string };
      if (!code) return json({ error: 'missing_code' });
      if (!row.contact_otp_code || row.contact_otp_code !== String(code).trim()) {
        return json({ error: 'invalid_code' });
      }
      if (!row.contact_otp_expires_at || new Date(row.contact_otp_expires_at) < new Date()) {
        return json({ error: 'expired_code' });
      }
      const result = await createUserAndSession(supabase, { ...row, token });
      if ('error' in result) return json(result);
      return json(result);
    }

    return json({ error: 'invalid_mode' });
  } catch (e) {
    console.error('telegram-finalize-registration exception', e);
    return json({ error: String((e as Error).message ?? e) });
  }
});
