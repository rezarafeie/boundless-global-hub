
-- First, let's simplify the RLS policies to make them less restrictive for testing
-- and fix the session context issues

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view accessible messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can view accessible rooms" ON public.chat_rooms;

-- Create simpler, more permissive policies for testing
-- Allow authenticated users to view all messages (we'll refine this later)
CREATE POLICY "Authenticated users can view messages" ON public.messenger_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Allow authenticated users to create messages
CREATE POLICY "Authenticated users can create messages" ON public.messenger_messages
FOR INSERT WITH CHECK (
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" ON public.messenger_messages
FOR UPDATE USING (
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messenger_messages
FOR DELETE USING (
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Simplify room access policy
CREATE POLICY "Authenticated users can view active rooms" ON public.chat_rooms
FOR SELECT USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Clean up inactive sessions (older than 24 hours)
UPDATE public.user_sessions 
SET is_active = false 
WHERE last_activity < NOW() - INTERVAL '24 hours' AND is_active = true;

-- Create some default rooms if they don't exist
INSERT INTO public.chat_rooms (name, type, description, is_active) 
VALUES 
  ('گفتگوی عمومی', 'public_group', 'گفتگوی عمومی برای همه کاربران', true),
  ('گروه بدون مرز', 'boundless_group', 'گروه ویژه دانش‌پذیران بدون مرز', true),
  ('کانال اطلاعیه', 'announcement_channel', 'کانال اطلاعیه‌های مهم', true)
ON CONFLICT DO NOTHING;

-- Improve the session context function with better error handling
CREATE OR REPLACE FUNCTION public.set_session_context(session_token text)
RETURNS void AS $$
BEGIN
  -- Set the session token in the configuration
  PERFORM set_config('app.session_token', session_token, true);
  
  -- Log the session context setting for debugging
  RAISE NOTICE 'Session context set for token: %', left(session_token, 8) || '...';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set session context: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
