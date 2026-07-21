DROP POLICY IF EXISTS "Authenticated manage scheduled posts" ON public.social_scheduled_posts;
CREATE POLICY "Public manage scheduled posts" ON public.social_scheduled_posts FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_scheduled_posts TO anon, authenticated;