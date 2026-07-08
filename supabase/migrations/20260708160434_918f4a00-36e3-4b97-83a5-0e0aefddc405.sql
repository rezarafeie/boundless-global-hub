
CREATE TABLE IF NOT EXISTS public.support_activation_custom_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  channel text NOT NULL CHECK (channel IN ('bot','email','sms')),
  delay_minutes integer NOT NULL DEFAULT 60,
  max_repeats integer NOT NULL DEFAULT 1,
  repeat_delay_minutes integer NOT NULL DEFAULT 1440,
  email_subject text,
  email_body text,
  sms_text text,
  sms_template_url text,
  bot_text text,
  skip_if_activated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_activation_custom_followups TO authenticated;
GRANT ALL ON public.support_activation_custom_followups TO service_role;

ALTER TABLE public.support_activation_custom_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read custom followups"
  ON public.support_activation_custom_followups FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Service role manages custom followups"
  ON public.support_activation_custom_followups FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_custom_followups_updated ON public.support_activation_custom_followups;
CREATE TRIGGER trg_custom_followups_updated
  BEFORE UPDATE ON public.support_activation_custom_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_activation_followup_log
  ADD COLUMN IF NOT EXISTS custom_followup_id uuid REFERENCES public.support_activation_custom_followups(id) ON DELETE SET NULL;

ALTER TABLE public.support_activations
  ADD COLUMN IF NOT EXISTS custom_followup_sent_counts jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_custom_followups_course ON public.support_activation_custom_followups(course_id);
CREATE INDEX IF NOT EXISTS idx_followup_log_custom ON public.support_activation_followup_log(custom_followup_id);
