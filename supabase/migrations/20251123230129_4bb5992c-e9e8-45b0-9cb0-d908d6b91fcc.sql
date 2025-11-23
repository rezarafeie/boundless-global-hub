-- Create lead analysis jobs table
CREATE TABLE IF NOT EXISTS public.lead_analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  progress_current integer NOT NULL DEFAULT 0,
  progress_total integer NOT NULL DEFAULT 0,
  results jsonb,
  error_message text,
  created_by integer REFERENCES public.chat_users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.lead_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage lead analysis jobs"
ON public.lead_analysis_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users
    WHERE chat_users.id = (auth.uid()::text)::integer
    AND chat_users.is_messenger_admin = true
  )
);

CREATE POLICY "Anyone can view lead analysis jobs"
ON public.lead_analysis_jobs
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lead_analysis_jobs_status ON public.lead_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_lead_analysis_jobs_course_id ON public.lead_analysis_jobs(course_id);

-- Enable realtime
ALTER TABLE public.lead_analysis_jobs REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_analysis_jobs;