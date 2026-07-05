
CREATE POLICY "assignment uploads: user upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-uploads'
    AND (storage.foldername(name))[1] = public.get_user_from_session(current_setting('app.session_token', true))::text
  );

CREATE POLICY "assignment uploads: user read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-uploads'
    AND (
      (storage.foldername(name))[1] = public.get_user_from_session(current_setting('app.session_token', true))::text
      OR public.is_academy_admin(auth.uid())
    )
  );

CREATE POLICY "assignment uploads: user delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-uploads'
    AND (storage.foldername(name))[1] = public.get_user_from_session(current_setting('app.session_token', true))::text
  );
