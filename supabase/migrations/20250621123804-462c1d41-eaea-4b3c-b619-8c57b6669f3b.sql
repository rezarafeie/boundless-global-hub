
-- Create support_messages table for private chat support
CREATE TABLE public.support_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create support_agents table
CREATE TABLE public.support_agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add bedoun_marz fields to chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN bedoun_marz_request BOOLEAN DEFAULT FALSE,
ADD COLUMN bedoun_marz_approved BOOLEAN DEFAULT FALSE;

-- Add support role to user sessions tracking
ALTER TABLE public.user_sessions 
ADD COLUMN is_support_agent BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);
CREATE INDEX idx_support_agents_phone ON public.support_agents(phone);
CREATE INDEX idx_chat_users_bedoun_marz ON public.chat_users(bedoun_marz_approved) WHERE bedoun_marz_approved = TRUE;

-- Enable realtime for support messages
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
