import { admin, secretEquals, normalizePhone, json } from '../_shared/callcenter.ts'
import { decideRoute, renderResponse, type RoutingConfig, type CallerFacts } from '../_shared/call-routing.ts'
Deno.serve(async req => {
  const url = new URL(req.url)
  const psk = Deno.env.get('DAFTARESHOMA_CALL_CONTROL_PSK')
  const authorized = secretEquals(url.searchParams.get('key'),Deno.env.get('DAFTARESHOMA_CALL_CONTROL_KEY')) ||
    ['x-call-control-psk','x-psk','authorization'].some(h => secretEquals(req.headers.get(h)?.replace(/^Bearer\s+/i,'') ?? null,psk))
  if (!authorized) return json({error:'unauthorized'},401)
  let config: RoutingConfig = {mode:'capture'}, facts: CallerFacts = {}, body:any = {}
  let failed = false
  try {
    body = await req.json()
    const {data,error} = await admin.from('call_routing_config').select('config').eq('id',1).abortSignal(AbortSignal.timeout(1200)).single()
    if(error) throw error
    config = data.config
    const canonical = normalizePhone(body.from_number ?? body.callerNumber ?? body.FromNumber ?? body.phone).normalized
    const result = await admin.rpc('callcenter_caller_facts',{canonical_phone:canonical,at_time:new Date().toISOString()}).abortSignal(AbortSignal.timeout(1200))
    if(result.error) throw result.error
    facts = result.data ?? {}
  } catch { failed = true }
  const decision = failed ? {destination:config.default_destination || '',reason:'lookup_failed',matched_rule:'default'} : decideRoute(facts,config,new Date())
  const headers = Object.fromEntries([...req.headers].filter(([name,value]) => !/auth|psk|key|secret|cookie|token/i.test(name) && !secretEquals(value,psk)))
  try {
    const {error} = await admin.from('call_control_requests').insert({headers,body,decision,caller_facts:facts}).abortSignal(AbortSignal.timeout(1200))
    if(error) console.error('Call-control audit persistence failed')
  } catch { console.error('Call-control audit persistence failed') }
  return json(config.mode === 'live' && config.response_template ? renderResponse(config.response_template,decision.destination) : {})
})
