import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { zibalFetch, getZibalMerchant } from "../_shared/zibal.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackId, enrollmentId, enrollmentType } = await req.json();
    console.log('🔍 Zibal verify called with:', { trackId, enrollmentId, enrollmentType });

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

    const merchant = getZibalMerchant();
    const verifyPayload = { merchant, trackId: Number(trackId) };
    console.log('Zibal verify payload:', verifyPayload);

    const zibalResponse = await zibalFetch('/v1/verify', {
      method: 'POST',
      body: JSON.stringify(verifyPayload),
    });
    const zibalData = await zibalResponse.json();
    console.log('Zibal verify response:', zibalData);

    // result 100 = success, 201 = already verified
    if (zibalData.result === 100 || zibalData.result === 201) {
      // status 1 = paid+verified, 2 = paid+not-verified (still ok to confirm)
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      const refId = zibalData.refNumber ? String(zibalData.refNumber) : String(trackId);

      const { error: updateError } = await supabase.from(tableName)
        .update({ payment_status: 'completed', zarinpal_ref_id: refId })
        .eq('id', enrollmentId);

      if (updateError) {
        console.error('❌ Failed to update enrollment:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Webhook
      try {
        const webhookPayload = {
          event_type: 'enrollment_paid_successful',
          timestamp: new Date().toISOString(),
          data: {
            enrollment,
            user: enrollment.chat_users || { name: enrollment.full_name, email: enrollment.email, phone: enrollment.phone },
            course: enrollmentType === 'test' ? enrollment.tests : enrollment.courses,
            payment: { amount: enrollment.payment_amount, ref_id: refId, trackId, method: 'zibal' }
          }
        };
        await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'enrollment_paid_successful', payload: webhookPayload }),
        });
      } catch (e) { console.error('Webhook error:', e); }

      // SpotPlayer license
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
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      console.error('❌ Zibal verification failed:', zibalData);
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      await supabase.from(tableName).update({ payment_status: 'failed' }).eq('id', enrollmentId);

      return new Response(JSON.stringify({
        error: 'Payment verification failed',
        code: zibalData.result ?? 'unknown',
        details: zibalData,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Zibal verify error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
