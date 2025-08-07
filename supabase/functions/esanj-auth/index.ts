import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EsanjAuthResponse {
  token: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { username, password } = await req.json()
    
    console.log('Attempting to authenticate with Esanj API...')
    
    const esanjResponse = await fetch('https://esanj.org/api/v1/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username || 'rafeie',
        password: password || 'reza1234'
      })
    })

    if (!esanjResponse.ok) {
      console.error('Esanj auth failed:', esanjResponse.status, esanjResponse.statusText)
      throw new Error(`Authentication failed: ${esanjResponse.status}`)
    }

    const authData: EsanjAuthResponse = await esanjResponse.json()
    console.log('Esanj authentication successful')

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: authData.token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Esanj authentication error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})