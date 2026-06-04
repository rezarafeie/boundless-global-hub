import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rafieipayFetch } from "../_shared/rafieipay.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId, enrollmentType, trackId, transactionId } = await req.json();
    console.log('🔍 Rafiei Pay verify:', { enrollmentId, enrollmentType, trackId, transactionId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let enrollment: any, enrollmentError: any;
    if (enrollmentType === 'test') {
      const r = await supabase.from('test_enrollments')
        .select(`*, tests (title, slug)`).eq('id', enrollmentId).single();
      enrollment = r.data; enrollmentError = r.error;
    } else {
      const r = await supabase.from('enrollments')
        .select(`*, courses (*), chat_users:chat_user_id (*)`).eq('id', enrollmentId).single();
      enrollment = r.data; enrollmentError = r.error;
    }

    if (enrollmentError || !enrollment) {
      console.error('❌ Enrollment not found:', enrollmentError);
      return new Response(JSON.stringify({ error: 'Enrollment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Per Rafiei Pay docs: body must be { track_id } OR { transaction_id }. NOT order_id/reference.
    const verifyBody: Record<string, any> = {};
    if (trackId) verifyBody.track_id = String(trackId);
    else if (transactionId) verifyBody.transaction_id = String(transactionId);
    else {
      return new Response(JSON.stringify({ error: 'Missing track_id or transaction_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await rafieipayFetch('/functions/v1/payments-verify', verifyBody, { enrollmentId });
    const r = result.body || {};

    // Success = success===true AND transaction.status === 'verified'. already_verified is also success.
    const tx = r?.transaction || {};
    const isPaid = r?.success === true && (tx.status === 'verified' || r?.already_verified === true);
    const refId = tx.ref_id || r?.ref_id || '';

    if (isPaid) {
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      const { error: updateError } = await supabase.from(tableName)
        .update({ payment_status: 'completed', zarinpal_ref_id: String(refId || tx.id || '') })
        .eq('id', enrollmentId);
      if (updateError) throw new Error(`Database update failed: ${updateError.message}`);

      try {
        const webhookPayload = {
          event_type: 'enrollment_paid_successful',
          timestamp: new Date().toISOString(),
          data: {
            enrollment,
            user: enrollment.chat_users || { name: enrollment.full_name, email: enrollment.email, phone: enrollment.phone },
            course: enrollmentType === 'test' ? enrollment.tests : enrollment.courses,
            payment: { amount: enrollment.payment_amount, ref_id: refId, method: 'rafieipay' }
          }
        };
        await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'enrollment_paid_successful', payload: webhookPayload }),
        });
      } catch (e) { console.error('Webhook error:', e); }

      if (enrollmentType !== 'test' && enrollment.courses?.is_spotplayer_enabled) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/create-spotplayer-license`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enrollmentId, userFullName: enrollment.full_name,
              userPhone: enrollment.phone, courseId: enrollment.course_id,
            }),
          });
        } catch (e) { console.error('SpotPlayer error:', e); }
      }

      return new Response(JSON.stringify({
        success: true,
        refId,
        course: enrollmentType === 'test' ? enrollment.tests : enrollment.courses,
        enrollment,
        transaction: tx,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.error('❌ Rafiei Pay verification failed:', r);
    const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
    await supabase.from(tableName).update({ payment_status: 'failed' }).eq('id', enrollmentId);

    return new Response(JSON.stringify({
      error: r?.error?.message || 'Payment verification failed',
      details: r,
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Rafiei Pay verify error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String((error as any)?.message || error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
