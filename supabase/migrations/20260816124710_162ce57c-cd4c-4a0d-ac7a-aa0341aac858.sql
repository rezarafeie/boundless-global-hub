CREATE OR REPLACE FUNCTION public.find_duplicate_enrollments(p_session_token text, p_course_id uuid DEFAULT NULL)
RETURNS TABLE(
  keep_id uuid,
  duplicate_id uuid,
  full_name text,
  phone text,
  email text,
  course_id uuid,
  course_title text,
  payment_status text,
  payment_amount numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);

  RETURN QUERY
  WITH ranked AS (
    SELECT
      e.id,
      e.full_name,
      e.phone,
      e.email,
      e.course_id,
      e.payment_status,
      e.payment_amount,
      e.created_at,
      public.normalize_phone(e.phone) AS norm_phone,
      ROW_NUMBER() OVER (
        PARTITION BY e.course_id, public.normalize_phone(e.phone)
        ORDER BY
          CASE WHEN e.payment_status IN ('success','completed') THEN 0 ELSE 1 END,
          CASE WHEN e.spotplayer_license_key IS NOT NULL THEN 0 ELSE 1 END,
          e.created_at ASC
      ) AS rn,
      FIRST_VALUE(e.id) OVER (
        PARTITION BY e.course_id, public.normalize_phone(e.phone)
        ORDER BY
          CASE WHEN e.payment_status IN ('success','completed') THEN 0 ELSE 1 END,
          CASE WHEN e.spotplayer_license_key IS NOT NULL THEN 0 ELSE 1 END,
          e.created_at ASC
      ) AS keeper_id
    FROM public.enrollments e
    WHERE (p_course_id IS NULL OR e.course_id = p_course_id)
      AND e.phone IS NOT NULL
      AND public.normalize_phone(e.phone) <> ''
  )
  SELECT
    r.keeper_id,
    r.id,
    r.full_name,
    r.phone,
    r.email,
    r.course_id,
    c.title,
    r.payment_status,
    r.payment_amount,
    r.created_at
  FROM ranked r
  LEFT JOIN public.courses c ON c.id = r.course_id
  WHERE r.rn > 1
    AND r.payment_status NOT IN ('success','completed')
  ORDER BY r.norm_phone, r.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_duplicate_enrollments(p_session_token text, p_course_id uuid DEFAULT NULL, p_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin integer;
  v_ids uuid[];
  v_count integer := 0;
BEGIN
  v_admin := public.assert_webinar_followup_admin(p_session_token);

  SELECT array_agg(d.duplicate_id) INTO v_ids
  FROM public.find_duplicate_enrollments(p_session_token, p_course_id) d
  WHERE p_ids IS NULL OR d.duplicate_id = ANY(p_ids);

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM public.lead_assignments WHERE enrollment_id = ANY(v_ids);
  DELETE FROM public.lead_distribution_logs WHERE enrollment_id = ANY(v_ids);
  DELETE FROM public.crm_notes WHERE enrollment_id = ANY(v_ids);
  DELETE FROM public.crm_followups WHERE enrollment_id = ANY(v_ids);
  DELETE FROM public.enrollment_followup_events WHERE enrollment_id = ANY(v_ids);

  DELETE FROM public.enrollments WHERE id = ANY(v_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_duplicate_enrollments(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_duplicate_enrollments(text, uuid, uuid[]) TO anon, authenticated, service_role;