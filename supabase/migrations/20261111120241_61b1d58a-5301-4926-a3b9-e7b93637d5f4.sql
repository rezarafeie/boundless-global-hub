CREATE TABLE public.call_center_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz, result jsonb, error text);
GRANT ALL ON public.call_center_jobs TO service_role;
ALTER TABLE public.call_center_jobs ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX call_center_jobs_active_kind ON public.call_center_jobs(kind) WHERE status IN ('pending','processing');
CREATE OR REPLACE FUNCTION public.callcenter_enqueue_scheduled_jobs() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE k text; interval_minutes integer; BEGIN
PERFORM pg_advisory_xact_lock(hashtext('callcenter_enqueue'));
UPDATE public.call_center_jobs SET status='failed',finished_at=now(),error='Processing lease expired' WHERE status='processing' AND started_at<now()-interval '15 minutes';
SELECT greatest(5,least(coalesce(sync_interval_minutes,5),1440)) INTO interval_minutes FROM public.call_center_settings WHERE id=1;
FOREACH k IN ARRAY ARRAY['sync','recording','transcript','analysis','followups','attribution','events'] LOOP
IF NOT EXISTS(SELECT 1 FROM public.call_center_jobs WHERE kind=k AND created_at>now()-make_interval(mins=>CASE WHEN k='sync' THEN coalesce(interval_minutes,5) ELSE 5 END)) THEN
INSERT INTO public.call_center_jobs(kind) VALUES(k) ON CONFLICT DO NOTHING;
END IF; END LOOP; END $$;
REVOKE ALL ON FUNCTION public.callcenter_enqueue_scheduled_jobs() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.callcenter_enqueue_scheduled_jobs() TO service_role;
CREATE OR REPLACE FUNCTION public.callcenter_claim_scheduled_job() RETURNS SETOF public.call_center_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
PERFORM pg_advisory_xact_lock(hashtext('callcenter_claim'));
RETURN QUERY UPDATE public.call_center_jobs SET status='processing',started_at=now() WHERE id=(SELECT id FROM public.call_center_jobs WHERE status='pending' ORDER BY created_at,kind FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.callcenter_claim_scheduled_job() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.callcenter_claim_scheduled_job() TO service_role;