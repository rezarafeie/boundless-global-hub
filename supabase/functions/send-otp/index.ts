import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  phone?: string;
  countryCode?: string;
  email?: string;
}

const KAVENEGAR_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const KAVENEGAR_TEMPLATE = Deno.env.get('KAVENEGAR_VERIFY_TEMPLATE');

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

      // Send via Lovable Cloud transactional email
      const { error: sendError } = await supabase.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: 'otp-verification',
            recipientEmail: identifier,
            idempotencyKey: `otp-${identifier}-${otpCode}`,
            templateData: { code: otpCode },
          },
        }
      );

      if (sendError) {
        console.error('Email send error:', sendError);
        throw new Error('Failed to send verification email');
      }
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

      if (!KAVENEGAR_KEY || !KAVENEGAR_TEMPLATE) throw new Error('SMS is not configured');
      const kavenegarResponse = await fetch(`https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/verify/lookup.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ receptor: formattedPhone, token: otpCode, template: KAVENEGAR_TEMPLATE }),
      }).catch(() => { throw new Error('SMS delivery failed'); });
      const kavenegarResult = await kavenegarResponse.json();
      if (!kavenegarResponse.ok || kavenegarResult.return?.status !== 200) {
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
    console.error('OTP delivery failed');
    return new Response(
      JSON.stringify({ success: false, error: 'ارسال کد انجام نشد' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
