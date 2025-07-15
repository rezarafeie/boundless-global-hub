-- Allow users to update their own notification preferences in chat_users table
-- This adds a policy for users to update their notification_enabled and notification_token fields

CREATE POLICY "Users can update their own notification settings" ON public.chat_users
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true 
    AND us.last_activity > now() - interval '24 hours'
    AND us.user_id = chat_users.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true 
    AND us.last_activity > now() - interval '24 hours'
    AND us.user_id = chat_users.id
  )
);