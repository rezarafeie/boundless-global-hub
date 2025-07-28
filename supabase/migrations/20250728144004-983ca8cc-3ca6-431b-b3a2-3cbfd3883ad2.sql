-- Create a new function for lead distribution that sets assignment_type to 'distributed'
CREATE OR REPLACE FUNCTION public.distribute_lead_to_agent(p_enrollment_id UUID, p_agent_user_id INTEGER, p_assigned_by INTEGER)
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
  
  -- Insert or update assignment with 'distributed' type
  INSERT INTO public.lead_assignments (enrollment_id, sales_agent_id, assigned_by, assignment_type)
  VALUES (p_enrollment_id, agent_id, p_assigned_by, 'distributed')
  ON CONFLICT (enrollment_id) DO UPDATE SET
    sales_agent_id = agent_id,
    assigned_by = p_assigned_by,
    assigned_at = now(),
    updated_at = now(),
    assignment_type = 'distributed';
    
  RETURN TRUE;
END;
$$;