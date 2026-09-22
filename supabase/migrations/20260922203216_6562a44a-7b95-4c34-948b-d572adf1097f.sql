ALTER TABLE public.course_gamification_notifications
ADD COLUMN IF NOT EXISTS delivery_errors jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_gamification_notifications TO authenticated;
GRANT ALL ON public.course_gamification_notifications TO service_role;