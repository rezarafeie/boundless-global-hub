ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS duplicate_lead_of uuid;
CREATE INDEX IF NOT EXISTS enrollments_visible_leads_course_idx ON public.enrollments(course_id, created_at DESC) WHERE duplicate_lead_of IS NULL;
COMMENT ON COLUMN public.enrollments.duplicate_lead_of IS 'Lead-list-only duplicate marker; the enrollment and all dependencies are preserved.';
CREATE OR REPLACE FUNCTION public.find_duplicate_enrollments(p_session_token text, p_course_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(keep_id uuid, duplicate_id uuid, full_name text, phone text, email text, course_id uuid, course_title text, payment_status text, payment_amount numeric, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO public AS $function$
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  RETURN QUERY
  WITH identities AS (
    SELECT e.*, COALESCE('user:' || e.chat_user_id::text, 'phone:' || NULLIF(public.normalize_phone(translate(e.phone, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')), ''), 'email:' || NULLIF(lower(trim(e.email)), ''), 'record:' || e.id::text) AS identity_key,
      EXISTS(SELECT 1 FROM public.lead_assignments la WHERE la.enrollment_id=e.id) AS has_assignment
    FROM public.enrollments e WHERE p_course_id IS NULL OR e.course_id=p_course_id
  ), ranked AS (
    SELECT i.*, ROW_NUMBER() OVER w AS rn, FIRST_VALUE(i.id) OVER w AS keeper_id
    FROM identities i
    WINDOW w AS (PARTITION BY i.course_id, i.identity_key ORDER BY (i.duplicate_lead_of IS NULL) DESC, i.has_assignment DESC, (i.payment_status IN ('success','completed')) DESC NULLS LAST, (NULLIF(i.spotplayer_license_key,'') IS NOT NULL) DESC, i.created_at ASC, i.id ASC)
  )
  SELECT r.keeper_id, r.id, r.full_name, r.phone, r.email, r.course_id, c.title, r.payment_status, r.payment_amount, r.created_at
  FROM ranked r LEFT JOIN public.courses c ON c.id=r.course_id
  WHERE r.rn>1 AND r.duplicate_lead_of IS NULL
  ORDER BY r.course_id, r.identity_key, r.created_at, r.id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.remove_duplicate_enrollments(p_session_token text, p_course_id uuid DEFAULT NULL::uuid, p_ids uuid[] DEFAULT NULL::uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE v_count integer := 0;
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  PERFORM pg_advisory_xact_lock(hashtext('lead_duplicate_cleanup'));
  WITH duplicates AS (SELECT d.keep_id,d.duplicate_id FROM public.find_duplicate_enrollments(p_session_token,p_course_id) d WHERE p_ids IS NULL OR d.duplicate_id=ANY(p_ids))
  UPDATE public.enrollments e SET duplicate_lead_of=d.keep_id FROM duplicates d WHERE e.id=d.duplicate_id AND e.duplicate_lead_of IS NULL;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION public.find_duplicate_enrollments(text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_duplicate_enrollments(text,uuid,uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_duplicate_enrollments(text,uuid) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.remove_duplicate_enrollments(text,uuid,uuid[]) TO anon,authenticated,service_role;