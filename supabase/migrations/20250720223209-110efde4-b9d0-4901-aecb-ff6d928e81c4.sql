-- Create google_auth_settings table to control Google login availability
CREATE TABLE public.google_auth_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by INTEGER REFERENCES public.chat_users(id),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert the default row
INSERT INTO public.google_auth_settings (id, is_enabled) VALUES (1, true);

-- Enable RLS
ALTER TABLE public.google_auth_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view google auth settings" 
ON public.google_auth_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update google auth settings" 
ON public.google_auth_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users cu
    WHERE cu.id = auth.uid()::text::integer 
    AND cu.is_messenger_admin = true
  )
);

-- Create trigger to update timestamp
CREATE TRIGGER update_google_auth_settings_updated_at
BEFORE UPDATE ON public.google_auth_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();