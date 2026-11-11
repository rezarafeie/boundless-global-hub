import { admin, secretEquals, normalizeProviderCall, matchCrmRecords, customerNumberOf, resolveAgentByExtension, enrichCall, getSettings, json } from '../_shared/callcenter.ts'
Deno.serve(async req => {
  if (!secretEquals(req.headers.get('x-webhook-secret') || new URL(req.url).searchParams.get('secret'),Deno.env.get('DAFTARESHOMA_WEBHOOK_SECRET'))) return json({error:'unauthorized'},401)
  let eventId: string | undefined
  try {
    const raw = await req.json()
    const type = String(raw.EventType ?? raw.eventType ?? raw.event ?? raw.EventName ?? raw.eventName ?? raw.type ?? '')
    const providerId = raw.EventId ?? raw.eventId ?? raw.event_id
    const { data: event, error: eventError } = await admin.from('call_events').insert({provider_event_id:providerId ? String(providerId) : null,event_type:type,payload:raw,status:'received'}).select('id').single()
    if (eventError) {
      if (eventError.code !== '23505' || !providerId) throw new Error(eventError.message)
      const {data:previous,error} = await admin.from('call_events').select('id,status').eq('provider_event_id',String(providerId)).single()
      if (error) throw new Error(error.message)
      if (previous.status !== 'failed') return json({success:true,duplicate:true})
      eventId = previous.id
    } else eventId = event.id
    const source = raw.call ?? raw.data ?? raw.Data ?? raw
    const n = normalizeProviderCall(source)
    if (!n) throw new Error('Missing call identifier')
    const at = new Date(raw.Timestamp ?? raw.timestamp ?? raw.eventTime ?? n.ended_at ?? n.answered_at ?? n.started_at ?? Date.now()).toISOString()
    const end = /Call(Incoming|Outgoing)Ended/i.test(type) || /ended$|hangup/i.test(type)
    const transfer = /transfer/i.test(type)
    const {data:old,error:lookupError} = await admin.from('calls').select('*').eq('provider','daftareshoma').eq('provider_call_id',n.provider_call_id).maybeSingle()
    if (lookupError) throw new Error(lookupError.message)
    const stale = old && ((old.last_event_at && old.last_event_at > at) || (old.ended_at && !end) || (!end && ['answered','in_progress'].includes(old.status) && !transfer))
    if (!stale) {
      const settings = await getSettings()
      const match = settings.auto_lead_matching && old?.link_source !== 'manual' ? await matchCrmRecords(customerNumberOf(n)) : null
      const {customer_name:_name,...links} = match ?? {}
      const payload:any = {...n,provider:'daftareshoma',last_event_at:at,
        direction:/incoming/i.test(type) ? 'incoming' : /outgoing/i.test(type) ? 'outgoing' : n.direction,
        status:end ? n.status : transfer ? 'answered' : 'ringing',
        started_at:old?.started_at ?? n.started_at ?? at, ended_at:end ? n.ended_at ?? at : null,
        ...(match ? {...links,link_source:'automatic'} : {}),
        agent_id:old?.agent_id ?? await resolveAgentByExtension(n.extension) ?? match?.agent_id ?? null}
      if (old?.status === 'answered') payload.status = 'answered'
      if (!payload.recording_id && old?.recording_id) payload.recording_id = old.recording_id
      let q = old ? admin.from('calls').update(payload).eq('id',old.id) : admin.from('calls').insert(payload)
      if (old) q = old.last_event_at ? q.eq('last_event_at',old.last_event_at) : q.is('last_event_at',null)
      const {data:call,error} = await q.select('*').maybeSingle()
      if (error) throw new Error(error.message)
      if (!call) throw new Error('Concurrent event update; retry event')
      await enrichCall(call,settings)
      const {error:eventUpdateError} = await admin.from('call_events').update({call_id:call.id}).eq('id',eventId)
      if(eventUpdateError) throw new Error(eventUpdateError.message)
    }
    const {error} = await admin.from('call_events').update({status:'processed',processed_at:new Date().toISOString()}).eq('id',eventId)
    if(error) throw new Error(error.message)
    return json({success:true})
  } catch(e) {
    if(eventId) await admin.from('call_events').update({status:'failed'}).eq('id',eventId)
    return json({success:false,error:(e as Error).message},500)
  }
})
