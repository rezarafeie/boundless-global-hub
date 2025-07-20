import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WEBHOOK_URL = "https://hook.us1.make.com/m9ita6qaswo7ysgx0c4vy1c34kl0x9ij"

serve(async (req) => {
  const { method } = req

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { enrollment, user, course } = await req.json()

    console.log('📤 Sending enrollment webhook for user:', user?.name, 'course:', course?.title)

    // Prepare webhook payload
    const webhookPayload = {
      timestamp: new Date().toISOString(),
      event_type: 'course_enrollment_success',
      user_data: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        username: user?.username
      },
      course_data: {
        id: course?.id,
        title: course?.title,
        description: course?.description,
        price: course?.price,
        slug: course?.slug
      },
      enrollment_data: {
        id: enrollment?.id,
        payment_status: enrollment?.payment_status,
        payment_amount: enrollment?.payment_amount,
        payment_method: enrollment?.payment_method,
        created_at: enrollment?.created_at,
        zarinpal_ref_id: enrollment?.zarinpal_ref_id
      }
    }

    console.log('🎯 Webhook payload:', webhookPayload)

    // Send webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      console.error('❌ Webhook failed:', webhookResponse.status, await webhookResponse.text())
      throw new Error(`Webhook failed with status ${webhookResponse.status}`)
    }

    console.log('✅ Webhook sent successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully' 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error sending enrollment webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send webhook',
        details: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}