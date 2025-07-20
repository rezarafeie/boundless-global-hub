-- Allow all users (including unauthenticated) to edit courses for admin functionality
DROP POLICY IF EXISTS "All users can manage courses" ON public.courses;

CREATE POLICY "Public access to courses"
ON public.courses
FOR ALL
USING (true)
WITH CHECK (true);