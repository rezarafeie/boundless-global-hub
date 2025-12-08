-- Create table for custom CRM statuses
CREATE TABLE public.crm_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT DEFAULT 'default',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by INTEGER REFERENCES public.chat_users(id)
);

-- Enable RLS
ALTER TABLE public.crm_statuses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active statuses
CREATE POLICY "Anyone can view active CRM statuses"
ON public.crm_statuses
FOR SELECT
USING (is_active = true);

-- Allow admins to manage statuses
CREATE POLICY "Admins can manage CRM statuses"
ON public.crm_statuses
FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_crm_statuses_updated_at
BEFORE UPDATE ON public.crm_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default statuses
INSERT INTO public.crm_statuses (label, color, order_index) VALUES
('در انتظار پرداخت', 'yellow', 1),
('کنسل', 'red', 2),
('موفق', 'green', 3),
('پاسخ نداده', 'gray', 4),
('امکان مکالمه نداشت', 'orange', 5),
('تکمیل شده', 'blue', 6),
('لغو شده', 'red', 7);