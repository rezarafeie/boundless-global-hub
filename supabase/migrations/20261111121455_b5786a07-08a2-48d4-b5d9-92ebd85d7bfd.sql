CREATE OR REPLACE FUNCTION public.callcenter_wake_scheduled_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,net AS $$ BEGIN
PERFORM net.http_post(url:='https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/call-center-scheduler',headers:='{"Content-Type":"application/json"}'::jsonb,body:='{}'::jsonb);
RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.callcenter_wake_scheduled_job() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER callcenter_wake_job AFTER INSERT ON public.call_center_jobs FOR EACH ROW EXECUTE FUNCTION public.callcenter_wake_scheduled_job();