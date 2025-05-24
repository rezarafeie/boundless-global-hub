
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()

    console.log('Sending SMS to:', phone, 'with code:', code)

    const response = await fetch('https://api.farazsms.com/v2/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lQBvFydrE35Wk1zkiKBiIiQpI5VwMKs3ovikaj40hS0='
      },
      body: JSON.stringify({
        recipient: phone,
        message: `کد تایید آکادمی رفیعی: ${code}`,
        sender: 'RafieiAcademy'
      }),
    })

    console.log('Faraaz API response status:', response.status)
    const result = await response.text()
    console.log('Faraaz API response:', result)

    if (!response.ok) {
      throw new Error(`Failed to send SMS: ${result}`)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'SMS sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('SMS sending error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
