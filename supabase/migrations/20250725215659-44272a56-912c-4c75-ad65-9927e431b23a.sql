-- Enable net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "net" WITH SCHEMA "extensions";

-- Update the trigger function to use the correct syntax
CREATE OR REPLACE FUNCTION public.send_enrollment_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for successful payments
  IF NEW.payment_status IN ('completed', 'success') AND 
     (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('completed', 'success')) THEN
    
    -- Call the edge function to send enrollment emails using net extension
    PERFORM 
      net.http_post(
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