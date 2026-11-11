ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS link_source text;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS match_status text;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS last_event_at timestamptz;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS processing_error text;
CREATE TABLE IF NOT EXISTS public.call_routing_config (
 id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), config jsonb NOT NULL DEFAULT '{"mode":"capture"}'::jsonb
);
INSERT INTO public.call_routing_config(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.call_control_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 headers jsonb NOT NULL, body jsonb NOT NULL, decision jsonb NOT NULL, caller_facts jsonb NOT NULL DEFAULT '{}'
);
REVOKE ALL ON public.call_routing_config, public.call_control_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.call_routing_config, public.call_control_requests TO service_role;
ALTER TABLE public.call_routing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_control_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='call_routing_config' AND policyname='service_role_only') THEN
 CREATE POLICY service_role_only ON public.call_routing_config TO service_role USING(true) WITH CHECK(true);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='call_control_requests' AND policyname='service_role_only') THEN
 CREATE POLICY service_role_only ON public.call_control_requests TO service_role USING(true) WITH CHECK(true);
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.callcenter_followup_keys (call_id uuid PRIMARY KEY);
REVOKE ALL ON public.callcenter_followup_keys FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.callcenter_followup_keys TO service_role;
ALTER TABLE public.callcenter_followup_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='callcenter_followup_keys' AND policyname='service_role_only') THEN
 CREATE POLICY service_role_only ON public.callcenter_followup_keys TO service_role USING(true) WITH CHECK(true);
 END IF;
END $$;
INSERT INTO public.callcenter_followup_keys SELECT DISTINCT call_id FROM public.call_followups WHERE type='missed_call' AND call_id IS NOT NULL ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.callcenter_dedup_followup() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.type='missed_call' AND NEW.call_id IS NOT NULL THEN
   INSERT INTO public.callcenter_followup_keys VALUES(NEW.call_id) ON CONFLICT DO NOTHING;
   IF NOT FOUND THEN RETURN NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='callcenter_dedup_followup' AND tgrelid='public.call_followups'::regclass) THEN
 CREATE TRIGGER callcenter_dedup_followup BEFORE INSERT ON public.call_followups FOR EACH ROW EXECUTE FUNCTION public.callcenter_dedup_followup();
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.callcenter_pending_analysis(batch_size integer DEFAULT 8) RETURNS SETOF public.calls LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT c.* FROM public.calls c WHERE EXISTS(SELECT 1 FROM public.call_transcripts t WHERE t.call_id=c.id AND t.processing_status='completed')
 AND NOT EXISTS(SELECT 1 FROM public.call_ai_analysis a WHERE a.call_id=c.id)
 AND c.processing_status IS DISTINCT FROM 'analyzing'
 ORDER BY c.started_at ASC NULLS LAST,c.id LIMIT LEAST(GREATEST(batch_size,1),50)
$$;
CREATE OR REPLACE FUNCTION public.callcenter_pending_recordings(batch_size integer DEFAULT 25) RETURNS SETOF public.calls LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT c.* FROM public.calls c WHERE c.recording_id IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM public.call_recordings r WHERE r.call_id=c.id AND r.status IN ('ready','unavailable','downloading'))
 ORDER BY c.started_at ASC NULLS LAST,c.id LIMIT LEAST(GREATEST(batch_size,1),50)
$$;
REVOKE ALL ON FUNCTION public.callcenter_pending_analysis(integer),public.callcenter_pending_recordings(integer),public.callcenter_dedup_followup() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.callcenter_pending_analysis(integer),public.callcenter_pending_recordings(integer),public.callcenter_dedup_followup() TO service_role;
CREATE OR REPLACE FUNCTION public.callcenter_normalize_phone(phone text) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE d text;
BEGIN
 d := regexp_replace(translate(coalesce(phone,''),'۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'),'[^0-9]','','g');
 IF d='' THEN RETURN NULL; END IF;
 IF d LIKE '0098%' THEN d:='98'||substr(d,5);
 ELSIF length(d)=11 AND d LIKE '0%' THEN d:='98'||substr(d,2);
 ELSIF length(d)=10 AND d LIKE '9%' THEN d:='98'||d;
 ELSIF d LIKE '00%' THEN d:=substr(d,3); END IF;
 RETURN d;
END $$;
CREATE OR REPLACE FUNCTION public.callcenter_phone_records(source_table text, canonical_phone text) RETURNS TABLE(record jsonb) LANGUAGE plpgsql STABLE SET search_path=public AS $$
BEGIN
 IF source_table NOT IN ('chat_users','enrollments','consultation_bookings','webinar_participants') THEN RAISE EXCEPTION 'Invalid source'; END IF;
 RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE public.callcenter_normalize_phone(t.phone)=$1 ORDER BY to_jsonb(t)->>''created_at'' DESC NULLS LAST, to_jsonb(t)->>''id'' DESC',source_table) USING canonical_phone;
END $$;
CREATE OR REPLACE FUNCTION public.callcenter_caller_facts(canonical_phone text, at_time timestamptz DEFAULT now()) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path=public AS $$
DECLARE student boolean:=false; assigned text; consultation text; support_agent text; recent boolean:=false; availability jsonb:='{}'; r jsonb;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id=e.course_id WHERE public.callcenter_normalize_phone(e.phone)=canonical_phone AND e.payment_status IN ('completed','success','paid') AND c.is_active=true AND e.created_at<=at_time) INTO student;
 SELECT to_jsonb(sa)->>'user_id' INTO assigned FROM public.enrollments e JOIN public.lead_assignments la ON la.enrollment_id=e.id JOIN public.sales_agents sa ON sa.id=la.sales_agent_id WHERE public.callcenter_normalize_phone(e.phone)=canonical_phone AND e.created_at<=at_time ORDER BY e.created_at DESC,e.id DESC LIMIT 1;
 SELECT EXISTS(SELECT 1 FROM public.enrollments e WHERE public.callcenter_normalize_phone(e.phone)=canonical_phone AND e.created_at BETWEEN at_time-interval '14 days' AND at_time) OR EXISTS(SELECT 1 FROM public.webinar_participants w WHERE public.callcenter_normalize_phone(w.phone)=canonical_phone AND w.joined_at BETWEEN at_time-interval '14 days' AND at_time) INTO recent;
 SELECT to_jsonb(b) INTO r FROM public.consultation_bookings b WHERE public.callcenter_normalize_phone(b.phone)=canonical_phone AND b.created_at<=at_time AND coalesce(to_jsonb(b)->>'status','') IN ('active','confirmed','scheduled','pending') ORDER BY b.created_at DESC,b.id DESC LIMIT 1;
 consultation := coalesce(r->>'agent_id',r->>'assigned_agent_id');
 SELECT coalesce(jsonb_object_agg(user_id::text,is_active),'{}') INTO availability FROM public.call_agent_extensions WHERE user_id IS NOT NULL;
 IF to_regclass('public.support_tickets') IS NOT NULL THEN
   EXECUTE 'SELECT coalesce(to_jsonb(t)->>''assigned_agent_id'',to_jsonb(t)->>''agent_id'') FROM public.support_tickets t WHERE public.callcenter_normalize_phone(to_jsonb(t)->>''phone'')=$1 AND coalesce(to_jsonb(t)->>''status'','''') IN (''open'',''pending'',''in_progress'') AND (to_jsonb(t)->>''created_at'')::timestamptz<=$2 ORDER BY to_jsonb(t)->>''created_at'' DESC LIMIT 1' INTO support_agent USING canonical_phone,at_time;
 END IF;
 RETURN jsonb_build_object('isStudent',student,'assignedAgentId',assigned,'activeConsultationAgentId',consultation,'recentWebinarOrCheckout',recent,'openSupportAgentId',support_agent,'agentAvailability',availability);
END $$;
CREATE OR REPLACE FUNCTION public.callcenter_stats_qa(question_kind text, from_date date DEFAULT NULL, to_date date DEFAULT NULL, self_agent bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path=public AS $$
DECLARE today date := (now() AT TIME ZONE 'Asia/Tehran')::date; first_day date; last_day date; start_at timestamptz; finish_at timestamptz; result jsonb;
BEGIN
 IF question_kind NOT IN ('today_total','top_agents','unanswered_yesterday','avg_duration_week','top_extensions','in_vs_out') THEN RAISE EXCEPTION 'Invalid question_kind'; END IF;
 first_day := coalesce(from_date,CASE WHEN question_kind='unanswered_yesterday' THEN today-1 WHEN question_kind='avg_duration_week' THEN today-6 ELSE today END);
 last_day := coalesce(to_date,CASE WHEN question_kind='unanswered_yesterday' THEN today-1 ELSE today END);
 IF first_day>last_day THEN RAISE EXCEPTION 'Invalid range'; END IF;
 start_at:=first_day::timestamp AT TIME ZONE 'Asia/Tehran'; finish_at:=(last_day+1)::timestamp AT TIME ZONE 'Asia/Tehran';
 IF question_kind='today_total' THEN
  SELECT jsonb_build_object('total',count(*)) INTO result FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND (self_agent IS NULL OR agent_id=self_agent);
 ELSIF question_kind='unanswered_yesterday' THEN
  SELECT jsonb_build_object('total',count(*)) INTO result FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND direction='incoming' AND ended_at IS NOT NULL AND status<>'answered' AND (self_agent IS NULL OR agent_id=self_agent);
 ELSIF question_kind='avg_duration_week' THEN
  SELECT jsonb_build_object('average_seconds',coalesce(avg(talk_seconds),0),'total',count(*)) INTO result FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND status='answered' AND (self_agent IS NULL OR agent_id=self_agent);
 ELSIF question_kind='top_agents' THEN
  SELECT jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(x)),'[]')) INTO result FROM (SELECT agent_id,count(*) total FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND (self_agent IS NULL OR agent_id=self_agent) GROUP BY agent_id ORDER BY total DESC,agent_id LIMIT 20)x;
 ELSIF question_kind='top_extensions' THEN
  SELECT jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(x)),'[]')) INTO result FROM (SELECT extension,count(*) total FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND (self_agent IS NULL OR agent_id=self_agent) GROUP BY extension ORDER BY total DESC,extension LIMIT 20)x;
 ELSE
  SELECT jsonb_build_object('incoming',count(*) FILTER(WHERE direction='incoming'),'outgoing',count(*) FILTER(WHERE direction='outgoing'),'internal',count(*) FILTER(WHERE direction='internal')) INTO result FROM public.calls WHERE started_at>=start_at AND started_at<finish_at AND (self_agent IS NULL OR agent_id=self_agent);
 END IF;
 RETURN result || jsonb_build_object('question_kind',question_kind,'from',first_day,'to',last_day,'timezone','Asia/Tehran');
END $$;
REVOKE ALL ON FUNCTION public.callcenter_normalize_phone(text),public.callcenter_phone_records(text,text),public.callcenter_caller_facts(text,timestamptz),public.callcenter_stats_qa(text,date,date,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.callcenter_normalize_phone(text),public.callcenter_phone_records(text,text),public.callcenter_caller_facts(text,timestamptz),public.callcenter_stats_qa(text,date,date,bigint) TO service_role;