-- Drop the old log_user_activity function with duration parameter to resolve function ambiguity
DROP FUNCTION IF EXISTS public.log_user_activity(integer, text, text, jsonb, integer);

-- Ensure the correct function exists without duration parameter
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id integer, 
  p_event_type text, 
  p_reference text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id, 
    event_type, 
    reference, 
    metadata
  )
  VALUES (
    p_user_id, 
    p_event_type, 
    p_reference, 
    p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;