
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS support_followup_stage1_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_repeat_delay_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_repeat_delay_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_repeat_delay_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS support_followup_stage1_sms_template_url text
    DEFAULT 'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={course_title}&template=welcomefollowup';

UPDATE public.courses
SET support_followup_stage1_sms_template_url = 'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={course_title}&template=welcomefollowup'
WHERE support_followup_stage1_sms_template_url IS NULL;
