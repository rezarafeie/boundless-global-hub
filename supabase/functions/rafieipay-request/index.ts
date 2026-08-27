import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"
import { rafieipayFetch, buildRafieipayCustomer, normalizeIranMobile, buildFxFields } from "../_shared/rafieipay.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseSlug, testSlug, firstName, lastName, email, phone, countryCode, customAmount, enrollmentType, gateway, userId, nationalId, customerMetadata } = await req.json();

    // Only these gateways may be forwarded to Rafiei Pay. Empty/undefined = Rafiei Pay Checkout
    // (customer picks the method inside Rafiei Pay).
    const allowedGateways = ['zibal', 'zarinpal', 'snapppay'];
    const rpGateway: string | undefined =
      typeof gateway === 'string' && allowedGateways.includes(gateway) ? gateway : undefined;

    // Full customer profile (enriched from the platform account when available)
    const customer = await buildRafieipayCustomer({
      userId, firstName, lastName, email, phone, countryCode, nationalId,
      metadata: { ...(customerMetadata || {}), source: 'enroll' },
    });

    // Normalize Iranian mobile to 09xxxxxxxxx (required by SnappPay via Rafiei Pay)
    const customerMobile = normalizeIranMobile((customer.phone as string) || phone);


    if (rpGateway === 'snapppay' && !customerMobile) {
      return new Response(JSON.stringify({ error: 'برای پرداخت اقساطی، شماره موبایل ایرانی معتبر لازم است' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let paymentAmount: number, enrollment: any, itemTitle: string, itemSlug: string;

    if (enrollmentType === 'test' && testSlug) {
      const { data: test, error: testError } = await supabase
        .from('tests').select('*').eq('slug', testSlug).eq('is_active', true).single();
      if (testError || !test) {
        return new Response(JSON.stringify({ error: 'Test not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Amount is decided server-side: a client value may only lower the price (discounts), never raise it.
      const testBase = Number(test.price || 0);
      const testRequested = Number(customAmount);
      paymentAmount = Number.isFinite(testRequested) && testRequested > 0 && testRequested <= testBase ? testRequested : testBase;
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
      // Amount is decided server-side: a client value may only lower the price (discounts), never raise it.
      const courseBase = Number(course.price || 0);
      const courseRequested = Number(customAmount);
      paymentAmount = Number.isFinite(courseRequested) && courseRequested > 0 && courseRequested <= courseBase ? courseRequested : courseBase;
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

    const amountTomanFinal = Math.round(Number(paymentAmount));
    const fx = await buildFxFields(amountTomanFinal);

    const payload: Record<string, any> = {
      amount_toman: amountTomanFinal,
      ...fx,
      order_id: String(enrollment.id),
      description: enrollmentType === 'test' ? `خرید آزمون: ${itemTitle}` : `خرید دوره: ${itemTitle}`,
      callback_url: callbackUrl,
      customer: {
        ...customer,
        metadata: {
          ...((customer.metadata as Record<string, unknown>) || {}),
          enrollment_type: enrollmentType === 'test' ? 'test' : 'course',
          item_slug: itemSlug,
          enrollment_id: String(enrollment.id),
        },
      },
      metadata: {
        source: 'rafiei-academy',
        enrollment_type: enrollmentType === 'test' ? 'test' : 'course',
        item_slug: itemSlug,
        enrollment_id: String(enrollment.id),
      },
    };
    if (customerMobile) payload.customer_mobile = customerMobile;
    // Rafiei Pay Checkout = no gateway (customer chooses inside Rafiei Pay)
    if (rpGateway) payload.gateway = rpGateway;

    const result = await rafieipayFetch('/functions/v1/payments-request', payload, { enrollmentId: enrollment.id });
    const r = result.body || {};

    // Checkout mode returns checkout_url; direct-gateway mode returns payment_url.
    const redirectUrl = r?.payment_url || r?.paymentUrl || r?.checkout_url || r?.checkoutUrl;
    const paymentId = r?.payment_id || r?.id || r?.payment?.id;
    const reference = paymentId || r?.order_id || r?.token || r?.transaction_id || r?.reference;

    if (redirectUrl) {
      const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
      const update: Record<string, any> = {};
      if (reference) update.zarinpal_authority = String(reference);
      if (enrollmentType !== 'test') {
        update.payment_method = rpGateway ? `rafieipay_${rpGateway}` : 'rafieipay';
      }
      if (Object.keys(update).length) {
        await supabase.from(tableName).update(update).eq('id', enrollment.id);
      }
      return new Response(JSON.stringify({
        success: true,
        paymentUrl: redirectUrl,
        checkoutUrl: r?.checkout_url || r?.checkoutUrl || null,
        paymentId: paymentId || null,
        gateway: rpGateway || 'checkout',
        reference,
        enrollmentId: enrollment.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    console.error('Rafiei Pay request failed:', r);
    return new Response(JSON.stringify({
      error: r?.error?.message || 'Payment request failed',
      errorCode: result.errorCode || r?.error?.code,
      details: r,
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Rafiei Pay request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String((error as any)?.message || error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
