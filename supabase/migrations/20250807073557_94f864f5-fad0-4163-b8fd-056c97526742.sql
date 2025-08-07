-- First, let's drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own test enrollments" ON public.test_enrollments;
DROP POLICY IF EXISTS "Allow anonymous test enrollment creation" ON public.test_enrollments;
DROP POLICY IF EXISTS "Admins can manage all test enrollments" ON public.test_enrollments;
DROP POLICY IF EXISTS "Allow test enrollment updates" ON public.test_enrollments;

-- Enable RLS on test_enrollments table (if not already enabled)
ALTER TABLE public.test_enrollments ENABLE ROW LEVEL SECURITY;

-- Create a simple policy to allow all operations for now (we can restrict later)
CREATE POLICY "Public access to test enrollments" 
ON public.test_enrollments 
FOR ALL 
USING (true)
WITH CHECK (true);