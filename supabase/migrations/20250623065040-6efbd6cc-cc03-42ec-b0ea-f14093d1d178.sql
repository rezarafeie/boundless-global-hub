
-- Create admin_settings table to store system-wide configuration
CREATE TABLE public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  manual_approval_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.admin_settings (id, manual_approval_enabled, updated_at) 
VALUES (1, false, now())
ON CONFLICT (id) DO NOTHING;

-- Add constraint to ensure only one settings row exists
ALTER TABLE public.admin_settings 
ADD CONSTRAINT single_settings_row CHECK (id = 1);
