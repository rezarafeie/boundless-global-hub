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
    
    // Normalize answers to expected shape: [{ row: number, value: number }]
    const normalizeAnswers = (answers: any[]): Array<{ row: number; value: number }> => {
      try {
        return answers.map((a: any) => {
          if (typeof a?.value !== 'undefined' && typeof a?.row !== 'undefined') {
            return { row: Number(a.row), value: Number(a.value) }
          }
          if (typeof a?.answer_id !== 'undefined' && typeof a?.question_row !== 'undefined') {
            return { row: Number(a.question_row), value: Number(a.answer_id) }
          }
          // Fallback: try to coerce common shapes
          const keys = Object.keys(a || {})
          const row = Number(a?.row ?? a?.question ?? a?.q ?? a?.question_row)
          const value = Number(a?.value ?? a?.answer ?? a?.answer_id)
          return { row, value }
        })
      } catch {
        return answers as any
      }
    }

    const payload = {
      test_id: testId,
      uuid: uuid,
      employee_id: employeeId,
      age: age,
      sex: sex,
      answers: normalizeAnswers(answers)
    }
    
    // Try primary endpoint then fallback
    const endpoints = [
      'https://esanj.org/api/v1/interpretation',
      'https://esanj.org/api/v1/interpretation/grading'
    ]

    let submitResponse: Response | null = null
    let lastError: any = null

    for (const url of endpoints) {
      submitResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${esanjToken}`
        },
        body: JSON.stringify(payload)
      })

      if (submitResponse.ok) {
        console.log('Test submitted successfully to', url)
        break
      } else {
        const text = await submitResponse.text().catch(() => '')
        console.error(`Submission failed at ${url}:`, submitResponse.status, submitResponse.statusText, text.slice(0, 200))
        lastError = new Error(`Failed to submit test: ${submitResponse.status}`)
      }
    }

    if (!submitResponse || !submitResponse.ok) {
      throw lastError || new Error('Failed to submit test')
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