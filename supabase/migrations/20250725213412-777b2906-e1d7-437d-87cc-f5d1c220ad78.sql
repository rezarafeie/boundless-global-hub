
-- Update the RLS policy to allow public read access to gmail_credentials
DROP POLICY IF EXISTS "Admins can manage gmail credentials" ON public.gmail_credentials;

-- Create separate policies for read and write access
CREATE POLICY "Anyone can view gmail credentials" 
  ON public.gmail_credentials 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage gmail credentials" 
  ON public.gmail_credentials 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM chat_users 
    WHERE id = (auth.uid()::text)::integer 
    AND is_messenger_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_users 
    WHERE id = (auth.uid()::text)::integer 
    AND is_messenger_admin = true
  ));
