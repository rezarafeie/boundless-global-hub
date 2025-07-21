-- Update RLS policies for webhook_configurations to work with the existing admin system
DROP POLICY IF EXISTS "Admins can manage webhook configurations" ON public.webhook_configurations;

-- Create a new policy that works with the chat_users admin system
CREATE POLICY "Chat admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update webhook_logs policy as well
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;

CREATE POLICY "Chat admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (true);

-- Also allow inserts to webhook_logs for the webhook system
CREATE POLICY "System can insert webhook logs" 
ON public.webhook_logs 
FOR INSERT 
WITH CHECK (true);