-- Create import_logs table for tracking CSV imports
CREATE TABLE public.import_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  total_rows integer NOT NULL DEFAULT 0,
  new_users_created integer NOT NULL DEFAULT 0,
  existing_users_updated integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage import logs" 
ON public.import_logs 
FOR ALL 
USING (true)
WITH CHECK (true);