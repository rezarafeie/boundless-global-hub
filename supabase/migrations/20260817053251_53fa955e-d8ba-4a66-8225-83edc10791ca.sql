ALTER TABLE public.webinar_followup_recipients
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS idx_webinar_followup_recipients_status
  ON public.webinar_followup_recipients (followup_id, delivery_status, scheduled_at);

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
  v_claimed boolean := false;
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
    AND (
      public.webinar_followup_recipients.delivery_status <> 'processing'
      OR public.webinar_followup_recipients.claimed_at < now() - interval '10 minutes'
    );

  GET DIAGNOSTICS v_claimed = ROW_COUNT;
  RETURN v_claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_webinar_followup_delivery(
  p_followup_id uuid,
  p_phone text,
  p_delivered boolean,
  p_status text,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webinar_followup_recipients
  SET sent_count = sent_count + CASE WHEN p_delivered THEN 1 ELSE 0 END,
      last_sent_at = CASE WHEN p_delivered THEN now() ELSE last_sent_at END,
      delivery_status = CASE
        WHEN p_delivered THEN COALESCE(NULLIF(p_status, ''), 'sent')
        ELSE COALESCE(NULLIF(p_status, ''), 'failed')
      END,
      claimed_at = NULL,
      last_error = p_error,
      updated_at = now()
  WHERE followup_id = p_followup_id
    AND phone = p_phone
    AND delivery_status = 'processing';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webinar_followup_delivery(uuid, uuid, text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_webinar_followup_delivery(uuid, text, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webinar_followup_delivery(uuid, uuid, text, timestamptz, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_webinar_followup_delivery(uuid, text, boolean, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_webinar_followup_queue(
  p_session_token text,
  p_webinar_id uuid
)
RETURNS TABLE(
  followup_id uuid,
  eligible_count bigint,
  sent_count bigint,
  pending_count bigint,
  processing_count bigint,
  failed_count bigint,
  last_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);

  RETURN QUERY
  WITH audience_phones AS (
    SELECT f.id AS followup_id, public.normalize_phone(r.mobile_number) AS phone
    FROM public.webinar_followups f
    JOIN public.webinar_registrations r ON r.webinar_id = f.webinar_id
    WHERE f.webinar_id = p_webinar_id
      AND f.audience IN ('registered', 'registered_not_attended', 'all')
      AND (f.audience <> 'registered_not_attended' OR NOT EXISTS (
        SELECT 1 FROM public.webinar_participants p
        WHERE p.webinar_id = f.webinar_id
          AND public.normalize_phone(p.phone) = public.normalize_phone(r.mobile_number)
      ))
    UNION
    SELECT f.id, public.normalize_phone(s.mobile_number)
    FROM public.webinar_followups f
    JOIN public.webinar_signups s ON s.webinar_id = f.webinar_id
    WHERE f.webinar_id = p_webinar_id
      AND f.audience IN ('registered', 'registered_not_attended', 'all')
      AND (f.audience <> 'registered_not_attended' OR NOT EXISTS (
        SELECT 1 FROM public.webinar_participants p
        WHERE p.webinar_id = f.webinar_id
          AND public.normalize_phone(p.phone) = public.normalize_phone(s.mobile_number)
      ))
    UNION
    SELECT f.id, public.normalize_phone(p.phone)
    FROM public.webinar_followups f
    JOIN public.webinar_participants p ON p.webinar_id = f.webinar_id
    WHERE f.webinar_id = p_webinar_id
      AND f.audience IN ('attended', 'all')
  ), eligible AS (
    SELECT followup_id, phone FROM audience_phones WHERE phone IS NOT NULL AND phone <> '' GROUP BY followup_id, phone
  )
  SELECT f.id,
         count(e.phone)::bigint,
         count(e.phone) FILTER (
           WHERE COALESCE(r.sent_count, 0) >= CASE WHEN f.schedule_mode = 'adaptive' THEN 1 ELSE GREATEST(1, f.max_repeats) END
         )::bigint,
         count(e.phone) FILTER (
           WHERE COALESCE(r.sent_count, 0) < CASE WHEN f.schedule_mode = 'adaptive' THEN 1 ELSE GREATEST(1, f.max_repeats) END
             AND COALESCE(r.delivery_status, 'pending') <> 'processing'
         )::bigint,
         count(e.phone) FILTER (WHERE r.delivery_status = 'processing')::bigint,
         count(e.phone) FILTER (WHERE r.delivery_status = 'failed')::bigint,
         max(r.last_sent_at)
  FROM public.webinar_followups f
  LEFT JOIN eligible e ON e.followup_id = f.id
  LEFT JOIN public.webinar_followup_recipients r ON r.followup_id = f.id AND r.phone = e.phone
  WHERE f.webinar_id = p_webinar_id
  GROUP BY f.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_webinar_followup_queue(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_webinar_followup_queue(text, uuid) TO anon, authenticated, service_role;