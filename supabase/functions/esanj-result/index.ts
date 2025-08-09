import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// Updated to use correct endpoint format

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { esanjToken, uuid, testId, type = 'html' } = await req.json()
    
    if (!esanjToken || !uuid || !testId) {
      throw new Error('Missing required parameters: esanjToken, uuid, and testId are required')
    }

    console.log('Fetching test result for UUID:', uuid, 'testId:', testId, 'type:', type)
    
    const apiUrl = `https://esanj.org/api/v1/interpretation/${type}/${uuid}`;
    const requestHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${esanjToken}`
    };
    
    console.log('🔍 API Request Details:');
    console.log('URL:', apiUrl);
    console.log('Method: GET');
    console.log('Headers:', JSON.stringify(requestHeaders, null, 2));
    console.log('Bearer Token (first 20 chars):', esanjToken.substring(0, 20) + '...');
    
    const resultResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders
    })

    console.log('📥 API Response Details:');
    console.log('Status:', resultResponse.status);
    console.log('Status Text:', resultResponse.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(resultResponse.headers.entries()), null, 2));

    if (!resultResponse.ok) {
      const responseText = await resultResponse.text();
      console.log('❌ Error Response Body:', responseText);
      
      const errorDetails = {
        status: resultResponse.status,
        statusText: resultResponse.statusText,
        url: apiUrl,
        headers: Object.fromEntries(resultResponse.headers.entries()),
        body: responseText
      };
      
      console.log('🚨 Complete Error Details for Esanj:', JSON.stringify(errorDetails, null, 2));
      
      throw new Error(`Failed to fetch test result: ${resultResponse.status} - ${responseText}`)
    }

    const resultData = await resultResponse.json()
    console.log('✅ Test result fetched successfully')
    console.log('📊 Response Data Preview:', JSON.stringify(resultData).substring(0, 200) + '...')

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