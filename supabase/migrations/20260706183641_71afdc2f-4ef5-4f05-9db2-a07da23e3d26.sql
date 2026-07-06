
-- Course-level followup config
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS support_followup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_delay_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_delay_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_delay_minutes integer NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS support_followup_max_repeats integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_email_subject text,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_email_body text,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_sms_text text,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_bot_text text,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_business_text text;

-- Per-activation counters
ALTER TABLE public.support_activations
  ADD COLUMN IF NOT EXISTS followup_stage1_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followup_stage2_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followup_stage3_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_stage integer,
  ADD COLUMN IF NOT EXISTS last_followup_sent_at timestamptz;

-- Audit log
CREATE TABLE IF NOT EXISTS public.support_activation_followup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_activation_id uuid NOT NULL REFERENCES public.support_activations(id) ON DELETE CASCADE,
  course_id uuid,
  user_id integer,
  stage integer NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_activation_followup_log TO authenticated;
GRANT ALL ON public.support_activation_followup_log TO service_role;

ALTER TABLE public.support_activation_followup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read followup log"
  ON public.support_activation_followup_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users cu
      WHERE cu.id::text = auth.uid()::text AND (cu.is_messenger_admin = true OR cu.role = 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_support_followup_log_activation
  ON public.support_activation_followup_log(support_activation_id);

-- Set default Persian messages on existing courses (only where NULL)
UPDATE public.courses SET
  support_followup_stage1_email_subject = COALESCE(support_followup_stage1_email_subject, 'قدم آخر برای فعال‌سازی پشتیبانی دوره {{course_title}}'),
  support_followup_stage1_email_body = COALESCE(support_followup_stage1_email_body,
    E'{{name}} عزیز،\n\nخرید شما برای دوره «{{course_title}}» با موفقیت ثبت شد ✅\nبرای فعال‌سازی پشتیبانی، لطفاً وارد داشبورد آکادمی رفیعی شوید و روی دکمه «فعال‌سازی پشتیبانی» کلیک کنید.\n\nلینک ورود: https://academy.rafiei.co\n\nموفق باشید 🌱\nآکادمی رفیعی'),
  support_followup_stage1_sms_text = COALESCE(support_followup_stage1_sms_text,
    '{{name}} عزیز، برای فعال‌سازی پشتیبانی دوره {{course_title}} به داشبورد آکادمی رفیعی مراجعه کنید: academy.rafiei.co'),
  support_followup_stage2_bot_text = COALESCE(support_followup_stage2_bot_text,
    E'سلام {{name}} 👋\nوارد ربات شدی ولی هنوز روی دکمه «فعال‌سازی پشتیبانی» نزدی.\nیه کلیک کافیه تا تیم پشتیبانی دوره «{{course_title}}» رو برات فعال کنه.'),
  support_followup_stage3_business_text = COALESCE(support_followup_stage3_business_text,
    E'{{name}} جان،\nپیام فعال‌سازی پشتیبانی دوره «{{course_title}}» رو دریافت کردیم ولی هنوز نهایی نشده. اگر سوالی داری همینجا بنویس تا سریع رسیدگی کنیم 🙏');
