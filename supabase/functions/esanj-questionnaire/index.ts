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
    const { esanjToken, testId } = await req.json()
    
    if (!esanjToken || !testId) {
      throw new Error('Missing required parameters: esanjToken and testId')
    }

    console.log('Fetching questionnaire for test:', testId) // Updated version
    
    const apiUrl = `https://esanj.org/api/v1/questionnaire/${testId}`
    console.log('=== DETAILED API CALL INFO FOR ESANJ DEVELOPERS ===')
    console.log('API URL:', apiUrl)
    console.log('Method: GET')
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${esanjToken.substring(0, 10)}...` // Masked for security
    })
    console.log('Test ID:', testId)
    console.log('Current timestamp:', new Date().toISOString())

    const questionnaireResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      }
    })

    console.log('=== ESANJ API RESPONSE DETAILS ===')
    console.log('Response status:', questionnaireResponse.status)
    console.log('Response status text:', questionnaireResponse.statusText)
    console.log('Response headers:', Object.fromEntries(questionnaireResponse.headers.entries()))
    console.log('Response URL:', questionnaireResponse.url)

    if (!questionnaireResponse.ok) {
      const errorText = await questionnaireResponse.text()
      console.log('Error response body:', errorText)
      throw new Error(`Failed to fetch questionnaire: ${questionnaireResponse.status} - ${errorText}`)
    }

    const questionnaireData = await questionnaireResponse.json()
    console.log('=== RAW API RESPONSE FROM ESANJ ===')
    console.log('Full raw response:', JSON.stringify(questionnaireData, null, 2))
    console.log('Response type:', typeof questionnaireData)
    console.log('Has test property:', !!questionnaireData.test)
    console.log('Has questions property:', !!questionnaireData.questions)
    console.log('Questions array length:', questionnaireData?.questions?.length || 0)
    console.log('Questions array type:', Array.isArray(questionnaireData?.questions))
    
    if (questionnaireData.questions && questionnaireData.questions.length > 0) {
      console.log('First question structure:', JSON.stringify(questionnaireData.questions[0], null, 2))
    } else {
      console.log('=== ISSUE: Questions array is empty or missing ===')
      console.log('Available response keys:', Object.keys(questionnaireData))
      if (questionnaireData.test) {
        console.log('Test object:', JSON.stringify(questionnaireData.test, null, 2))
      }
    }
    
    console.log('=== END OF DETAILED LOGS ===')

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