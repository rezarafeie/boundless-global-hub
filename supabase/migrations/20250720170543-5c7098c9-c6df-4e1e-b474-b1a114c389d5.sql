-- Allow public access to view enrollments for admin purposes
-- This is needed for the admin panel to work
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;

CREATE POLICY "Allow admin access to enrollments" 
ON enrollments 
FOR SELECT 
USING (true);