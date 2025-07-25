-- Drop and recreate the enrollment email trigger to ensure it works properly
DROP TRIGGER IF EXISTS enrollment_email_trigger ON public.enrollments;

-- Create the trigger function if it doesn't exist
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
    PERFORM net.http_post(
      url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c"}'::jsonb,
      body := json_build_object(
        'enrollmentId', NEW.id
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER enrollment_email_trigger
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_enrollment_email_trigger();