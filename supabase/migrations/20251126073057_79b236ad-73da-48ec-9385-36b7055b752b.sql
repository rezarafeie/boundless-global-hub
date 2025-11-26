-- Fix Black Friday RLS policies to use session-based authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update Black Friday settings" ON black_friday_settings;
DROP POLICY IF EXISTS "Admins can manage Black Friday discounts" ON black_friday_discounts;

-- Create new policies using session-based auth
CREATE POLICY "Admins can update Black Friday settings"
ON black_friday_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM chat_users cu
    JOIN user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token'::text, true)
    AND us.is_active = true
    AND (cu.role = 'admin' OR cu.is_messenger_admin = true)
  )
);

CREATE POLICY "Admins can manage Black Friday discounts"
ON black_friday_discounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM chat_users cu
    JOIN user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token'::text, true)
    AND us.is_active = true
    AND (cu.role = 'admin' OR cu.is_messenger_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM chat_users cu
    JOIN user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token'::text, true)
    AND us.is_active = true
    AND (cu.role = 'admin' OR cu.is_messenger_admin = true)
  )
);