-- Add new link fields to courses table
ALTER TABLE public.courses 
ADD COLUMN support_link TEXT,
ADD COLUMN telegram_channel_link TEXT,
ADD COLUMN gifts_link TEXT;

-- Create course_click_logs table for tracking user interactions
CREATE TABLE public.course_click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('support', 'telegram', 'gifts')),
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_course_click_logs_user_course ON public.course_click_logs(user_id, course_id);
CREATE INDEX idx_course_click_logs_action_type ON public.course_click_logs(action_type);

-- Enable RLS on course_click_logs table
ALTER TABLE public.course_click_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_click_logs
CREATE POLICY "Users can insert their own click logs" ON public.course_click_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own click logs" ON public.course_click_logs
  FOR SELECT USING (true);

CREATE POLICY "Admins can view all click logs" ON public.course_click_logs
  FOR ALL USING (true);