CREATE OR REPLACE FUNCTION public.create_webinar_followup(
  p_session_token text,
  p_webinar_id uuid
)
RETURNS public.webinar_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id integer;
  v_result public.webinar_followups;
BEGIN
  SELECT us.user_id
  INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_token = p_session_token
    AND us.is_active = true
    AND us.last_activity > now() - interval '24 hours';

  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.chat_users cu
    WHERE cu.id = v_user_id
      AND (
        cu.role IN ('admin', 'enrollments_manager')
        OR cu.is_messenger_admin = true
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = v_user_id
            AND ur.is_active = true
            AND ur.role_name IN ('admin', 'enrollments_manager')
        )
      )
  ) THEN
    RAISE EXCEPTION 'دسترسی مدیریت معتبر نیست';
  END IF;

  INSERT INTO public.webinar_followups (
    webinar_id, name, channel, audience, anchor, delay_minutes,
    max_repeats, repeat_delay_minutes, sms_template_url
  )
  VALUES (
    p_webinar_id, 'پیگیری جدید', 'email', 'registered', 'registration', 60,
    1, 1440,
    'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={webinar_title}&template=welcomefollowup'
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_webinar_followup(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_webinar_followup(text, uuid) TO anon, authenticated, service_role;