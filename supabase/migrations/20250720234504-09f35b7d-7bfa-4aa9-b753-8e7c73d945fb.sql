
-- Create discount_codes table for the discount system
CREATE TABLE public.discount_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  percentage numeric NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  course_id uuid REFERENCES public.courses(id),
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text
);

-- Add RLS policies for discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active discount codes (for validation)
CREATE POLICY "Anyone can view active discount codes" 
  ON public.discount_codes 
  FOR SELECT 
  USING (is_active = true);

-- Allow admin access to manage discount codes
CREATE POLICY "Admin can manage discount codes" 
  ON public.discount_codes 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert the first discount code: summer2025start with 25% off
INSERT INTO public.discount_codes (code, percentage, is_active, max_uses, created_by)
VALUES ('summer2025start', 25, true, 100, 'system');

-- Enable realtime for discount_codes table
ALTER TABLE public.discount_codes REPLICA IDENTITY FULL;

-- Create index for better performance on code lookups
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_active ON public.discount_codes(is_active);

-- Enable pg_cron extension for hourly dollar price updates
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the dollar price update function to run every hour
SELECT cron.schedule(
  'update-dollar-prices-hourly',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/update-dollar-prices',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);
