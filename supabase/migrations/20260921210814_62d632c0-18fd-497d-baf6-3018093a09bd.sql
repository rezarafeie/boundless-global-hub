
CREATE TABLE public.smart_test_v2_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.smart_test_v2_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_test_v2_config TO authenticated;
GRANT ALL ON public.smart_test_v2_config TO service_role;
ALTER TABLE public.smart_test_v2_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "v2 config readable by everyone" ON public.smart_test_v2_config FOR SELECT USING (true);
CREATE POLICY "v2 config managed by admins" ON public.smart_test_v2_config FOR ALL TO authenticated
  USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.smart_test_v2_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT 'boundless_smart_test_v2',
  session_key text NOT NULL,
  user_id uuid,
  chat_user_id integer,
  full_name text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'in_progress',
  current_step text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  path_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  contradictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_type text,
  recommended_path text,
  recommended_match integer,
  alternative_path text,
  alternative_match integer,
  not_now_path text,
  not_now_match integer,
  readiness_score integer,
  confidence text,
  primary_objection text,
  secondary_objection text,
  remaining_objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewed_objection_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  maza_progress integer,
  cta_shown text,
  cta_clicked text,
  cta_clicked_at timestamptz,
  ai_reality_check text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stv2_session ON public.smart_test_v2_submissions(session_key);
CREATE INDEX idx_stv2_status ON public.smart_test_v2_submissions(status);
CREATE INDEX idx_stv2_path ON public.smart_test_v2_submissions(recommended_path);
CREATE INDEX idx_stv2_created ON public.smart_test_v2_submissions(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.smart_test_v2_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_test_v2_submissions TO authenticated;
GRANT ALL ON public.smart_test_v2_submissions TO service_role;
ALTER TABLE public.smart_test_v2_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "v2 submissions insert by anyone" ON public.smart_test_v2_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "v2 submissions select by anyone" ON public.smart_test_v2_submissions FOR SELECT USING (true);
CREATE POLICY "v2 submissions update by anyone" ON public.smart_test_v2_submissions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "v2 submissions delete by admins" ON public.smart_test_v2_submissions FOR DELETE TO authenticated
  USING (public.is_academy_admin_safe(auth.uid()));

CREATE TABLE public.smart_test_v2_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.smart_test_v2_submissions(id) ON DELETE CASCADE,
  session_key text,
  event_type text NOT NULL,
  step_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stv2_events_sub ON public.smart_test_v2_events(submission_id);
CREATE INDEX idx_stv2_events_type ON public.smart_test_v2_events(event_type);
GRANT INSERT ON public.smart_test_v2_events TO anon;
GRANT SELECT, INSERT ON public.smart_test_v2_events TO authenticated;
GRANT ALL ON public.smart_test_v2_events TO service_role;
ALTER TABLE public.smart_test_v2_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "v2 events insert by anyone" ON public.smart_test_v2_events FOR INSERT WITH CHECK (true);
CREATE POLICY "v2 events read by admins" ON public.smart_test_v2_events FOR SELECT TO authenticated
  USING (public.is_academy_admin_safe(auth.uid()));

CREATE TRIGGER trg_stv2_config_updated BEFORE UPDATE ON public.smart_test_v2_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_stv2_sub_updated BEFORE UPDATE ON public.smart_test_v2_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
