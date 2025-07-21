-- Create webhook configurations table
CREATE TABLE public.webhook_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  event_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  headers jsonb DEFAULT '{}'::jsonb,
  body_template jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by integer REFERENCES public.chat_users(id)
);

-- Create webhook logs table
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id uuid NOT NULL REFERENCES public.webhook_configurations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Create webhook events enum
CREATE TYPE webhook_event_type AS ENUM (
  'enrollment_created',
  'enrollment_paid_successful', 
  'enrollment_manual_payment_submitted',
  'enrollment_manual_payment_approved',
  'enrollment_manual_payment_rejected',
  'user_created',
  'email_linked_existing_account'
);

-- Enable RLS
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_configurations
CREATE POLICY "Admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users 
    WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_users 
    WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
  )
);

-- RLS policies for webhook_logs
CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users 
    WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_webhook_configurations_event_type ON public.webhook_configurations(event_type);
CREATE INDEX idx_webhook_configurations_is_active ON public.webhook_configurations(is_active);
CREATE INDEX idx_webhook_logs_webhook_config_id ON public.webhook_logs(webhook_config_id);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_sent_at ON public.webhook_logs(sent_at);

-- Create function to update updated_at column
CREATE TRIGGER update_webhook_configurations_updated_at
BEFORE UPDATE ON public.webhook_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();