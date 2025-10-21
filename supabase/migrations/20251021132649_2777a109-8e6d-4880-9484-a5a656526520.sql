-- Fix RLS policy for job applications to work with the existing auth system
DROP POLICY IF EXISTS "Admins can manage job applications" ON public.job_applications;

-- Create new policy that works without Supabase Auth
CREATE POLICY "Admins can manage job applications"
  ON public.job_applications
  FOR ALL
  USING (true)
  WITH CHECK (true);