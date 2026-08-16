CREATE OR REPLACE FUNCTION public.get_webinar_followup_logs(p_session_token text, p_webinar_id uuid, p_limit integer DEFAULT 200)
RETURNS TABLE (
  id uuid,
  followup_id uuid,
  webinar_id uuid,
  phone text,
  user_id integer,
  channel text,
  status text,
  error_message text,
  payload jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  RETURN QUERY
  SELECT l.id, l.followup_id, l.webinar_id, l.phone, l.user_id, l.channel, l.status, l.error_message, l.payload, l.created_at
  FROM public.webinar_followup_log l
  WHERE l.webinar_id = p_webinar_id
  ORDER BY l.created_at DESC
  LIMIT COALESCE(p_limit, 200);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_webinar_followup_recipients(p_session_token text, p_webinar_id uuid)
RETURNS TABLE (
  id uuid,
  followup_id uuid,
  webinar_id uuid,
  phone text,
  sent_count integer,
  last_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  RETURN QUERY
  SELECT r.id, r.followup_id, r.webinar_id, r.phone, r.sent_count, r.last_sent_at
  FROM public.webinar_followup_recipients r
  WHERE r.webinar_id = p_webinar_id
  ORDER BY r.last_sent_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_webinar_followup_logs(text, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_webinar_followup_recipients(text, uuid) TO anon, authenticated;