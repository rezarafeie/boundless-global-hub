-- Allow everyone to manage lead assignments
DROP POLICY IF EXISTS "Admins can manage lead assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Sales agents can update their assigned leads" ON public.lead_assignments;
DROP POLICY IF EXISTS "Sales agents can view their assigned leads" ON public.lead_assignments;
DROP POLICY IF EXISTS "Sales managers can manage lead assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Sales managers can view lead assignments" ON public.lead_assignments;

-- Create new policies that allow everyone to manage lead assignments
CREATE POLICY "Everyone can manage lead assignments" 
ON public.lead_assignments 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Allow everyone to manage lead distribution logs
DROP POLICY IF EXISTS "Admins can manage lead distribution logs" ON public.lead_distribution_logs;

CREATE POLICY "Everyone can manage lead distribution logs" 
ON public.lead_distribution_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Allow everyone to view and manage sales agents
DROP POLICY IF EXISTS "Admins can manage sales agents" ON public.sales_agents;
DROP POLICY IF EXISTS "Sales managers can view sales agents" ON public.sales_agents;

CREATE POLICY "Everyone can view sales agents" 
ON public.sales_agents 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can manage sales agents" 
ON public.sales_agents 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Ensure enrollments can be viewed and updated by everyone for lead distribution
DROP POLICY IF EXISTS "Allow admin access to enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow admin access to update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Sales managers can view all enrollments" ON public.enrollments;

CREATE POLICY "Everyone can view enrollments" 
ON public.enrollments 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can update enrollments for lead distribution" 
ON public.enrollments 
FOR UPDATE 
USING (true)
WITH CHECK (true);