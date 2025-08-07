import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"

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
    const { courseSlug, testSlug, firstName, lastName, email, phone, countryCode, customAmount, enrollmentType } = await req.json();

    let paymentAmount, enrollment, itemTitle, itemSlug;

    if (enrollmentType === 'test' && testSlug) {
      // Handle test enrollment
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('slug', testSlug)
        .eq('is_active', true)
        .single();

      if (testError || !test) {
        return new Response(
          JSON.stringify({ error: 'Test not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      paymentAmount = customAmount || test.price;
      itemTitle = test.title;
      itemSlug = testSlug;

      // Create test enrollment record
      const { data: testEnrollment, error: testEnrollmentError } = await supabase
        .from('test_enrollments')
        .insert({
          test_id: test.id,
          full_name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          country_code: countryCode || '+98',
          payment_amount: paymentAmount,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (testEnrollmentError) {
        console.error('Test enrollment creation error:', testEnrollmentError);
        return new Response(
          JSON.stringify({ error: 'Failed to create test enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      enrollment = testEnrollment;
    } else {
      // Handle course enrollment
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (courseError || !course) {
        return new Response(
          JSON.stringify({ error: 'Course not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      paymentAmount = customAmount || course.price;
      itemTitle = course.title;
      itemSlug = courseSlug;

      // Create course enrollment record
      const { data: courseEnrollment, error: courseEnrollmentError } = await supabase
        .from('enrollments')
        .insert({
          course_id: course.id,
          full_name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          country_code: countryCode || '+98',
          payment_amount: paymentAmount,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (courseEnrollmentError) {
        console.error('Course enrollment creation error:', courseEnrollmentError);
        return new Response(
          JSON.stringify({ error: 'Failed to create course enrollment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      enrollment = courseEnrollment;
    }

    // Prepare Zarinpal payment request
    const merchantId = Deno.env.get('ZARINPAL_MERCHANT_ID');
    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate appropriate callback URL based on enrollment type
    let callbackUrl;
    if (enrollmentType === 'test') {
      callbackUrl = `https://academy.rafiei.co/enroll/success/?test=${itemSlug}&phone=${encodeURIComponent(phone)}&enrollment=${enrollment.id}&status=OK&Authority={zarinpal_authority}`;
    } else {
      callbackUrl = `https://academy.rafiei.co/enroll/success?course=${itemSlug}&email=${encodeURIComponent(email)}&enrollment=${enrollment.id}`;
    }

    const zarinpalPayload = {
      merchant_id: merchantId,
      amount: Math.round(paymentAmount * 10), // Convert to Rials (multiply by 10) - use final amount after discount
      callback_url: callbackUrl,
      description: enrollmentType === 'test' ? `خرید آزمون: ${itemTitle}` : `خرید دوره: ${itemTitle}`,
      metadata: {
        mobile: phone,
        email: email
      }
    };

    console.log('Zarinpal request payload:', zarinpalPayload);

    // Send request to Zarinpal
    const zarinpalResponse = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zarinpalPayload)
    });

    const zarinpalData = await zarinpalResponse.json();
    console.log('Zarinpal response:', zarinpalData);

    if (zarinpalData.data && zarinpalData.data.code === 100) {
      // Update enrollment with authority based on type
      if (enrollmentType === 'test') {
        await supabase
          .from('test_enrollments')
          .update({ zarinpal_authority: zarinpalData.data.authority })
          .eq('id', enrollment.id);
      } else {
        await supabase
          .from('enrollments')
          .update({ zarinpal_authority: zarinpalData.data.authority })
          .eq('id', enrollment.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          authority: zarinpalData.data.authority,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${zarinpalData.data.authority}`,
          enrollmentId: enrollment.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Zarinpal request failed:', zarinpalData);
      return new Response(
        JSON.stringify({ 
          error: 'Payment request failed',
          details: zarinpalData.errors || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Payment request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});