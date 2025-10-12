-- Add telegram_channel_link to webinar_entries table
ALTER TABLE public.webinar_entries 
ADD COLUMN telegram_channel_link text;

-- Create webinar_registrations table for registration records
CREATE TABLE public.webinar_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  mobile_number text NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_webinar_registrations_webinar_id ON public.webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_mobile ON public.webinar_registrations(mobile_number);

-- Enable RLS
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert registrations
CREATE POLICY "Anyone can register for webinars"
  ON public.webinar_registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to view all registrations
CREATE POLICY "Admins can view all registrations"
  ON public.webinar_registrations
  FOR SELECT
  USING (true);