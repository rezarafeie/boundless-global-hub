-- Update RLS policies for lead_assignments to be fully public
DROP POLICY IF EXISTS "Everyone can manage lead assignments" ON public.lead_assignments;

-- Create new policy that allows all operations without restrictions
CREATE POLICY "Public access to lead assignments"
ON public.lead_assignments
FOR ALL
USING (true)
WITH CHECK (true);

-- Also ensure sales_agents table has public access for reading
DROP POLICY IF EXISTS "Everyone can manage sales agents" ON public.sales_agents;

CREATE POLICY "Public access to sales agents"
ON public.sales_agents
FOR ALL
USING (true)
WITH CHECK (true);