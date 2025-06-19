
-- Create chat_users table for user registration and approval
CREATE TABLE public.chat_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to chat_messages to link messages to users
ALTER TABLE public.chat_messages ADD COLUMN user_id INTEGER REFERENCES public.chat_users(id);

-- Update chat_messages to make sender_name nullable since we'll get it from chat_users
ALTER TABLE public.chat_messages ALTER COLUMN sender_name DROP NOT NULL;

-- Add RLS policies for chat_users (public read for approved users)
ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved users" ON public.chat_users
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert new users" ON public.chat_users
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON public.user_sessions
  FOR UPDATE USING (true);

-- Add function to clean up inactive sessions
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE last_activity < NOW() - INTERVAL '1 hour';
END;
$$;
