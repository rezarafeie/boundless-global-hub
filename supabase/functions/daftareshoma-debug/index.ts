import { corsHeaders } from '../_shared/cors.ts'

const BASE = (Deno.env.get('DAFTARESHOMA_BASE_URL') || 'https://coreapi.daftareshoma.com').replace(/\/+$/, '')
const TOKEN = Deno.env.get('DAFTARESHOMA_API_TOKEN') || ''

const now = new Date()
const from = new Date(now.getTime() - 24 * 3600 * 1000)
const iso = (d: Date) => d.toISOString().slice(0, 19)

const bodies: Record<string, unknown> = {
  minimal: { limit: 10, pagination: 1 },
  full: {
    fromDate: iso(from), toDate: iso(now), directionType: 'None', type: 'None',
    from: '', to: '', extention: '', disposition: 'None', id: '', limit: 10, pagination: 1,
  },
  datesOnly: { fromDate: iso(from), toDate: iso(now), limit: 10, pagination: 1 },
  empty: {},
  pagination0: { fromDate: iso(from), toDate: iso(now), limit: 10, pagination: 0 },
  fa: { fromDate: '1405/05/24', toDate: '1405/05/25', limit: 10, pagination: 1 },
}

const headerSets: Record<string, Record<string, string>> = {
  bearer: { Authorization: `Bearer ${TOKEN}` },
  raw: { Authorization: TOKEN },
  apikey: { 'X-API-KEY': TOKEN },
  apikey2: { ApiKey: TOKEN },
  token: { token: TOKEN },
  both: { Authorization: `Bearer ${TOKEN}`, 'X-API-KEY': TOKEN },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const results: any[] = []
  const q = new URL(req.url).searchParams
  const only = q.get('headers')

  for (const [hName, hs] of Object.entries(headerSets)) {
    if (only && only !== hName) continue
    for (const [bName, body] of Object.entries(bodies)) {
      try {
        const res = await fetch(`${BASE}/api/Customize/CustomerCallSearch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...hs },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        results.push({ headers: hName, body: bName, status: res.status, snippet: text.slice(0, 300) })
      } catch (e) {
        results.push({ headers: hName, body: bName, status: 0, snippet: (e as Error).message })
      }
    }
  }

  return new Response(JSON.stringify({ base: BASE, tokenLen: TOKEN.length, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
