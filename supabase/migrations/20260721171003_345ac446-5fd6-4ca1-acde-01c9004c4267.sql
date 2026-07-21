
DROP POLICY IF EXISTS "social-media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "social-media authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "social-media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "social-media authenticated delete" ON storage.objects;

CREATE POLICY "social-media authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-media');

CREATE POLICY "social-media authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'social-media');

CREATE POLICY "social-media authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'social-media');

CREATE POLICY "social-media authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'social-media');
