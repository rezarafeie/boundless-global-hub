import { corsHeaders } from '../_shared/cors.ts'
import { admin, requireInternalOrAdmin, AuthError, dsRequest, normalizeProviderCall, matchCrmRecords, customerNumberOf, resolveAgentByExtension, enrichCall, getSettings, json } from '../_shared/callcenter.ts'

/**
 * Bounded DaftareShoma import. Each run:
 *  1. imports yesterday + today (new calls arrive fast), then
 *  2. continues the history backfill from a saved day/page cursor,
 * and stops starting new pages after a time budget so it never hits the function timeout.
 */
const BUDGET_MS = 90_000
const PAGE = 100
const day = (d: Date) => d.toISOString().slice(0, 10)

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const started = Date.now()
  const timeLeft = () => BUDGET_MS - (Date.now() - started)
  try {
    await requireInternalOrAdmin(req)
    const body = await req.json().catch(() => ({})), settings = await getSettings()
    if (req.headers.has('x-cron-key') && (!settings.enabled || !settings.auto_sync_enabled)) return json({ success: true, skipped: true }, 200, corsHeaders)
    const { data: state, error: stateError } = await admin.from('daftareshoma_sync_state').select('*').eq('id', 1).maybeSingle()
    if (stateError) throw new Error(stateError.message)

    let imported = 0

    const importRaw = async (raw: any) => {
      const n = normalizeProviderCall(raw)
      if (!n) return
      const { data: old, error: lookupError } = await admin.from('calls').select('agent_id, link_source, recording_id').eq('provider', 'daftareshoma').eq('provider_call_id', n.provider_call_id).maybeSingle()
      if (lookupError) throw new Error(lookupError.message)
      const match = settings.auto_lead_matching && old?.link_source !== 'manual' ? await matchCrmRecords(customerNumberOf(n)) : null
      const { customer_name: _name, ...links } = match ?? {}
      const payload: any = { ...n, provider: 'daftareshoma', ended_at: n.ended_at ?? n.started_at,
        ...(match ? { ...links, link_source: 'automatic' } : {}), agent_id: old?.agent_id ?? await resolveAgentByExtension(n.extension) ?? match?.agent_id ?? null }
      if (!n.recording_id && old?.recording_id) payload.recording_id = old.recording_id
      const { data: call, error } = await admin.from('calls').upsert(payload, { onConflict: 'provider,provider_call_id' }).select('*').single()
      if (error) throw new Error(error.message)
      await enrichCall(call, settings)
      imported++
    }

    /** Imports pages of a date range starting at `page`; returns {done, nextPage, total}. */
    const importRange = async (from: string, to: string, page: number) => {
      let total = 0
      while (timeLeft() > 20_000) {
        const response = await dsRequest('/api/Customize/CustomerCallSearch', { method: 'POST', body: { fromDate: from, toDate: to, limit: PAGE, pagination: page } })
        if (!Array.isArray(response?.data)) throw new Error('Invalid provider page')
        total = Number(response.totalCount)
        // Calls are processed 5 at a time to keep each page short.
        const rows = response.data as any[]
        for (let i = 0; i < rows.length; i += 5) await Promise.all(rows.slice(i, i + 5).map(importRaw))
        if (!rows.length || rows.length < PAGE || (Number.isFinite(total) && page * PAGE >= total)) return { done: true, nextPage: 1, total }
        page++
      }
      return { done: false, nextPage: page, total }
    }

    // Explicit manual range: bounded, reports whether it finished.
    if (body.from || body.to) {
      const from = new Date(body.from ?? Date.now() - 7 * 86400000), to = new Date(body.to ?? Date.now())
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) throw new AuthError('Invalid date range', 400)
      const r = await importRange(day(from), day(to), Number(body.page) || 1)
      return json({ success: true, imported, providerTotal: r.total, complete: r.done, nextPage: r.done ? null : r.nextPage }, 200, corsHeaders)
    }

    // 1) Recent calls first.
    const now = new Date()
    const recent = await importRange(day(new Date(now.getTime() - 86400000)), day(now), 1)

    // 2) History backfill, one day at a time from the saved cursor up to yesterday.
    const yesterday = day(new Date(now.getTime() - 86400000))
    let cursor: string | null = state?.backfill_date ?? null
    let cursorPage: number = state?.backfill_page ?? 1
    if (body.full) { cursor = '2020-01-01'; cursorPage = 1 }
    let daysDone = 0
    while (cursor && cursor < yesterday && timeLeft() > 20_000) {
      const r = await importRange(cursor, cursor, cursorPage)
      if (!r.done) { cursorPage = r.nextPage; break }
      const next = new Date(cursor + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1)
      cursor = day(next); cursorPage = 1; daysDone++
      await admin.from('daftareshoma_sync_state').update({ backfill_date: cursor, backfill_page: 1 }).eq('id', 1)
    }
    const backfillDone = !cursor || cursor >= yesterday

    const { error } = await admin.from('daftareshoma_sync_state').update({
      backfill_date: cursor, backfill_page: cursorPage,
      ...(recent.done ? { last_synced_at: now.toISOString(), last_success_at: now.toISOString(), last_error: null } : {}),
      last_attempt_at: now.toISOString(),
    }).eq('id', 1)
    if (error) throw new Error(error.message)
    return json({ success: true, imported, recentComplete: recent.done, backfillDate: cursor, backfillDone, daysDone }, 200, corsHeaders)
  } catch (e) {
    if (!(e instanceof AuthError)) await admin.from('daftareshoma_sync_state').update({ last_attempt_at: new Date().toISOString(), last_error: (e as Error).message }).eq('id', 1)
    return json({ success: false, error: (e as Error).message }, e instanceof AuthError ? e.status : 500, corsHeaders)
  }
})
