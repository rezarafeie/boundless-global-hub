CREATE OR REPLACE FUNCTION public.claim_social_enrollment_event() RETURNS SETOF public.social_enrollment_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
PERFORM pg_advisory_xact_lock(hashtext('social_enrollment_worker'));
IF EXISTS(SELECT 1 FROM public.social_enrollment_events WHERE status='processing' AND locked_at > now()-interval '10 minutes') THEN RETURN; END IF;
RETURN QUERY UPDATE public.social_enrollment_events SET status='processing', locked_at=now(), attempts=attempts+1 WHERE id=(SELECT id FROM public.social_enrollment_events WHERE ((status IN ('queued','retry') AND next_attempt_at<=now()) OR (status='processing' AND locked_at<=now()-interval '10 minutes')) AND attempts<5 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.claim_social_enrollment_event() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_social_enrollment_event() TO service_role;