-- Update all pending zarinpal payments to cancelled_payment status
UPDATE public.enrollments 
SET 
  payment_status = 'cancelled_payment',
  updated_at = now()
WHERE 
  payment_status = 'pending'
  AND payment_method = 'zarinpal'
  AND manual_payment_status IS NULL; -- Exclude manual payments

-- Log how many records were updated
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % zarinpal enrollments from pending to cancelled_payment', affected_count;
END $$;