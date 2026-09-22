ALTER TABLE public.course_gamification_settings
  ADD COLUMN IF NOT EXISTS messages jsonb NOT NULL DEFAULT '{}'::jsonb;