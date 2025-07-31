-- Fix the cancel_unpaid_zarinpal_enrollments function to not cancel successful payments
CREATE OR REPLACE FUNCTION public.cancel_unpaid_zarinpal_enrollments()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.enrollments 
  SET 
    payment_status = 'cancelled_payment',
    updated_at = now()
  WHERE 
    payment_status = 'pending'
    AND payment_method = 'zarinpal'
    AND created_at < now() - INTERVAL '10 minutes'
    AND manual_payment_status IS NULL -- Exclude manual payments
    AND (zarinpal_ref_id IS NULL OR zarinpal_ref_id = '') -- Only cancel if no successful payment reference
    AND (zarinpal_authority IS NULL OR zarinpal_authority = ''); -- Only cancel if no authority or empty authority
    
  -- Log how many were cancelled
  RAISE NOTICE 'Cancelled % unpaid zarinpal enrollments', ROW_COUNT;
END;
$function$