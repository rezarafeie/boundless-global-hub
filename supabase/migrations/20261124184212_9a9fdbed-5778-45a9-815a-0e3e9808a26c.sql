REVOKE ALL ON FUNCTION public.enrollment_sms_on_activation() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enrollment_sms_on_activation() TO service_role;
CREATE INDEX course_sms_login_tokens_enrollment_idx ON public.course_sms_login_tokens(enrollment_id);