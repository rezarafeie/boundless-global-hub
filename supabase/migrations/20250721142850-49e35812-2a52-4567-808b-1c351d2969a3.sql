-- Create a junction table for lesson-section relationships
CREATE TABLE public.lesson_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(lesson_id, section_id)
);

-- Enable RLS
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage lesson sections" 
ON public.lesson_sections 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Anyone can view lesson sections" 
ON public.lesson_sections 
FOR SELECT 
USING (true);

-- Migrate existing data
INSERT INTO public.lesson_sections (lesson_id, section_id)
SELECT id, section_id 
FROM public.course_lessons 
WHERE section_id IS NOT NULL;

-- Add index for better performance
CREATE INDEX idx_lesson_sections_lesson_id ON public.lesson_sections(lesson_id);
CREATE INDEX idx_lesson_sections_section_id ON public.lesson_sections(section_id);