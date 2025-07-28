-- Update the get_lead_assignments function to only return self-assigned leads
-- Distributed leads should not appear in the assignments tab
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
    -- Only return self-assigned leads, not distributed ones
    AND la.assignment_type = 'self_assigned'
  ORDER BY la.assigned_at DESC;
END;
$$;