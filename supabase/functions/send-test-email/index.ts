import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Send test email function called');
    
    // Get a test enrollment
    const testEnrollmentId = 'e1919b83-0dec-499c-85bd-6d8457f98eba';
    
    console.log('📧 Calling send-enrollment-email function with test enrollment...');
    
    // Call the actual send email function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-enrollment-email', {
      body: { enrollmentId: testEnrollmentId }
    });

    if (emailError) {
      console.error('❌ Email function error:', emailError);
      throw new Error(`Email function failed: ${emailError.message}`);
    }

    console.log('✅ Email function response:', emailResult);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Test email sent successfully',
      enrollmentId: testEnrollmentId,
      emailResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Test email failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});