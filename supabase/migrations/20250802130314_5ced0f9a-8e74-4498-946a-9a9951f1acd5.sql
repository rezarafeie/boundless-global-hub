-- Add telegram_only_access field to courses table
ALTER TABLE public.courses 
ADD COLUMN telegram_only_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.courses.telegram_only_access IS 'If true, course content is only accessible through telegram activation, hides StartCourseSection';