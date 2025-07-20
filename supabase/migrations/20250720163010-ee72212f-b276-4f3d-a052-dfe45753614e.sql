-- Enable RLS on enrollments table if not already enabled
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Update the existing policies for enrollments to be more appropriate
DROP POLICY IF EXISTS "Anyone can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;

-- Policy to allow anyone to create enrollments (for manual payments and online payments)
CREATE POLICY "Allow public enrollment creation" 
ON public.enrollments 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments" 
ON public.enrollments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE chat_users.id = ((auth.uid())::text)::integer 
  AND chat_users.is_messenger_admin = true
));

-- Policy to allow admins to update enrollments (for approval/rejection)
CREATE POLICY "Admins can update enrollments" 
ON public.enrollments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE chat_users.id = ((auth.uid())::text)::integer 
  AND chat_users.is_messenger_admin = true
));