
-- Enable RLS on message_reactions table if not already enabled
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;

-- Create policy to allow users to view all message reactions
CREATE POLICY "Users can view message reactions" ON public.message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Create policy to allow authenticated users to add reactions
CREATE POLICY "Users can add reactions" ON public.message_reactions
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Create policy to allow users to delete their own reactions
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
FOR DELETE USING (
  user_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);
