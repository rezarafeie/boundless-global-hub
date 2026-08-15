import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, audit, AuthError,
  dsRequest, dsTryEndpoints, ProviderError, getSettings, invokeFn, json,
} from '../_shared/callcenter.ts'

const EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
}

async function fetchAndStore(callId: string) {
  const { data: call } = await admin.from('calls').select('*').eq('id', callId).maybeSingle()
  if (!call) throw new Error('تماس یافت نشد')
  if (!call.recording_id) throw new Error('این تماس فایل ضبط شده ندارد')

  await admin.from('call_recordings').upsert({
    call_id: call.id,
    provider_recording_id: call.recording_id,
    status: 'downloading',
    error: null,
  }, { onConflict: 'call_id' })

  let res: Response
  try {
    // documented API: POST /api/Customize/RecordUrlList?RecordingId=<uuid> -> { success, url, errorMessage }
    const meta = await dsRequest('/api/Customize/RecordUrlList', {
      method: 'POST',
      query: { RecordingId: call.recording_id },
      timeoutMs: 30000,
    })
    const url = meta?.url ?? meta?.Url ?? null
    if (!url) throw new Error(meta?.errorMessage || meta?.ErrorMessage || 'فایل ضبط در دسترس نیست')

    const dl = await fetch(String(url))
    if (!dl.ok) throw new Error(`دانلود فایل ضبط ناموفق بود (${dl.status})`)
    res = dl
    const message = (e as Error).message
    await admin.from('call_recordings').update({
      status: /404|not found|در دسترس/.test(message) ? 'unavailable' : 'failed',
      error: message,
    }).eq('call_id', call.id)
    throw e
  }

  const mime = res.headers.get('content-type')?.split(';')[0] || 'audio/mpeg'
  const ext = EXT_BY_MIME[mime] ?? 'mp3'
  const bytes = new Uint8Array(await res.arrayBuffer())

  const started = call.started_at ? new Date(call.started_at) : new Date()
  const path = `${started.getUTCFullYear()}/${String(started.getUTCMonth() + 1).padStart(2, '0')}/${call.id}/recording.${ext}`

  const { error: uploadError } = await admin.storage
    .from('call-recordings')
    .upload(path, bytes, { contentType: mime, upsert: true })

  if (uploadError) {
    await admin.from('call_recordings').update({ status: 'failed', error: uploadError.message }).eq('call_id', call.id)
    throw uploadError
  }

  await admin.from('call_recordings').update({
    status: 'ready',
    storage_path: path,
    mime_type: mime,
    duration_seconds: call.talk_seconds ?? null,
    downloaded_at: new Date().toISOString(),
    error: null,
  }).eq('call_id', call.id)

  await admin.from('calls').update({ processing_status: 'recording_ready' }).eq('id', call.id)

  const settings = await getSettings()
  if (settings.transcription_enabled && (call.talk_seconds ?? 0) >= (settings.min_call_seconds_for_ai ?? 30)) {
    invokeFn('transcribe-call', { callId: call.id })
  }

  return { path, mime, size: bytes.length }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const callId = body.callId

    if (!body.internal) {
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.manage')
      await audit(ctx, 'call.recording_fetch', 'call', callId, {})
    }

    if (body.pending) {
      // batch mode for the cron job
      const { data: calls } = await admin
        .from('calls')
        .select('id, recording_id, call_recordings(status)')
        .not('recording_id', 'is', null)
        .order('started_at', { ascending: false })
        .limit(25)

      let processed = 0
      for (const c of calls ?? []) {
        const status = (c as any).call_recordings?.[0]?.status ?? (c as any).call_recordings?.status
        if (status === 'ready' || status === 'unavailable') continue
        try { await fetchAndStore(c.id); processed++ } catch (e) { console.error('recording failed', c.id, (e as Error).message) }
      }
      return json({ success: true, processed }, 200, corsHeaders)
    }

    if (!callId) return json({ success: false, error: 'callId الزامی است' }, 400, corsHeaders)

    const result = await fetchAndStore(callId)
    return json({ success: true, ...result }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : e instanceof ProviderError ? 502 : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
