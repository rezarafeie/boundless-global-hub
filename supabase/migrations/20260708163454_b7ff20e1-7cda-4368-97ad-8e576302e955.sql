DROP POLICY IF EXISTS "Anyone authenticated can read custom followups" ON public.support_activation_custom_followups;
CREATE POLICY "Public read custom followups" ON public.support_activation_custom_followups FOR SELECT TO public USING (true);
CREATE POLICY "Public manage custom followups" ON public.support_activation_custom_followups FOR ALL TO public USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_activation_custom_followups TO anon, authenticated;