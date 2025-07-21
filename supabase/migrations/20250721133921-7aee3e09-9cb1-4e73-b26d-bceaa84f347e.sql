-- Create course_title_groups table for organizing sections under custom titles
CREATE TABLE public.course_title_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add title_group_id to course_sections to group sections under titles
ALTER TABLE public.course_sections ADD COLUMN title_group_id UUID REFERENCES public.course_title_groups(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_course_title_groups_course_id_order ON public.course_title_groups(course_id, order_index);
CREATE INDEX idx_course_sections_title_group_id_order ON public.course_sections(title_group_id, order_index);

-- Enable RLS
ALTER TABLE public.course_title_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_title_groups
CREATE POLICY "Anyone can view course title groups"
ON public.course_title_groups
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage course title groups"
ON public.course_title_groups
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_course_title_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_title_groups_updated_at
BEFORE UPDATE ON public.course_title_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_course_title_groups_updated_at();