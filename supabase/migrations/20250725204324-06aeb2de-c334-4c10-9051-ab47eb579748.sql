-- Create gmail_credentials table
CREATE TABLE public.gmail_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_logs table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id),
  course_id UUID REFERENCES public.courses(id),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for gmail_credentials
CREATE POLICY "Admins can manage gmail credentials" 
ON public.gmail_credentials 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users 
    WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
  )
);

-- RLS policies for email_logs
CREATE POLICY "Admins can view email logs" 
ON public.email_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users 
    WHERE id = ((auth.uid())::text)::integer 
    AND is_messenger_admin = true
  )
);

CREATE POLICY "System can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_gmail_credentials_updated_at
  BEFORE UPDATE ON public.gmail_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();