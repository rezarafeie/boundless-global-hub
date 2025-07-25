-- Remove the email trigger from enrollment to fix the button
DROP TRIGGER IF EXISTS send_enrollment_email_trigger ON public.enrollments;