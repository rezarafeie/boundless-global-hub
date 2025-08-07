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
    const { esanjToken, testId, age, sex, uuid, employeeId, moreInformation } = await req.json()
    
    if (!esanjToken || !testId || !age || !sex || !uuid || !employeeId) {
      throw new Error('Missing required parameters: esanjToken, testId, age, sex, uuid, employeeId')
    }

    console.log('Fetching HTML questionnaire for test:', testId)
    
    // Build query parameters
    const params = new URLSearchParams({
      age: age.toString(),
      sex: sex,
      test_id: testId.toString(),
      uuid: uuid
    })

    // Add optional parameters - employee_id should be string
    if (employeeId) {
      params.append('employee_id', String(employeeId))
    }

    if (moreInformation && Array.isArray(moreInformation)) {
      moreInformation.forEach((info, index) => {
        params.append(`more_information[${index}]`, info)
      })
    }
    
    const apiUrl = `https://esanj.org/api/v1/questionnaire/html?${params.toString()}`
    console.log('=== HTML QUESTIONNAIRE API CALL INFO ===')
    console.log('API URL:', apiUrl)
    console.log('Method: GET')
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${esanjToken.substring(0, 10)}...` // Masked for security
    })
    console.log('Parameters:', {
      age,
      sex,
      test_id: testId,
      uuid,
      employee_id: employeeId,
      more_information: moreInformation
    })
    console.log('Current timestamp:', new Date().toISOString())

    const questionnaireResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Authorization': `Bearer ${esanjToken}`
      }
    })

    console.log('=== ESANJ HTML API RESPONSE DETAILS ===')
    console.log('Response status:', questionnaireResponse.status)
    console.log('Response status text:', questionnaireResponse.statusText)
    console.log('Response headers:', Object.fromEntries(questionnaireResponse.headers.entries()))
    console.log('Response URL:', questionnaireResponse.url)

    if (!questionnaireResponse.ok) {
      const errorText = await questionnaireResponse.text()
      console.log('Error response body:', errorText)
      throw new Error(`Failed to fetch HTML questionnaire: ${questionnaireResponse.status} - ${errorText}`)
    }

    // Get response as text since it's HTML
    const htmlContent = await questionnaireResponse.text()
    console.log('=== HTML QUESTIONNAIRE RESPONSE ===')
    console.log('HTML content length:', htmlContent.length)
    console.log('HTML preview (first 200 chars):', htmlContent.substring(0, 200))
    console.log('=== END OF HTML QUESTIONNAIRE LOGS ===')

    return new Response(
      JSON.stringify({ 
        success: true,
        htmlContent: htmlContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('HTML Questionnaire fetch error:', error)
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