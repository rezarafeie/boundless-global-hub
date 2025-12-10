-- Create lead_requests table for high-conversion lead generation
CREATE TABLE public.lead_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  ai_recommendation JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_agent_id INTEGER REFERENCES public.chat_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_lead_requests_phone ON public.lead_requests(phone);
CREATE INDEX idx_lead_requests_status ON public.lead_requests(status);
CREATE INDEX idx_lead_requests_assigned_agent ON public.lead_requests(assigned_agent_id);
CREATE INDEX idx_lead_requests_created_at ON public.lead_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert lead requests"
ON public.lead_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update lead requests"
ON public.lead_requests
FOR UPDATE
USING (true);

CREATE POLICY "Admins can view all lead requests"
ON public.lead_requests
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_requests_updated_at
BEFORE UPDATE ON public.lead_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();