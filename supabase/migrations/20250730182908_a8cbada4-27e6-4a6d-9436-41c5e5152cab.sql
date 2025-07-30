-- Drop existing restrictive policies on deals table
DROP POLICY IF EXISTS "Admins and sales managers can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Sales agents can view assigned deals" ON public.deals;
DROP POLICY IF EXISTS "System can create deals" ON public.deals;

-- Create new permissive policies for deals table
CREATE POLICY "Anyone can view all deals" 
ON public.deals 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update deals" 
ON public.deals 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete deals" 
ON public.deals 
FOR DELETE 
USING (true);

-- Also update deal_activities table to be publicly accessible
DROP POLICY IF EXISTS "Authorized users can manage deal activities" ON public.deal_activities;
DROP POLICY IF EXISTS "Users can view activities for accessible deals" ON public.deal_activities;

CREATE POLICY "Anyone can view deal activities" 
ON public.deal_activities 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create deal activities" 
ON public.deal_activities 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update deal activities" 
ON public.deal_activities 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete deal activities" 
ON public.deal_activities 
FOR DELETE 
USING (true);