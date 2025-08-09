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
    for (const a of normalized) {
      if (Number.isFinite(a.row) && Number.isFinite(a.value)) {
        requestBody[`q${a.row}`] = Number(a.value)
      }
    }

    const query = employeeId ? `?employee_id=${encodeURIComponent(String(employeeId))}` : ''
    const url = `https://esanj.org/api/v1/interpretation/${testId}/grading/${uuid}${query}`

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
      throw new Error(`Failed to submit test: ${submitResponse.status}`)
    }

    const submitData = await submitResponse.json()
    console.log('Test submitted successfully')

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