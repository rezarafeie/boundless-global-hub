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

const KAVENEGAR_KEY = '2F4B6676516B71793064726B626D644153507A55504C4D61776B6A31613858706A6E473952616F766477343D';

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
