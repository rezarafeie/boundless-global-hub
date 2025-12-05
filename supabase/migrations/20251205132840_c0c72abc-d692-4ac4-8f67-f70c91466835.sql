-- Create table for AI admin reports
CREATE TABLE public.ai_admin_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_name TEXT NOT NULL,
  view_mode TEXT NOT NULL DEFAULT 'daily',
  greeting TEXT,
  summary TEXT,
  highlights TEXT[] DEFAULT '{}',
  warnings TEXT[] DEFAULT '{}',
  suggestions TEXT[] DEFAULT '{}',
  motivation TEXT,
  raw_data JSONB,
  raw_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_admin_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view reports
CREATE POLICY "Admins can view AI reports"
ON public.ai_admin_reports
FOR SELECT
USING (true);

-- Create policy for inserting reports (from edge function)
CREATE POLICY "System can insert AI reports"
ON public.ai_admin_reports
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_ai_admin_reports_created_at ON public.ai_admin_reports(created_at DESC);