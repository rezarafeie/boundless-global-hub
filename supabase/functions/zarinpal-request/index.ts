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
    const { courseSlug, firstName, lastName, email, phone, countryCode, customAmount } = await req.json();

    // Get course details
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

    // Use custom amount if provided (for discounts), otherwise use course price
    const paymentAmount = customAmount || course.price;

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
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

    if (enrollmentError) {
      console.error('Enrollment creation error:', enrollmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create enrollment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Zarinpal payment request
    const merchantId = Deno.env.get('ZARINPAL_MERCHANT_ID');
    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callbackUrl = `https://academy.rafiei.co/enroll/success?course=${courseSlug}&email=${encodeURIComponent(email)}&enrollment=${enrollment.id}`;

    const zarinpalPayload = {
      merchant_id: merchantId,
      amount: Math.round(paymentAmount * 10), // Convert to Rials (multiply by 10) - use final amount after discount
      callback_url: callbackUrl,
      description: `خرید دوره: ${course.title}`,
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
      // Update enrollment with authority
      await supabase
        .from('enrollments')
        .update({ zarinpal_authority: zarinpalData.data.authority })
        .eq('id', enrollment.id);

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