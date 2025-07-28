-- Fix 1: Add Agent 140 (مهتاب عسگری) access to "دوره شروع بدون مرز" course
-- Get the sales_agent_id for user_id 140
INSERT INTO public.sales_agent_courses (sales_agent_id, course_id, created_at)
SELECT 
  sa.id,
  '287b51a8-a93b-4334-91ef-a5d3bf97fc3d'::uuid,
  now()
FROM public.sales_agents sa
WHERE sa.user_id = 140
ON CONFLICT (sales_agent_id, course_id) DO NOTHING;

-- Fix 2: Update get_user_courses_for_sales_agent to include distributed leads
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
    -- Check if lead is assigned to this specific agent (both distributed and self-assigned)
    CASE 
      WHEN la.sales_agent_id IN (
        SELECT sa_inner.id FROM public.sales_agents sa_inner WHERE sa_inner.user_id = agent_user_id
      ) THEN true
      ELSE false
    END as is_assigned,
    CASE 
      WHEN la.sales_agent_id IN (
        SELECT sa_inner.id FROM public.sales_agents sa_inner WHERE sa_inner.user_id = agent_user_id
      ) THEN cu.name
      ELSE NULL
    END as assigned_to_agent
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.sales_agent_courses sac ON c.id = sac.course_id
  JOIN public.sales_agents sa ON sac.sales_agent_id = sa.id
  LEFT JOIN public.lead_assignments la ON e.id = la.enrollment_id
  LEFT JOIN public.sales_agents assigned_sa ON la.sales_agent_id = assigned_sa.id
  LEFT JOIN public.chat_users cu ON assigned_sa.user_id = cu.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
    -- Show leads that are either:
    -- 1. Not assigned to anyone
    -- 2. Assigned to this agent (distributed or self-assigned)
    AND (
      la.id IS NULL OR 
      la.sales_agent_id = sa.id
    )
  ORDER BY e.created_at DESC;
END;
$$;