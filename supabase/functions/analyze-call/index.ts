import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, audit, AuthError, getSettings, json } from '../_shared/callcenter.ts'

const MODEL = 'google/gemini-2.5-flash'

async function buildCatalogContext() {
  const { data: courses } = await admin
    .from('courses')
    .select('title, slug, price, is_active')
    .eq('is_active', true)
    .limit(40)
  return (courses ?? []).map((c: any) => `- ${c.title} (slug: ${c.slug}, قیمت: ${c.price ?? 'نامشخص'})`).join('\n')
}

const clamp = (v: unknown) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

async function run(callId: string) {
  const { data: call } = await admin.from('calls').select('*').eq('id', callId).maybeSingle()
  if (!call) throw new Error('تماس یافت نشد')

  const { data: t } = await admin.from('call_transcripts').select('transcript').eq('call_id', callId).maybeSingle()
  const transcript = t?.transcript?.trim()
  if (!transcript) throw new Error('متن مکالمه برای تحلیل موجود نیست')

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY تنظیم نشده است')

  await admin.from('calls').update({ processing_status: 'analyzing' }).eq('id', callId)

  const catalog = await buildCatalogContext()

  const system = `تو یک تحلیل‌گر ارشد فروش برای «آکادمی رفیعی» هستی.
محصولات ما شامل دوره‌های آموزشی، وبینارها، مشاوره‌ها، برنامه‌های بدون مرز و پشتیبانی است.
کاتالوگ فعلی دوره‌ها:
${catalog || '(کاتالوگ در دسترس نیست)'}

مکالمهٔ تلفنی بین کارشناس و مشتری را تحلیل کن.
فقط و فقط JSON معتبر برگردان، بدون متن اضافه و بدون markdown.
امتیازها بین ۰ تا ۱۰۰ باشند. متن خروجی فارسی باشد.
ساختار دقیق:
{"summary":"","customer_intent":"","sentiment":"positive|neutral|negative|mixed","purchase_intent_score":0,"customer_needs":[],"pain_points":[],"objections":[],"products_mentioned":[],"recommended_products":[],"next_action":"","follow_up_required":true,"recommended_follow_up_at":null,"sales_scores":{"opening":0,"discovery":0,"explanation":0,"objection_handling":0,"closing":0,"overall":0},"agent_feedback":"","customer_summary":""}`

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `نوع تماس: ${call.direction === 'outgoing' ? 'خروجی' : 'ورودی'}\nمدت مکالمه: ${call.talk_seconds ?? 0} ثانیه\n\nمتن مکالمه:\n${transcript.slice(0, 40000)}`,
        },
      ],
    }),
  })

  if (res.status === 429) throw new Error('محدودیت نرخ سرویس هوش مصنوعی. کمی بعد دوباره تلاش کنید.')
  if (res.status === 402) throw new Error('اعتبار سرویس هوش مصنوعی کافی نیست.')
  if (!res.ok) throw new Error(`خطای سرویس هوش مصنوعی (${res.status}): ${await res.text()}`)

  const payload = await res.json()
  const content: string = payload?.choices?.[0]?.message?.content ?? ''
  const cleaned = content.replace(/```json|```/g, '').trim()
  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('پاسخ هوش مصنوعی قابل تفسیر نبود')
    parsed = JSON.parse(m[0])
  }

  const scores = parsed.sales_scores ?? {}
  const record = {
    call_id: callId,
    summary: parsed.summary ?? null,
    customer_intent: parsed.customer_intent ?? null,
    sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
    purchase_intent_score: clamp(parsed.purchase_intent_score) ?? 0,
    customer_needs: parsed.customer_needs ?? [],
    pain_points: parsed.pain_points ?? [],
    objections: parsed.objections ?? [],
    products_mentioned: parsed.products_mentioned ?? [],
    recommended_products: parsed.recommended_products ?? [],
    next_action: parsed.next_action ?? null,
    follow_up_required: parsed.follow_up_required !== false,
    recommended_follow_up_at: parsed.recommended_follow_up_at ?? null,
    opening_score: clamp(scores.opening),
    discovery_score: clamp(scores.discovery),
    explanation_score: clamp(scores.explanation),
    objection_handling_score: clamp(scores.objection_handling),
    closing_score: clamp(scores.closing),
    overall_sales_score: clamp(scores.overall),
    agent_feedback: parsed.agent_feedback ?? null,
    customer_summary: parsed.customer_summary ?? null,
    raw_ai_response: parsed,
    model: MODEL,
  }

  await admin.from('call_ai_analysis').upsert(record, { onConflict: 'call_id' })
  await admin.from('calls').update({
    processing_status: 'completed',
    ai_score: record.overall_sales_score,
    purchase_intent_score: record.purchase_intent_score,
  }).eq('id', callId)

  // downstream automations (high-intent tasks, attribution)
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-call-automations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ internal: true, callId }),
  }).catch(() => {})

  return record
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    if (!body.internal) {
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.ai_analysis')
      await audit(ctx, 'call.ai_analysis_run', 'call', body.callId, {})
    }

    if (body.pending) {
      const settings = await getSettings()
      if (!settings.ai_analysis_enabled) return json({ success: true, skipped: true }, 200, corsHeaders)

      const { data: ready } = await admin
        .from('call_transcripts')
        .select('call_id')
        .eq('processing_status', 'completed')
        .limit(50)
      const ids = (ready ?? []).map((r: any) => r.call_id)
      const { data: analyzed } = await admin.from('call_ai_analysis').select('call_id').in('call_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      const done = new Set((analyzed ?? []).map((a: any) => a.call_id))

      let processed = 0
      for (const id of ids.filter((i) => !done.has(i)).slice(0, 8)) {
        try { await run(id); processed++ } catch (e) { console.error('analysis failed', id, (e as Error).message) }
      }
      return json({ success: true, processed }, 200, corsHeaders)
    }

    if (!body.callId) return json({ success: false, error: 'callId الزامی است' }, 400, corsHeaders)
    const result = await run(body.callId)
    return json({ success: true, analysis: result }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
