-- Create job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  desired_position TEXT NOT NULL,
  city TEXT NOT NULL,
  work_type TEXT NOT NULL CHECK (work_type IN ('remote', 'hybrid', 'onsite')),
  self_introduction TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'interviewed', 'hired', 'rejected')),
  assigned_manager INTEGER REFERENCES public.chat_users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Public can insert applications
CREATE POLICY "Anyone can submit job applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (true);

-- Admins can view and manage all applications
CREATE POLICY "Admins can manage job applications"
  ON public.job_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE chat_users.id = (auth.uid()::text)::integer
      AND chat_users.is_messenger_admin = true
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_position ON public.job_applications(desired_position);
CREATE INDEX idx_job_applications_created_at ON public.job_applications(created_at DESC);