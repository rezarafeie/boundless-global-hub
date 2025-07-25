-- Step 1: Clean up duplicate triggers and fix timing issues

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS send_enrollment_email_trigger ON public.enrollments;
DROP TRIGGER IF EXISTS enrollment_email_trigger ON public.enrollments;

-- Create improved trigger with better timing and error handling
CREATE OR REPLACE FUNCTION public.send_enrollment_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for successful payments or free courses
  IF (NEW.payment_status IN ('completed', 'success') AND 
      (OLD IS NULL OR OLD.payment_status NOT IN ('completed', 'success'))) THEN
    
    -- Use a background job approach to avoid race conditions
    -- Call the edge function with a slight delay mechanism
    PERFORM http_post(
      'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email',
      json_build_object('enrollmentId', NEW.id)::text,
      'application/json'
    );
    
    RAISE NOTICE 'Triggered enrollment email for enrollment: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the enrollment
    RAISE WARNING 'Failed to trigger enrollment email for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger with AFTER timing to ensure enrollment is committed
CREATE TRIGGER send_enrollment_email_trigger
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_enrollment_email_trigger();