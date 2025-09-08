-- Fix RLS policies for anonymous enrollment

-- Ensure anonymous users can read active courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
CREATE POLICY "Anyone can view active courses" 
ON courses FOR SELECT 
USING (is_active = true);

-- Ensure anonymous users can create enrollments
DROP POLICY IF EXISTS "Allow anonymous enrollment creation" ON enrollments;
CREATE POLICY "Allow anonymous enrollment creation" 
ON enrollments FOR INSERT 
WITH CHECK (true);

-- Make sure RLS is enabled on both tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;