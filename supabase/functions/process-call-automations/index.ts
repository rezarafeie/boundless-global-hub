import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, AuthError, getSettings, json } from '../_shared/callcenter.ts'

/**
 * Rule engine for call-driven automations.
 * Rules live in `call_automation_rules` so admins can add more without code changes.
 */

type Rule = {
  id: string
  name: string
  trigger_type: string
  conditions: Record<string, any>
  actions: Record<string, any>
  is_active: boolean
  display_order: number
}

async function loadRules(trigger: string): Promise<Rule[]> {
  const { data } = await admin
    .from('call_automation_rules')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', trigger)
    .order('display_order', { ascending: true })
  return (data ?? []) as Rule[]
}

function matches(conditions: Record<string, any>, facts: Record<string, any>) {
  for (const [key, expected] of Object.entries(conditions ?? {})) {
    const actual = facts[key]
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('gt' in expected && !(Number(actual) > Number(expected.gt))) return false
      if ('gte' in expected && !(Number(actual) >= Number(expected.gte))) return false
      if ('lt' in expected && !(Number(actual) < Number(expected.lt))) return false
      if ('lte' in expected && !(Number(actual) <= Number(expected.lte))) return false
      if ('in' in expected && !(expected.in as any[]).includes(actual)) return false
      if ('exists' in expected && (!!actual !== !!expected.exists)) return false
    } else if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false
    } else if (actual !== expected) {
      return false
    }
  }
  return true
}

async function applyActions(rule: Rule, call: any, facts: Record<string, any>) {
  const a = rule.actions ?? {}

  if (a.create_followup) {
    const spec = a.create_followup === true ? {} : a.create_followup
    const { data: existing } = await admin
      .from('call_followups')
      .select('id')
      .eq('call_id', call.id)
      .in('status', ['pending', 'overdue'])
      .maybeSingle()
    if (!existing) {
      const delayMinutes = Number(spec.delay_minutes ?? 60)
      await admin.from('call_followups').insert({
        call_id: call.id,
        user_id: call.user_id,
        lead_id: call.lead_id,
        agent_id: spec.assign_to_lead_owner === false ? null : call.agent_id,
        type: spec.type ?? 'call_back',
        status: 'pending',
        priority: spec.priority ?? 'high',
        title: spec.title ?? 'پیگیری تماس',
        description: spec.description ?? `ایجاد شده توسط قانون: ${rule.name}`,
        due_at: new Date(Date.now() + delayMinutes * 60000).toISOString(),
        created_by: `rule:${rule.id}`,
      })
    }
  }

  if (a.notify) {
    const spec = a.notify === true ? {} : a.notify
    await admin.from('notifications').insert({
      title: spec.title ?? rule.name,
      message: spec.message ?? `تماس نیازمند توجه: ${call.caller_number ?? call.destination_number ?? ''}`,
      notification_type: 'floating',
      color: spec.color ?? '#2563eb',
      priority: 2,
      is_active: true,
    }).then(() => {}, () => {})
  }

  if (a.set_priority && call.id) {
    await admin.from('call_followups').update({ priority: a.set_priority }).eq('call_id', call.id).eq('status', 'pending')
  }

  await admin.from('call_events').insert({
    call_id: call.id,
    event_type: 'automation.applied',
    payload: { rule: rule.name, rule_id: rule.id, facts },
    status: 'processed',
    processed_at: new Date().toISOString(),
  })
}

async function processCall(callId: string) {
  const { data: call } = await admin.from('calls').select('*').eq('id', callId).maybeSingle()
  if (!call) return { applied: 0 }

  const { data: analysis } = await admin.from('call_ai_analysis').select('*').eq('call_id', callId).maybeSingle()
  const { data: followup } = await admin.from('call_followups').select('id').eq('call_id', callId).in('status', ['pending', 'overdue']).maybeSingle()

  const facts = {
    direction: call.direction,
    status: call.status,
    disposition: call.disposition,
    talk_seconds: call.talk_seconds ?? 0,
    has_recording: !!call.recording_id,
    has_followup: !!followup,
    is_customer: !!call.order_id,
    is_lead: !!call.lead_id,
    is_webinar: !!call.webinar_registration_id,
    is_consultation: !!call.consultation_id,
    purchase_intent_score: analysis?.purchase_intent_score ?? call.purchase_intent_score ?? 0,
    overall_sales_score: analysis?.overall_sales_score ?? 0,
    sentiment: analysis?.sentiment ?? null,
    follow_up_required: analysis?.follow_up_required ?? false,
  }

  const rules = [...(await loadRules('call_completed')), ...(await loadRules('ai_analysis_completed'))]
  let applied = 0
  for (const rule of rules) {
    if (matches(rule.conditions, facts)) {
      await applyActions(rule, call, facts)
      applied++
    }
  }

  // Built-in: high purchase intent with no follow-up
  const settings = await getSettings()
  if (!facts.has_followup && Number(facts.purchase_intent_score) >= Number(settings.high_intent_threshold ?? 80)) {
    await admin.from('call_followups').insert({
      call_id: call.id,
      user_id: call.user_id,
      lead_id: call.lead_id,
      agent_id: call.agent_id,
      type: 'sales',
      status: 'pending',
      priority: 'critical',
      title: 'مشتری با قصد خرید بالا — پیگیری فوری',
      description: analysis?.next_action ?? 'تحلیل هوشمند قصد خرید بالایی تشخیص داد.',
      due_at: analysis?.recommended_follow_up_at ?? new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      created_by: 'automation',
    })
    applied++
  }

  return { applied }
}

async function markOverdue() {
  const { data } = await admin
    .from('call_followups')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_at', new Date().toISOString())
    .select('id')
  return data?.length ?? 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    if (!body.internal && !body.cron) {
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.manage')
    }

    if (body.callId) {
      const result = await processCall(body.callId)
      return json({ success: true, ...result }, 200, corsHeaders)
    }

    const overdue = await markOverdue()
    return json({ success: true, overdue }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
