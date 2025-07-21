-- Create CRM notes table for tracking admin interactions with users
CREATE TABLE public.crm_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'call', 'message')),
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user activity logs table for tracking user activations and events
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for crm_notes
CREATE POLICY "Admins can manage CRM notes" 
ON public.crm_notes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = ((auth.uid())::text)::integer 
  AND is_messenger_admin = true
));

-- Create policies for user_activity_logs
CREATE POLICY "Admins can view activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_users 
  WHERE id = ((auth.uid())::text)::integer 
  AND is_messenger_admin = true
));

CREATE POLICY "System can insert activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_crm_notes_user_id ON public.crm_notes(user_id);
CREATE INDEX idx_crm_notes_created_at ON public.crm_notes(created_at DESC);
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Add trigger for crm_notes updated_at
CREATE TRIGGER update_crm_notes_updated_at
BEFORE UPDATE ON public.crm_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();