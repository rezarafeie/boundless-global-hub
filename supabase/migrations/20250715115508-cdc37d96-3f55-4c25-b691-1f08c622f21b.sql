-- Add notification preferences to chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS notification_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_token text DEFAULT NULL;