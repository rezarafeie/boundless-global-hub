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
    console.log('🔧 Starting payment status fix for inconsistent enrollments...');
    
    // Find enrollments with zarinpal_ref_id but incorrect payment status
    const { data: inconsistentEnrollments, error: selectError } = await supabase
      .from('enrollments')
      .select('id, full_name, email, payment_status, zarinpal_ref_id, payment_amount, created_at')
      .not('zarinpal_ref_id', 'is', null)
      .neq('zarinpal_ref_id', '')
      .not('payment_status', 'in', '(completed,success)')
      .eq('payment_method', 'zarinpal');

    if (selectError) {
      console.error('❌ Error finding inconsistent enrollments:', selectError);
      throw selectError;
    }

    if (!inconsistentEnrollments || inconsistentEnrollments.length === 0) {
      console.log('✅ No inconsistent enrollments found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No inconsistent enrollments found',
        fixed_count: 0,
        enrollments: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Found ${inconsistentEnrollments.length} inconsistent enrollments:`, 
      inconsistentEnrollments.map(e => ({ id: e.id, name: e.full_name, status: e.payment_status, ref_id: e.zarinpal_ref_id })));

    // Update all inconsistent enrollments to completed status
    const { data: updateResult, error: updateError } = await supabase
      .from('enrollments')
      .update({ 
        payment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .not('zarinpal_ref_id', 'is', null)
      .neq('zarinpal_ref_id', '')
      .not('payment_status', 'in', '(completed,success)')
      .eq('payment_method', 'zarinpal')
      .select('id, full_name, email, payment_status');

    if (updateError) {
      console.error('❌ Error updating enrollments:', updateError);
      throw updateError;
    }

    const fixedCount = updateResult?.length || 0;
    console.log(`✅ Successfully fixed ${fixedCount} enrollments`);

    // Log each fixed enrollment
    if (updateResult) {
      updateResult.forEach(enrollment => {
        console.log(`✅ Fixed enrollment: ${enrollment.id} (${enrollment.full_name}) -> ${enrollment.payment_status}`);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully fixed ${fixedCount} payment status inconsistencies`,
      fixed_count: fixedCount,
      enrollments: updateResult || [],
      original_inconsistent: inconsistentEnrollments
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Payment status fix failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fixed_count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});