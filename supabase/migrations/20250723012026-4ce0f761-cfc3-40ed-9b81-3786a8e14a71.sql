-- First check if payment_status column is text or enum, then add cancelled_payment functionality
-- Since payment_status is TEXT, we can just add the new value without creating an enum

-- Create function to cancel unpaid zarinpal enrollments after 10 minutes
CREATE OR REPLACE FUNCTION cancel_unpaid_zarinpal_enrollments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.enrollments 
  SET 
    payment_status = 'cancelled_payment',
    updated_at = now()
  WHERE 
    payment_status = 'pending'
    AND payment_method = 'zarinpal'
    AND created_at < now() - INTERVAL '10 minutes'
    AND manual_payment_status IS NULL; -- Exclude manual payments
    
  -- Log how many were cancelled
  RAISE NOTICE 'Cancelled % unpaid zarinpal enrollments', ROW_COUNT;
END;
$$;

-- Schedule the function to run every 2 minutes
SELECT cron.schedule(
  'cancel-unpaid-zarinpal-enrollments',
  '*/2 * * * *', -- every 2 minutes
  $$
  SELECT cancel_unpaid_zarinpal_enrollments();
  $$
);