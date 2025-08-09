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
    
    if (!esanjToken || !testId || !uuid || !answers) {
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
          const row = Number(a?.row ?? a?.question_row)
          const value = Number(a?.value ?? a?.answer_id)
          return { row, value }
        })
      } catch {
        return answers as any
      }
    }

    const normalized = normalizeAnswers(answers)

    // Build request body as q1..qN per Esanj docs
    const normalizeSex = (s: string) => {
      const v = (s || '').toString().toLowerCase()
      if (['m','male','man','boy','1'].includes(v)) return 'male'
      if (['f','female','woman','girl','0'].includes(v)) return 'female'
      return v || 'male'
    }

    const requestBody: Record<string, number | string> = {
      sex: normalizeSex(sex),
      age: Math.max(1, Math.floor(Number(age))),
    }
    
    // Only include employee_id if provided
    if (employeeId) {
      requestBody.employee_id = String(employeeId)
    }
    for (const a of normalized) {
      if (Number.isFinite(a.row) && Number.isFinite(a.value)) {
        requestBody[`q${a.row}`] = Number(a.value)
      }
    }

    const url = `https://esanj.org/api/v1/interpretation/${testId}/json/${uuid}`

    // Verbose logging (no secrets)
    let debug: any = {}
    try {
      const answerKeys = Object.keys(requestBody).filter(k => /^q\d+$/.test(k))
      const firstQs = Object.fromEntries(
        Object.entries(requestBody)
          .filter(([k]) => /^q\d+$/.test(k))
          .sort(([a],[b]) => Number(a.slice(1)) - Number(b.slice(1)))
          .slice(0, 5)
      )
      debug = {
        url,
        payload: {
          sex: requestBody.sex,
          age: requestBody.age,
          employee_id: requestBody.employee_id,
          answerCount: answerKeys.length,
          firstQs
        }
      }
      console.log('Esanj submit URL:', url)
      console.log('Esanj submit payload (summary):', debug.payload)
    } catch (_) {}

    const submitResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${esanjToken}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!submitResponse.ok) {
      const text = await submitResponse.text().catch(() => '')
      console.error('Submission failed:', submitResponse.status, submitResponse.statusText, text.slice(0, 300))
      return new Response(
        JSON.stringify({
          success: false,
          error: text.includes('UUID IS Exists') || text.includes('Tested before') 
            ? 'UUID IS Exists - Tested before' 
            : `Failed to submit test: ${submitResponse.status}`,
          debug: {
            ...debug,
            response: {
              status: submitResponse.status,
              statusText: submitResponse.statusText,
              bodyPreview: text.slice(0, 300)
            }
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const submitData = await submitResponse.json()
    console.log('Test submitted successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        result: submitData,
        debug
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