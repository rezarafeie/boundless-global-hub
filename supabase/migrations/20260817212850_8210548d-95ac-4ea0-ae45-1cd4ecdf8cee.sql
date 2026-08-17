ALTER TABLE public.webinar_followups
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS buttons jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.support_activation_custom_followups
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS buttons jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS support_followup_stage2_media_url text,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_media_type text,
  ADD COLUMN IF NOT EXISTS support_followup_stage2_buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_media_url text,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_media_type text,
  ADD COLUMN IF NOT EXISTS support_followup_stage3_buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS telegram_bot_activated_media_url text,
  ADD COLUMN IF NOT EXISTS telegram_bot_activated_media_type text;

ALTER TABLE public.webinar_entries
  ADD COLUMN IF NOT EXISTS telegram_support_activated_media_url text,
  ADD COLUMN IF NOT EXISTS telegram_support_activated_media_type text;