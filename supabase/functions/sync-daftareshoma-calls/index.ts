import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, AuthError, dsTryEndpoints, ProviderError,
  normalizeProviderCall, matchCrmRecords, customerNumberOf, resolveAgentByExtension,
  getSettings, json,
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

function extractTotal(data: any): number | null {
  const candidates = [
    data?.totalCount, data?.TotalCount, data?.total, data?.Total,
    data?.count, data?.Count, data?.totalRecords, data?.TotalRecords,
    data?.data?.totalCount, data?.data?.TotalCount, data?.data?.totalRecords,
    data?.result?.totalCount, data?.result?.TotalCount, data?.result?.totalRecords,
  ]
  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return null
}

async function runSync(ctx: any, opts: { full?: boolean; from?: string; to?: string; allTimeCount?: boolean } = {}) {
  const settings = await getSettings()
  const { data: state } = await admin.from('daftareshoma_sync_state').select('*').eq('id', 1).maybeSingle()

  if (opts.allTimeCount) {
    const { count: storedCount } = await admin.from('calls').select('id', { count: 'exact', head: true }).eq('provider', 'daftareshoma')
    if ((state?.calls_synced ?? 0) > (storedCount ?? 0)) {
      return { providerTotal: state.calls_synced, stored: storedCount ?? 0, counted: false }
    }
  }

  await admin.from('daftareshoma_sync_state').update({ last_attempt_at: new Date().toISOString() }).eq('id', 1)

  // the stored cursor can drift; never start later than the newest stored call
  const { data: newestCall } = await admin
    .from('calls').select('started_at').eq('provider', 'daftareshoma')
    .order('started_at', { ascending: false }).limit(1).maybeSingle()
  const cursorCandidates = [state?.last_synced_at, newestCall?.started_at]
    .filter(Boolean).map((v) => new Date(v as string).getTime())
  const cursor = cursorCandidates.length ? Math.min(...cursorCandidates) : null

  const requestedFrom = opts.from ? new Date(opts.from) : null
  const requestedTo = opts.to ? new Date(opts.to) : null
  if (requestedFrom && Number.isNaN(requestedFrom.getTime())) throw new Error('تاریخ شروع معتبر نیست')
  if (requestedTo && Number.isNaN(requestedTo.getTime())) throw new Error('تاریخ پایان معتبر نیست')

  const since = requestedFrom ?? (opts.full
    ? new Date(Date.now() - 30 * 24 * 3600 * 1000)
    : cursor
      ? new Date(cursor - 60 * 60 * 1000) // 1h overlap
      : new Date(Date.now() - 3 * 24 * 3600 * 1000))


  const now = new Date()
  // query a bit into the future so provider-side clock / timezone drift never
  // truncates the newest calls
  const until = requestedTo ?? new Date(now.getTime() + 24 * 3600 * 1000)
  const fromStr = since.toISOString()
  const toStr = now.toISOString()
  // documented API: POST /api/Customize/CustomerCallSearch
  // provider timestamps are naive **UTC** (persianTime is the Tehran rendering),
  // so the search window must be expressed in UTC too — sending Tehran local
  // time pushed the lower bound 3.5h into the future and hid the newest calls.
  const isoFmt = (d: Date) => d.toISOString().slice(0, 19)
  const sqlFmt = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
  const dayFmt = (d: Date) => d.toISOString().slice(0, 10)

  const SEARCH_PATH = '/api/Customize/CustomerCallSearch'

  let records: Record<string, any>[] = []
  let attempts: any[] = []
  try {
    const allTimeBody = { limit: opts.allTimeCount ? 1 : PAGE_SIZE, pagination: 1 }
    const res = await dsTryEndpoints(opts.allTimeCount ? [
      { path: SEARCH_PATH, method: 'POST', body: allTimeBody },
    ] : [
      // Omitting number, status and type fields means ALL numbers, statuses and
      // call types in DaftareShoma. Empty values are not sent because some API
      // versions interpret them as literal filters.
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: isoFmt(since), toDate: isoFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: sqlFmt(since), toDate: sqlFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { fromDate: dayFmt(since), toDate: dayFmt(until), limit: PAGE_SIZE, pagination: 1 } },
      { path: SEARCH_PATH, method: 'POST', body: { limit: PAGE_SIZE, pagination: 1 } },
    ])

    records = extractRecords(res.data)
    attempts = res.attempts

    const providerTotal = extractTotal(res.data)
    if (opts.allTimeCount) {
      if (providerTotal === null) throw new Error('تعداد کل تماس‌ها در پاسخ دفترشما موجود نبود')
      const { count: storedCount } = await admin.from('calls').select('id', { count: 'exact', head: true }).eq('provider', 'daftareshoma')
      // calls_synced is the persisted provider total. Future incremental syncs
      // add newly inserted calls to this baseline without recounting history.
      await admin.from('daftareshoma_sync_state').update({
        calls_synced: Math.max(providerTotal, storedCount ?? 0),
        last_success_at: new Date().toISOString(),
        last_error: null,
      }).eq('id', 1)
      return { providerTotal, stored: storedCount ?? 0, counted: true }
    }

    // Always paginate until a short/empty page. Older provider responses do
    // not consistently expose totalCount (or vary its casing/nesting).
    const accepted = (res as any).body ?? null
    if (records.length) {
      const totalCount = extractTotal(res.data)
      const maxPages = totalCount ? Math.min(500, Math.ceil(totalCount / PAGE_SIZE)) : 500
      for (let page = 2; page <= maxPages; page++) {
        try {
          const next = await dsTryEndpoints([
            { path: SEARCH_PATH, method: 'POST', body: { ...(accepted ?? { fromDate: isoFmt(since), toDate: isoFmt(until) }), limit: PAGE_SIZE, pagination: page } },
          ])
          const chunk = extractRecords(next.data)
          if (!chunk.length) break
          records = records.concat(chunk)
          if (chunk.length < PAGE_SIZE) break
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

  // De-duplicate provider pages before writing.
  const normalized = [...new Map(records.map((rec) => {
    const call = normalizeProviderCall(rec)
    return call ? [call.provider_call_id, call] : [crypto.randomUUID(), null]
  })).values()].filter(Boolean) as NonNullable<ReturnType<typeof normalizeProviderCall>>[]

  // Large historical/range imports use batched writes. CRM enrichment remains
  // in the lightweight incremental path and recordings are always lazy.
  if (normalized.length > 400 || requestedFrom) {
    for (let offset = 0; offset < normalized.length; offset += PAGE_SIZE) {
      const chunk = normalized.slice(offset, offset + PAGE_SIZE)
      const ids = chunk.map((item) => item.provider_call_id)
      const { data: existingRows } = await admin.from('calls').select('provider_call_id').eq('provider', 'daftareshoma').in('provider_call_id', ids)
      const existingIds = new Set((existingRows ?? []).map((item: any) => item.provider_call_id))
      const payloads = chunk.map((item) => ({ ...item, provider: 'daftareshoma' }))
      const { error } = await admin.from('calls').upsert(payloads, { onConflict: 'provider,provider_call_id' })
      if (error) throw new Error(`ذخیره تماس‌ها ناموفق بود: ${error.message}`)
      const newCount = ids.filter((id) => !existingIds.has(id)).length
      inserted += newCount
      updated += ids.length - newCount
      for (const item of chunk) {
        if (item.started_at && new Date(item.started_at) > latest) {
          latest = new Date(item.started_at)
          lastCallId = item.provider_call_id
        }
      }
    }
  } else for (const n of normalized) {
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

  }

  await admin.from('daftareshoma_sync_state').update({
    last_synced_at: latest.toISOString(),
    last_call_id: lastCallId,
    last_success_at: new Date().toISOString(),
    last_error: null,
    // Historical period imports are already represented by the one-time
    // provider baseline, so only normal incremental syncs advance that total.
    calls_synced: requestedFrom
      ? Math.max(state?.calls_synced ?? 0, 0)
      : Math.max(state?.calls_synced ?? 0, 0) + inserted,
  }).eq('id', 1)

  if (ctx) await audit(ctx, 'integration.sync_now', 'daftareshoma', null, { inserted, updated, fetched: records.length })

  return { fetched: normalized.length, inserted, updated, from: fromStr, to: toStr }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    // cron / internal invocation
    if (body.internal || body.cron) {
      const result = await runSync(null, { full: !!body.full, from: body.from, to: body.to, allTimeCount: !!body.allTimeCount })
      return json({ success: true, ...result }, 200, corsHeaders)
    }

    const ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.admin')
    const result = await runSync(ctx, { full: !!body.full, from: body.from, to: body.to, allTimeCount: !!body.allTimeCount })
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
