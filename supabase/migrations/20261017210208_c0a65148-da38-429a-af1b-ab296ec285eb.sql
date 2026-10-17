-- lovable-cron-fallback-reviewed: wake on enqueue; minute retry clock only while queue nonempty, unscheduled after drain
CREATE OR REPLACE FUNCTION public.social_enrollment_queue_clock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE active_count integer; worker_sql text;
BEGIN
PERFORM pg_advisory_xact_lock(hashtext('social_enrollment_clock'));
SELECT count(*) INTO active_count FROM public.social_enrollment_events WHERE status IN ('queued','retry','processing') AND attempts<5;
IF active_count > 0 AND NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='social-enrollment-pending-retries') THEN
worker_sql := $cmd$SELECT net.http_post(url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/social-enrollment-worker', headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI"}'::jsonb, body := '{}'::jsonb);$cmd$;
PERFORM cron.schedule('social-enrollment-pending-retries','* * * * *',worker_sql);
ELSIF active_count=0 THEN
PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='social-enrollment-pending-retries';
END IF;
RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.social_enrollment_queue_clock() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.social_enrollment_queue_clock() TO service_role;
CREATE TRIGGER social_enrollment_queue_clock_trigger AFTER INSERT OR UPDATE OF status ON public.social_enrollment_events FOR EACH STATEMENT EXECUTE FUNCTION public.social_enrollment_queue_clock();