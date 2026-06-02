INSERT INTO public.webinar_registrations (webinar_id, mobile_number, registered_at)
SELECT s.webinar_id, s.mobile_number, COALESCE(s.signup_time, now())
FROM public.webinar_signups s
LEFT JOIN public.webinar_registrations r
  ON r.webinar_id = s.webinar_id AND r.mobile_number = s.mobile_number
WHERE r.id IS NULL;