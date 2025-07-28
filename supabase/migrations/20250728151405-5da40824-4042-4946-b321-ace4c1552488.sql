-- Add lead generation options to courses table
ALTER TABLE public.courses 
ADD COLUMN use_enrollments_as_leads BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN lead_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;