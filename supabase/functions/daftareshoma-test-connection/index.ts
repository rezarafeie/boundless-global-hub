import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, audit, AuthError, dsTryEndpoints, ProviderError, json } from '../_shared/callcenter.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.admin')

    const tokenConfigured = !!Deno.env.get('DAFTARESHOMA_API_TOKEN')
    if (!tokenConfigured) {
      return json({ success: false, configured: false, message: 'توکن API دفتر شما تنظیم نشده است' }, 200, corsHeaders)
    }

    let ok = false
    let detail: unknown = null
    let endpoint: string | null = null
    let message = ''
    let attempts: unknown[] = []

    try {
      const res = await dsTryEndpoints([
        { path: '/api/v1/CallReport/GetCallReports', query: { pageNumber: 1, pageSize: 1 } },
        { path: '/api/v1/CallReport', query: { page: 1, pageSize: 1 } },
        { path: '/api/CallReport/List', query: { page: 1, pageSize: 1 } },
        { path: '/api/v1/Call/Reports', query: { page: 1, pageSize: 1 } },
      ])
      ok = true
      endpoint = res.path
      attempts = res.attempts
      detail = Array.isArray(res.data) ? { count: res.data.length } : res.data
      message = 'اتصال با موفقیت برقرار شد'
    } catch (e) {
      const pe = e as ProviderError
      message = pe.message ?? 'اتصال ناموفق بود'
      detail = pe.body ?? null
      attempts = (pe as any).attempts ?? []
    }

    const { data: state } = await admin.from('daftareshoma_sync_state').select('*').eq('id', 1).maybeSingle()
    await audit(ctx, 'integration.test_connection', 'daftareshoma', null, { ok, endpoint })

    return json({
      success: ok,
      configured: true,
      tokenMasked: '••••••••',
      endpoint,
      message,
      detail,
      attempts,
      syncState: state ?? null,
    }, 200, corsHeaders)

  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
