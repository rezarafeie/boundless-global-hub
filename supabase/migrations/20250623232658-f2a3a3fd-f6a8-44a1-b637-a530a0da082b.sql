
-- Insert or update support users with proper conflict handling
INSERT INTO public.chat_users (id, name, username, phone, is_approved, is_support_agent, role, created_at, updated_at)
VALUES 
  (999997, 'پشتیبانی عمومی', 'academy_support', '09000000001', true, true, 'support', now(), now()),
  (999998, 'پشتیبانی بدون مرز', 'boundless_support', '09000000002', true, true, 'support', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  phone = EXCLUDED.phone,
  is_approved = EXCLUDED.is_approved,
  is_support_agent = EXCLUDED.is_support_agent,
  role = EXCLUDED.role,
  updated_at = now();

-- Handle username conflicts separately if they exist
UPDATE public.chat_users 
SET 
  name = 'پشتیبانی عمومی',
  phone = '09000000001',
  is_approved = true,
  is_support_agent = true,
  role = 'support',
  updated_at = now()
WHERE username = 'academy_support' AND id != 999997;

UPDATE public.chat_users 
SET 
  name = 'پشتیبانی بدون مرز',
  phone = '09000000002',
  is_approved = true,
  is_support_agent = true,
  role = 'support',
  updated_at = now()
WHERE username = 'boundless_support' AND id != 999998;

-- Ensure boundless support user has proper status
UPDATE public.chat_users 
SET bedoun_marz = true, bedoun_marz_approved = true 
WHERE username = 'boundless_support';
