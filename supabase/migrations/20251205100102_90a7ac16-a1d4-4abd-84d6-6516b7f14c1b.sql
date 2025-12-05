-- Add column for leads management system toggle
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS use_full_leads_system boolean DEFAULT false;