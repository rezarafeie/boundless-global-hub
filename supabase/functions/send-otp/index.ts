import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  phone: string;
  countryCode: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, countryCode }: OTPRequest = await req.json();
    
    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Format phone number according to requirements
    let formattedPhone = phone;
    if (countryCode === '+98') {
      // For Iran, handle different phone formats
      let cleanPhone = phone;
      // Remove leading 0 if present (09xxxxxxxxx -> 9xxxxxxxxx)
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      formattedPhone = `${countryCode}${cleanPhone}`;
    } else {
      // For other countries, replace + with 00
      formattedPhone = `00${countryCode.slice(1)}${phone}`;
    }
    
    console.log('Sending OTP to:', formattedPhone, 'Code:', otpCode);
    
    // Send OTP via Kavenegar API
    const kavenegarUrl = `https://api.kavenegar.com/v1/2F4B6676516B71793064726B626D644153507A55504C4D61776B6A31613858706A6E473952616F766477343D/verify/lookup.json?receptor=${formattedPhone}&token=${otpCode}&template=academylogin`;
    
    const kavenegarResponse = await fetch(kavenegarUrl, {
      method: 'GET',
    });
    
    const kavenegarResult = await kavenegarResponse.json();
    console.log('Kavenegar response:', kavenegarResult);
    
    if (!kavenegarResponse.ok) {
      throw new Error('Failed to send OTP via Kavenegar');
    }
    
    // Store OTP in database for verification (expires in 5 minutes)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .upsert({
        phone: formattedPhone,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      }, {
        onConflict: 'phone'
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store OTP');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        formattedPhone
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
