import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting payment status monitoring check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const fixResults: any[] = [];

    // === Case 1: Enrollments with ref_id but wrong status ===
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

    console.log(`🔍 Case 1: Found ${inconsistentEnrollments?.length || 0} enrollments with ref_id but wrong status`);

    for (const enrollment of (inconsistentEnrollments || [])) {
      console.log(`🔧 Fixing enrollment ${enrollment.id} - ${enrollment.full_name} (has ref_id)`);
      
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ payment_status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', enrollment.id);

      fixResults.push({
        enrollmentId: enrollment.id,
        fullName: enrollment.full_name,
        case: 'has_ref_id_wrong_status',
        status: updateError ? 'failed' : 'fixed',
        error: updateError?.message
      });
    }

    // === Case 2: Enrollments with authority but no ref_id (verification never ran) ===
    const { data: unverifiedEnrollments, error: unverifiedError } = await supabase
      .from('enrollments')
      .select('id, full_name, payment_status, zarinpal_authority, payment_amount, created_at, course_id')
      .not('zarinpal_authority', 'is', null)
      .neq('zarinpal_authority', '')
      .is('zarinpal_ref_id', null)
      .eq('payment_method', 'zarinpal')
      .not('payment_status', 'in', '("completed","success")');

    if (unverifiedError) {
      console.error('❌ Error checking unverified payments:', unverifiedError);
    } else {
      console.log(`🔍 Case 2: Found ${unverifiedEnrollments?.length || 0} enrollments with authority but no verification`);

      const merchantId = Deno.env.get('ZARINPAL_MERCHANT_ID');

      for (const enrollment of (unverifiedEnrollments || [])) {
        // Only attempt verification for recent enrollments (within 1 hour - Zarinpal authority expires)
        const createdAt = new Date(enrollment.created_at);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (createdAt < hourAgo) {
          console.log(`⏭️ Skipping ${enrollment.id} - ${enrollment.full_name} (authority likely expired, created ${enrollment.created_at})`);
          fixResults.push({
            enrollmentId: enrollment.id,
            fullName: enrollment.full_name,
            case: 'authority_expired',
            status: 'skipped',
            error: 'Authority likely expired (older than 1 hour)'
          });
          continue;
        }

        if (!merchantId) {
          console.error('❌ ZARINPAL_MERCHANT_ID not configured');
          fixResults.push({
            enrollmentId: enrollment.id,
            fullName: enrollment.full_name,
            case: 'unverified_payment',
            status: 'failed',
            error: 'ZARINPAL_MERCHANT_ID not configured'
          });
          continue;
        }

        try {
          console.log(`🔄 Attempting Zarinpal verification for ${enrollment.id} - ${enrollment.full_name}`);
          
          const verifyPayload = {
            merchant_id: merchantId,
            amount: Math.round(enrollment.payment_amount * 10), // Toman to Rial
            authority: enrollment.zarinpal_authority
          };

          const zarinpalResponse = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });

          const zarinpalData = await zarinpalResponse.json();
          console.log(`Zarinpal verify response for ${enrollment.id}:`, zarinpalData);

          if (zarinpalData.data && (zarinpalData.data.code === 100 || zarinpalData.data.code === 101)) {
            // Payment was successful - update enrollment
            const { error: updateError } = await supabase
              .from('enrollments')
              .update({
                payment_status: 'completed',
                zarinpal_ref_id: zarinpalData.data.ref_id.toString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', enrollment.id);

            console.log(`✅ Verified and fixed enrollment ${enrollment.id}`);
            fixResults.push({
              enrollmentId: enrollment.id,
              fullName: enrollment.full_name,
              case: 'verified_and_fixed',
              status: updateError ? 'failed' : 'fixed',
              refId: zarinpalData.data.ref_id,
              error: updateError?.message
            });
          } else {
            console.log(`❌ Payment not successful for ${enrollment.id}: code ${zarinpalData.data?.code}`);
            fixResults.push({
              enrollmentId: enrollment.id,
              fullName: enrollment.full_name,
              case: 'payment_not_successful',
              status: 'skipped',
              zarinpalCode: zarinpalData.data?.code
            });
          }
        } catch (verifyError) {
          console.error(`❌ Verification failed for ${enrollment.id}:`, verifyError);
          fixResults.push({
            enrollmentId: enrollment.id,
            fullName: enrollment.full_name,
            case: 'verification_error',
            status: 'failed',
            error: verifyError.message
          });
        }
      }
    }

    const fixed = fixResults.filter(r => r.status === 'fixed').length;
    const failed = fixResults.filter(r => r.status === 'failed').length;
    const skipped = fixResults.filter(r => r.status === 'skipped').length;
    
    console.log(`📊 Monitor Summary: ${fixed} fixed, ${failed} failed, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${fixed}, failed ${failed}, skipped ${skipped}`,
        fixedCount: fixed,
        failedCount: failed,
        skippedCount: skipped,
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
