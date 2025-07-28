-- Create lead distribution logs table
CREATE TABLE public.lead_distribution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id integer NOT NULL,
  sales_agent_id integer NOT NULL,
  method text NOT NULL CHECK (method IN ('percentage', 'manual')),
  course_id uuid NOT NULL,
  count integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_distribution_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage lead distribution logs" 
ON public.lead_distribution_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = admin_id AND (is_messenger_admin = true OR role = 'sales_manager')
));

-- Add foreign key constraints
ALTER TABLE public.lead_distribution_logs 
ADD CONSTRAINT fk_admin_id 
FOREIGN KEY (admin_id) REFERENCES public.chat_users(id);

ALTER TABLE public.lead_distribution_logs 
ADD CONSTRAINT fk_sales_agent_id 
FOREIGN KEY (sales_agent_id) REFERENCES public.chat_users(id);

ALTER TABLE public.lead_distribution_logs 
ADD CONSTRAINT fk_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id);