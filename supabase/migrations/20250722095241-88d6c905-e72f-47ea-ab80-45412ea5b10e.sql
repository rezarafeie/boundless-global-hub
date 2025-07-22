-- Add is_open column to course_sections table
ALTER TABLE public.course_sections ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT false;