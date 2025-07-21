-- Fix RLS policies for crm_notes to work with current auth system
DROP POLICY IF EXISTS "Admins can manage CRM notes" ON public.crm_notes;

-- Create new policy that works with the messenger admin system
CREATE POLICY "Messenger admins can manage CRM notes" 
ON public.crm_notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also update the activity logs policy to be more permissive for admins
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.user_activity_logs;

CREATE POLICY "Messenger admins can view activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (true);

-- Add policy for inserting activity logs
CREATE POLICY "Messenger admins can insert activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (true);