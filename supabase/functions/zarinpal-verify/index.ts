
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🔍 Zarinpal verify function called with:', { authority, enrollmentId, manualApproval });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*),
        chat_users:chat_user_id (*)
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

      // Send manual payment approved webhook
      try {
        console.log('📤 Sending manual payment approved webhook...');
        
        const webhookPayload = {
          event_type: 'enrollment_manual_payment_approved',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: enrollment,
            user: enrollment.chat_users || { 
              name: enrollment.full_name,
              email: enrollment.email,
              phone: enrollment.phone 
            },
            course: enrollment.courses
          }
        };

        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_manual_payment_approved',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('✅ Manual payment approved webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Manual payment webhook failed:', webhookResponse.status, errorText);
        }
      } catch (webhookError) {
        console.error('❌ Failed to send manual payment approved webhook:', webhookError);
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
    console.log('Zarinpal verify status:', zarinpalResponse.status);

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
        console.log('📤 Sending enrollment_paid_successful webhook...');
        
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

        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_paid_successful',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('✅ Payment success webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Payment success webhook failed:', webhookResponse.status, errorText);
        }
      } catch (webhookError) {
        console.error('❌ Failed to send payment success webhook:', webhookError);
      }

      // Create SpotPlayer license if needed
      if (enrollment.courses.is_spotplayer_enabled) {
        try {
          console.log('🎮 Creating SpotPlayer license after successful payment...');
          
          const licenseResponse = await fetch(`${supabaseUrl}/functions/v1/create-spotplayer-license`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              enrollmentId: enrollmentId,
              userFullName: enrollment.full_name,
              userPhone: enrollment.phone,
              courseId: enrollment.course_id
            })
          });

          if (licenseResponse.ok) {
            console.log('✅ SpotPlayer license created after payment');
          } else {
            const errorText = await licenseResponse.text();
            console.error('❌ SpotPlayer license creation failed:', errorText);
          }
        } catch (licenseError) {
          console.error('❌ SpotPlayer license error (non-blocking):', licenseError);
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
