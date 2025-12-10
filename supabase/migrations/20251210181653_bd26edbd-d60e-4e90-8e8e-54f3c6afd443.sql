-- Add call_clicks column to lead_requests table
ALTER TABLE public.lead_requests 
ADD COLUMN IF NOT EXISTS call_clicks integer DEFAULT 0;