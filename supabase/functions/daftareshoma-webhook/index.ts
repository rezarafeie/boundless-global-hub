import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, normalizeProviderCall, matchCrmRecords, customerNumberOf,
  resolveAgentByExtension, getSettings, json,
} from '../_shared/callcenter.ts'

/**
 * Public webhook receiver for DaftareShoma call events.
 * Stores the raw event FIRST, then does light-weight mapping.
 * Heavy work (recording download / transcription / AI) is dispatched async.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let raw: any = null
  try {
    raw = await req.json()
  } catch {
    const text = await req.text().catch(() => '')
    raw = { body: text }
  }

  const secret = Deno.env.get('DAFTARESHOMA_WEBHOOK_SECRET')
  if (secret) {
    const provided = req.headers.get('x-webhook-secret') || new URL(req.url).searchParams.get('secret')
    if (provided !== secret) {
      return json({ success: false, error: 'unauthorized' }, 401, corsHeaders)
    }
  }

  const eventType = String(raw?.event ?? raw?.eventType ?? raw?.type ?? raw?.EventName ?? raw?.eventName ?? 'call.update')
  const ev = eventType.toLowerCase()

  // DaftareShoma live event taxonomy:
  //  call.incoming.started / call.incoming.transferstarted / call.incoming.transfercompleted
  //  call.incoming.ended / call.outgoing.ended
  const isIncomingEvent = /incoming|ورودی/.test(ev)
  const isStart = /started$|\.started|ringing|incoming\.start/.test(ev) && !/transfer/.test(ev)
  const isTransfer = /transfer/.test(ev)
  const isEnd = /ended|end$|hangup|complete|finish/.test(ev)
  const isLive = (isStart || isTransfer) && !isEnd
  const providerEventId = raw?.eventId ?? raw?.event_id ?? null

  // 1. persist raw event (idempotent on provider_event_id)
  const { data: event, error: eventError } = await admin
    .from('call_events')
    .insert({
      provider_event_id: providerEventId ? String(providerEventId) : null,
      event_type: eventType,
      payload: raw ?? {},
      status: 'received',
    })
    .select('id')
    .maybeSingle()

  if (eventError && eventError.code === '23505') {
    return json({ success: true, duplicate: true }, 200, corsHeaders) // already processed
  }

  try {
    const settings = await getSettings()
    const source = raw?.call ?? raw?.data ?? raw ?? {}
    const n = normalizeProviderCall(source)
    if (!n) {
      await admin.from('call_events').update({ status: 'ignored', processed_at: new Date().toISOString() }).eq('id', event?.id)
      return json({ success: true, ignored: true }, 200, corsHeaders)
    }

    const { data: existing } = await admin
      .from('calls')
      .select('id, disposition, recording_id, agent_id, status')
      .eq('provider', 'daftareshoma')
      .eq('provider_call_id', n.provider_call_id)
      .maybeSingle()

    const customerNumber = customerNumberOf(n)
    const match = settings.auto_lead_matching ? await matchCrmRecords(customerNumber) : null
    const agentId = existing?.agent_id ?? (await resolveAgentByExtension(n.extension)) ?? match?.agent_id ?? null

    const payload: Record<string, unknown> = {
      ...n,
      provider: 'daftareshoma',
      agent_id: agentId,
      user_id: match?.user_id ?? null,
      lead_id: match?.lead_id ?? null,
      consultation_id: match?.consultation_id ?? null,
      webinar_registration_id: match?.webinar_registration_id ?? null,
      order_id: match?.order_id ?? null,
      match_confidence: match?.match_confidence ?? 'unknown',
    }
    if (existing?.disposition) delete (payload as any).disposition

    // Live (ringing / in-progress) events: the provider sends no duration or
    // disposition yet, so force a live status instead of the "no_answer"
    // default that the historical normalizer produces.
    if (isLive) {
      payload.status = isTransfer ? 'answered' : 'ringing'
      payload.direction = isIncomingEvent ? 'incoming' : (n.direction === 'unknown' ? 'outgoing' : n.direction)
      payload.started_at = n.started_at ?? new Date().toISOString()
      payload.ended_at = null
      if (isTransfer) payload.answered_at = n.answered_at ?? new Date().toISOString()
    } else if (isEnd && !payload.ended_at) {
      payload.ended_at = new Date().toISOString()
    }

    const { data: call } = await admin
      .from('calls')
      .upsert(payload, { onConflict: 'provider,provider_call_id' })
      .select('*')
      .maybeSingle()

    if (call) {
      await admin.from('call_events').update({
        call_id: call.id,
        status: 'processed',
        processed_at: new Date().toISOString(),
      }).eq('id', event?.id)

      // Missed call
      const finished = /end|hangup|complete|finish/i.test(eventType) || !!n.ended_at
      if (finished && settings.auto_missed_call_followup && call.direction === 'incoming' && call.status !== 'answered') {
        const { data: dup } = await admin.from('call_followups').select('id').eq('call_id', call.id).maybeSingle()
        if (!dup) {
          await admin.from('call_followups').insert({
            call_id: call.id,
            user_id: call.user_id,
            lead_id: call.lead_id,
            agent_id: call.agent_id,
            type: 'missed_call',
            status: 'pending',
            priority: call.lead_id ? 'high' : 'medium',
            title: 'بازگشت تماس از دست رفته',
            description: `تماس بی‌پاسخ از ${call.caller_number ?? 'نامشخص'}`,
            due_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            created_by: 'webhook',
          })
        }
      }

      // Recording metadata is stored with the call, but the actual recording
      // URL/file is fetched lazily when an admin opens the call detail page.
    }

    return json({ success: true }, 200, corsHeaders)
  } catch (e) {
    console.error('webhook processing error', e)
    if (event?.id) {
      await admin.from('call_events').update({
        status: 'failed',
        error: (e as Error).message,
        processed_at: new Date().toISOString(),
      }).eq('id', event.id)
    }
    // Always 200 so the provider does not hammer us; the event is stored for retry.
    return json({ success: false, stored: true, error: (e as Error).message }, 200, corsHeaders)
  }
})
