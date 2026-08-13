GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webinar_followups TO authenticated;
GRANT ALL ON TABLE public.webinar_followups TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webinar_followup_recipients TO authenticated;
GRANT ALL ON TABLE public.webinar_followup_recipients TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webinar_followup_log TO authenticated;
GRANT ALL ON TABLE public.webinar_followup_log TO service_role;