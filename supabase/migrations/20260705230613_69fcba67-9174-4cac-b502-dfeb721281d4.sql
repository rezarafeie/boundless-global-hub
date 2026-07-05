
DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Anyone can read published assignments" ON public.assignments;

CREATE POLICY "Anyone read assignments (app-enforced)" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Anyone insert assignments (app-enforced)" ON public.assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone update assignments (app-enforced)" ON public.assignments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone delete assignments (app-enforced)" ON public.assignments FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO anon, authenticated;
GRANT ALL ON public.assignments TO service_role;

-- Also relax AI logs so admin panel can read them without auth.uid()
DROP POLICY IF EXISTS "Admins read AI logs" ON public.assignment_ai_logs;
CREATE POLICY "Anyone read AI logs (app-enforced)" ON public.assignment_ai_logs FOR SELECT USING (true);
CREATE POLICY "Anyone insert AI logs (app-enforced)" ON public.assignment_ai_logs FOR INSERT WITH CHECK (true);
GRANT SELECT, INSERT ON public.assignment_ai_logs TO anon, authenticated;
GRANT ALL ON public.assignment_ai_logs TO service_role;

-- Templates
DROP POLICY IF EXISTS "Admins manage templates" ON public.assignment_templates;
CREATE POLICY "Anyone manage templates (app-enforced)" ON public.assignment_templates FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_templates TO anon, authenticated;
GRANT ALL ON public.assignment_templates TO service_role;
