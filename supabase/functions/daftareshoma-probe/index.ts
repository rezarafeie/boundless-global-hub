import { corsHeaders } from '../_shared/cors.ts'
import { json } from '../_shared/callcenter.ts'

const BASE = 'https://coreapi.daftareshoma.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const token = Deno.env.get('DAFTARESHOMA_API_TOKEN') ?? ''
  const body = {
    disablePaging: false,
    pageNumber: 1,
    pageSize: 5,
    whereConditionText: 'StartTime>="2026-08-16 00:00:00.000 "  && StartTime<="2026-08-17 00:00:00.000 " ',
    sortText: '',
  }
  const out: any[] = []
  for (const auth of [token, `Bearer ${token}`]) {
    try {
      const res = await fetch(`${BASE}/api/CustomerCall/Search`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      out.push({ mode: auth.startsWith('Bearer') ? 'bearer' : 'raw', status: res.status, body: (await res.text()).slice(0, 400) })
    } catch (e) {
      out.push({ mode: auth.startsWith('Bearer') ? 'bearer' : 'raw', error: (e as Error).message })
    }
  }
  return json({ out }, 200, corsHeaders)
})
