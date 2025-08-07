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
    const { esanjToken, testId, uuid, employeeId, age, sex, answers } = await req.json()
    
    if (!esanjToken || !testId || !uuid || !employeeId || !answers) {
      throw new Error('Missing required parameters')
    }

    console.log('Submitting test answers for test:', testId, 'employee:', employeeId)
    
    // Submit test answers to Esanj interpretation endpoint
    const submitResponse = await fetch(`https://esanj.org/api/v1/interpretation`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      },
      body: JSON.stringify({
        test_id: testId,
        uuid: uuid,
        employee_id: employeeId,
        age: age,
        sex: sex,
        answers: answers
      })
    })

    if (!submitResponse.ok) {
      throw new Error(`Failed to submit test: ${submitResponse.status}`)
    }

    const submitData = await submitResponse.json()
    console.log('Test submitted successfully:', submitData)

    return new Response(
      JSON.stringify({ 
        success: true,
        result: submitData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Test submission error:', error)
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