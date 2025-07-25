import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test the specific enrollment that's failing
    const enrollmentId = 'ac0047a3-077a-43be-89e0-bdd22f77c487';
    
    console.log('🧪 Testing enrollment email for:', enrollmentId);
    
    // Call the send-enrollment-email function
    const response = await fetch('https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ enrollmentId }),
    });
    
    const result = await response.text();
    console.log('📧 Email function response status:', response.status);
    console.log('📧 Email function response:', result);
    
    return new Response(JSON.stringify({
      status: response.status,
      response: result,
      enrollment_id: enrollmentId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});