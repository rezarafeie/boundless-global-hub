-- Add duration field to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN duration INTEGER DEFAULT 15; -- duration in minutes

-- Add comment for clarity
COMMENT ON COLUMN public.course_lessons.duration IS 'Lesson duration in minutes';