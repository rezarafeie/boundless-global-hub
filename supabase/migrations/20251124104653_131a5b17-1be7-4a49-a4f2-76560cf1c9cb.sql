-- Create table for smart test submissions
CREATE TABLE IF NOT EXISTS public.smart_test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES public.chat_users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  province TEXT,
  email TEXT,
  english_level TEXT,
  education_level TEXT,
  current_job TEXT,
  monthly_income NUMERIC,
  likes_job BOOLEAN,
  freelance_experience BOOLEAN,
  goals TEXT[],
  daily_study_time TEXT,
  learning_preference TEXT[],
  education_budget NUMERIC,
  willing_to_invest BOOLEAN,
  ai_analysis JSONB,
  recommended_course_slug TEXT,
  recommended_course_title TEXT,
  ai_response_text TEXT,
  score INTEGER,
  status TEXT DEFAULT 'pending',
  assigned_to INTEGER REFERENCES public.chat_users(id),
  result_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.smart_test_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert submissions
CREATE POLICY "Anyone can create submissions"
  ON public.smart_test_submissions
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.smart_test_submissions
  FOR SELECT
  USING (
    user_id IS NOT NULL AND 
    user_id = (
      SELECT us.user_id FROM public.user_sessions us
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
    )
    OR
    result_token = current_setting('app.result_token', true)
  );

-- Admins can manage all submissions
CREATE POLICY "Admins can manage submissions"
  ON public.smart_test_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users cu
      WHERE cu.id = (
        SELECT us.user_id FROM public.user_sessions us
        WHERE us.session_token = current_setting('app.session_token', true)
        AND us.is_active = true
      )
      AND cu.is_messenger_admin = true
    )
  );

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_smart_test_phone ON public.smart_test_submissions(phone);
CREATE INDEX IF NOT EXISTS idx_smart_test_token ON public.smart_test_submissions(result_token);
CREATE INDEX IF NOT EXISTS idx_smart_test_created ON public.smart_test_submissions(created_at DESC);