import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"
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
    const { courseSlug, testSlug, firstName, lastName, email, phone, countryCode, customAmount, enrollmentType } = await req.json();

    let paymentAmount: number, enrollment: any, itemTitle: string, itemSlug: string;

    if (enrollmentType === 'test' && testSlug) {
      const { data: test, error: testError } = await supabase
        .from('tests').select('*').eq('slug', testSlug).eq('is_active', true).single();
      if (testError || !test) {
        return new Response(JSON.stringify({ error: 'Test not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      paymentAmount = customAmount || test.price;
      itemTitle = test.title; itemSlug = testSlug;

      const { data: te, error: teErr } = await supabase
        .from('test_enrollments').insert({
          test_id: test.id, user_id: null,
          full_name: `${firstName} ${lastName}`, email, phone,
          payment_amount: paymentAmount,
          payment_status: 'pending', enrollment_status: 'pending'
        }).select().single();
      if (teErr) {
        console.error('Test enrollment creation error:', teErr);
        return new Response(JSON.stringify({ error: 'Failed to create test enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      enrollment = te;
    } else {
      const { data: course, error: courseError } = await supabase
        .from('courses').select('*').eq('slug', courseSlug).eq('is_active', true).single();
      if (courseError || !course) {
        return new Response(JSON.stringify({ error: 'Course not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      paymentAmount = customAmount || course.price;
      itemTitle = course.title; itemSlug = courseSlug;

      const { data: ce, error: ceErr } = await supabase
        .from('enrollments').insert({
          course_id: course.id,
          full_name: `${firstName} ${lastName}`, email, phone,
          country_code: countryCode || '+98',
          payment_amount: paymentAmount,
          payment_method: 'rafieipay',
          payment_status: 'pending'
        }).select().single();
      if (ceErr) {
        console.error('Course enrollment creation error:', ceErr);
        return new Response(JSON.stringify({ error: 'Failed to create course enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      enrollment = ce;
    }

    let callbackUrl: string;
    if (enrollmentType === 'test') {
      callbackUrl = `https://academy.rafiei.co/enroll/success/?test=${itemSlug}&phone=${encodeURIComponent(phone)}&enrollment=${enrollment.id}&gateway=rafieipay`;
    } else {
      callbackUrl = `https://academy.rafiei.co/enroll/success?course=${itemSlug}&email=${encodeURIComponent(email || '')}&enrollment=${enrollment.id}&gateway=rafieipay`;
    }

    const payload = {
      amount_toman: Math.round(Number(paymentAmount)),
      order_id: String(enrollment.id),
      description: enrollmentType === 'test' ? `خرید آزمون: ${itemTitle}` : `خرید دوره: ${itemTitle}`,
      callback_url: callbackUrl,
      customer: { phone, email },
    };

    const r = await rafieipayFetch('/functions/v1/payments-request', payload);

    const paymentUrl = r?.payment_url || r?.paymentUrl;
    const reference = r?.order_id || r?.token || r?.transaction_id || r?.reference;

    if (paymentUrl) {
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      if (reference) {
        await supabase.from(tableName)
          .update({ zarinpal_authority: String(reference) })
          .eq('id', enrollment.id);
      }
      return new Response(JSON.stringify({
        success: true,
        paymentUrl,
        reference,
        enrollmentId: enrollment.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.error('Rafiei Pay request failed:', r);
    return new Response(JSON.stringify({
      error: 'Payment request failed',
      details: r,
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Rafiei Pay request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String((error as any)?.message || error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
