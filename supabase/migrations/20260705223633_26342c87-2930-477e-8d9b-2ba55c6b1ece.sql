
DROP POLICY IF EXISTS "Students see own submissions (session)" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students insert own submissions (session)" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students update own submissions (session)" ON public.assignment_submissions;

CREATE POLICY "Anyone read submissions (app-enforced)"
  ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone insert submissions (app-enforced)"
  ON public.assignment_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone update submissions (app-enforced)"
  ON public.assignment_submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "assignment uploads: user upload own" ON storage.objects;
DROP POLICY IF EXISTS "assignment uploads: user read own" ON storage.objects;
DROP POLICY IF EXISTS "assignment uploads: user delete own" ON storage.objects;

CREATE POLICY "assignment uploads: anyone upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assignment-uploads');
CREATE POLICY "assignment uploads: anyone read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assignment-uploads');
CREATE POLICY "assignment uploads: anyone delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assignment-uploads');
