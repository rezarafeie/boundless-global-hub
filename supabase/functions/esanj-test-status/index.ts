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
    const { esanjToken, testId, employeeId } = await req.json()
    
    if (!esanjToken || !testId || !employeeId) {
      throw new Error('Missing required parameters')
    }

    console.log('Checking test status for test:', testId, 'employee:', employeeId)
    
    const queryParams = new URLSearchParams({
      test_id: testId.toString(),
      employee_id: employeeId.toString()
    })

    const statusResponse = await fetch(`https://esanj.org/api/v1/test/status-do?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      }
    })

    if (!statusResponse.ok) {
      throw new Error(`Failed to check test status: ${statusResponse.status}`)
    }

    const statusData = await statusResponse.json()
    console.log('Test status checked successfully:', statusData)

    return new Response(
      JSON.stringify({ 
        success: true,
        status: statusData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Test status check error:', error)
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