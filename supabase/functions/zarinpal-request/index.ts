
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
    const { courseSlug, amount, userEmail, userMobile, userName } = await req.json()

    console.log('Payment request for:', { courseSlug, amount, userEmail })

    const callbackUrl = `https://academy.rafiei.co/payment-success/${courseSlug}`
    
    const zarinpalRequest = {
      merchant_id: "10f6ea92-fb53-468c-bcc9-36ef4d9f539c",
      amount: amount,
      callback_url: callbackUrl,
      description: `پرداخت برای دوره ${courseSlug} توسط ${userName}`,
      metadata: {
        mobile: userMobile,
        email: userEmail
      }
    }

    console.log('Sending request to Zarinpal:', zarinpalRequest)

    const response = await fetch('https://payment.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zarinpalRequest)
    })

    const result = await response.json()
    console.log('Zarinpal response:', result)

    if (result.data && result.data.code === 100) {
      // Create payment record in Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(authHeader)

      if (user) {
        await supabase.from('payments').insert({
          user_id: user.id,
          course_slug: courseSlug,
          authority: result.data.authority,
          amount: amount,
          status: 'pending',
          merchant_id: zarinpalRequest.merchant_id
        })
      }

      return new Response(JSON.stringify({
        success: true,
        authority: result.data.authority,
        paymentUrl: `https://www.zarinpal.com/pg/StartPay/${result.data.authority}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment request failed',
        details: result
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Payment request error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
