-- Create function to distribute leads and create deals simultaneously
CREATE OR REPLACE FUNCTION public.distribute_lead_and_create_deal(
  p_enrollment_id uuid,
  p_agent_user_id integer,
  p_assigned_by integer,
  p_deal_course_id uuid,
  p_deal_price numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  agent_id INTEGER;
  deal_id UUID;
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
  
  -- Create deal for this assignment
  INSERT INTO public.deals (
    enrollment_id,
    course_id,
    price,
    assigned_salesperson_id,
    assigned_by_id
  ) VALUES (
    p_enrollment_id,
    p_deal_course_id,
    p_deal_price,
    p_agent_user_id,
    p_assigned_by
  )
  ON CONFLICT (enrollment_id) DO UPDATE SET
    course_id = p_deal_course_id,
    price = p_deal_price,
    assigned_salesperson_id = p_agent_user_id,
    assigned_by_id = p_assigned_by,
    updated_at = now();
    
  RETURN TRUE;
END;
$function$;

-- Add unique constraint on deals enrollment_id to prevent duplicates
ALTER TABLE public.deals ADD CONSTRAINT deals_enrollment_id_unique UNIQUE (enrollment_id);