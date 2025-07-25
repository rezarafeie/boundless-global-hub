-- Add lesson_number column to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN lesson_number INTEGER;

-- Create function to generate lesson numbers for existing lessons
CREATE OR REPLACE FUNCTION public.generate_lesson_numbers()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  course_rec RECORD;
  lesson_rec RECORD;
  lesson_counter INTEGER;
BEGIN
  -- Loop through each course
  FOR course_rec IN SELECT DISTINCT course_id FROM public.course_lessons ORDER BY course_id
  LOOP
    lesson_counter := 1;
    
    -- Loop through lessons in this course ordered by section and order_index
    FOR lesson_rec IN 
      SELECT cl.id 
      FROM public.course_lessons cl
      LEFT JOIN public.course_sections cs ON cl.section_id = cs.id
      WHERE cl.course_id = course_rec.course_id
      ORDER BY 
        COALESCE(cs.order_index, 0),
        cl.order_index,
        cl.created_at
    LOOP
      -- Update lesson with sequential number
      UPDATE public.course_lessons 
      SET lesson_number = lesson_counter 
      WHERE id = lesson_rec.id;
      
      lesson_counter := lesson_counter + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Generate lesson numbers for existing lessons
SELECT public.generate_lesson_numbers();

-- Create function to auto-assign lesson numbers for new lessons
CREATE OR REPLACE FUNCTION public.assign_lesson_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next lesson number for this course
  SELECT COALESCE(MAX(lesson_number), 0) + 1 
  INTO next_number
  FROM public.course_lessons 
  WHERE course_id = NEW.course_id;
  
  -- Assign the lesson number
  NEW.lesson_number := next_number;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign lesson numbers
CREATE TRIGGER assign_lesson_number_trigger
  BEFORE INSERT ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lesson_number();

-- Create function to get lesson by number
CREATE OR REPLACE FUNCTION public.get_lesson_by_number(course_slug_param text, lesson_num integer)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  video_url text,
  file_url text,
  duration integer,
  order_index integer,
  section_id uuid,
  course_id uuid,
  lesson_number integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id,
    cl.title,
    cl.content,
    cl.video_url,
    cl.file_url,
    cl.duration,
    cl.order_index,
    cl.section_id,
    cl.course_id,
    cl.lesson_number,
    cl.created_at,
    cl.updated_at
  FROM public.course_lessons cl
  JOIN public.courses c ON cl.course_id = c.id
  WHERE c.slug = course_slug_param 
    AND cl.lesson_number = lesson_num
    AND c.is_active = true;
END;
$$;