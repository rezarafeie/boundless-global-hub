
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

    // SMS API request (using a mock service for now - replace with actual SMS provider)
    const smsPayload = {
      receptor: formattedPhone,
      message: `کد تایید شما: ${code}`,
      token: code,
      template: 'verify'
    }

    console.log('SMS payload:', smsPayload)

    // For development, we'll simulate a successful SMS send
    // In production, replace this with your actual SMS provider API call
    const mockSmsResponse = {
      return: {
        status: 200,
        message: 'success'
      }
    }

    console.log('SMS API response:', mockSmsResponse)

    if (mockSmsResponse.return.status === 200) {
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
  }
})
