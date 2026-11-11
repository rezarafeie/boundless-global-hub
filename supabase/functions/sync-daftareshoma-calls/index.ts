import { corsHeaders } from '../_shared/cors.ts'
import { admin, requireInternalOrAdmin, AuthError, dsRequest, normalizeProviderCall, matchCrmRecords, customerNumberOf, resolveAgentByExtension, enrichCall, getSettings, json } from '../_shared/callcenter.ts'
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    await requireInternalOrAdmin(req)
    const body = await req.json().catch(() => ({})), settings = await getSettings()
    // Cron identity is established by the header, never by a JSON flag.
    if (req.headers.has('x-cron-key') && (!settings.enabled || !settings.auto_sync_enabled)) return json({ success: true, skipped: true },200,corsHeaders)
    const { data: state, error: stateError } = await admin.from('daftareshoma_sync_state').select('*').eq('id',1).maybeSingle()
    if (stateError) throw new Error(stateError.message)
    const to = body.to ? new Date(body.to) : new Date()
    const from = body.from ? new Date(body.from) : body.full ? new Date('2020-01-01') : new Date(state?.last_synced_at ? new Date(state.last_synced_at).getTime()-86400000 : Date.now()-7*86400000)
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) throw new AuthError('Invalid date range',400)
    let imported = 0, total = 0
    for (let page = 1; ; page++) {
      const response = await dsRequest('/api/Customize/CustomerCallSearch', { method: 'POST', body: {
        fromDate: from.toISOString().slice(0,10), toDate: to.toISOString().slice(0,10), limit: 100, pagination: page } })
      if (!Array.isArray(response?.data)) throw new Error('Invalid provider page')
      total = Number(response.totalCount)
      for (const raw of response.data) {
        const n = normalizeProviderCall(raw)
        if (!n) throw new Error('Provider call has no identifier')
        const { data: old, error: lookupError } = await admin.from('calls').select('*').eq('provider','daftareshoma').eq('provider_call_id',n.provider_call_id).maybeSingle()
        if (lookupError) throw new Error(lookupError.message)
        const match = settings.auto_lead_matching && old?.link_source !== 'manual' ? await matchCrmRecords(customerNumberOf(n)) : null
        const { customer_name: _name, ...links } = match ?? {}
        const payload: any = { ...n, provider: 'daftareshoma', ended_at: n.ended_at ?? n.started_at,
          ...(match ? { ...links, link_source: 'automatic' } : {}), agent_id: old?.agent_id ?? await resolveAgentByExtension(n.extension) ?? match?.agent_id ?? null }
        if(!n.recording_id && old?.recording_id) payload.recording_id=old.recording_id
        const { data: call, error } = await admin.from('calls').upsert(payload,{onConflict:'provider,provider_call_id'}).select('*').single()
        if (error) throw new Error(error.message)
        await enrichCall(call,settings)
        imported++
      }
      if (!response.data.length || (Number.isFinite(total) && page*100 >= total) || response.data.length < 100) break
      if (page >= 1000) throw new Error('Sync page safety limit reached; cursor not advanced')
    }
    const { error } = await admin.from('daftareshoma_sync_state').update({ last_synced_at: to.toISOString(), last_success_at:new Date().toISOString(), last_attempt_at: new Date().toISOString(), calls_synced: total, last_error: null }).eq('id',1)
    if (error) throw new Error(error.message)
    return json({success:true,imported,providerTotal:total},200,corsHeaders)
  } catch(e) {
    if(!(e instanceof AuthError)) await admin.from('daftareshoma_sync_state').update({last_attempt_at:new Date().toISOString(),last_error:(e as Error).message}).eq('id',1)
    return json({success:false,error:(e as Error).message},e instanceof AuthError ? e.status : 500,corsHeaders)
  }
})
