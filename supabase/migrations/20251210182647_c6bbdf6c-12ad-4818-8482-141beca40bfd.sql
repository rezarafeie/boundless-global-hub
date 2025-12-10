-- Create function to increment call clicks
CREATE OR REPLACE FUNCTION public.increment_lead_call_clicks(lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lead_requests 
  SET call_clicks = COALESCE(call_clicks, 0) + 1 
  WHERE id = lead_id;
END;
$$;