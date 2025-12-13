-- Add consultation_type column to consultation_bookings
ALTER TABLE public.consultation_bookings 
ADD COLUMN consultation_type text DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.consultation_bookings.consultation_type IS 'Type of consultation: sales or education';