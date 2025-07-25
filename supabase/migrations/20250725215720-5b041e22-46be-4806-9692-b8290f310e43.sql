-- Update the trigger function to use the existing http extension
CREATE OR REPLACE FUNCTION public.send_enrollment_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for successful payments
  IF NEW.payment_status IN ('completed', 'success') AND 
     (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('completed', 'success')) THEN
    
    -- Call the edge function to send enrollment emails
    PERFORM http_post(
      'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email',
      json_build_object('enrollmentId', NEW.id)::text,
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$;