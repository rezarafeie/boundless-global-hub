-- Fix RLS policies for black_friday_settings
DROP POLICY IF EXISTS "Only admins can update Black Friday settings" ON black_friday_settings;

CREATE POLICY "Admins can update Black Friday settings"
ON black_friday_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_users
    WHERE (user_id = (auth.uid())::text OR id::text = (auth.uid())::text)
    AND (role = 'admin' OR is_messenger_admin = true)
  )
);

-- Fix RLS policies for black_friday_discounts
DROP POLICY IF EXISTS "Only admins can manage Black Friday discounts" ON black_friday_discounts;

CREATE POLICY "Admins can manage Black Friday discounts"
ON black_friday_discounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM chat_users
    WHERE (user_id = (auth.uid())::text OR id::text = (auth.uid())::text)
    AND (role = 'admin' OR is_messenger_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_users
    WHERE (user_id = (auth.uid())::text OR id::text = (auth.uid())::text)
    AND (role = 'admin' OR is_messenger_admin = true)
  )
);