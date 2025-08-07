-- Check current RLS policies on tests table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tests';

-- Drop existing restrictive policies and create open policies for tests table
DROP POLICY IF EXISTS "Anyone can view active tests" ON public.tests;
DROP POLICY IF EXISTS "Admins can manage tests" ON public.tests;
DROP POLICY IF EXISTS "Public access to tests" ON public.tests;

-- Create a comprehensive policy to allow anyone to manage tests
CREATE POLICY "Public access to all test operations" 
ON public.tests 
FOR ALL 
USING (true)
WITH CHECK (true);