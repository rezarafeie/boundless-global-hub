import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  phone: string;
  otpCode: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otpCode }: VerifyOTPRequest = await req.json();
    
    // Format phone number consistently with send-otp function
    let formattedPhone = phone;
    // Handle Iranian phone numbers (remove leading 0 and add +98)
    if (phone.startsWith('0') && phone.length === 11) {
      formattedPhone = `+98${phone.substring(1)}`;
    } else if (phone.length === 10 && phone.startsWith('9')) {
      formattedPhone = `+98${phone}`;
    } else if (!phone.startsWith('+98')) {
      formattedPhone = `+98${phone}`;
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if OTP exists and is valid using the formatted phone
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired OTP'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('phone', formattedPhone)
      .eq('otp_code', otpCode);
    
    if (updateError) {
      console.error('Error updating OTP verification:', updateError);
      throw new Error('Failed to verify OTP');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP verified successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
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