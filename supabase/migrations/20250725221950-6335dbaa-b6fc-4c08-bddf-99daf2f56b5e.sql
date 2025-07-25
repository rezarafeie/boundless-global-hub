-- Create trigger to automatically send enrollment emails
CREATE OR REPLACE FUNCTION public.send_enrollment_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for successful payments or free courses
  IF (NEW.payment_status IN ('completed', 'success') AND 
      (OLD IS NULL OR OLD.payment_status NOT IN ('completed', 'success'))) THEN
    
    -- Call the edge function to send enrollment emails
    PERFORM net.http_post(
      url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json', 
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c'
      ),
      body := jsonb_build_object('enrollmentId', NEW.id)::text
    );
    
    RAISE NOTICE 'Triggered enrollment email for enrollment: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS enrollment_email_trigger ON public.enrollments;
CREATE TRIGGER enrollment_email_trigger
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_enrollment_email_trigger();

-- Manually trigger the email for the existing enrollment
UPDATE public.enrollments 
SET updated_at = now() 
WHERE id = 'abab63bf-b391-4a59-a7b6-15f721db3914';