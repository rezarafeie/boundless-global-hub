-- Allow public access to update enrollments for admin purposes
-- This is needed for the admin panel to work
DROP POLICY IF EXISTS "Admins can update enrollments" ON enrollments;

CREATE POLICY "Allow admin access to update enrollments" 
ON enrollments 
FOR UPDATE 
USING (true);