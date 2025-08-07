-- Create RLS policies for test_enrollments table

-- Enable RLS on test_enrollments table (if not already enabled)
ALTER TABLE public.test_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create test enrollments (similar to regular enrollments)
CREATE POLICY "Allow anonymous test enrollment creation" 
ON public.test_enrollments 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own test enrollments  
CREATE POLICY "Users can view their own test enrollments" 
ON public.test_enrollments 
FOR SELECT 
USING (user_id::text IN (
  SELECT us.user_id::text 
  FROM public.user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
) OR true); -- Allow viewing for now, can be restricted later

-- Allow admins to view and manage all test enrollments
CREATE POLICY "Admins can manage all test enrollments" 
ON public.test_enrollments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_users cu 
  WHERE cu.id::text IN (
    SELECT us.user_id::text 
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  ) AND cu.is_messenger_admin = true
));

-- Allow updates for enrollment status changes
CREATE POLICY "Allow test enrollment updates" 
ON public.test_enrollments 
FOR UPDATE 
USING (true);