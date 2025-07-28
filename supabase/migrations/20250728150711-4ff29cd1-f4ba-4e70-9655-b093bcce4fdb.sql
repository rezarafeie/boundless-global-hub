-- Fix the get_user_courses_for_sales_agent function to only show unassigned leads
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
    -- Always false for this function since we only show unassigned leads
    false as is_assigned,
    NULL::TEXT as assigned_to_agent
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.sales_agent_courses sac ON c.id = sac.course_id
  JOIN public.sales_agents sa ON sac.sales_agent_id = sa.id
  LEFT JOIN public.lead_assignments la ON e.id = la.enrollment_id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
    -- Only show leads that are NOT assigned to anyone
    AND la.id IS NULL
  ORDER BY e.created_at DESC;
END;
$$;

-- Also update the get_lead_assignments function to include distributed leads for the agent
CREATE OR REPLACE FUNCTION public.get_lead_assignments(agent_user_id INTEGER)
RETURNS TABLE(
  assignment_id INTEGER,
  enrollment_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  course_title TEXT,
  payment_amount NUMERIC,
  assigned_at TIMESTAMP WITH TIME ZONE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    e.id,
    e.full_name,
    e.email,
    e.phone,
    c.title,
    e.payment_amount,
    la.assigned_at,
    la.status
  FROM public.lead_assignments la
  JOIN public.sales_agents sa ON la.sales_agent_id = sa.id
  JOIN public.enrollments e ON la.enrollment_id = e.id
  JOIN public.courses c ON e.course_id = c.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
    -- Return both distributed and self-assigned leads
    AND la.assignment_type IN ('distributed', 'self_assigned')
  ORDER BY la.assigned_at DESC;
END;
$$;