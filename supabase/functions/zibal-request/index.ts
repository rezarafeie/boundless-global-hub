import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"
import { zibalFetch, zibalStartUrl, getZibalMerchant } from "../_shared/zibal.ts"

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

      const { data: testEnrollment, error: testEnrollmentError } = await supabase
        .from('test_enrollments').insert({
          test_id: test.id, user_id: null,
          full_name: `${firstName} ${lastName}`, email, phone,
          payment_amount: paymentAmount,
          payment_status: 'pending', enrollment_status: 'pending'
        }).select().single();

      if (testEnrollmentError) {
        console.error('Test enrollment creation error:', testEnrollmentError);
        return new Response(JSON.stringify({ error: 'Failed to create test enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      enrollment = testEnrollment;
    } else {
      const { data: course, error: courseError } = await supabase
        .from('courses').select('*').eq('slug', courseSlug).eq('is_active', true).single();

      if (courseError || !course) {
        return new Response(JSON.stringify({ error: 'Course not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      paymentAmount = customAmount || course.price;
      itemTitle = course.title; itemSlug = courseSlug;

      const { data: courseEnrollment, error: courseEnrollmentError } = await supabase
        .from('enrollments').insert({
          course_id: course.id,
          full_name: `${firstName} ${lastName}`, email, phone,
          country_code: countryCode || '+98',
          payment_amount: paymentAmount,
          payment_method: 'zibal',
          payment_status: 'pending'
        }).select().single();

      if (courseEnrollmentError) {
        console.error('Course enrollment creation error:', courseEnrollmentError);
        return new Response(JSON.stringify({ error: 'Failed to create course enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      enrollment = courseEnrollment;
    }

    const merchant = getZibalMerchant();

    let callbackUrl: string;
    if (enrollmentType === 'test') {
      callbackUrl = `https://academy.rafiei.co/enroll/success/?test=${itemSlug}&phone=${encodeURIComponent(phone)}&enrollment=${enrollment.id}&gateway=zibal`;
    } else {
      callbackUrl = `https://academy.rafiei.co/enroll/success?course=${itemSlug}&email=${encodeURIComponent(email)}&enrollment=${enrollment.id}&gateway=zibal`;
    }

    const payload = {
      merchant,
      amount: Math.round(paymentAmount * 10), // Toman -> Rial
      callbackUrl,
      description: enrollmentType === 'test' ? `خرید آزمون: ${itemTitle}` : `خرید دوره: ${itemTitle}`,
      orderId: String(enrollment.id),
      mobile: phone,
    };

    console.log('Zibal request payload:', payload);

    const zibalResponse = await zibalFetch('/v1/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const zibalData = await zibalResponse.json();
    console.log('Zibal response:', zibalData);

    if (zibalData.result === 100 && zibalData.trackId) {
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      await supabase.from(tableName)
        .update({ zarinpal_authority: String(zibalData.trackId) }) // reuse column for tracking
        .eq('id', enrollment.id);

      return new Response(JSON.stringify({
        success: true,
        trackId: zibalData.trackId,
        paymentUrl: zibalStartUrl(zibalData.trackId),
        enrollmentId: enrollment.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      console.error('Zibal request failed:', zibalData);
      return new Response(JSON.stringify({
        error: 'Payment request failed',
        details: zibalData,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Payment request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
