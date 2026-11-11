import { corsHeaders } from '../_shared/cors.ts'
import {
  admin, authenticate, requirePermission, requireCallAccess, requireInternalOrAdmin, audit,
  AuthError, getSettings, invokeFn, json,
} from '../_shared/callcenter.ts'
import {
  streamTranscription, streamCorrection, acceptCorrection, TRANSCRIBE_MODEL, CORRECTION_MODEL,
  streamDiarizedCorrection, parseSegments, acceptDiarized, segmentsToText, DIARIZE_MODEL, type Segment,
} from '../_shared/call-transcription.ts'

/**
 * Speech-to-text for call recordings (Persian), then a conservative AI spelling pass.
 * - `{ callId, stream: true }` → text/event-stream with live deltas (agent/admin session).
 * - `{ callId }` → JSON (internal or admin).
 * - `{ pending: true }` → background batch (internal or admin).
 * The raw speech-to-text output is kept in raw_transcript; transcript holds the corrected text.
 */

type Emit = (event: string, data: unknown) => void

/** Legacy direct-OpenAI path, only used when the Lovable key is not configured. */
async function transcribeOpenAI(blob: Blob, filename: string) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (!openaiKey || !/^[\x20-\x7E]+$/.test(openaiKey)) throw new Error('هیچ سرویس معتبر تبدیل گفتار به متن پیکربندی نشده است')
  const form = new FormData()
  form.append('file', blob, filename)
  const model = Deno.env.get('OPENAI_TRANSCRIBE_MODEL')?.trim() || 'gpt-4o-transcribe'
  form.append('model', model)
  form.append('language', 'fa')
  form.append('response_format', 'json')
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${openaiKey}` }, body: form,
  })
  if (!res.ok) throw new Error(`خطای سرویس تبدیل گفتار (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return { text: String(data.text ?? '').trim(), model }
}

async function run(callId: string, emit: Emit = () => {}, forceAnalysis = false) {
  const { data: recording } = await admin.from('call_recordings').select('*').eq('call_id', callId).maybeSingle()
  if (!recording?.storage_path || recording.status !== 'ready') {
    await admin.from('call_transcripts').update({ processing_status: 'skipped', error: 'فایل ضبط معتبر موجود نیست' }).eq('call_id', callId)
    throw new Error('فایل ضبط شده برای این تماس موجود نیست')
  }

  await admin.from('call_transcripts').upsert({
    call_id: callId, processing_status: 'transcribing', language: 'fa', error: null,
  }, { onConflict: 'call_id' })
  await admin.from('calls').update({ processing_status: 'transcribing' }).eq('id', callId)

  try {
    emit('stage', { stage: 'download' })
    const { data: file, error } = await admin.storage.from('call-recordings').download(recording.storage_path)
    if (error || !file) throw new Error(error?.message ?? 'دانلود فایل ضبط ناموفق بود')
    const filename = recording.storage_path.split('/').pop() || 'recording.mp3'

    const useGateway = !!Deno.env.get('LOVABLE_API_KEY')?.trim()
    let raw: string, provider: string, model: string
    emit('stage', { stage: 'transcribe' })
    if (useGateway) {
      const typed = new File([file], filename, { type: recording.mime_type || 'audio/mpeg' })
      raw = await streamTranscription(typed, (d) => emit('raw', { delta: d }))
      provider = 'lovable'; model = TRANSCRIBE_MODEL
    } else {
      const r = await transcribeOpenAI(file, filename)
      raw = r.text; provider = 'openai'; model = r.model
      emit('raw', { delta: raw })
    }
    emit('raw_done', { text: raw })

    // Persist the raw text first so nothing is lost if correction fails.
    const { error: rawErr } = await admin.from('call_transcripts').update({
      raw_transcript: raw, provider, model, error: null,
    }).eq('call_id', callId)
    if (rawErr) throw new Error(rawErr.message)

    let finalText = raw
    let correctionModel: string | null = null
    let segments: Segment[] | null = null
    if (raw && useGateway) {
      emit('stage', { stage: 'correct' })
      try {
        const out = await streamDiarizedCorrection(file, raw, (d) => emit('corrected', { delta: d }))
        const segs = parseSegments(out)
        if (acceptDiarized(raw, segs)) {
          segments = segs; finalText = segmentsToText(segs); correctionModel = DIARIZE_MODEL
          emit('segments', { segments })
        } else throw new Error('diarization rejected')
      } catch (e) {
        console.error('diarize failed, falling back', callId, (e as Error).message)
        try {
          const corrected = await streamCorrection(raw)
          if (acceptCorrection(raw, corrected)) { finalText = corrected; correctionModel = CORRECTION_MODEL }
        } catch { emit('notice', { message: 'تصحیح انجام نشد؛ متن اصلی ذخیره شد' }) }
      }
    }

    const { error: saveError } = await admin.from('call_transcripts').update({
      transcript: finalText,
      segments,
      speaker_diarization: segments ? { labels: { agent: 'فروشنده', customer: 'مشتری' }, model: DIARIZE_MODEL } : null,
      correction_model: correctionModel,
      corrected_at: correctionModel ? new Date().toISOString() : null,
      processing_status: finalText ? 'completed' : 'empty',
      error: null,
    }).eq('call_id', callId)
    if (saveError) throw new Error(saveError.message)

    await admin.from('calls').update({ processing_status: 'transcribed' }).eq('id', callId)

    const settings = await getSettings()
    if (finalText && (forceAnalysis || settings.ai_analysis_enabled)) {
      emit('stage', { stage: 'analyze' })
      try { await invokeFn('analyze-call', { callId }) } catch { emit('notice', { message: 'تحلیل تماس ناموفق بود؛ بعداً دوباره تلاش کنید' }) }
    }

    return { length: finalText.length, provider, corrected: !!correctionModel, transcript: finalText }
  } catch (e) {
    await admin.from('call_transcripts').update({
      processing_status: 'failed', error: (e as Error).message,
    }).eq('call_id', callId)
    await admin.from('calls').update({ processing_status: 'failed' }).eq('id', callId)
    throw e
  }
}

function sseResponse(callId: string): Response {
  const encoder = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  let open = true
  const body = new ReadableStream<Uint8Array>({
    start(c) { controller = c },
    cancel() { open = false },
  })
  const emit: Emit = (event, data) => {
    if (!open) return
    try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) } catch { open = false }
  }
  // Keep the connection alive through proxies while the model is thinking.
  const ping = setInterval(() => { if (open) try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { open = false } }, 10000)

  const work = run(callId, emit, true)
    .then((r) => emit('done', r))
    .catch((e) => emit('error', { error: (e as Error).message }))
    .finally(() => { clearInterval(ping); if (open) try { controller.close() } catch { /* closed */ } })
  // Finish and save even if the browser disconnects mid-stream.
  ;(globalThis as any).EdgeRuntime?.waitUntil?.(work)

  return new Response(body, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    if (body.stream) {
      // Interactive: same permissions as reprocess-call.
      const ctx = await authenticate(req, body.sessionToken)
      requirePermission(ctx, 'calls.manage')
      requirePermission(ctx, 'calls.view_transcript')
      if (typeof body.callId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.callId)) {
        return json({ success: false, error: 'callId نامعتبر است' }, 400, corsHeaders)
      }
      await requireCallAccess(ctx, body.callId)
      const settings = await getSettings()
      if (!settings.enabled) return json({ success: false, error: 'مرکز تماس غیرفعال است' }, 400, corsHeaders)
      await audit(ctx, 'call.reprocess', 'call', body.callId, { stage: 'transcript', stream: true })
      return sseResponse(body.callId)
    }

    await requireInternalOrAdmin(req)

    if (body.pending) {
      const settings = await getSettings()
      if (!settings.enabled || !settings.transcription_enabled) return json({ success: true, skipped: true }, 200, corsHeaders)
      // Bounded run: up to 40 calls, 4 at a time, stop starting new work after ~80s.
      const started = Date.now()
      const BUDGET_MS = 80_000, MAX_ITEMS = 40, CONCURRENCY = 4
      const retryBefore = new Date(Date.now() - 30 * 60_000).toISOString()
      const { data: pending } = await admin
        .from('call_transcripts')
        .select('call_id')
        .or(`processing_status.eq.pending,and(processing_status.eq.failed,updated_at.lt.${retryBefore})`)
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS)
      const queue = (pending ?? []).map((t) => t.call_id as string)
      let processed = 0, failed = 0
      const worker = async () => {
        while (queue.length && Date.now() - started < BUDGET_MS) {
          const id = queue.shift()!
          try { await run(id); processed++ } catch (e) { failed++; console.error('transcribe failed', id, (e as Error).message) }
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
      return json({ success: true, processed, failed, remaining: queue.length }, 200, corsHeaders)
    }

    if (!body.callId) return json({ success: false, error: 'callId الزامی است' }, 400, corsHeaders)
    const { transcript: _t, ...result } = await run(body.callId)
    return json({ success: true, ...result }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
