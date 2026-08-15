import { corsHeaders } from '../_shared/cors.ts'
import { admin, authenticate, requirePermission, audit, AuthError, invokeFn, json } from '../_shared/callcenter.ts'

/** Re-runs the recording -> transcript -> AI pipeline for a single call. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await authenticate(req, body.sessionToken)
    requirePermission(ctx, 'calls.manage')

    const callId = body.callId
    if (!callId) return json({ success: false, error: 'callId الزامی است' }, 400, corsHeaders)

    const stage = body.stage ?? 'auto' // recording | transcript | analysis | auto
    const { data: call } = await admin.from('calls').select('id, recording_id').eq('id', callId).maybeSingle()
    if (!call) return json({ success: false, error: 'تماس یافت نشد' }, 404, corsHeaders)

    const { data: rec } = await admin.from('call_recordings').select('status').eq('call_id', callId).maybeSingle()
    const { data: tr } = await admin.from('call_transcripts').select('processing_status').eq('call_id', callId).maybeSingle()

    await admin.from('calls').update({ processing_status: 'pending' }).eq('id', callId)

    let dispatched = 'analysis'
    if (stage === 'recording' || (stage === 'auto' && rec?.status !== 'ready')) {
      dispatched = 'recording'
      invokeFn('process-call-recording', { callId, internal: true })
    } else if (stage === 'transcript' || (stage === 'auto' && tr?.processing_status !== 'completed')) {
      dispatched = 'transcript'
      invokeFn('transcribe-call', { callId, internal: true })
    } else {
      invokeFn('analyze-call', { callId, internal: true })
    }

    await audit(ctx, 'call.reprocess', 'call', callId, { stage: dispatched })

    return json({ success: true, stage: dispatched, message: 'پردازش مجدد آغاز شد' }, 200, corsHeaders)
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500
    return json({ success: false, error: (e as Error).message }, status, corsHeaders)
  }
})
