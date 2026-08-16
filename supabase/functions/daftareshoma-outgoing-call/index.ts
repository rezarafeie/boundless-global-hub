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

    // Extension resolution: explicit (admins/managers) -> per-agent mapping (by email) -> default
    const resolved = await resolveAgentExtension(ctx, body.extension, settings.default_extension)
    const extension = resolved.extension
    if (!extension) {
      return json({
        success: false,
        error: 'داخلی شما تعریف نشده است. در تنظیمات مرکز تماس، داخلی این کارشناس را بر اساس ایمیل ثبت کنید.',
      }, 400, corsHeaders)
    }

    const line = String((settings as any).outbound_line_number || '02128427131').replace(/[^0-9]/g, '')
    const dial = target.normalized.startsWith('98') ? '0' + target.normalized.slice(2) : target.normalized

    let providerResponse: any = null
    let endpoint: string | null = null
    try {
      const res = await dsTryEndpoints([
        // documented endpoint (External APIs v1)
        { path: '/api/Customize/OutgoingCall', method: 'POST', body: { from_number: line, to_number: dial, caller_extension: extension } },
      ])
      endpoint = res.path
      providerResponse = res.data
    } catch (e) {
      const pe = e as ProviderError
      console.log('outgoing-call attempts', JSON.stringify((pe as any).attempts ?? []))
      await audit(ctx, 'call.outgoing_failed', 'call', null, { phone: target.normalized, extension, error: pe.message })
      const raw = JSON.stringify(pe.body ?? '')
      const lineMissing = raw.includes('خط وجود ندارد') || raw.includes('هفت رقم')
      const message = lineMissing
        ? `تماس برقرار نشد: خط «${line}» یا داخلی «${extension}» در پنل دفتر شما معتبر نیست. در تنظیمات مرکز تماس بررسی کنید.`
        : pe.message
      return json({ success: false, error: message, detail: pe.body ?? null, extension, extensionSource: resolved.source, attempts: (pe as any).attempts ?? [] }, pe.status >= 400 && pe.status < 600 ? pe.status : 502, corsHeaders)
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
      caller_number: extension,
      caller_number_normalized: normalizePhone(extension).normalized,
      destination_number: target.raw,
      destination_number_normalized: target.normalized,
      extension,
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
      phone: target.normalized, extension, extensionSource: resolved.source, endpoint,
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
