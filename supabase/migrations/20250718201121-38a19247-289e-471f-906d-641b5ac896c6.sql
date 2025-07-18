-- Create OTP verification table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for edge functions to access this table
CREATE POLICY "Enable all operations for service role" 
ON public.otp_verifications 
FOR ALL 
TO service_role 
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_otp_verifications_updated_at
BEFORE UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();