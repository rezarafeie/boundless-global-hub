CREATE TABLE public.course_enrollment_sms_settings (
 course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
 welcome_enabled boolean NOT NULL DEFAULT false,
 activation_enabled boolean NOT NULL DEFAULT false,
 start_enabled boolean NOT NULL DEFAULT false,
 activation_delay_minutes integer NOT NULL DEFAULT 60 CHECK (activation_delay_minutes >= 0),
 start_delay_minutes integer NOT NULL DEFAULT 1440 CHECK (start_delay_minutes >= 0),
 enabled_from timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.course_enrollment_sms_settings TO service_role;
ALTER TABLE public.course_enrollment_sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages enrollment SMS" ON public.course_enrollment_sms_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_course_enrollment_sms_settings BEFORE UPDATE ON public.course_enrollment_sms_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.enrollment_sms_deliveries (
 enrollment_id uuid NOT NULL REFERENCES public.enrollments(id), kind text NOT NULL CHECK (kind IN ('welcome','activation','start')),
 status text NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','sent','failed','skipped','unknown')),
 provider_message_id text, error_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(enrollment_id,kind)
);
GRANT ALL ON public.enrollment_sms_deliveries TO service_role;
ALTER TABLE public.enrollment_sms_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages SMS deliveries" ON public.enrollment_sms_deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_enrollment_sms_deliveries BEFORE UPDATE ON public.enrollment_sms_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.course_sms_login_tokens (
 token_hash text PRIMARY KEY, enrollment_id uuid NOT NULL REFERENCES public.enrollments(id),
 expires_at timestamptz NOT NULL, consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.course_sms_login_tokens TO service_role;
ALTER TABLE public.course_sms_login_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages private SMS login" ON public.course_sms_login_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_course_sms_login_tokens BEFORE UPDATE ON public.course_sms_login_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE FUNCTION public.enrollment_sms_candidates() RETURNS SETOF jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('activation_id',a.id,'kind',k.kind) FROM public.support_activations a
 JOIN public.enrollments e ON e.id=a.enrollment_id AND e.chat_user_id=a.user_id AND e.course_id=a.course_id
 JOIN public.course_enrollment_sms_settings s ON s.course_id=e.course_id
 CROSS JOIN (VALUES ('welcome'),('activation'),('start')) k(kind)
 WHERE e.payment_status IN ('completed','success') AND e.created_at >= s.enabled_from
 AND NOT EXISTS(SELECT 1 FROM public.enrollment_sms_deliveries d WHERE d.enrollment_id=e.id AND d.kind=k.kind)
 AND ((k.kind='welcome' AND s.welcome_enabled)
 OR (k.kind='activation' AND s.activation_enabled AND a.status <> 'activated' AND a.activated_at IS NULL AND now() >= a.created_at + make_interval(mins=>s.activation_delay_minutes))
 OR (k.kind='start' AND s.start_enabled AND a.status='activated' AND a.activated_at IS NOT NULL AND now() >= a.activated_at + make_interval(mins=>s.start_delay_minutes)
 AND NOT EXISTS(SELECT 1 FROM public.user_lesson_progress p WHERE p.user_id=a.user_id AND p.course_id=a.course_id AND (p.is_opened OR p.is_completed OR p.total_time_spent>0))))
 ORDER BY e.created_at,a.id,k.kind LIMIT 100
$$;
REVOKE ALL ON FUNCTION public.enrollment_sms_candidates() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enrollment_sms_candidates() TO service_role;

CREATE FUNCTION public.consume_course_sms_login(p_hash text,p_session text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.course_sms_login_tokens; e public.enrollments; c public.courses; u public.chat_users;
BEGIN
 SELECT * INTO t FROM public.course_sms_login_tokens WHERE token_hash=p_hash FOR UPDATE;
 IF NOT FOUND OR t.consumed_at IS NOT NULL OR t.expires_at<=now() THEN RETURN NULL; END IF;
 SELECT * INTO e FROM public.enrollments WHERE id=t.enrollment_id AND payment_status IN ('completed','success');
 IF NOT FOUND OR e.chat_user_id IS NULL THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.support_activations a WHERE a.enrollment_id=e.id AND a.user_id=e.chat_user_id AND a.course_id=e.course_id AND a.status='activated' AND a.activated_at IS NOT NULL) THEN RETURN NULL; END IF;
 SELECT * INTO c FROM public.courses WHERE id=e.course_id AND is_active=true;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.course_gamification_settings s WHERE s.course_id=c.id AND s.enabled)
 AND NOT EXISTS(SELECT 1 FROM public.course_access_windows w WHERE w.user_id=e.chat_user_id AND w.course_id=c.id AND (w.status='completed' OR (w.status='active' AND w.expires_at>now()))) THEN RETURN NULL; END IF;
 SELECT * INTO u FROM public.chat_users WHERE id=e.chat_user_id AND NOT COALESCE(is_blocked,false);
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.course_sms_login_tokens SET consumed_at=now() WHERE token_hash=p_hash;
 INSERT INTO public.user_sessions(user_id,session_token,is_active,last_activity) VALUES(u.id,p_session,true,now());
 RETURN jsonb_build_object('session_token',p_session,'course_slug',c.slug,'user',jsonb_build_object('id',u.id,'name',u.name,'first_name',u.first_name,'last_name',u.last_name,'email',u.email,'phone',u.phone,'country_code',u.country_code,'username',u.username));
END;
$$;
REVOKE ALL ON FUNCTION public.consume_course_sms_login(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_course_sms_login(text,text) TO service_role;

SELECT vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'enrollment_sms_worker_key','Private enrollment SMS scheduler authentication');
CREATE FUNCTION public.enrollment_sms_worker_key() RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='enrollment_sms_worker_key' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.enrollment_sms_worker_key() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enrollment_sms_worker_key() TO service_role;
CREATE FUNCTION public.dispatch_enrollment_sms() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE secret text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.course_enrollment_sms_settings WHERE welcome_enabled OR activation_enabled OR start_enabled) THEN RETURN; END IF;
 SELECT public.enrollment_sms_worker_key() INTO secret;
 PERFORM net.http_post(url:='https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/enrollment-sms',headers:=jsonb_build_object('Content-Type','application/json','x-enrollment-sms-secret',secret),body:='{"action":"worker"}'::jsonb,timeout_milliseconds:=60000);
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_enrollment_sms() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_enrollment_sms() TO service_role;
CREATE FUNCTION public.enrollment_sms_on_activation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.course_enrollment_sms_settings s JOIN public.enrollments e ON e.course_id=s.course_id WHERE e.id=NEW.enrollment_id AND s.welcome_enabled AND e.payment_status IN ('completed','success') AND e.created_at>=s.enabled_from) THEN
 PERFORM public.dispatch_enrollment_sms(); END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER enrollment_sms_welcome AFTER INSERT ON public.support_activations FOR EACH ROW EXECUTE FUNCTION public.enrollment_sms_on_activation();
SELECT cron.schedule('enrollment-sms-reminders','0 * * * *','SELECT public.dispatch_enrollment_sms();');