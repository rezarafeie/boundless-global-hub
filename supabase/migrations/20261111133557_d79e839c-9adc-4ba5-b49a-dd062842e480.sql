CREATE OR REPLACE FUNCTION public.callcenter_pending_recordings(batch_size integer DEFAULT 25)
 RETURNS SETOF calls LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
 SELECT c.* FROM public.calls c WHERE c.recording_id IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM public.call_recordings r WHERE r.call_id=c.id AND (r.status IN ('ready','unavailable')
   OR (r.status='downloading' AND r.updated_at > now()-interval '15 minutes')))
 ORDER BY c.started_at DESC NULLS LAST,c.id LIMIT LEAST(GREATEST(batch_size,1),50)
$function$;

UPDATE public.call_recordings SET status='unavailable', error='فایل ضبط دفتر شما خالی است (1413 بایت)'
 WHERE call_id='119583f2-1915-41ad-bc42-730ae70b2d94';
UPDATE public.call_transcripts SET processing_status='failed', error='فایل ضبط خالی بود؛ متن معتبر نیست'
 WHERE call_id='119583f2-1915-41ad-bc42-730ae70b2d94';
UPDATE public.calls SET processing_status='recording_unavailable' WHERE id='119583f2-1915-41ad-bc42-730ae70b2d94';