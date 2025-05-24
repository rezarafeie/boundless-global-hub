
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, courseSlug, userEmail, userPhone } = await req.json()

    console.log('Payment request received:', { amount, courseSlug, userEmail, userPhone })

    const zarinpalRequest = {
      merchant_id: "00000000-0000-0000-0000-000000000000",
      amount: amount,
      currency: "IRT",
      description: `خرید دوره ${courseSlug}`,
      callback_url: `${req.headers.get('origin')}/payment-success`,
      metadata: {
        email: userEmail || '',
        mobile: userPhone || '', // اطمینان از ارسال شماره موبایل
        course_slug: courseSlug
      }
    }

    console.log('Zarinpal request payload:', zarinpalRequest)

    const response = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zarinpalRequest)
    })

    const data = await response.json()
    console.log('Zarinpal response:', data)

    if (data.data && data.data.code === 100) {
      return new Response(
        JSON.stringify({
          success: true,
          authority: data.data.authority,
          payment_url: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.error('Zarinpal error:', data)
      return new Response(
        JSON.stringify({
          success: false,
          error: data.errors?.[0]?.message || 'خطا در ایجاد درخواست پرداخت'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
  } catch (error) {
    console.error('Error in zarinpal-request:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'خطای سرور در پردازش درخواست'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
