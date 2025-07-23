-- Create comprehensive user activity tracking system
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  reference TEXT, -- course_id, lesson_id, etc.
  metadata JSONB DEFAULT '{}',
  duration INTEGER, -- in minutes for time-based activities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_event_type ON public.user_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_reference ON public.user_activity_logs(reference);

-- Create user lesson progress tracking table
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  is_opened BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  first_opened_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for lesson progress
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON public.user_lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);

-- Create user course progress tracking table
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  course_id UUID NOT NULL,
  support_activated BOOLEAN DEFAULT false,
  telegram_joined BOOLEAN DEFAULT false,
  course_page_visited BOOLEAN DEFAULT false,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create indexes for course progress
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id ON public.user_course_progress(course_id);

-- Enable RLS on new tables
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_activity_logs
CREATE POLICY "Users can insert their own activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (true);

-- Create RLS policies for user_lesson_progress
CREATE POLICY "Users can manage their own lesson progress" 
ON public.user_lesson_progress 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for user_course_progress
CREATE POLICY "Users can manage their own course progress" 
ON public.user_course_progress 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update course progress when lesson progress changes
CREATE OR REPLACE FUNCTION public.update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update course progress based on lesson progress
  INSERT INTO public.user_course_progress (
    user_id, 
    course_id, 
    total_lessons,
    completed_lessons,
    total_time_spent,
    progress_percentage,
    last_activity_at,
    updated_at
  )
  SELECT 
    NEW.user_id,
    NEW.course_id,
    COUNT(*) as total_lessons,
    COUNT(*) FILTER (WHERE ulp.is_completed = true) as completed_lessons,
    COALESCE(SUM(ulp.total_time_spent), 0) as total_time_spent,
    ROUND(
      (COUNT(*) FILTER (WHERE ulp.is_completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as progress_percentage,
    NOW() as last_activity_at,
    NOW() as updated_at
  FROM public.user_lesson_progress ulp
  WHERE ulp.user_id = NEW.user_id 
    AND ulp.course_id = NEW.course_id
  GROUP BY ulp.user_id, ulp.course_id
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET
    total_lessons = EXCLUDED.total_lessons,
    completed_lessons = EXCLUDED.completed_lessons,
    total_time_spent = EXCLUDED.total_time_spent,
    progress_percentage = EXCLUDED.progress_percentage,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = EXCLUDED.updated_at;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update course progress
DROP TRIGGER IF EXISTS trigger_update_course_progress ON public.user_lesson_progress;
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_progress();

-- Create function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id INTEGER,
  p_event_type TEXT,
  p_reference TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_duration INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id, 
    event_type, 
    reference, 
    metadata, 
    duration
  )
  VALUES (
    p_user_id, 
    p_event_type, 
    p_reference, 
    p_metadata, 
    p_duration
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;