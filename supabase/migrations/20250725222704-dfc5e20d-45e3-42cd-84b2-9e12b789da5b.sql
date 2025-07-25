-- Fix the send_enrollment_email_trigger function to use correct http_post syntax
CREATE OR REPLACE FUNCTION public.send_enrollment_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for successful payments or free courses
  IF (NEW.payment_status IN ('completed', 'success') AND 
      (OLD IS NULL OR OLD.payment_status NOT IN ('completed', 'success'))) THEN
    
    -- Call the edge function to send enrollment emails using correct syntax
    PERFORM http_post(
      'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email',
      json_build_object('enrollmentId', NEW.id)::text,
      'application/json'
    );
    
    RAISE NOTICE 'Triggered enrollment email for enrollment: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;