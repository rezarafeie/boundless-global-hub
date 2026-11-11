import { corsHeaders } from '../_shared/cors.ts'
import { requireInternalOrAdmin, dsRequest, AuthError, ProviderError, json } from '../_shared/callcenter.ts'
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null,{headers:corsHeaders})
  try {
    await requireInternalOrAdmin(req)
    const day = new Date().toISOString().slice(0,10)
    const data = await dsRequest('/api/Customize/CustomerCallSearch', {method:'POST',body:{fromDate:day,toDate:day,limit:1,pagination:1},timeoutMs:10000})
    if (!Array.isArray(data?.data)) throw new Error('پاسخ گزارش تماس دفتر شما معتبر نیست')
    return json({success:true,endpoint:'/api/Customize/CustomerCallSearch',providerTotal:Number(data.totalCount)||0},200,corsHeaders)
  } catch(e) {
    if (e instanceof AuthError) return json({success:false,error:e.message},e.status,corsHeaders)
    // Admin/internal-only diagnostics: provider status and a short, truncated response snippet.
    const detail = e instanceof ProviderError
      ? { providerStatus: e.status, providerBody: (typeof e.body === 'string' ? e.body : JSON.stringify(e.body ?? null)).slice(0, 600) }
      : {}
    return json({success:false,error:(e as Error).message,...detail},500,corsHeaders)
  }
})
