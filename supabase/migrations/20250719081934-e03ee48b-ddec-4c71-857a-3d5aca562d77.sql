-- Update RLS policies for support conversations to allow everyone to see and chat

-- Drop existing restrictive policies for support_conversations
DROP POLICY IF EXISTS "Allow conversation viewing" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation updates" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can view their support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Support agents can update conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can create support conversations" ON public.support_conversations;

-- Create new permissive policies for support_conversations
CREATE POLICY "Everyone can view support conversations" 
ON public.support_conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can create support conversations" 
ON public.support_conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Everyone can update support conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (true);

-- Update messenger_messages policies to allow support chat access for everyone
DROP POLICY IF EXISTS "Messages policy for authenticated users" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible rooms" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can view messages in rooms they have access to" ON public.messenger_messages;

-- Create new permissive policies for messenger_messages
CREATE POLICY "Everyone can view all messages" 
ON public.messenger_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can send messages" 
ON public.messenger_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Everyone can update messages" 
ON public.messenger_messages 
FOR UPDATE 
USING (true);

-- Update chat_users policies to allow everyone to see users
DROP POLICY IF EXISTS "Anyone can view approved users" ON public.chat_users;
DROP POLICY IF EXISTS "Service role can view all users" ON public.chat_users;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.chat_users;

-- Create new permissive policies for chat_users
CREATE POLICY "Everyone can view all users" 
ON public.chat_users 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can update users" 
ON public.chat_users 
FOR UPDATE 
USING (true);