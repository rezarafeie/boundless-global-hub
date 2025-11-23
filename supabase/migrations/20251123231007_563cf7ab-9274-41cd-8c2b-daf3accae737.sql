-- Fix RLS policies for lead_analysis_jobs to be more permissive like other admin tables

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Admins can view jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Anyone can view lead analysis jobs" ON public.lead_analysis_jobs;
DROP POLICY IF EXISTS "Admins can manage lead analysis jobs" ON public.lead_analysis_jobs;

-- Create simple policies that allow all operations (similar to crm_notes, deals, etc.)
CREATE POLICY "Anyone can insert jobs"
  ON public.lead_analysis_jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view jobs"
  ON public.lead_analysis_jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update jobs"
  ON public.lead_analysis_jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete jobs"
  ON public.lead_analysis_jobs
  FOR DELETE
  USING (true);