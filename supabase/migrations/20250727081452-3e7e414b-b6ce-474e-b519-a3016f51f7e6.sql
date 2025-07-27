
-- Add course_id and status columns to crm_notes table
ALTER TABLE public.crm_notes 
ADD COLUMN course_id uuid REFERENCES public.courses(id),
ADD COLUMN status text DEFAULT 'در انتظار پرداخت';

-- Create an index on course_id for better performance
CREATE INDEX IF NOT EXISTS idx_crm_notes_course_id ON public.crm_notes(course_id);

-- Create an index on created_at for better performance on date filtering
CREATE INDEX IF NOT EXISTS idx_crm_notes_created_at ON public.crm_notes(created_at);
