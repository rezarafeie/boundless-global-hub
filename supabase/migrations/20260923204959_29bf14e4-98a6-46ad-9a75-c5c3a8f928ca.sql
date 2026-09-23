
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  days_count integer NOT NULL DEFAULT 30,
  timezone text NOT NULL DEFAULT 'Asia/Tehran',
  status text NOT NULL DEFAULT 'draft',
  eligible_course_ids uuid[] NOT NULL DEFAULT '{}',
  eligible_all_boundless boolean NOT NULL DEFAULT false,
  onboarding_form_id uuid,
  default_deadline_time text NOT NULL DEFAULT '23:59',
  gamification_enabled boolean NOT NULL DEFAULT true,
  streak_enabled boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  leaderboard_enabled boolean NOT NULL DEFAULT true,
  ai_review_default boolean NOT NULL DEFAULT true,
  coach_review_default boolean NOT NULL DEFAULT false,
  segments jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  penalty_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  messages jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees published challenges" ON public.challenges FOR SELECT
  USING (status IN ('scheduled','active','paused','finished') OR public.is_academy_admin_safe(auth.uid()));
CREATE POLICY "Admins manage challenges" ON public.challenges FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  short_description text,
  goal text,
  estimated_minutes integer,
  unlock_time text,
  deadline_time text,
  deadline_hours integer,
  xp integer NOT NULL DEFAULT 10,
  required boolean NOT NULL DEFAULT true,
  review_mode text NOT NULL DEFAULT 'ai',
  notification_text text,
  followups jsonb,
  stage_update_enabled boolean NOT NULL DEFAULT false,
  stage_update_prompt text,
  stage_update_suggest text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, day_number)
);
GRANT SELECT ON public.challenge_days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_days TO authenticated;
GRANT ALL ON public.challenge_days TO service_role;
ALTER TABLE public.challenge_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads days" ON public.challenge_days FOR SELECT USING (true);
CREATE POLICY "Admins manage days" ON public.challenge_days FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.challenge_days(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  key text,
  title text,
  business_models text[] NOT NULL DEFAULT '{}',
  stages text[] NOT NULL DEFAULT '{}',
  budgets text[] NOT NULL DEFAULT '{}',
  boundless_codes text[] NOT NULL DEFAULT '{}',
  instructions text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  example text,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  expected_result text,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  form_id uuid REFERENCES public.telegram_forms(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 0,
  is_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_challenge_variants_day ON public.challenge_variants(day_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_variants TO authenticated;
GRANT ALL ON public.challenge_variants TO service_role;
ALTER TABLE public.challenge_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage variants" ON public.challenge_variants FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id integer NOT NULL,
  boundless_code text,
  business_model text,
  stage text,
  budget text,
  monthly_revenue numeric,
  goal text,
  website text,
  socials text,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  first_sale_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  current_day integer NOT NULL DEFAULT 1,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage participants" ON public.challenge_participants FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_id uuid NOT NULL REFERENCES public.challenge_days(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  variant_id uuid REFERENCES public.challenge_variants(id) ON DELETE SET NULL,
  assignment_id uuid,
  form_id uuid,
  submission_id uuid,
  status text NOT NULL DEFAULT 'available',
  available_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  missed_at timestamptz,
  xp_awarded integer NOT NULL DEFAULT 0,
  reward_processed boolean NOT NULL DEFAULT false,
  penalty_processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, day_id)
);
CREATE INDEX idx_challenge_progress_status ON public.challenge_progress(challenge_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_progress TO authenticated;
GRANT ALL ON public.challenge_progress TO service_role;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage progress" ON public.challenge_progress FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  date date NOT NULL,
  leads integer NOT NULL DEFAULT 0,
  conversations integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_daily_metrics TO authenticated;
GRANT ALL ON public.challenge_daily_metrics TO service_role;
ALTER TABLE public.challenge_daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage metrics" ON public.challenge_daily_metrics FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.challenge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  user_id integer,
  kind text NOT NULL,
  ref_id text NOT NULL DEFAULT '',
  title text,
  message text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_errors jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, kind, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_events TO authenticated;
GRANT ALL ON public.challenge_events TO service_role;
ALTER TABLE public.challenge_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.challenge_events FOR ALL
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TRIGGER trg_challenges_upd BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_days_upd BEFORE UPDATE ON public.challenge_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_variants_upd BEFORE UPDATE ON public.challenge_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_participants_upd BEFORE UPDATE ON public.challenge_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_progress_upd BEFORE UPDATE ON public.challenge_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_metrics_upd BEFORE UPDATE ON public.challenge_daily_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_events_upd BEFORE UPDATE ON public.challenge_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
