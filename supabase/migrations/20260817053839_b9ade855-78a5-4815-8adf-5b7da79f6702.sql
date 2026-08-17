CREATE OR REPLACE FUNCTION public.claim_webinar_followup_delivery(
  p_followup_id uuid,
  p_webinar_id uuid,
  p_phone text,
  p_scheduled_at timestamptz,
  p_max_deliveries integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  INSERT INTO public.webinar_followup_recipients (
    followup_id, webinar_id, phone, sent_count, delivery_status,
    claimed_at, scheduled_at, attempt_count, last_error
  ) VALUES (
    p_followup_id, p_webinar_id, p_phone, 0, 'processing',
    now(), p_scheduled_at, 1, NULL
  )
  ON CONFLICT (followup_id, phone) DO UPDATE
  SET delivery_status = 'processing',
      claimed_at = now(),
      scheduled_at = EXCLUDED.scheduled_at,
      attempt_count = public.webinar_followup_recipients.attempt_count + 1,
      last_error = NULL,
      updated_at = now()
  WHERE public.webinar_followup_recipients.sent_count < GREATEST(1, p_max_deliveries)
    AND public.webinar_followup_recipients.delivery_status IN ('pending', 'failed');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webinar_followup_delivery(uuid, uuid, text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webinar_followup_delivery(uuid, uuid, text, timestamptz, integer) TO service_role;