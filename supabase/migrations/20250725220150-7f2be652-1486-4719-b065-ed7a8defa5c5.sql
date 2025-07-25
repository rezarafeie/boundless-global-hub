-- Create triggers to automatically send enrollment emails

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS enrollment_email_trigger ON public.enrollments;
DROP TRIGGER IF EXISTS enrollment_email_insert_trigger ON public.enrollments;

-- Create trigger for UPDATE operations (when payment status changes)
CREATE TRIGGER enrollment_email_trigger 
AFTER UPDATE ON public.enrollments 
FOR EACH ROW 
EXECUTE FUNCTION public.send_enrollment_email_trigger();

-- Create trigger for INSERT operations (for free courses that are created as completed)
CREATE TRIGGER enrollment_email_insert_trigger 
AFTER INSERT ON public.enrollments 
FOR EACH ROW 
EXECUTE FUNCTION public.send_enrollment_email_trigger();