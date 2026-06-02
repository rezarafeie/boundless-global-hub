
DROP POLICY IF EXISTS "Authenticated can manage forms" ON public.telegram_forms;
DROP POLICY IF EXISTS "Authenticated can manage fields" ON public.telegram_form_fields;
DROP POLICY IF EXISTS "Authenticated can view submissions" ON public.telegram_form_submissions;
DROP POLICY IF EXISTS "Authenticated can manage answers" ON public.telegram_form_answers;

CREATE POLICY "Anyone can manage forms" ON public.telegram_forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage fields" ON public.telegram_form_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage submissions" ON public.telegram_form_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage answers" ON public.telegram_form_answers FOR ALL USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.telegram_forms TO anon;
GRANT INSERT, UPDATE, DELETE ON public.telegram_form_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_form_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_form_answers TO anon;
