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

  if (settings.notifications_enabled && call.agent_id) {
    await admin.from('notifications').insert({
      title: 'تماس از دست رفته',
      message: `تماس بی‌پاسخ از ${call.caller_number ?? 'نامشخص'} — نیاز به پیگیری`,
      notification_type: 'floating',
      color: '#dc2626',
      priority: priority === 'critical' ? 3 : 2,
      is_active: true,
    }).then(() => {}, () => {})
  }
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
  const fromStr = since.toISOString()
  const toStr = now.toISOString()
  // many DaftareShoma deployments reject ISO-8601 with 'Z' and return 500
  const sqlFmt = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
  const dayFmt = (d: Date) => d.toISOString().slice(0, 10)
  const fromSql = sqlFmt(since), toSql = sqlFmt(now)
  const fromDay = dayFmt(since), toDay = dayFmt(now)
  const fromEpoch = Math.floor(since.getTime() / 1000), toEpoch = Math.floor(now.getTime() / 1000)

  let records: Record<string, any>[] = []
  let attempts: any[] = []
  try {
    const res = await dsTryEndpoints([
      { path: '/api/v1/CallReport/GetCallReports', query: { fromDate: fromSql, toDate: toSql, pageNumber: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/CallReport/GetCallReports', query: { fromDate: fromDay, toDate: toDay, pageNumber: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/CallReport/GetCallReports', query: { fromDate: fromStr, toDate: toStr, pageNumber: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/CallReport', query: { from: fromSql, to: toSql, page: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/CallReport', query: { from: fromEpoch, to: toEpoch, page: 1, pageSize: PAGE_SIZE } },
      { path: '/api/CallReport/List', query: { startDate: fromSql, endDate: toSql, page: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/Call/Reports', query: { from: fromSql, to: toSql, page: 1, pageSize: PAGE_SIZE } },
      { path: '/api/v1/CallReport/GetCallReports', query: { pageNumber: 1, pageSize: PAGE_SIZE } },
    ])
    records = extractRecords(res.data)
    attempts = res.attempts
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
    const status = e instanceof AuthError ? e.status : e instanceof ProviderError ? 502 : 500
    console.error('sync error', e)
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
