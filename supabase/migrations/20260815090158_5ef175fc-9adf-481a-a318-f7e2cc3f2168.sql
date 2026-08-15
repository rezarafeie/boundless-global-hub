CREATE OR REPLACE FUNCTION public.assert_webinar_followup_admin(p_session_token text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id integer;
BEGIN
  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_token = p_session_token
    AND us.is_active = true
    AND us.last_activity > now() - interval '24 hours';

  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.chat_users cu
    WHERE cu.id = v_user_id
      AND (cu.role IN ('admin','enrollments_manager')
        OR cu.is_messenger_admin = true
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v_user_id AND ur.is_active = true AND ur.role_name IN ('admin','enrollments_manager')))
  ) THEN
    RAISE EXCEPTION 'دسترسی مدیریت معتبر نیست';
  END IF;
  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_webinar_followup(
  p_session_token text,
  p_id uuid,
  p_name text,
  p_enabled boolean,
  p_channel text,
  p_audience text,
  p_anchor text,
  p_delay_minutes integer,
  p_max_repeats integer,
  p_repeat_delay_minutes integer,
  p_email_subject text,
  p_email_body text,
  p_sms_text text,
  p_sms_template_url text,
  p_bot_text text
) RETURNS public.webinar_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.webinar_followups;
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  UPDATE public.webinar_followups SET
    name = p_name,
    enabled = p_enabled,
    channel = p_channel,
    audience = p_audience,
    anchor = p_anchor,
    delay_minutes = COALESCE(p_delay_minutes, 0),
    max_repeats = COALESCE(p_max_repeats, 1),
    repeat_delay_minutes = COALESCE(p_repeat_delay_minutes, 1440),
    email_subject = p_email_subject,
    email_body = p_email_body,
    sms_text = p_sms_text,
    sms_template_url = p_sms_template_url,
    bot_text = p_bot_text,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'پیگیری پیدا نشد';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_webinar_followup(p_session_token text, p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  DELETE FROM public.webinar_followups WHERE id = p_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_webinar_followup(text,uuid,text,boolean,text,text,text,integer,integer,integer,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_webinar_followup(text,uuid) TO anon, authenticated;