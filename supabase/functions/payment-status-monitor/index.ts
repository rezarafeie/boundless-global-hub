import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting payment status monitoring check...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find enrollments with successful Zarinpal payments but wrong status
    const { data: inconsistentEnrollments, error } = await supabase
      .from('enrollments')
      .select('id, full_name, payment_status, zarinpal_ref_id, created_at, course_id')
      .not('zarinpal_ref_id', 'is', null)
      .neq('zarinpal_ref_id', '')
      .not('payment_status', 'in', '("completed","success")')
      .eq('payment_method', 'zarinpal');

    if (error) {
      console.error('❌ Error checking payment inconsistencies:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${inconsistentEnrollments?.length || 0} payment inconsistencies`);

    if (!inconsistentEnrollments || inconsistentEnrollments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No payment inconsistencies found',
          inconsistencies: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fix the inconsistent payments
    const fixResults = [];
    for (const enrollment of inconsistentEnrollments) {
      console.log(`🔧 Fixing enrollment ${enrollment.id} - ${enrollment.full_name}`);
      
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      if (updateError) {
        console.error(`❌ Failed to fix enrollment ${enrollment.id}:`, updateError);
        fixResults.push({
          enrollmentId: enrollment.id,
          status: 'failed',
          error: updateError.message
        });
      } else {
        console.log(`✅ Fixed enrollment ${enrollment.id}`);
        fixResults.push({
          enrollmentId: enrollment.id,
          status: 'fixed',
          fullName: enrollment.full_name
        });
      }
    }

    // Log summary
    const fixed = fixResults.filter(r => r.status === 'fixed').length;
    const failed = fixResults.filter(r => r.status === 'failed').length;
    
    console.log(`📊 Monitor Summary: ${fixed} fixed, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${fixed} payment inconsistencies, ${failed} failed`,
        inconsistenciesFound: inconsistentEnrollments.length,
        fixedCount: fixed,
        failedCount: failed,
        details: fixResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Payment monitor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});