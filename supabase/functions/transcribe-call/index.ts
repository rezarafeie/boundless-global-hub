import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, audit, AuthError, getSettings, invokeFn, json } from '../_shared/callcenter.ts'

/**
 * Speech-to-text for call recordings (Persian).
 * Provider order: OPENAI_API_KEY (whisper) -> Lovable AI gateway.
 * Keys live only in edge-function secrets.
 */
async function transcribeAudio(blob: Blob, filename: string): Promise<{ text: string; provider: string; model: string }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (openaiKey) {
    const form = new FormData()
    form.append('file', blob, filename)
    form.append('model', Deno.env.get('OPENAI_TRANSCRIBE_MODEL') || 'whisper-1')
    form.append('language', 'fa')
    form.append('response_format', 'json')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    })
    if (!res.ok) throw new Error(`خطای سرویس تبدیل گفتار (${res.status}): ${await res.text()}`)
    const data = await res.json()
    return { text: data.text ?? '', provider: 'openai', model: 'whisper-1' }
  }

  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  if (lovableKey) {
    const form = new FormData()
    form.append('file', blob, filename)
    form.append('model', 'whisper-1')
    form.append('language', 'fa')
    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${lovableKey}` },
      body: form,
    })
    if (!res.ok) throw new Error(`خطای سرویس تبدیل گفتار (${res.status}): ${await res.text()}`)
    const data = await res.json()
    return { text: data.text ?? '', provider: 'lovable', model: 'whisper-1' }
  }

  throw new Error('هیچ سرویس تبدیل گفتار به متنی پیکربندی نشده است (OPENAI_API_KEY را تنظیم کنید)')
}

async function run(callId: string) {
  const { data: recording } = await admin.from('call_recordings').select('*').eq('call_id', callId).maybeSingle()
  if (!recording?.storage_path) throw new Error('فایل ضبط شده برای این تماس موجود نیست')

  await admin.from('call_transcripts').upsert({
    call_id: callId, processing_status: 'transcribing', language: 'fa', error: null,
  }, { onConflict: 'call_id' })
  await admin.from('calls').update({ processing_status: 'transcribing' }).eq('id', callId)

  try {
    const { data: file, error } = await admin.storage.from('call-recordings').download(recording.storage_path)
    if (error || !file) throw new Error(error?.message ?? 'دانلود فایل ضبط ناموفق بود')

    const filename = recording.storage_path.split('/').pop() || 'recording.mp3'
    const { text, provider, model } = await transcribeAudio(file, filename)

    await admin.from('call_transcripts').update({
      transcript: text,
      provider,
      model,
      processing_status: text?.trim() ? 'completed' : 'empty',
      error: null,
    }).eq('call_id', callId)

    await admin.from('calls').update({ processing_status: 'transcribed' }).eq('id', callId)

    const settings = await getSettings()
    if (settings.ai_analysis_enabled && text?.trim()) invokeFn('analyze-call', { callId })

    return { length: text?.length ?? 0, provider }
  } catch (e) {
    await admin.from('call_transcripts').update({
      processing_status: 'failed', error: (e as Error).message,
    }).eq('call_id', callId)
    await admin.from('calls').update({ processing_status: 'failed' }).eq('id', callId)
    throw e
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    if (!body.internal) {
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.manage')
      await audit(ctx, 'call.transcribe_requested', 'call', body.callId, {})
    }

    if (body.pending) {
      const { data: pending } = await admin
        .from('call_transcripts')
        .select('call_id')
        .in('processing_status', ['pending', 'failed'])
        .limit(10)
      let processed = 0
      for (const t of pending ?? []) {
        try { await run(t.call_id); processed++ } catch (e) { console.error('transcribe failed', t.call_id, (e as Error).message) }
      }
      return json({ success: true, processed }, 200, corsHeaders)
    }

    if (!body.callId) return json({ success: false, error: 'callId الزامی است' }, 400, corsHeaders)
    const result = await run(body.callId)
    return json({ success: true, ...result }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
