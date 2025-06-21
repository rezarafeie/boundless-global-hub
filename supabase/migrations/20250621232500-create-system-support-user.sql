
-- Create system support user with id = 1
INSERT INTO public.chat_users (id, name, phone, is_approved, is_support_agent, role, created_at, updated_at)
VALUES (1, 'پشتیبانی سیستم', '00000000000', true, true, 'system', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_support_agent = true,
  is_approved = true,
  role = 'system',
  updated_at = NOW();

-- Reset the sequence to start from 2 for new users
SELECT setval('chat_users_id_seq', GREATEST(2, (SELECT MAX(id) + 1 FROM chat_users)));
