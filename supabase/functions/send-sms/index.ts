
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
    const { phone, code } = await req.json()

    console.log('SMS request received:', { phone, code })

    // Validate inputs
    if (!phone || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'شماره تلفن و کد تایید الزامی است'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Format phone number (remove any extra characters and ensure it starts with 98)
    const formattedPhone = phone.replace(/\D/g, '').replace(/^0/, '98')

    console.log('Formatted phone:', formattedPhone)

    // Faraaz API request with correct endpoint and API key
    const faraazPayload = {
      code: "vzhg0d009gpv1w6",
      sender: "+983000505",
      recipient: formattedPhone,
      variable: {
        code: code
      }
    }

    console.log('Faraaz SMS payload:', faraazPayload)

    // Call Faraaz API with proper headers including API key
    const faraazResponse = await fetch('https://api2.ippanel.com/api/v1/sms/pattern/normal/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'AccessKey lQBvFydrE35Wk1zkiKBiIiQpI5VwMKs3ovikaj40hS0='
      },
      body: JSON.stringify(faraazPayload)
    })

    const faraazResult = await faraazResponse.json()
    console.log('Faraaz API response status:', faraazResponse.status)
    console.log('Faraaz API response:', faraazResult)

    if (faraazResponse.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'کد تایید با موفقیت ارسال شد'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.error('Faraaz API error:', faraazResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'خطا در ارسال پیامک'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
  } catch (error) {
    console.error('Error in send-sms:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'خطای سرور در ارسال پیامک'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    }
  )
})
