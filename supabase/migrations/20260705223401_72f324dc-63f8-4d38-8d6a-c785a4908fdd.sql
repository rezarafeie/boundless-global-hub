
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  ai_feedback_enabled boolean NOT NULL DEFAULT false,
  manual_review_enabled boolean NOT NULL DEFAULT false,
  ai_feedback_prompt text,
  passing_score integer,
  estimated_minutes integer,
  cta_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  due_date timestamptz,
  allow_resubmit boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assignments_lesson ON public.assignments(lesson_id);
CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

GRANT SELECT ON public.assignments TO anon, authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published assignments"
  ON public.assignments FOR SELECT
  USING (status = 'published' OR public.is_academy_admin(auth.uid()));

CREATE POLICY "Admins manage assignments"
  ON public.assignments FOR ALL
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  ai_feedback jsonb,
  admin_feedback text,
  score integer,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON public.assignment_submissions(status);
CREATE UNIQUE INDEX uniq_draft_per_student_assignment
  ON public.assignment_submissions(assignment_id, student_id)
  WHERE status = 'draft';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO anon;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own submissions (session)"
  ON public.assignment_submissions FOR SELECT
  USING (
    student_id = public.get_user_from_session(current_setting('app.session_token', true))
    OR public.is_academy_admin(auth.uid())
  );

CREATE POLICY "Students insert own submissions (session)"
  ON public.assignment_submissions FOR INSERT
  WITH CHECK (
    student_id = public.get_user_from_session(current_setting('app.session_token', true))
  );

CREATE POLICY "Students update own submissions (session)"
  ON public.assignment_submissions FOR UPDATE
  USING (
    student_id = public.get_user_from_session(current_setting('app.session_token', true))
    OR public.is_academy_admin(auth.uid())
  );

CREATE POLICY "Admins delete submissions"
  ON public.assignment_submissions FOR DELETE
  USING (public.is_academy_admin(auth.uid()));

CREATE TABLE public.assignment_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  submission_id uuid REFERENCES public.assignment_submissions(id) ON DELETE SET NULL,
  kind text NOT NULL,
  prompt text,
  response jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assignment_ai_logs TO authenticated;
GRANT ALL ON public.assignment_ai_logs TO service_role;
ALTER TABLE public.assignment_ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read AI logs"
  ON public.assignment_ai_logs FOR SELECT
  USING (public.is_academy_admin(auth.uid()));

CREATE TABLE public.assignment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  template_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assignment_templates TO anon, authenticated;
GRANT ALL ON public.assignment_templates TO service_role;
ALTER TABLE public.assignment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads templates"
  ON public.assignment_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage templates"
  ON public.assignment_templates FOR ALL
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
