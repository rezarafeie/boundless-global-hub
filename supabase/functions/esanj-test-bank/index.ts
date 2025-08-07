import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EsanjTestBankResponse {
  tests: Array<{
    test_id: number
    count_ready: number
    count_used: number
    test: {
      id: number
      title: string
    }
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { esanjToken } = await req.json()
    
    if (!esanjToken) {
      throw new Error('Esanj token is required')
    }

    console.log('Fetching test bank from Esanj API...')
    
    const esanjResponse = await fetch('https://esanj.org/api/v1/test/bank', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      }
    })

    if (!esanjResponse.ok) {
      throw new Error(`Failed to fetch test bank: ${esanjResponse.status}`)
    }

    const testBankData: EsanjTestBankResponse = await esanjResponse.json()
    console.log('Test bank fetched successfully:', testBankData.tests.length, 'tests')

    // Update local tests table with data from Esanj
    for (const testItem of testBankData.tests) {
      const slug = testItem.test.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim()

      await supabase
        .from('tests')
        .upsert({
          test_id: testItem.test_id,
          title: testItem.test.title,
          count_ready: testItem.count_ready,
          count_used: testItem.count_used,
          slug: slug,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'test_id'
        })
    }

    console.log('Tests updated in database')

    return new Response(
      JSON.stringify({ 
        success: true,
        tests: testBankData.tests,
        message: 'Test bank synced successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Test bank sync error:', error)
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