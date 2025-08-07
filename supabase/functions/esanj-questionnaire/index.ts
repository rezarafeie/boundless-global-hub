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
    const { esanjToken, testId, uuid, employeeId, age, sex } = await req.json()
    
    if (!esanjToken || !testId || !uuid || !employeeId || age === undefined || !sex) {
      throw new Error('Missing required parameters: esanjToken, testId, uuid, employeeId, age, sex')
    }

    console.log('Fetching questionnaire for test:', testId, 'employee:', employeeId)
    
    const apiUrl = `https://esanj.org/api/v1/questionnaire/${testId}`
    console.log('API URL:', apiUrl)

    const questionnaireResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      },
      body: JSON.stringify({
        uuid: uuid,
        employee_id: employeeId,
        age: age,
        sex: sex
      })
    })

    console.log('Response status:', questionnaireResponse.status)
    console.log('Response headers:', Object.fromEntries(questionnaireResponse.headers.entries()))

    if (!questionnaireResponse.ok) {
      throw new Error(`Failed to fetch questionnaire: ${questionnaireResponse.status}`)
    }

    const questionnaireData = await questionnaireResponse.json()
    console.log('Raw API response:', JSON.stringify(questionnaireData, null, 2))
    console.log('Questions count:', questionnaireData?.questions?.length || 0)
    
    // Check if the API response has the expected structure
    if (!questionnaireData.questions || questionnaireData.questions.length === 0) {
      console.log('Warning: No questions returned from Esanj API')
      console.log('Full response structure:', Object.keys(questionnaireData))
    }
    
    console.log('Questionnaire fetched successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        questionnaire: questionnaireData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Questionnaire fetch error:', error)
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