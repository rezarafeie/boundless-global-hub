import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import { rafieipayFetch, rafieipayGet } from "../_shared/rafieipay.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId, enrollmentType, trackId, transactionId, paymentId } = await req.json();
    console.log('🔍 Rafiei Pay verify:', { enrollmentId, enrollmentType, trackId, transactionId, paymentId });

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

    const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';

    // Idempotency: an already-completed enrollment is never activated twice.
    if (enrollment.payment_status === 'completed') {
      console.log('ℹ️ Enrollment already completed — returning existing result');
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        refId: enrollment.zarinpal_ref_id || '',
        course: enrollmentType === 'test' ? enrollment.tests : enrollment.courses,
        enrollment,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Preferred path (Rafiei Pay v2): read the authoritative payment state.
    // Callback query params are never trusted as proof of payment.
    const lookupId = paymentId || enrollment.zarinpal_authority;
    let r: any = {};
    let tx: any = {};
    let isPaid = false;
    let amountToman: number | null = null;

    if (lookupId) {
      const get = await rafieipayGet('/functions/v1/payments-get', { id: String(lookupId) }, { enrollmentId });
      r = get.body || {};
      tx = r?.payment || r?.transaction || r?.data || r;
      const status = tx?.status;
      amountToman = Number(tx?.amount_toman ?? r?.amount_toman ?? NaN);
      isPaid = status === 'verified';
    }

    // Fallback for legacy callbacks that only carry track_id / transaction_id.
    if (!isPaid && (trackId || transactionId)) {
      const verifyBody: Record<string, any> = {};
      if (trackId) verifyBody.track_id = String(trackId);
      else verifyBody.transaction_id = String(transactionId);
      const result = await rafieipayFetch('/functions/v1/payments-verify', verifyBody, { enrollmentId });
      r = result.body || {};
      tx = r?.transaction || {};
      isPaid = r?.success === true && (tx.status === 'verified' || r?.already_verified === true);
      const amt = Number(tx?.amount_toman ?? r?.amount_toman ?? NaN);
      if (Number.isFinite(amt)) amountToman = amt;
    }

    if (!lookupId && !trackId && !transactionId) {
      return new Response(JSON.stringify({ error: 'Missing payment id / track_id / transaction_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Amount check: the verified amount must match the order amount.
    const expectedAmount = Math.round(Number(enrollment.payment_amount || 0));
    if (isPaid && amountToman !== null && Number.isFinite(amountToman) && Math.round(amountToman) !== expectedAmount) {
      console.error('❌ Amount mismatch', { amountToman, expectedAmount });
      return new Response(JSON.stringify({
        success: false,
        error: 'مبلغ پرداخت با مبلغ سفارش مطابقت ندارد',
        details: { paid: amountToman, expected: expectedAmount },
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const refId = tx?.ref_id || r?.ref_id || tx?.id || '';


    if (isPaid) {
      // Atomic, idempotent activation: only the transition from a non-completed row wins.
      const { data: updatedRows, error: updateError } = await supabase.from(tableName)
        .update({ payment_status: 'completed', zarinpal_ref_id: String(refId || '') })
        .eq('id', enrollmentId)
        .neq('payment_status', 'completed')
        .select('id');
      if (updateError) throw new Error(`Database update failed: ${updateError.message}`);
      const firstActivation = (updatedRows?.length || 0) > 0;
      if (!firstActivation) {
        return new Response(JSON.stringify({
          success: true, alreadyProcessed: true, refId,
          course: enrollmentType === 'test' ? enrollment.tests : enrollment.courses,
          enrollment, transaction: tx,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }


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
