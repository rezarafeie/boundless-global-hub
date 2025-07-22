-- Add is_open field to course_title_groups table
ALTER TABLE public.course_title_groups 
ADD COLUMN is_open boolean NOT NULL DEFAULT false;