-- Add country_code column to chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN country_code text;