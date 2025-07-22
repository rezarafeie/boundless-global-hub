-- Add free access option to courses table
ALTER TABLE public.courses 
ADD COLUMN is_free_access boolean DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.courses.is_free_access IS 'When enabled, /access route will not check login or has access permissions - public link for everyone to see course content';