CREATE TABLE public.social_enrollment_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 enabled boolean NOT NULL DEFAULT false,
 account_id uuid NOT NULL REFERENCES public.social_accounts(id),
 course_id uuid NOT NULL REFERENCES public.courses(id),
 event_type text NOT NULL DEFAULT 'autoform_completed',
 trigger_value text NOT NULL,
 field_mapping jsonb NOT NULL DEFAULT '{"name":"name","phone":"phone","email":"email"}',
 reply_template text NOT NULL DEFAULT '{name} عزیز، ثبت‌نام شما در دوره «{course_title}» انجام شد.\nفعال‌سازی پشتیبانی: {telegram_link}\n{bale_link}',
 missing_fields_message text NOT NULL DEFAULT 'لطفاً فرم ثبت‌نام را با نام، شماره موبایل و ایمیل تکمیل کنید.',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_enrollment_rules TO service_role;
ALTER TABLE public.social_enrollment_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER social_enrollment_rules_updated BEFORE UPDATE ON public.social_enrollment_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.social_enrollment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_key text NOT NULL UNIQUE,
 event_type text NOT NULL,
 payload jsonb NOT NULL,
 rule_id uuid REFERENCES public.social_enrollment_rules(id),
 status text NOT NULL DEFAULT 'queued',
 attempts integer NOT NULL DEFAULT 0,
 enrollment_id uuid,
 reply_sent_at timestamptz,
 last_error text,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_enrollment_events TO service_role;
ALTER TABLE public.social_enrollment_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX social_enrollment_events_pending ON public.social_enrollment_events(next_attempt_at) WHERE status IN ('queued','retry');
CREATE TRIGGER social_enrollment_events_updated BEFORE UPDATE ON public.social_enrollment_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();