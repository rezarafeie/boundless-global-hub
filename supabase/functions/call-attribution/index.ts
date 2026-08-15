import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, AuthError, getSettings, phoneTail, json } from '../_shared/callcenter.ts'

/**
 * Phone-assisted revenue attribution.
 * We never claim causality — we report that a paid enrollment happened within
 * the attribution window after one or more answered calls.
 */
async function attributeEnrollment(enrollment: any, windowDays: number) {
  const tail = phoneTail(enrollment.phone)
  if (!tail) return null

  const purchaseAt = new Date(enrollment.updated_at ?? enrollment.created_at)
  const windowStart = new Date(purchaseAt.getTime() - windowDays * 24 * 3600 * 1000)

  const { data: calls } = await admin
    .from('calls')
    .select('id, agent_id, started_at, talk_seconds, status')
    .or(`caller_number_normalized.like.%${tail},destination_number_normalized.like.%${tail}`)
    .eq('status', 'answered')
    .gte('started_at', windowStart.toISOString())
    .lte('started_at', purchaseAt.toISOString())
    .order('started_at', { ascending: true })

  if (!calls?.length) return null

  const talk = calls.reduce((s: number, c: any) => s + (c.talk_seconds ?? 0), 0)
  const last = calls[calls.length - 1]

  const record = {
    enrollment_id: enrollment.id,
    user_phone_normalized: tail,
    phone_assisted_sale: true,
    last_call_before_purchase: last.id,
    agent_id: last.agent_id,
    calls_before_purchase: calls.length,
    talk_time_before_purchase: talk,
    first_call_at: calls[0].started_at,
    last_call_at: last.started_at,
    purchase_at: purchaseAt.toISOString(),
    amount: enrollment.payment_amount ?? 0,
    attribution_window_days: windowDays,
  }

  await admin.from('call_attributions').upsert(record, { onConflict: 'enrollment_id' })
  await admin.from('calls').update({ resulted_in_sale: true }).in('id', calls.map((c: any) => c.id))
  return record
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.internal && !body.cron) {
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.analytics')
    }

    const settings = await getSettings()
    const windowDays = Number(body.windowDays ?? settings.attribution_window_days ?? 7)
    const lookbackDays = Number(body.lookbackDays ?? 3)

    let query = admin
      .from('enrollments')
      .select('id, phone, payment_amount, payment_status, created_at, updated_at')
      .in('payment_status', ['completed', 'success'])
      .order('updated_at', { ascending: false })
      .limit(500)

    if (body.enrollmentId) query = admin
      .from('enrollments')
      .select('id, phone, payment_amount, payment_status, created_at, updated_at')
      .eq('id', body.enrollmentId)
    else query = query.gte('updated_at', new Date(Date.now() - lookbackDays * 24 * 3600 * 1000).toISOString())

    const { data: enrollments } = await query

    let attributed = 0
    for (const e of enrollments ?? []) {
      const r = await attributeEnrollment(e, windowDays)
      if (r) attributed++
    }

    return json({ success: true, scanned: enrollments?.length ?? 0, attributed }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
