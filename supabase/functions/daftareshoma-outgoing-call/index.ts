import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, checkRateLimit, AuthError,
  dsTryEndpoints, ProviderError, normalizePhone, getSettings, matchCrmRecords, json, resolveAgentExtension,
} from '../_shared/callcenter.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let ctx = null as Awaited<ReturnType<typeof authenticate>> | null
  try {
    const body = await req.json().catch(() => ({}))
    ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.create')
    await checkRateLimit(ctx.userId, 'call.outgoing_initiated', 30, 300)

    const target = normalizePhone(body.phone)
    if (!target.normalized || target.normalized.length < 8) {
      return json({ success: false, error: 'شماره تماس معتبر نیست' }, 400, corsHeaders)
    }

    const settings = await getSettings()
    if (!settings.enabled) {
      return json({ success: false, error: 'مرکز تماس غیرفعال است' }, 400, corsHeaders)
    }

    // DaftareShoma click-to-call first rings the agent's phone (`from_number`).
    // `caller_extension` is the registered academy line, not a short PBX extension.
    const resolved = await resolveAgentExtension(ctx, body.extension, settings.default_extension)
    const agentPhone = resolved.extension
    if (!agentPhone) {
      return json({
        success: false,
        error: 'شماره تماس کارشناس تعریف نشده است. شماره کارشناس را در تنظیمات مرکز تماس ثبت کنید.',
      }, 400, corsHeaders)
    }

    const lineDigits = String((settings as any).outbound_line_number || '').replace(/[^0-9]/g, '')
    if (lineDigits.length < 7) {
      return json({ success: false, error: 'خط خروجی آکادمی در تنظیمات مرکز تماس تعریف نشده است.' }, 400, corsHeaders)
    }
    const dial = target.normalized.startsWith('98') ? '0' + target.normalized.slice(2) : target.normalized
    const internationalLine = lineDigits.startsWith('98')
      ? `+${lineDigits}`
      : lineDigits.startsWith('0')
        ? `+98${lineDigits.slice(1)}`
        : lineDigits
    const lineVariants = [...new Set([internationalLine, lineDigits])]

    let providerResponse: any = null
    let endpoint: string | null = null
    try {
      const res = await dsTryEndpoints(lineVariants.map((callerLine) => ({
        path: '/api/Customize/OutgoingCall',
        method: 'POST',
        body: { from_number: agentPhone, to_number: dial, caller_extension: callerLine },
      })))
      endpoint = res.path
      providerResponse = res.data
    } catch (e) {
      const pe = e as ProviderError
      console.log('outgoing-call attempts', JSON.stringify((pe as any).attempts ?? []))
      await audit(ctx, 'call.outgoing_failed', 'call', null, { phone: target.normalized, agentPhone, callerLine: internationalLine, error: pe.message })
      const raw = JSON.stringify(pe.body ?? '')
      const lineMissing = raw.includes('خط وجود ندارد') || raw.includes('هفت رقم')
      const message = lineMissing
        ? `تماس برقرار نشد: شماره کارشناس «${agentPhone}» یا خط آکادمی «${internationalLine}» در پنل دفتر شما معتبر نیست.`
        : pe.message
      return json({ success: false, error: message, detail: pe.body ?? null, agentPhone, phoneSource: resolved.source, callerLine: internationalLine, attempts: (pe as any).attempts ?? [] }, pe.status >= 400 && pe.status < 600 ? pe.status : 502, corsHeaders)
    }

    const providerCallId = String(
      providerResponse?.uniqueId ?? providerResponse?.callId ?? providerResponse?.id ??
      `pending-${crypto.randomUUID()}`,
    )

    const match = settings.auto_lead_matching ? await matchCrmRecords(target.normalized) : null

    const { data: call } = await admin.from('calls').upsert({
      provider: 'daftareshoma',
      provider_call_id: providerCallId,
      direction: 'outgoing',
      status: 'initiated',
      caller_number: agentPhone,
      caller_number_normalized: normalizePhone(agentPhone).normalized,
      destination_number: target.raw,
      destination_number_normalized: target.normalized,
      extension: internationalLine,
      started_at: new Date().toISOString(),
      agent_id: ctx.userId,
      user_id: match?.user_id ?? body.userId ?? null,
      lead_id: match?.lead_id ?? body.leadId ?? null,
      consultation_id: match?.consultation_id ?? body.consultationId ?? null,
      webinar_registration_id: match?.webinar_registration_id ?? body.webinarRegistrationId ?? null,
      order_id: match?.order_id ?? body.orderId ?? null,
      match_confidence: match?.match_confidence ?? 'manual',
      source: body.source ?? 'crm_click_to_call',
      processing_status: 'pending',
      raw_payload: { originate: providerResponse, endpoint },
    }, { onConflict: 'provider,provider_call_id' }).select('id').maybeSingle()

    await audit(ctx, 'call.outgoing_initiated', 'call', call?.id ?? null, {
      phone: target.normalized, agentPhone, phoneSource: resolved.source, callerLine: internationalLine, endpoint,
    })

    return json({
      success: true,
      callId: call?.id ?? null,
      providerCallId,
      state: 'connecting',
      message: 'درخواست تماس ارسال شد. ابتدا تلفن شما زنگ می‌خورد.',
    }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
