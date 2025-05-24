
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { authority, amount } = await req.json()

    console.log('Verifying payment:', { authority, amount })

    const verifyRequest = {
      merchant_id: "10f6ea92-fb53-468c-bcc9-36ef4d9f539c",
      authority: authority,
      amount: amount
    }

    const response = await fetch('https://payment.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyRequest)
    })

    const result = await response.json()
    console.log('Zarinpal verify response:', result)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (result.data && result.data.code === 100) {
      // Payment successful - update payment and activate course
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('authority', authority)
        .single()

      if (payment) {
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            ref_id: result.data.ref_id,
            verified_at: new Date().toISOString()
          })
          .eq('authority', authority)

        // Activate course for user
        await supabase
          .from('user_courses')
          .insert({
            user_id: payment.user_id,
            course_slug: payment.course_slug,
            course_type: 'paid',
            status: 'active',
            authority: authority,
            amount: payment.amount,
            payment_status: 'completed'
          })

        return new Response(JSON.stringify({
          success: true,
          ref_id: result.data.ref_id,
          course_slug: payment.course_slug
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Payment failed or not found
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('authority', authority)

    return new Response(JSON.stringify({
      success: false,
      error: 'Payment verification failed',
      details: result
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
