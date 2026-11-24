CREATE OR REPLACE FUNCTION public.gen_activation_token(p_length integer DEFAULT 12)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_alphabet text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  v_out text := '';
  v_len int;
  i int;
BEGIN
  v_len := GREATEST(COALESCE(p_length, 12), 6);
  FOR i IN 1..v_len LOOP
    v_out := v_out || substr(v_alphabet, (floor(random() * 62) + 1)::int, 1);
  END LOOP;
  RETURN v_out;
END $$;

GRANT EXECUTE ON FUNCTION public.gen_activation_token(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_support_activation(
  p_user_id integer,
  p_course_id uuid,
  p_enrollment_id uuid DEFAULT NULL
) RETURNS public.support_activations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_activations;
  v_token text;
  v_bot_username text;
  v_deep_link text;
  v_attempts int := 0;
BEGIN
  SELECT * INTO v_row
  FROM public.support_activations
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND ((enrollment_id IS NULL AND p_enrollment_id IS NULL) OR enrollment_id = p_enrollment_id)
  LIMIT 1;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  LOOP
    v_attempts := v_attempts + 1;
    v_token := public.gen_activation_token(12);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.support_activations WHERE activation_token = v_token);
    IF v_attempts >= 10 THEN
      v_token := replace(gen_random_uuid()::text, '-', '');
      EXIT;
    END IF;
  END LOOP;

  SELECT COALESCE(telegram_bot_username, 'rafiei_bot') INTO v_bot_username
  FROM public.admin_settings WHERE id = 1;
  v_bot_username := regexp_replace(COALESCE(v_bot_username,'rafiei_bot'), '^@', '');
  v_deep_link := 'https://t.me/' || v_bot_username || '?start=sact_' || v_token;

  INSERT INTO public.support_activations(
    user_id, course_id, enrollment_id, activation_token, bot_deep_link, status
  ) VALUES (
    p_user_id, p_course_id, p_enrollment_id, v_token, v_deep_link, 'not_started'
  ) RETURNING * INTO v_row;

  INSERT INTO public.support_activation_events(
    support_activation_id, user_id, course_id, event_type, payload_json
  ) VALUES (
    v_row.id, p_user_id, p_course_id, 'created', jsonb_build_object('token', v_token)
  );

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.ensure_support_activation(integer, uuid, uuid) TO anon, authenticated, service_role;