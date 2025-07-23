-- Add missing metadata column to user_activity_logs table
ALTER TABLE public.user_activity_logs 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.user_activity_logs.metadata IS 'Additional metadata for the activity event as JSON';