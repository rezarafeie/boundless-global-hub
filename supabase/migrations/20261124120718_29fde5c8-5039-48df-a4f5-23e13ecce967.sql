ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS digipay_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS digipay_max_amount_toman bigint NOT NULL DEFAULT 100000000;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS digipay_enabled boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.finalize_snapppay_payment(p_payment_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_payment public.snapppay_payments%ROWTYPE;
  v_already boolean := false;
BEGIN
  SELECT * INTO v_payment FROM public.snapppay_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'payment_not_found');
  END IF;
  IF v_payment.status = 'paid' THEN
    v_already := true;
  ELSE
    UPDATE public.snapppay_payments SET status = 'paid', paid_at = COALESCE(paid_at, now()) WHERE id = p_payment_id;
  END IF;
  IF v_payment.order_id IS NOT NULL THEN
    IF v_payment.enrollment_type = 'test' THEN
      UPDATE public.test_enrollments SET payment_status = 'completed', enrollment_status = 'ready' WHERE id = v_payment.order_id;
    ELSE
      UPDATE public.enrollments
        SET payment_status = 'completed',
            payment_method = COALESCE(NULLIF(v_payment.provider, ''), 'snapppay'),
            zarinpal_ref_id = COALESCE(v_payment.provider_reference_id, v_payment.provider_transaction_id)
        WHERE id = v_payment.order_id;
    END IF;
  END IF;
  RETURN jsonb_build_object('success', true, 'already_finalized', v_already, 'order_id', v_payment.order_id);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.finalize_snapppay_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_snapppay_payment(uuid) TO service_role;