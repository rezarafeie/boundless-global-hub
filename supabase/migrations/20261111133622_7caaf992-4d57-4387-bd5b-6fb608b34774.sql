UPDATE public.call_center_settings SET transcription_enabled = true;
INSERT INTO public.call_transcripts(call_id, processing_status, language)
SELECT r.call_id, 'pending', 'fa' FROM public.call_recordings r JOIN public.calls c ON c.id = r.call_id
WHERE r.status = 'ready' AND coalesce(c.talk_seconds,0) >= 30
ON CONFLICT (call_id) DO NOTHING;