-- Add a new column to lead_assignments to distinguish between admin distribution and sales agent self-assignment
ALTER TABLE public.lead_assignments 
ADD COLUMN assignment_type TEXT DEFAULT 'self_assigned' CHECK (assignment_type IN ('distributed', 'self_assigned'));

-- Update existing assignments to be 'self_assigned' by default
UPDATE public.lead_assignments 
SET assignment_type = 'self_assigned' 
WHERE assignment_type IS NULL;

-- Update the get_user_courses_for_sales_agent function to only consider self_assigned as truly assigned
CREATE OR REPLACE FUNCTION public.get_user_courses_for_sales_agent(agent_user_id INTEGER)
RETURNS TABLE(
  enrollment_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  course_title TEXT,
  payment_status TEXT,
  payment_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  is_assigned BOOLEAN,
  assigned_to_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    e.email,
    e.phone,
    c.title,
    e.payment_status,
    e.payment_amount,
    e.created_at,
    -- Only consider it assigned if it's self_assigned by this agent
    (la.id IS NOT NULL AND la.assignment_type = 'self_assigned' AND assigned_sa.user_id = agent_user_id) as is_assigned,
    CASE 
      WHEN la.id IS NOT NULL AND la.assignment_type = 'self_assigned' AND assigned_sa.user_id = agent_user_id THEN cu.name
      ELSE NULL
    END as assigned_to_agent
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.sales_agent_courses sac ON c.id = sac.course_id
  JOIN public.sales_agents sa ON sac.sales_agent_id = sa.id
  LEFT JOIN public.lead_assignments la ON e.id = la.enrollment_id AND la.sales_agent_id = sa.id
  LEFT JOIN public.sales_agents assigned_sa ON la.sales_agent_id = assigned_sa.id
  LEFT JOIN public.chat_users cu ON assigned_sa.user_id = cu.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
  ORDER BY e.created_at DESC;
END;
$$;

-- Update the assign_lead_to_agent function to mark self-assignments
CREATE OR REPLACE FUNCTION public.assign_lead_to_agent(p_enrollment_id UUID, p_agent_user_id INTEGER, p_assigned_by INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id INTEGER;
BEGIN
  -- Get sales agent id
  SELECT id INTO agent_id
  FROM public.sales_agents
  WHERE user_id = p_agent_user_id AND is_active = true;
  
  IF agent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update assignment with proper type
  INSERT INTO public.lead_assignments (enrollment_id, sales_agent_id, assigned_by, assignment_type)
  VALUES (p_enrollment_id, agent_id, p_assigned_by, 'self_assigned')
  ON CONFLICT (enrollment_id) DO UPDATE SET
    sales_agent_id = agent_id,
    assigned_by = p_assigned_by,
    assigned_at = now(),
    updated_at = now(),
    assignment_type = 'self_assigned';
    
  RETURN TRUE;
END;
$$;