import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { esanjToken, uuid, type = 'grading' } = await req.json()
    
    if (!esanjToken || !uuid) {
      throw new Error('Missing required parameters')
    }

    console.log('Fetching test result for UUID:', uuid, 'type:', type)
    
    let resultResponse
    
    if (type === 'grading') {
      resultResponse = await fetch(`https://esanj.org/api/v1/interpretation/grading/${uuid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${esanjToken}`
        }
      })
    } else {
      resultResponse = await fetch(`https://esanj.org/api/v1/interpretation/${type}/${uuid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${esanjToken}`
        }
      })
    }

    if (!resultResponse.ok) {
      throw new Error(`Failed to fetch test result: ${resultResponse.status}`)
    }

    const resultData = await resultResponse.json()
    console.log('Test result fetched successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        result: resultData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Test result fetch error:', error)
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