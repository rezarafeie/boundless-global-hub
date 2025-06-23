
-- Update existing support users to ensure they have correct settings
UPDATE public.chat_users 
SET 
  name = 'پشتیبانی آکادمی',
  username = 'support',
  is_approved = true,
  is_support_agent = true,
  role = 'support',
  updated_at = now()
WHERE phone = '1';

UPDATE public.chat_users 
SET 
  name = 'پشتیبانی بدون مرز',
  username = 'boundless',
  is_approved = true,
  is_support_agent = true,
  role = 'support',
  updated_at = now()
WHERE phone = '2';

-- Also ensure they have bio field for profile completeness
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS bio TEXT;
