-- Add SpotPlayer fields to courses table
ALTER TABLE courses 
ADD COLUMN spotplayer_course_id TEXT,
ADD COLUMN is_spotplayer_enabled BOOLEAN DEFAULT false;

-- Add SpotPlayer license fields to enrollments table
ALTER TABLE enrollments 
ADD COLUMN spotplayer_license_id TEXT,
ADD COLUMN spotplayer_license_key TEXT,
ADD COLUMN spotplayer_license_url TEXT;

-- Create license_errors table for error logging
CREATE TABLE license_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  course_id UUID,
  enrollment_id UUID,
  error_message TEXT NOT NULL,
  api_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on license_errors table
ALTER TABLE license_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to license errors
CREATE POLICY "Admins can view all license errors"
ON license_errors
FOR ALL
USING (true);

-- Add comment to describe the new fields
COMMENT ON COLUMN courses.spotplayer_course_id IS 'SpotPlayer course ID for license generation';
COMMENT ON COLUMN courses.is_spotplayer_enabled IS 'Whether this course requires SpotPlayer license generation';
COMMENT ON COLUMN enrollments.spotplayer_license_id IS 'Generated SpotPlayer license ID';
COMMENT ON COLUMN enrollments.spotplayer_license_key IS 'Generated SpotPlayer license key';
COMMENT ON COLUMN enrollments.spotplayer_license_url IS 'SpotPlayer video access URL';