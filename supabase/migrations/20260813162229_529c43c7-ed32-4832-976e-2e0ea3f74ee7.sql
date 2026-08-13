CREATE TABLE public.webinar_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'پیگیری جدید',
  enabled BOOLEAN NOT NULL DEFAULT true,
  channel TEXT NOT NULL DEFAULT 'email',
  audience TEXT NOT NULL DEFAULT 'registered',
  anchor TEXT NOT NULL DEFAULT 'registration',
  delay_minutes INTEGER NOT NULL DEFAULT 60,
  max_repeats INTEGER NOT NULL DEFAULT 1,
  repeat_delay_minutes INTEGER NOT NULL DEFAULT 1440,
  email_subject TEXT,
  email_body TEXT,
  sms_text TEXT,
  sms_template_url TEXT,
  bot_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webinar_followups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webinar_followups TO authenticated;
GRANT ALL ON public.webinar_followups TO service_role;
ALTER TABLE public.webinar_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webinar_followups readable" ON public.webinar_followups FOR SELECT USING (true);
CREATE POLICY "webinar_followups manageable" ON public.webinar_followups FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_webinar_followups_updated_at
BEFORE UPDATE ON public.webinar_followups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webinar_followup_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  followup_id UUID NOT NULL REFERENCES public.webinar_followups(id) ON DELETE CASCADE,
  webinar_id UUID NOT NULL,
  phone TEXT NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (followup_id, phone)
);

GRANT SELECT ON public.webinar_followup_recipients TO authenticated;
GRANT ALL ON public.webinar_followup_recipients TO service_role;
ALTER TABLE public.webinar_followup_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webinar_followup_recipients readable" ON public.webinar_followup_recipients FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_webinar_followup_recipients_updated_at
BEFORE UPDATE ON public.webinar_followup_recipients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webinar_followup_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  followup_id UUID REFERENCES public.webinar_followups(id) ON DELETE SET NULL,
  webinar_id UUID,
  phone TEXT,
  user_id INTEGER,
  channel TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webinar_followup_log TO authenticated;
GRANT ALL ON public.webinar_followup_log TO service_role;
ALTER TABLE public.webinar_followup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webinar_followup_log readable" ON public.webinar_followup_log FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_webinar_followups_webinar ON public.webinar_followups(webinar_id);
CREATE INDEX idx_webinar_followup_log_webinar ON public.webinar_followup_log(webinar_id, created_at DESC);
CREATE INDEX idx_webinar_followup_recipients_followup ON public.webinar_followup_recipients(followup_id);