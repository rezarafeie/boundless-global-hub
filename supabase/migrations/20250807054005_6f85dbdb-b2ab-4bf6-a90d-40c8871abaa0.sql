-- Create tests table to store available tests from Esanj API
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id INTEGER NOT NULL UNIQUE, -- From Esanj API
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  slug TEXT NOT NULL UNIQUE,
  count_ready INTEGER DEFAULT 0,
  count_used INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_enrollments table to track user test sessions
CREATE TABLE public.test_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL, -- Reference to chat_users
  test_id UUID NOT NULL REFERENCES public.tests(id),
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'zarinpal',
  zarinpal_authority TEXT,
  zarinpal_ref_id TEXT,
  enrollment_status TEXT NOT NULL DEFAULT 'pending', -- pending, ready, in_progress, completed
  esanj_employee_id INTEGER,
  esanj_uuid TEXT,
  birth_year INTEGER,
  sex TEXT, -- male, female
  test_started_at TIMESTAMP WITH TIME ZONE,
  test_completed_at TIMESTAMP WITH TIME ZONE,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_tests_test_id ON public.tests(test_id);
CREATE INDEX idx_tests_slug ON public.tests(slug);
CREATE INDEX idx_test_enrollments_user_id ON public.test_enrollments(user_id);
CREATE INDEX idx_test_enrollments_phone ON public.test_enrollments(phone);
CREATE INDEX idx_test_enrollments_esanj_uuid ON public.test_enrollments(esanj_uuid);

-- Enable Row Level Security
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests table
CREATE POLICY "Anyone can view active tests" 
ON public.tests 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage tests" 
ON public.tests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
));

-- RLS Policies for test_enrollments table
CREATE POLICY "Users can view their own test enrollments" 
ON public.test_enrollments 
FOR SELECT 
USING (user_id = ((auth.uid())::text)::integer);

CREATE POLICY "Anyone can create test enrollments" 
ON public.test_enrollments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own test enrollments" 
ON public.test_enrollments 
FOR UPDATE 
USING (user_id = ((auth.uid())::text)::integer);

CREATE POLICY "Admins can manage all test enrollments" 
ON public.test_enrollments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_enrollments_updated_at
  BEFORE UPDATE ON public.test_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();