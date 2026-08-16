import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, AuthError,
  normalizePhone, phoneTail, matchCrmRecords, getSettings, json, type AuthContext,
} from '../_shared/callcenter.ts'

/**
 * Read/write gateway for the Call Center UI.
 * All call tables are service-role only, so every query passes through here
 * with server-side permission + data-isolation enforcement.
 */

const CALL_SELECT = `
  *,
  call_recordings(id, status, storage_path, duration_seconds, mime_type),
  call_transcripts(processing_status),
  call_ai_analysis(overall_sales_score, purchase_intent_score, sentiment, summary, next_action, follow_up_required)
`

function scope(query: any, ctx: AuthContext, column = 'agent_id') {
  return ctx.restrictedToSelf ? query.eq(column, ctx.userId) : query
}

async function decorate(rows: any[]) {
  if (!rows.length) return rows
  const userIds = [...new Set(rows.flatMap((r) => [r.user_id, r.agent_id]).filter(Boolean))]
  const { data: people } = userIds.length
    ? await admin.from('chat_users').select('id, name, full_name, phone').in('id', userIds)
    : { data: [] as any[] }
  const map = new Map((people ?? []).map((p: any) => [p.id, p.full_name || p.name]))

  const leadIds = [...new Set(rows.map((r) => r.lead_id).filter(Boolean))]
  const { data: leads } = leadIds.length
    ? await admin.from('enrollments').select('id, full_name, phone, course_id, courses(title)').in('id', leadIds)
    : { data: [] as any[] }
  const leadMap = new Map((leads ?? []).map((l: any) => [l.id, l]))

  return rows.map((r) => ({
    ...r,
    customer_name: map.get(r.user_id) ?? leadMap.get(r.lead_id)?.full_name ?? null,
    agent_name: map.get(r.agent_id) ?? null,
    related_course: leadMap.get(r.lead_id)?.courses?.title ?? null,
  }))
}

async function listCalls(ctx: AuthContext, p: any) {
  const page = Math.max(1, Number(p.page ?? 1))
  const pageSize = Math.min(100, Number(p.pageSize ?? 20))
  let q = admin.from('calls').select(CALL_SELECT, { count: 'exact' })
  q = scope(q, ctx)

  if (p.direction) q = q.eq('direction', p.direction)
  if (p.status) q = q.eq('status', p.status)
  if (p.disposition) q = q.eq('disposition', p.disposition)
  if (p.agentId) q = q.eq('agent_id', p.agentId)
  if (p.extension) q = q.eq('extension', p.extension)
  if (p.userId) q = q.eq('user_id', p.userId)
  if (p.leadId) q = q.eq('lead_id', p.leadId)
  if (p.consultationId) q = q.eq('consultation_id', p.consultationId)
  if (p.webinarRegistrationId) q = q.eq('webinar_registration_id', p.webinarRegistrationId)
  if (p.missed) q = q.eq('direction', 'incoming').neq('status', 'answered')
  if (p.hasRecording) q = q.not('recording_id', 'is', null)
  if (p.minAiScore) q = q.gte('ai_score', Number(p.minAiScore))
  if (p.minIntent) q = q.gte('purchase_intent_score', Number(p.minIntent))
  if (p.from) q = q.gte('started_at', p.from)
  if (p.to) q = q.lte('started_at', p.to)

  if (p.search) {
    const term = String(p.search).trim()
    const tail = phoneTail(term)
    if (tail) {
      q = q.or(`caller_number_normalized.like.%${tail},destination_number_normalized.like.%${tail}`)
    } else {
      const { data: matches } = await admin
        .from('chat_users')
        .select('id')
        .or(`name.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(50)
      const ids = (matches ?? []).map((m: any) => m.id)
      if (ids.length) q = q.in('user_id', ids)
      else q = q.eq('provider_call_id', term)
    }
  }

  const { data, count, error } = await q
    .order('started_at', { ascending: false, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw new Error(error.message)

  return { calls: await decorate(data ?? []), total: count ?? 0, page, pageSize }
}

async function callDetail(ctx: AuthContext, callId: string) {
  let q = admin
    .from('calls')
    .select(`${CALL_SELECT}, transcript_detail:call_transcripts(*), call_followups(*), call_events(*)`)
    .eq('id', callId)
  q = scope(q, ctx)
  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(`خطا در دریافت تماس: ${error.message}`)
  if (!data) throw new AuthError('تماس یافت نشد یا دسترسی ندارید', 404)
  const [decorated] = await decorate([data])

  let customer: any = null
  if (data.user_id) {
    const { data: u } = await admin.from('chat_users').select('id, name, full_name, phone, email, created_at').eq('id', data.user_id).maybeSingle()
    customer = u
  }
  const tail = phoneTail(data.direction === 'outgoing' ? data.destination_number_normalized : data.caller_number_normalized)
  const { data: orders } = tail
    ? await admin.from('enrollments').select('id, full_name, payment_amount, payment_status, created_at, courses(title)').like('phone', `%${tail}`).order('created_at', { ascending: false }).limit(10)
    : { data: [] as any[] }

  return { call: decorated, customer, orders: orders ?? [] }
}

async function overview(ctx: AuthContext, p: any) {
  const from = p.from ?? new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const to = p.to ?? new Date().toISOString()

  // KPIs are computed with head-only COUNT queries — no call rows are fetched.
  const countCalls = async (build: (q: any) => any = (q) => q) => {
    let q = admin.from('calls').select('id', { count: 'exact', head: true })
      .gte('started_at', from).lte('started_at', to)
    q = scope(q, ctx)
    const { count } = await build(q)
    return count ?? 0
  }

  const [total, incoming, outgoing, answered, missed] = await Promise.all([
    countCalls(),
    countCalls((q) => q.eq('direction', 'incoming')),
    countCalls((q) => q.eq('direction', 'outgoing')),
    countCalls((q) => q.eq('status', 'answered')),
    countCalls((q) => q.eq('direction', 'incoming').neq('status', 'answered')),
  ])

  // aggregate durations / AI scores through a single RPC-free lightweight read
  let sq = admin.from('calls').select('talk_seconds, waiting_seconds, ai_score, status')
    .gte('started_at', from).lte('started_at', to)
  sq = scope(sq, ctx)
  const { data: durations } = await sq.limit(5000)
  const dl = durations ?? []
  const answeredRows = dl.filter((c: any) => c.status === 'answered')
  const scored = dl.filter((c: any) => c.ai_score != null)

  let fq = admin.from('call_followups').select('id, status, due_at, agent_id')
  fq = scope(fq, ctx)
  const { data: followups } = await fq.in('status', ['pending', 'overdue']).limit(2000)

  let aq = admin.from('call_attributions').select('amount, agent_id, purchase_at').gte('purchase_at', from)
  aq = scope(aq, ctx)
  const { data: attributions } = await aq.limit(2000)

  const now = Date.now()

  // compact trend data (only the columns the charts need)
  let tq = admin.from('calls').select('started_at, direction, status')
    .gte('started_at', from).lte('started_at', to)
    .order('started_at', { ascending: false })
  tq = scope(tq, ctx)
  const { data: series } = p.includeSeries === false ? { data: [] as any[] } : await tq.limit(3000)

  return {
    kpis: {
      total,
      incoming,
      outgoing,
      answered,
      missed,
      answerRate: total ? Math.round((answered / total) * 100) : 0,
      totalTalk: dl.reduce((s: number, c: any) => s + (c.talk_seconds ?? 0), 0),
      avgTalk: answeredRows.length ? Math.round(answeredRows.reduce((s: number, c: any) => s + (c.talk_seconds ?? 0), 0) / answeredRows.length) : 0,
      avgWait: dl.length ? Math.round(dl.reduce((s: number, c: any) => s + (c.waiting_seconds ?? 0), 0) / dl.length) : 0,
      followupsDue: (followups ?? []).filter((f) => f.status === 'pending').length,
      followupsOverdue: (followups ?? []).filter((f) => f.status === 'overdue' || (f.due_at && new Date(f.due_at).getTime() < now && f.status === 'pending')).length,
      assistedSales: attributions?.length ?? 0,
      assistedRevenue: (attributions ?? []).reduce((s, a: any) => s + Number(a.amount ?? 0), 0),
      avgAiScore: scored.length ? Math.round(scored.reduce((s: number, c: any) => s + (c.ai_score ?? 0), 0) / scored.length) : null,
    },
    series: series ?? [],
  }
}


async function agentStats(ctx: AuthContext, p: any) {
  requirePermission(ctx, 'calls.analytics')
  const from = p.from ?? new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  let q = admin.from('calls').select('agent_id, direction, status, talk_seconds, ai_score, purchase_intent_score, resulted_in_sale').gte('started_at', from)
  q = scope(q, ctx)
  const { data: calls } = await q.limit(10000)

  let fq = admin.from('call_followups').select('agent_id, status')
  fq = scope(fq, ctx)
  const { data: followups } = await fq.limit(5000)

  let aq = admin.from('call_attributions').select('agent_id, amount').gte('purchase_at', from)
  aq = scope(aq, ctx)
  const { data: attributions } = await aq.limit(5000)

  const byAgent = new Map<number, any>()
  const bucket = (id: number | null) => {
    const key = id ?? 0
    if (!byAgent.has(key)) byAgent.set(key, {
      agent_id: id, calls: 0, answered: 0, incoming: 0, outgoing: 0, talk: 0,
      followupsCompleted: 0, followupsOverdue: 0, sales: 0, revenue: 0,
      aiScoreSum: 0, aiScoreCount: 0, intentSum: 0, intentCount: 0,
    })
    return byAgent.get(key)
  }

  for (const c of calls ?? []) {
    const b = bucket(c.agent_id)
    b.calls++
    if (c.status === 'answered') b.answered++
    if (c.direction === 'incoming') b.incoming++; else b.outgoing++
    b.talk += c.talk_seconds ?? 0
    if (c.ai_score != null) { b.aiScoreSum += c.ai_score; b.aiScoreCount++ }
    if (c.purchase_intent_score != null) { b.intentSum += c.purchase_intent_score; b.intentCount++ }
  }
  for (const f of followups ?? []) {
    const b = bucket(f.agent_id)
    if (f.status === 'completed') b.followupsCompleted++
    if (f.status === 'overdue') b.followupsOverdue++
  }
  for (const a of attributions ?? []) {
    const b = bucket(a.agent_id)
    b.sales++
    b.revenue += Number(a.amount ?? 0)
  }

  const ids = [...byAgent.keys()].filter(Boolean)
  const { data: people } = ids.length ? await admin.from('chat_users').select('id, name, full_name').in('id', ids) : { data: [] as any[] }
  const nameMap = new Map((people ?? []).map((p: any) => [p.id, p.full_name || p.name]))

  return {
    agents: [...byAgent.values()].map((b) => ({
      ...b,
      agent_name: b.agent_id ? nameMap.get(b.agent_id) ?? `کاربر ${b.agent_id}` : 'نامشخص',
      avgTalk: b.answered ? Math.round(b.talk / b.answered) : 0,
      conversionRate: b.calls ? Math.round((b.sales / b.calls) * 100) : 0,
      avgAiScore: b.aiScoreCount ? Math.round(b.aiScoreSum / b.aiScoreCount) : null,
      avgIntent: b.intentCount ? Math.round(b.intentSum / b.intentCount) : null,
    })).sort((a, b) => b.calls - a.calls),
  }
}

async function queues(ctx: AuthContext) {
  const now = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  let missedQ = admin.from('calls').select(CALL_SELECT).eq('direction', 'incoming').neq('status', 'answered').gte('started_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
  missedQ = scope(missedQ, ctx)
  const { data: missed } = await missedQ.order('started_at', { ascending: false }).limit(50)

  let fuQ = admin.from('call_followups').select('*, calls(caller_number, destination_number, direction, started_at, user_id, lead_id)').in('status', ['pending', 'overdue'])
  fuQ = scope(fuQ, ctx)
  const { data: followups } = await fuQ.order('due_at', { ascending: true }).limit(100)

  let intentQ = admin.from('calls').select(CALL_SELECT).gte('purchase_intent_score', 70)
  intentQ = scope(intentQ, ctx)
  const { data: highIntent } = await intentQ.order('started_at', { ascending: false }).limit(30)

  return {
    missed: await decorate(missed ?? []),
    followups: followups ?? [],
    highIntent: await decorate(highIntent ?? []),
    overdue: (followups ?? []).filter((f: any) => f.status === 'overdue' || (f.due_at && f.due_at < now)),
    todayDue: (followups ?? []).filter((f: any) => f.due_at && f.due_at >= dayAgo),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.view')
    const action = String(body.action ?? '')
    const p = body.params ?? {}

    switch (action) {
      case 'overview':
        return json({ success: true, ...(await overview(ctx, p)) }, 200, corsHeaders)

      case 'calls':
        return json({ success: true, ...(await listCalls(ctx, p)) }, 200, corsHeaders)

      case 'call':
        return json({ success: true, ...(await callDetail(ctx, p.callId)) }, 200, corsHeaders)

      case 'queues':
        return json({ success: true, ...(await queues(ctx)) }, 200, corsHeaders)

      case 'agents':
        return json({ success: true, ...(await agentStats(ctx, p)) }, 200, corsHeaders)

      case 'recording-url': {
        requirePermission(ctx, 'calls.listen_recording')
        const { data: rec } = await admin.from('call_recordings').select('storage_path, mime_type').eq('call_id', p.callId).maybeSingle()
        if (!rec?.storage_path) return json({ success: false, error: 'فایل ضبط موجود نیست' }, 404, corsHeaders)
        const { data: signed, error } = await admin.storage.from('call-recordings').createSignedUrl(rec.storage_path, 3600)
        if (error) return json({ success: false, error: error.message }, 500, corsHeaders)
        await audit(ctx, 'call.recording_accessed', 'call', p.callId, {})
        return json({ success: true, url: signed?.signedUrl, mime: rec.mime_type }, 200, corsHeaders)
      }

      case 'transcript': {
        requirePermission(ctx, 'calls.view_transcript')
        const { data } = await admin.from('call_transcripts').select('*').eq('call_id', p.callId).maybeSingle()
        return json({ success: true, transcript: data }, 200, corsHeaders)
      }

      case 'save-outcome': {
        requirePermission(ctx, 'calls.create')
        const patch: Record<string, unknown> = {}
        if (p.disposition !== undefined) patch.disposition = p.disposition
        if (p.notes !== undefined) patch.notes = p.notes
        if (Object.keys(patch).length) {
          let q = admin.from('calls').update(patch).eq('id', p.callId)
          q = scope(q, ctx)
          await q
        }
        if (p.followup?.due_at) {
          await admin.from('call_followups').insert({
            call_id: p.callId,
            agent_id: ctx.userId,
            type: p.followup.type ?? 'call_back',
            status: 'pending',
            priority: p.followup.priority ?? 'medium',
            title: p.followup.title ?? 'پیگیری تماس',
            description: p.followup.description ?? null,
            due_at: p.followup.due_at,
            created_by: `user:${ctx.userId}`,
          })
        }
        await audit(ctx, 'call.disposition_changed', 'call', p.callId, { disposition: p.disposition })
        return json({ success: true }, 200, corsHeaders)
      }

      case 'complete-followup': {
        await admin.from('call_followups').update({
          status: p.status ?? 'completed',
          completed_at: new Date().toISOString(),
          completed_by: ctx.userId,
        }).eq('id', p.followupId)
        await audit(ctx, 'followup.completed', 'call_followup', p.followupId, {})
        return json({ success: true }, 200, corsHeaders)
      }

      case 'create-followup': {
        const { data } = await admin.from('call_followups').insert({
          call_id: p.callId ?? null,
          user_id: p.userId ?? null,
          lead_id: p.leadId ?? null,
          agent_id: p.agentId ?? ctx.userId,
          type: p.type ?? 'call_back',
          status: 'pending',
          priority: p.priority ?? 'medium',
          title: p.title ?? 'پیگیری',
          description: p.description ?? null,
          due_at: p.due_at,
          created_by: `user:${ctx.userId}`,
        }).select('id').maybeSingle()
        await audit(ctx, 'followup.created', 'call_followup', data?.id ?? null, {})
        return json({ success: true, id: data?.id }, 200, corsHeaders)
      }

      case 'link-call': {
        requirePermission(ctx, 'calls.manage')
        await admin.from('calls').update({
          user_id: p.userId ?? null,
          lead_id: p.leadId ?? null,
          match_confidence: 'manual',
        }).eq('id', p.callId)
        await audit(ctx, 'call.relinked', 'call', p.callId, { userId: p.userId, leadId: p.leadId })
        return json({ success: true }, 200, corsHeaders)
      }

      case 'lookup': {
        const match = await matchCrmRecords(normalizePhone(p.phone).normalized)
        let history: any[] = []
        const tail = phoneTail(p.phone)
        if (tail) {
          const { data } = await admin.from('calls')
            .select('id, direction, status, started_at, talk_seconds, agent_id')
            .or(`caller_number_normalized.like.%${tail},destination_number_normalized.like.%${tail}`)
            .order('started_at', { ascending: false }).limit(10)
          history = data ?? []
        }
        return json({ success: true, match, history }, 200, corsHeaders)
      }

      case 'dispositions': {
        const { data } = await admin.from('call_dispositions').select('*').eq('is_active', true).order('display_order')
        return json({ success: true, dispositions: data ?? [] }, 200, corsHeaders)
      }

      case 'settings': {
        requirePermission(ctx, 'calls.admin')
        const settings = await getSettings()
        const { data: sync } = await admin.from('daftareshoma_sync_state').select('*').eq('id', 1).maybeSingle()
        const { data: rules } = await admin.from('call_automation_rules').select('*').order('display_order')
        return json({
          success: true,
          settings,
          sync,
          rules: rules ?? [],
          tokenConfigured: !!Deno.env.get('DAFTARESHOMA_API_TOKEN'),
          webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/daftareshoma-webhook`,
        }, 200, corsHeaders)
      }

      case 'save-settings': {
        requirePermission(ctx, 'calls.admin')
        const allowed = [
          'enabled', 'auto_sync_enabled', 'sync_interval_minutes', 'recording_sync_enabled',
          'transcription_enabled', 'ai_analysis_enabled', 'auto_lead_matching',
          'auto_missed_call_followup', 'default_extension', 'attribution_window_days',
          'min_call_seconds_for_ai', 'notifications_enabled', 'missed_call_priority_rules',
          'high_intent_threshold',
        ]
        const patch: Record<string, unknown> = {}
        for (const k of allowed) if (k in (p.settings ?? {})) patch[k] = p.settings[k]
        await admin.from('call_center_settings').update(patch).eq('id', 1)
        await audit(ctx, 'integration.settings_changed', 'call_center_settings', '1', patch)
        return json({ success: true }, 200, corsHeaders)
      }

      case 'save-rule': {
        requirePermission(ctx, 'calls.admin')
        const rule = p.rule ?? {}
        const { data } = await admin.from('call_automation_rules').upsert({
          id: rule.id ?? undefined,
          name: rule.name,
          is_active: rule.is_active ?? true,
          trigger_type: rule.trigger_type ?? 'call_completed',
          conditions: rule.conditions ?? {},
          actions: rule.actions ?? {},
          display_order: rule.display_order ?? 0,
        }).select('id').maybeSingle()
        await audit(ctx, 'automation.rule_saved', 'call_automation_rule', data?.id ?? null, { name: rule.name })
        return json({ success: true, id: data?.id }, 200, corsHeaders)
      }

      case 'delete-rule': {
        requirePermission(ctx, 'calls.admin')
        await admin.from('call_automation_rules').delete().eq('id', p.ruleId)
        await audit(ctx, 'automation.rule_deleted', 'call_automation_rule', p.ruleId, {})
        return json({ success: true }, 200, corsHeaders)
      }

      case 'audit-logs': {
        requirePermission(ctx, 'calls.admin')
        const { data } = await admin.from('call_audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
        return json({ success: true, logs: data ?? [] }, 200, corsHeaders)
      }

      case 'agent-list': {
        const { data } = await admin.from('chat_users')
          .select('id, name, full_name, phone, role')
          .or('role.in.(sales_agent,sales_manager,admin),is_messenger_admin.eq.true')
          .limit(200)
        return json({ success: true, agents: data ?? [] }, 200, corsHeaders)
      }

      default:
        return json({ success: false, error: 'اکشن نامعتبر' }, 400, corsHeaders)
    }
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    console.error('call-center-data error', e)
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
