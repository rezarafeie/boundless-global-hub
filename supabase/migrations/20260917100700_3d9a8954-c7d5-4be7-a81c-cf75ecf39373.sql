-- Per-course gamification settings
CREATE TABLE public.course_gamification_settings (
  course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  free_days integer NOT NULL DEFAULT 7,
  reactivation_price_usd numeric NOT NULL DEFAULT 10,
  reactivation_days integer NOT NULL DEFAULT 7,
  mission_hours integer NOT NULL DEFAULT 24,
  fast_finish_days integer NOT NULL DEFAULT 3,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_gamification_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_gamification_settings TO authenticated;
GRANT ALL ON public.course_gamification_settings TO service_role;
ALTER TABLE public.course_gamification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gamification settings" ON public.course_gamification_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage gamification settings" ON public.course_gamification_settings FOR ALL USING (true) WITH CHECK (true);

-- Configurable rewards
CREATE TABLE public.course_gamification_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  emoji text DEFAULT '🏆',
  within_days integer NOT NULL DEFAULT 7,
  reward_type text NOT NULL DEFAULT 'badge',
  reward_value text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cgr_course ON public.course_gamification_rewards(course_id);
GRANT SELECT ON public.course_gamification_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_gamification_rewards TO authenticated;
GRANT ALL ON public.course_gamification_rewards TO service_role;
ALTER TABLE public.course_gamification_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rewards" ON public.course_gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.course_gamification_rewards FOR ALL USING (true) WITH CHECK (true);

-- Access windows
CREATE TABLE public.course_access_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'enrollment',
  completed_at timestamptz,
  completion_days numeric,
  streak_count integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_caw_expires ON public.course_access_windows(expires_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_access_windows TO anon, authenticated;
GRANT ALL ON public.course_access_windows TO service_role;
ALTER TABLE public.course_access_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their access windows" ON public.course_access_windows FOR ALL USING (true) WITH CHECK (true);

-- Missions (one per lesson per user)
CREATE TABLE public.course_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  streak_kept boolean,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_cm_user_course ON public.course_missions(user_id, course_id);
CREATE INDEX idx_cm_due ON public.course_missions(due_at) WHERE completed_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_missions TO anon, authenticated;
GRANT ALL ON public.course_missions TO service_role;
ALTER TABLE public.course_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their missions" ON public.course_missions FOR ALL USING (true) WITH CHECK (true);

-- Granted rewards
CREATE TABLE public.user_course_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES public.course_gamification_rewards(id) ON DELETE CASCADE,
  title text NOT NULL,
  reward_type text NOT NULL DEFAULT 'badge',
  reward_value text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by text NOT NULL DEFAULT 'system',
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ucr_user ON public.user_course_rewards(user_id, course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_course_rewards TO anon, authenticated;
GRANT ALL ON public.user_course_rewards TO service_role;
ALTER TABLE public.user_course_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their rewards" ON public.user_course_rewards FOR ALL USING (true) WITH CHECK (true);

-- Notification idempotency log
CREATE TABLE public.course_gamification_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  course_id uuid NOT NULL,
  kind text NOT NULL,
  ref_id text,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, kind, ref_id)
);
GRANT SELECT ON public.course_gamification_notifications TO authenticated;
GRANT ALL ON public.course_gamification_notifications TO service_role;
ALTER TABLE public.course_gamification_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view notification log" ON public.course_gamification_notifications FOR SELECT USING (true);

CREATE TRIGGER trg_cgs_updated BEFORE UPDATE ON public.course_gamification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cgr_updated BEFORE UPDATE ON public.course_gamification_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_caw_updated BEFORE UPDATE ON public.course_access_windows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_updated BEFORE UPDATE ON public.course_missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();