import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, AuthError, dsTryEndpoints, ProviderError,
  normalizeProviderCall, matchCrmRecords, customerNumberOf, resolveAgentByExtension,
  getSettings, invokeFn, json,
} from '../_shared/callcenter.ts'

const PAGE_SIZE = 200

function extractRecords(data: any): Record<string, any>[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  for (const key of ['items', 'data', 'result', 'results', 'records', 'callReports', 'list']) {
    const v = data[key]
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v.items)) return v.items
    if (v && Array.isArray(v.data)) return v.data
  }
  return []
}

async function createMissedCallFollowup(call: any, settings: any, priorityOverride?: string) {
  const { data: existing } = await admin
    .from('call_followups')
    .select('id')
    .eq('call_id', call.id)
    .neq('status', 'cancelled')
    .maybeSingle()
  if (existing) return

  let priority = priorityOverride ?? 'medium'
  if (!priorityOverride) {
    const rules = settings.missed_call_priority_rules ?? {}
    if (call.order_id) priority = rules.existing_customer ?? 'medium'
    if (call.webinar_registration_id) priority = rules.recent_webinar ?? 'high'
    if (call.consultation_id) priority = rules.active_consultation ?? 'high'
    if (call.lead_id && !call.order_id) priority = rules.active_checkout ?? 'critical'
    if (!call.user_id && !call.lead_id) priority = rules.unknown ?? 'medium'
  }

  await admin.from('call_followups').insert({
    call_id: call.id,
    user_id: call.user_id,
    lead_id: call.lead_id,
    agent_id: call.agent_id,
    type: 'missed_call',
    status: 'pending',
    priority,
    title: 'بازگشت تماس از دست رفته',
    description: `تماس بی‌پاسخ از ${call.caller_number ?? 'نامشخص'}`,
    due_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_by: 'automation',
  })

  // NOTE: never insert into public `notifications` — that table is a site-wide
  // banner feed visible to every visitor. Missed calls surface to the owning
  // agent through `call_followups` inside the Call Center dashboard instead.
}

async function runSync(ctx: any, opts: { full?: boolean } = {}) {
  const settings = await getSettings()
  const { data: state } = await admin.from('daftareshoma_sync_state').select('*').eq('id', 1).maybeSingle()

  await admin.from('daftareshoma_sync_state').update({ last_attempt_at: new Date().toISOString() }).eq('id', 1)

  const since = opts.full
    ? new Date(Date.now() - 30 * 24 * 3600 * 1000)
    : state?.last_synced_at
      ? new Date(new Date(state.last_synced_at).getTime() - 10 * 60 * 1000) // 10 min overlap
      : new Date(Date.now() - 3 * 24 * 3600 * 1000)

  const now = new Date()
  // query a bit into the future so provider-side clock / timezone drift never
  // truncates the newest calls
  const until = new Date(now.getTime() + 24 * 3600 * 1000)
  const fromStr = since.toISOString()
  const toStr = now.toISOString()
  // documented API: POST /api/Customize/CustomerCallSearch
  // provider dates are naive Tehran local time
  const isoFmt = (d: Date) => tehranNaive(d)
  const sqlFmt = (d: Date) => tehranNaive(d, ' ')
  const dayFmt = (d: Date) => tehranNaive(d).slice(0, 10)

  const SEARCH_PATH = '/api/Customize/CustomerCallSearch'

  let records: Record<string, any>[] = []
  let attempts: any[] = []
  try {
    const res = await dsTryEndpoints([
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: isoFmt(since), toDate: isoFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: sqlFmt(since), toDate: sqlFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: dayFmt(since), toDate: dayFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { limit: PAGE_SIZE, pagination: 1 } },
    ])

    records = extractRecords(res.data)
    attempts = res.attempts

    // page through remaining results using the same accepted body shape
    const accepted = (res as any).body ?? null
    const totalCount = Number(res.data?.totalCount ?? 0)
    if (records.length && totalCount > records.length) {
      const maxPages = Math.min(25, Math.ceil(totalCount / PAGE_SIZE))
      for (let page = 2; page <= maxPages; page++) {
        try {
          const next = await dsTryEndpoints([
            { path: SEARCH_PATH, method: 'POST', body: { ...(accepted ?? { fromDate: isoFmt(since), toDate: isoFmt(now) }), limit: PAGE_SIZE, pagination: page } },
          ])
          const chunk = extractRecords(next.data)
          if (!chunk.length) break
          records = records.concat(chunk)
        } catch { break }
      }
    }
  } catch (e) {
    const pe = e as ProviderError
    attempts = (pe as any).attempts ?? []
    await admin.from('daftareshoma_sync_state')
      .update({ last_error: `${pe.message} — ${JSON.stringify(attempts).slice(0, 800)}` })
      .eq('id', 1)
    ;(pe as any).attempts = attempts
    throw pe
  }


  let inserted = 0
  let updated = 0
  let latest = state?.last_synced_at ? new Date(state.last_synced_at) : since
  let lastCallId = state?.last_call_id ?? null

  for (const rec of records) {
    const n = normalizeProviderCall(rec)
    if (!n) continue

    const { data: existing } = await admin
      .from('calls')
      .select('id, status, recording_id, processing_status, disposition, user_id, lead_id, agent_id, notes')
      .eq('provider', 'daftareshoma')
      .eq('provider_call_id', n.provider_call_id)
      .maybeSingle()

    const customerNumber = customerNumberOf(n)
    const match = settings.auto_lead_matching ? await matchCrmRecords(customerNumber) : null
    const agentId = (existing?.agent_id ?? null) || (await resolveAgentByExtension(n.extension)) || match?.agent_id || null

    const payload: Record<string, unknown> = {
      ...n,
      provider: 'daftareshoma',
      agent_id: agentId,
      user_id: match?.user_id ?? existing?.user_id ?? null,
      lead_id: match?.lead_id ?? existing?.lead_id ?? null,
      consultation_id: match?.consultation_id ?? null,
      webinar_registration_id: match?.webinar_registration_id ?? null,
      order_id: match?.order_id ?? null,
      match_confidence: match?.match_confidence ?? 'unknown',
    }
    // never overwrite human input
    if (existing?.disposition) delete (payload as any).disposition

    const { data: saved } = await admin
      .from('calls')
      .upsert(payload, { onConflict: 'provider,provider_call_id' })
      .select('*')
      .maybeSingle()

    if (!saved) continue
    if (existing) updated++
    else inserted++

    if (n.started_at && new Date(n.started_at) > latest) {
      latest = new Date(n.started_at)
      lastCallId = n.provider_call_id
    }

    const isNewlyFinished = !existing || existing.status !== saved.status

    // Missed-call automation
    if (settings.auto_missed_call_followup && saved.direction === 'incoming' && saved.status !== 'answered' && isNewlyFinished) {
      await createMissedCallFollowup(saved, settings)
    }

    // Recording pipeline
    if (settings.recording_sync_enabled && saved.recording_id && (!existing || !existing.recording_id)) {
      invokeFn('process-call-recording', { callId: saved.id })
    }
  }

  await admin.from('daftareshoma_sync_state').update({
    last_synced_at: latest.toISOString(),
    last_call_id: lastCallId,
    last_success_at: new Date().toISOString(),
    last_error: null,
    calls_synced: (state?.calls_synced ?? 0) + inserted,
  }).eq('id', 1)

  if (ctx) await audit(ctx, 'integration.sync_now', 'daftareshoma', null, { inserted, updated, fetched: records.length })

  return { fetched: records.length, inserted, updated, from: fromStr, to: toStr }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    // cron / internal invocation
    if (body.internal || body.cron) {
      const result = await runSync(null, { full: !!body.full })
      return json({ success: true, ...result }, 200, corsHeaders)
    }

    const ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.admin')
    const result = await runSync(ctx, { full: !!body.full })
    return json({ success: true, ...result }, 200, corsHeaders)
  } catch (e) {
    console.error('sync error', e)
    if (e instanceof AuthError) {
      return json({ success: false, error: e.message }, e.status, corsHeaders)
    }
    // provider/runtime failures are reported as 200 so the admin UI can show a
    // readable diagnostic instead of a 502 that breaks the page
    return json({
      success: false,
      error: (e as Error).message,
      provider_status: e instanceof ProviderError ? e.status : null,
      attempts: (e as any).attempts ?? [],
    }, 200, corsHeaders)

  }
})
