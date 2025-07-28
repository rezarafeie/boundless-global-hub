-- Update existing policies to include sales managers

-- Update lead_assignments policies to include sales managers
DROP POLICY IF EXISTS "Sales managers can view lead assignments" ON lead_assignments;
CREATE POLICY "Sales managers can view lead assignments"
ON lead_assignments
FOR SELECT
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid()) OR
  sales_agent_id IN (
    SELECT sales_agents.id
    FROM sales_agents
    WHERE sales_agents.user_id = ((auth.uid())::text)::integer
  )
);

DROP POLICY IF EXISTS "Sales managers can manage lead assignments" ON lead_assignments;
CREATE POLICY "Sales managers can manage lead assignments"
ON lead_assignments
FOR ALL
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
)
WITH CHECK (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);

-- Update enrollments policies to include sales managers
CREATE POLICY "Sales managers can view all enrollments"
ON enrollments
FOR SELECT
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);

-- Update sales_agents policies to include sales managers
CREATE POLICY "Sales managers can view sales agents"
ON sales_agents
FOR SELECT
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);

CREATE POLICY "Sales managers can manage sales agents"
ON sales_agents
FOR ALL
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
)
WITH CHECK (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);

-- Update sales_agent_courses policies to include sales managers
CREATE POLICY "Sales managers can view sales agent courses"
ON sales_agent_courses
FOR SELECT
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);

CREATE POLICY "Sales managers can manage sales agent courses"
ON sales_agent_courses
FOR ALL
TO authenticated
USING (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
)
WITH CHECK (
  is_academy_admin_safe(auth.uid()) OR 
  is_sales_manager(auth.uid())
);