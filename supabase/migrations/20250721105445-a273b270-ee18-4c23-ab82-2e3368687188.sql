-- Create table for SSO tokens
CREATE TABLE public.sso_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('woocommerce', 'academy')),
  enrollment_id UUID REFERENCES public.enrollments(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.sso_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for SSO tokens
CREATE POLICY "Admin can manage all SSO tokens" 
ON public.sso_tokens 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_sso_tokens_token ON public.sso_tokens(token);
CREATE INDEX idx_sso_tokens_expires_at ON public.sso_tokens(expires_at);
CREATE INDEX idx_sso_tokens_enrollment_id ON public.sso_tokens(enrollment_id);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_sso_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.sso_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;