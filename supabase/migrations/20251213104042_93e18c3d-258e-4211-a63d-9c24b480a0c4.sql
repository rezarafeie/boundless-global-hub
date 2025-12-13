-- Add consultation_id to deals table for linking deals to consultations
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS consultation_id uuid REFERENCES public.consultation_bookings(id) ON DELETE SET NULL;

-- Add reminder tracking to consultation_bookings
ALTER TABLE public.consultation_bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS crm_added boolean DEFAULT false;

-- Create index for consultation lookups
CREATE INDEX IF NOT EXISTS idx_deals_consultation_id ON public.deals(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_deal_id ON public.consultation_bookings(deal_id);

-- Add no_show status to consultation_bookings check constraint
-- First drop existing constraint and recreate with new status
ALTER TABLE public.consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
ALTER TABLE public.consultation_bookings ADD CONSTRAINT consultation_bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));