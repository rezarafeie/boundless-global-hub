CREATE POLICY "social_media_anon_insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'social-media');
CREATE POLICY "social_media_anon_read" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'social-media');
CREATE POLICY "social_media_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'social-media');