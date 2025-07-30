-- Create CRM follow-ups table
CREATE TABLE public.crm_followups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.chat_users(id),
  crm_activity_id uuid NOT NULL REFERENCES public.crm_notes(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to integer NOT NULL REFERENCES public.chat_users(id),
  due_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  deal_id uuid NULL REFERENCES public.deals(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_followups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Messenger admins can manage CRM follow-ups" 
ON public.crm_followups 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_crm_followups_due_at ON public.crm_followups(due_at);
CREATE INDEX idx_crm_followups_status ON public.crm_followups(status);
CREATE INDEX idx_crm_followups_user_id ON public.crm_followups(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_crm_followups_updated_at
  BEFORE UPDATE ON public.crm_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();