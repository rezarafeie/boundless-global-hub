-- Add new course management options
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS create_test_license BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS woocommerce_create_access BOOLEAN DEFAULT true;