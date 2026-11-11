import { corsHeaders } from '../_shared/cors.ts'
import { requireInternalOrAdmin, dsRequest, dsFetch, AuthError, ProviderError, json } from '../_shared/callcenter.ts'

async function pingProxy() {
  const proxy = Deno.env.get('DAFTARESHOMA_PROXY_URL'); const secret = Deno.env.get('DAFTARESHOMA_PROXY_SECRET')
  if (!proxy || !secret) return null
  try {
    const u = new URL(proxy); u.searchParams.set('ping', '1')
    const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(8000) })
    const t = await r.text()
    return { status: r.status, proxyVersion: r.headers.get('X-Rafiei-Proxy'), body: t.slice(0, 300) }
  } catch (e) { return { status: 0, error: (e as Error).message } }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null,{headers:corsHeaders})
  try {
    await requireInternalOrAdmin(req)
  } catch (e) {
    return json({success:false,error:(e as Error).message},e instanceof AuthError ? e.status : 401,corsHeaders)
  }
  const proxy = await pingProxy()
  try {
    const day = new Date().toISOString().slice(0,10)
    let probe: any = null
    if (req.headers.get('x-internal-secret')) { try { probe = (await req.json())?.probe ?? null } catch { /* none */ } }
    if (probe?.download) {
      const r = await dsFetch(String(probe.download))
      const b = new Uint8Array(await r.arrayBuffer())
      return json({success:true,status:r.status,ct:r.headers.get('content-type'),up:r.headers.get('X-Upstream-Status'),size:b.length,head:new TextDecoder().decode(b.slice(0,400))},200,corsHeaders)
    }
    const data = await dsRequest(probe?.path ?? '/api/Customize/CustomerCallSearch', {method:probe?.method ?? 'POST',body:probe ? probe.body : {fromDate:day,toDate:day,limit:1,pagination:1},query:probe?.query,authMode:probe?.authMode,timeoutMs:20000})
    if (probe) return json({success:true,probeResult:JSON.stringify(data).slice(0,1500)},200,corsHeaders)
    if (!Array.isArray(data?.data)) throw new Error('پاسخ گزارش تماس دفتر شما معتبر نیست')
    return json({success:true,endpoint:'/api/Customize/CustomerCallSearch',providerTotal:Number(data.totalCount)||0,proxy},200,corsHeaders)
  } catch(e) {
    // Admin/internal-only diagnostics: provider status and a short, truncated response snippet.
    const detail = e instanceof ProviderError
      ? { providerStatus: e.status, providerBody: (typeof e.body === 'string' ? e.body : JSON.stringify(e.body ?? null)).slice(0, 600) }
      : {}
    return json({success:false,error:(e as Error).message,proxy,...detail},500,corsHeaders)
  }
})
