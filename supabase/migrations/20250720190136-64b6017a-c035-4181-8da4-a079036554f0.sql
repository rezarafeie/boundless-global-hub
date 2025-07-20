-- Add enable_course_access field to courses table
ALTER TABLE public.courses 
ADD COLUMN enable_course_access BOOLEAN DEFAULT false;

-- Create course_sections table
CREATE TABLE public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_lessons table
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  file_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX idx_course_sections_order ON public.course_sections(course_id, order_index);
CREATE INDEX idx_course_lessons_section_id ON public.course_lessons(section_id);
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_order ON public.course_lessons(section_id, order_index);

-- Enable RLS on both tables
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_sections
CREATE POLICY "Anyone can view course sections" ON public.course_sections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course sections" ON public.course_sections
  FOR ALL USING (true);

-- Create RLS policies for course_lessons  
CREATE POLICY "Anyone can view course lessons" ON public.course_lessons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course lessons" ON public.course_lessons
  FOR ALL USING (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_course_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_course_sections_updated_at
    BEFORE UPDATE ON public.course_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_content_updated_at();

CREATE TRIGGER update_course_lessons_updated_at
    BEFORE UPDATE ON public.course_lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_content_updated_at();