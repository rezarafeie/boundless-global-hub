-- Enable RLS on smart_test_submissions if not already enabled
ALTER TABLE smart_test_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can insert their test submission" ON smart_test_submissions;
DROP POLICY IF EXISTS "Anyone can read their submission by token" ON smart_test_submissions;

-- Allow anyone to insert test submissions (public quiz)
CREATE POLICY "Anyone can insert their test submission"
ON smart_test_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading submissions by token (for results page)
CREATE POLICY "Anyone can read their submission by token"
ON smart_test_submissions
FOR SELECT
TO anon, authenticated
USING (true);