-- Fix get_user_courses_for_sales_agent to only show distributed leads
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
    -- Always false for available leads (they can be self-assigned)
    false as is_assigned,
    NULL::TEXT as assigned_to_agent
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.lead_assignments la ON e.id = la.enrollment_id
  JOIN public.sales_agents sa ON la.sales_agent_id = sa.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
    -- Only show leads that were DISTRIBUTED to this agent but not yet self-assigned
    AND la.assignment_type = 'distributed'
  ORDER BY e.created_at DESC;
END;
$$;