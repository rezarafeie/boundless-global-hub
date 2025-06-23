
-- Add password_hash column to chat_users table to support password authentication
ALTER TABLE public.chat_users 
ADD COLUMN password_hash TEXT;

-- Add unique constraint on username to prevent duplicates
ALTER TABLE public.chat_users 
ADD CONSTRAINT chat_users_username_unique UNIQUE (username);
