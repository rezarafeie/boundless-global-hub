import { corsHeaders } from '../_shared/cors.ts'
import { dsRequest, json } from '../_shared/callcenter.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const body = await req.json().catch(() => ({} as any))
  try {
    const data = await dsRequest(body.path ?? '/api/Customize/CustomerCallSearch', {
      method: body.method ?? 'POST',
      body: body.payload ?? { limit: 5, pagination: 1 },
    })
    return json({ success: true, data }, 200, corsHeaders)
  } catch (e) {
    return json({ success: false, error: (e as Error).message, body: (e as any).body ?? null }, 200, corsHeaders)
  }
})
