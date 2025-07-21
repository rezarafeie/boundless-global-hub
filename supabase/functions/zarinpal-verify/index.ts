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
    const { authority, enrollmentId, manualApproval } = await req.json();

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Enrollment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle manual payments - skip Zarinpal verification
    if (authority === 'MANUAL_PAYMENT' || manualApproval) {
      console.log('Processing manual payment approval for enrollment:', enrollmentId);

      // Create WooCommerce order if product ID is available and order doesn't exist
      let woocommerceOrderId = enrollment.woocommerce_order_id;
      if (enrollment.courses.woocommerce_product_id && !woocommerceOrderId) {
        try {
          const wooOrderId = await createWooCommerceOrder(enrollment);
          if (wooOrderId) {
            woocommerceOrderId = wooOrderId;
            await supabase
              .from('enrollments')
              .update({ woocommerce_order_id: wooOrderId })
              .eq('id', enrollmentId);
          }
        } catch (wooError) {
          console.error('WooCommerce order creation failed:', wooError);
          // Don't fail the whole process if WooCommerce fails
        }
      }

      // Return success for manual payment (don't modify payment status - admin already approved)
      return new Response(
        JSON.stringify({
          success: true,
          refId: 'MANUAL_PAYMENT_APPROVED',
          woocommerceOrderId,
          course: enrollment.courses,
          enrollment: enrollment
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Regular Zarinpal verification for non-manual payments
    const merchantId = Deno.env.get('ZARINPAL_MERCHANT_ID');
    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Zarinpal
    const verifyPayload = {
      merchant_id: merchantId,
      amount: Math.round(enrollment.payment_amount * 10), // Convert to Rials
      authority: authority
    };

    console.log('Zarinpal verify payload:', verifyPayload);

    const zarinpalResponse = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload)
    });

    const zarinpalData = await zarinpalResponse.json();
    console.log('Zarinpal verify response:', zarinpalData);

    if (zarinpalData.data && zarinpalData.data.code === 100) {
      // Payment successful - update enrollment
      await supabase
        .from('enrollments')
        .update({
          payment_status: 'completed',
          zarinpal_ref_id: zarinpalData.data.ref_id.toString()
        })
        .eq('id', enrollmentId);

      // Create WooCommerce order if product ID is available
      let woocommerceOrderId = null;
      if (enrollment.courses.woocommerce_product_id) {
        try {
          const wooOrderId = await createWooCommerceOrder(enrollment);
          if (wooOrderId) {
            woocommerceOrderId = wooOrderId;
            await supabase
              .from('enrollments')
              .update({ woocommerce_order_id: wooOrderId })
              .eq('id', enrollmentId);
          }
        } catch (wooError) {
          console.error('WooCommerce order creation failed:', wooError);
          // Don't fail the whole process if WooCommerce fails
        }
      }

      // Send webhook for successful payment
      try {
        const webhookPayload = {
          event_type: 'enrollment_paid_successful',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: enrollment,
            user: enrollment.chat_users || { 
              name: enrollment.full_name,
              email: enrollment.email,
              phone: enrollment.phone 
            },
            course: enrollment.courses,
            payment: {
              amount: enrollment.payment_amount,
              ref_id: zarinpalData.data.ref_id,
              authority: authority,
              method: 'zarinpal'
            }
          }
        };

        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_paid_successful',
            payload: webhookPayload
          })
        });

        console.log('Payment success webhook sent successfully');
      } catch (webhookError) {
        console.error('Failed to send payment success webhook:', webhookError);
        // Don't fail the payment if webhook fails
      }

      // Create SpotPlayer license if needed
      if (enrollment.courses.is_spotplayer_enabled) {
        try {
          await createSpotPlayerLicense(enrollment, enrollmentId);
        } catch (licenseError) {
          console.error('SpotPlayer license creation failed:', licenseError);
          // Don't fail the payment if license creation fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          refId: zarinpalData.data.ref_id,
          woocommerceOrderId,
          course: enrollment.courses,
          enrollment: enrollment
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Payment failed
      await supabase
        .from('enrollments')
        .update({ payment_status: 'failed' })
        .eq('id', enrollmentId);

      return new Response(
        JSON.stringify({ 
          error: 'Payment verification failed',
          code: zarinpalData.data?.code || 'unknown'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createWooCommerceOrder(enrollment: any): Promise<number | null> {
  const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
  
  if (!consumerKey || !consumerSecret) {
    console.warn('WooCommerce credentials not configured');
    return null;
  }

  const orderData = {
    payment_method: 'zarinpal',
    payment_method_title: 'Zarinpal',
    set_paid: true,
    billing: {
      first_name: enrollment.full_name,
      email: enrollment.email,
      phone: enrollment.phone
    },
    line_items: [
      {
        product_id: enrollment.courses.woocommerce_product_id,
        quantity: 1
      }
    ]
  };

  // Create Basic Auth header
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  
  try {
    const response = await fetch('https://auth.rafiei.co/wp-json/wc/v3/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const orderResponse = await response.json();
      console.log('WooCommerce order created:', orderResponse.id);
      return orderResponse.id;
    } else {
      const errorText = await response.text();
      console.error('WooCommerce order creation failed:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return null;
  }
}

async function createSpotPlayerLicense(enrollment: any, enrollmentId: string): Promise<void> {
  try {
    // Check if SpotPlayer is enabled for this course
    if (!enrollment.courses.is_spotplayer_enabled || !enrollment.courses.spotplayer_course_id) {
      console.log('SpotPlayer not enabled for this course, skipping license creation');
      return;
    }

    console.log('Creating SpotPlayer license for enrollment:', enrollmentId);

    const spotPlayerRequestBody = {
      test: false,
      course: [enrollment.courses.spotplayer_course_id],
      name: enrollment.full_name,
      watermark: {
        texts: [
          {
            text: enrollment.phone
          }
        ]
      }
    };

    console.log('Sending request to SpotPlayer API:', spotPlayerRequestBody);

    // Call SpotPlayer API
    const spotPlayerResponse = await fetch('https://panel.spotplayer.ir/license/edit/', {
      method: 'POST',
      headers: {
        '$API': 'YoCd0Z5K5OkR/vQFituZuQSpiAcnlg==',
        '$LEVEL': '-1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spotPlayerRequestBody)
    });

    if (!spotPlayerResponse.ok) {
      const errorText = await spotPlayerResponse.text();
      throw new Error(`SpotPlayer API error: ${spotPlayerResponse.status} - ${errorText}`);
    }

    const spotPlayerData = await spotPlayerResponse.json();
    console.log('SpotPlayer API response:', spotPlayerData);

    // Construct the full video access URL
    const fullVideoUrl = `https://dl.spotplayer.ir${spotPlayerData.url}`;

    // Update enrollment with SpotPlayer license data
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        spotplayer_license_id: spotPlayerData._id,
        spotplayer_license_key: spotPlayerData.key,
        spotplayer_license_url: fullVideoUrl
      })
      .eq('id', enrollmentId);

    if (updateError) {
      throw new Error(`Failed to update enrollment: ${updateError.message}`);
    }

    console.log('Successfully created SpotPlayer license and updated enrollment');

  } catch (error) {
    console.error('SpotPlayer license creation error:', error);
    
    // Log error to license_errors table
    await supabase
      .from('license_errors')
      .insert({
        enrollment_id: enrollmentId,
        course_id: enrollment.course_id,
        error_message: error.message,
        api_response: null
      });
  }
}
