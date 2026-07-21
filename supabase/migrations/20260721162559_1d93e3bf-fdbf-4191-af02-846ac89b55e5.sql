-- Storage policies for social-media bucket: allow service_role only (edge functions handle uploads/signed URLs)
CREATE POLICY "social_media_service_all"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'social-media')
WITH CHECK (bucket_id = 'social-media');

CREATE POLICY "social_media_authenticated_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'social-media');

CREATE POLICY "social_media_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social-media');