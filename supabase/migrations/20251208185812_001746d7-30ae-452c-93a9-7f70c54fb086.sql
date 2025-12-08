-- Add action token column to consultation_bookings for secure link-based actions
ALTER TABLE public.consultation_bookings
ADD COLUMN IF NOT EXISTS action_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_action_token ON public.consultation_bookings(action_token);