import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, checkRateLimit, AuthError,
  dsTryEndpoints, ProviderError, normalizePhone, getSettings, matchCrmRecords, json,
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

    // Extension: explicit choice (admins/managers only) or the agent's own default
    let extension: string | null = null
    if (body.extension && (ctx.isAdmin || !ctx.restrictedToSelf)) {
      extension = String(body.extension).replace(/[^0-9]/g, '')
    } else {
      const { data: me } = await admin.from('chat_users').select('phone').eq('id', ctx.userId).maybeSingle()
      extension = (body.extension && ctx.restrictedToSelf ? String(body.extension).replace(/[^0-9]/g, '') : null)
        || settings.default_extension
        || (me?.phone ? normalizePhone(me.phone).normalized : null)
    }
    if (!extension) {
      return json({ success: false, error: 'داخلی کارشناس مشخص نیست. در تنظیمات مرکز تماس داخلی پیش‌فرض را وارد کنید.' }, 400, corsHeaders)
    }

    const dial = target.normalized.startsWith('98') ? '0' + target.normalized.slice(2) : target.normalized

    let providerResponse: any = null
    let endpoint: string | null = null
    try {
      const res = await dsTryEndpoints([
        { path: '/api/v1/Call/Originate', method: 'POST', body: { extension, destination: dial, number: dial } },
        { path: '/api/v1/Call/MakeCall', method: 'POST', body: { extension, destination: dial, number: dial } },
        { path: '/api/v1/Click2Call', method: 'POST', body: { extension, destination: dial, number: dial } },
        { path: '/api/Call/Originate', method: 'POST', body: { extension, destination: dial } },
      ])
      endpoint = res.path
      providerResponse = res.data
    } catch (e) {
      const pe = e as ProviderError
      await audit(ctx, 'call.outgoing_failed', 'call', null, { phone: target.normalized, extension, error: pe.message })
      return json({ success: false, error: pe.message, detail: pe.body ?? null }, pe.status >= 400 && pe.status < 600 ? pe.status : 502, corsHeaders)
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
      phone: target.normalized, extension, endpoint,
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
