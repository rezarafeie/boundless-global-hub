-- Allow all authenticated users to edit courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "All users can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);