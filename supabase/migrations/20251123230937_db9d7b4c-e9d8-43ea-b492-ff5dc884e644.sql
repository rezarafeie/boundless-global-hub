-- Fix RLS policies for lead_analysis_jobs to properly check admin permissions

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admins to insert jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Allow admins to update jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Allow admins to delete jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Allow anyone to view jobs" ON public.lead_analysis_jobs;

-- Create new policies that properly check for admin users
CREATE POLICY "Admins can insert jobs"
  ON public.lead_analysis_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.phone = auth.jwt()->>'phone'
      AND (chat_users.role = 'admin' OR chat_users.is_messenger_admin = true)
    )
  );

CREATE POLICY "Admins can view jobs"
  ON public.lead_analysis_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.phone = auth.jwt()->>'phone'
      AND (chat_users.role = 'admin' OR chat_users.is_messenger_admin = true)
    )
  );

CREATE POLICY "Admins can update jobs"
  ON public.lead_analysis_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.phone = auth.jwt()->>'phone'
      AND (chat_users.role = 'admin' OR chat_users.is_messenger_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.phone = auth.jwt()->>'phone'
      AND (chat_users.role = 'admin' OR chat_users.is_messenger_admin = true)
    )
  );

CREATE POLICY "Admins can delete jobs"
  ON public.lead_analysis_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.phone = auth.jwt()->>'phone'
      AND (chat_users.role = 'admin' OR chat_users.is_messenger_admin = true)
    )
  );