import { corsHeaders } from '../_shared/cors.ts'
import { authenticate, requirePermission, AuthError, json } from '../_shared/callcenter.ts'
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null,{headers:corsHeaders})
  try {
    const body = await req.json().catch(()=>({})), ctx = await authenticate(req,body.sessionToken)
    requirePermission(ctx,'calls.admin')
    const day = new Date().toISOString().slice(0,10)
    const tokens = await Promise.all(['DAFTARESHOMA_API_TOKEN','DAFTARESHOMA_PORTAL_TOKEN'].map(async name => {
      const token = Deno.env.get(name)
      if (!token) return {name,configured:false,success:false,status:null}
      try {
        const res = await fetch('https://coreapi.daftareshoma.com/api/Customize/CustomerCallSearch',{
          method:'POST',headers:{Authorization:`Bearer ${token.replace(/^Bearer\s+/i,'')}`,'Content-Type':'application/json'},
          body:JSON.stringify({fromDate:day,toDate:day,limit:1,pagination:1}),signal:AbortSignal.timeout(10000)})
        const data = await res.json().catch(()=>null)
        return {name,configured:true,status:res.status,success:res.ok && Array.isArray(data?.data)}
      } catch { return {name,configured:true,status:null,success:false} }
    }))
    return json({success:tokens[0].success,tokens},200,corsHeaders)
  } catch(e) { return json({success:false,error:(e as Error).message},e instanceof AuthError ? e.status : 500,corsHeaders) }
})
