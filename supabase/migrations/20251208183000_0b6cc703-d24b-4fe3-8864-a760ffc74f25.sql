-- Add description field for user's consultation details/explanation
ALTER TABLE public.consultation_bookings 
ADD COLUMN IF NOT EXISTS description TEXT;