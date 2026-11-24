CREATE OR REPLACE FUNCTION public.consume_course_sms_login(p_hash text,p_session text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.course_sms_login_tokens; e public.enrollments; c public.courses; u public.chat_users;
BEGIN
 SELECT * INTO t FROM public.course_sms_login_tokens WHERE token_hash=p_hash FOR UPDATE;
 IF NOT FOUND OR t.consumed_at IS NOT NULL OR t.expires_at<=now() THEN RETURN NULL; END IF;
 SELECT * INTO e FROM public.enrollments WHERE id=t.enrollment_id AND payment_status IN ('completed','success');
 IF NOT FOUND OR e.chat_user_id IS NULL THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.support_activations a WHERE a.enrollment_id=e.id AND a.user_id=e.chat_user_id AND a.course_id=e.course_id AND a.status='activated' AND a.activated_at IS NOT NULL) THEN RETURN NULL; END IF;
 SELECT * INTO c FROM public.courses WHERE id=e.course_id AND is_active=true;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.course_access_windows w WHERE w.user_id=e.chat_user_id AND w.course_id=c.id AND w.status IN ('locked','expired')) THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.course_gamification_settings s WHERE s.course_id=c.id AND s.enabled)
 AND NOT EXISTS(SELECT 1 FROM public.course_access_windows w WHERE w.user_id=e.chat_user_id AND w.course_id=c.id AND (w.status='completed' OR (w.status='active' AND w.expires_at>now()))) THEN RETURN NULL; END IF;
 SELECT * INTO u FROM public.chat_users WHERE id=e.chat_user_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.course_sms_login_tokens SET consumed_at=now() WHERE token_hash=p_hash;
 INSERT INTO public.user_sessions(user_id,session_token,is_active,last_activity) VALUES(u.id,p_session,true,now());
 RETURN jsonb_build_object('session_token',p_session,'course_slug',c.slug,'user',jsonb_build_object('id',u.id,'name',u.name,'first_name',u.first_name,'last_name',u.last_name,'email',u.email,'phone',u.phone,'country_code',u.country_code,'username',u.username));
END;
$$;
REVOKE ALL ON FUNCTION public.consume_course_sms_login(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_course_sms_login(text,text) TO service_role;

CREATE FUNCTION public.enrollment_sms_on_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.payment_status IN ('completed','success') AND (TG_OP='INSERT' OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
 AND EXISTS(SELECT 1 FROM public.support_activations WHERE enrollment_id=NEW.id)
 AND EXISTS(SELECT 1 FROM public.course_enrollment_sms_settings WHERE course_id=NEW.course_id AND welcome_enabled AND NEW.created_at>=enabled_from)
 THEN PERFORM public.dispatch_enrollment_sms(); END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enrollment_sms_on_payment() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enrollment_sms_on_payment() TO service_role;
CREATE TRIGGER enrollment_sms_paid_welcome AFTER INSERT OR UPDATE OF payment_status ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.enrollment_sms_on_payment();
CREATE FUNCTION public.enrollment_sms_new_course() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.course_enrollment_sms_settings(course_id,welcome_enabled,activation_enabled,start_enabled) VALUES(NEW.id,true,true,true) ON CONFLICT DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enrollment_sms_new_course() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enrollment_sms_new_course() TO service_role;
CREATE TRIGGER enrollment_sms_default_new_course AFTER INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.enrollment_sms_new_course();