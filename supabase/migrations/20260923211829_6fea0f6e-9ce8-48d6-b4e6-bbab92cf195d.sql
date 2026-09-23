DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['challenges','challenge_days','challenge_variants','challenge_participants','challenge_progress','challenge_daily_metrics','challenge_events'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "App-enforced manage %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "App-enforced manage %s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;