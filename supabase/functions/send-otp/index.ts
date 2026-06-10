import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  phone?: string;
  countryCode?: string;
  email?: string;
}

const GMAIL_CLIENT_ID = '242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com';
const GMAIL_CLIENT_SECRET = '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';
const KAVENEGAR_KEY = '2F4B6676516B71793064726B626D644153507A55504C4D61776B6A31613858706A6E473952616F766477343D';

async function sendEmailOtp(supabase: any, email: string, code: string) {
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
      <p style="color:#444">Use this one-time code to finish signing in:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;padding:16px;background:#fff;border-radius:8px;margin:16px 0">
        ${code}
      </div>
      <p style="color:#888;font-size:12px">The code expires in 5 minutes. If you didn't request this, ignore the email.</p>
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: OTPRequest = await req.json();
    const isEmail = !!body.email;

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let identifier: string;

    if (isEmail) {
      identifier = body.email!.trim().toLowerCase();
      console.log('Sending email OTP to:', identifier, 'Code:', otpCode);
      await sendEmailOtp(supabase, identifier, otpCode);
    } else {
      const phone = body.phone!;
      const countryCode = body.countryCode || '+98';
      let formattedPhone = phone;
      if (countryCode === '+98') {
        let cleanPhone = phone;
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        formattedPhone = `${countryCode}${cleanPhone}`;
      } else {
        formattedPhone = `00${countryCode.slice(1)}${phone}`;
      }
      identifier = formattedPhone;

      console.log('Sending OTP to:', formattedPhone, 'Code:', otpCode);

      const kavenegarUrl = `https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/verify/lookup.json?receptor=${formattedPhone}&token=${otpCode}&template=academylogin`;
      const kavenegarResponse = await fetch(kavenegarUrl);
      const kavenegarResult = await kavenegarResponse.json();
      console.log('Kavenegar response:', kavenegarResult);
      if (!kavenegarResponse.ok) {
        throw new Error('Failed to send OTP via Kavenegar');
      }
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: dbError } = await supabase
      .from('otp_verifications')
      .upsert({
        phone: identifier,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
      }, { onConflict: 'phone' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store OTP');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        formattedPhone: identifier,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
