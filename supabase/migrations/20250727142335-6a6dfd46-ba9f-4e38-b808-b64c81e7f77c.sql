
-- Fix the assign_courses_to_sales_agent function to not reference updated_at column
CREATE OR REPLACE FUNCTION public.assign_courses_to_sales_agent(p_agent_user_id integer, p_course_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  agent_id INTEGER;
  course_id UUID;
BEGIN
  -- Get or create sales agent
  SELECT id INTO agent_id
  FROM public.sales_agents
  WHERE user_id = p_agent_user_id;
  
  IF agent_id IS NULL THEN
    INSERT INTO public.sales_agents (user_id, is_active)
    VALUES (p_agent_user_id, true)
    RETURNING id INTO agent_id;
  ELSE
    -- Ensure the agent is active
    UPDATE public.sales_agents 
    SET is_active = true
    WHERE id = agent_id;
  END IF;
  
  -- Remove existing course assignments for this agent
  DELETE FROM public.sales_agent_courses
  WHERE sales_agent_id = agent_id;
  
  -- Add new course assignments (without updated_at column)
  FOREACH course_id IN ARRAY p_course_ids
  LOOP
    INSERT INTO public.sales_agent_courses (sales_agent_id, course_id, created_at)
    VALUES (agent_id, course_id, now())
    ON CONFLICT (sales_agent_id, course_id) DO UPDATE SET
      created_at = now();
  END LOOP;
  
  RETURN TRUE;
END;
$function$;
