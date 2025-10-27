-- Create internship_applications table
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  age integer NOT NULL,
  city text NOT NULL,
  specialization text,
  desired_department text NOT NULL,
  availability text NOT NULL,
  self_introduction text,
  status text DEFAULT 'new'::text,
  assigned_mentor integer,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit internship applications
CREATE POLICY "Anyone can submit internship applications"
ON public.internship_applications
FOR INSERT
WITH CHECK (true);

-- Admins can manage internship applications
CREATE POLICY "Admins can manage internship applications"
ON public.internship_applications
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_internship_applications_status ON public.internship_applications(status);
CREATE INDEX idx_internship_applications_created_at ON public.internship_applications(created_at DESC);