-- Set all notification_enabled to false in chat_users table
-- This disables notifications for all users

UPDATE public.chat_users 
SET notification_enabled = false;