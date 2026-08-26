ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS snapppay_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS snapppay_max_amount_toman bigint NOT NULL DEFAULT 50000000,
  ADD COLUMN IF NOT EXISTS snapppay_proxy_url text;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS snapppay_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.snapppay_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  enrollment_type text NOT NULL DEFAULT 'course',
  user_id integer,
  course_id uuid,
  provider text NOT NULL DEFAULT 'snapppay',
  amount numeric NOT NULL,
  amount_rial bigint NOT NULL,
  currency text NOT NULL DEFAULT 'IRR',
  status text NOT NULL DEFAULT 'created',
  provider_payment_token text,
  provider_transaction_id text NOT NULL,
  provider_reference_id text,
  payment_page_url text,
  mobile text,
  callback_payload jsonb,
  verify_response jsonb,
  settle_response jsonb,
  status_response jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  redirected_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS snapppay_payments_transaction_id_key
  ON public.snapppay_payments (provider_transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS snapppay_payments_token_key
  ON public.snapppay_payments (provider_payment_token) WHERE provider_payment_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS snapppay_payments_order_idx ON public.snapppay_payments (order_id);

GRANT SELECT ON public.snapppay_payments TO authenticated;
GRANT ALL ON public.snapppay_payments TO service_role;

ALTER TABLE public.snapppay_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view snapppay payments"
  ON public.snapppay_payments FOR SELECT TO authenticated
  USING (public.is_academy_admin_safe(auth.uid()));

CREATE TRIGGER update_snapppay_payments_updated_at
  BEFORE UPDATE ON public.snapppay_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.finalize_snapppay_payment(p_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.snapppay_payments%ROWTYPE;
  v_already boolean := false;
BEGIN
  SELECT * INTO v_payment FROM public.snapppay_payments
    WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'payment_not_found');
  END IF;

  IF v_payment.status = 'paid' THEN
    v_already := true;
  ELSE
    UPDATE public.snapppay_payments
      SET status = 'paid', paid_at = COALESCE(paid_at, now())
      WHERE id = p_payment_id;
  END IF;

  IF v_payment.order_id IS NOT NULL THEN
    IF v_payment.enrollment_type = 'test' THEN
      UPDATE public.test_enrollments
        SET payment_status = 'completed',
            enrollment_status = 'ready'
        WHERE id = v_payment.order_id;
    ELSE
      UPDATE public.enrollments
        SET payment_status = 'completed',
            payment_method = 'snapppay',
            zarinpal_ref_id = COALESCE(v_payment.provider_reference_id, v_payment.provider_transaction_id)
        WHERE id = v_payment.order_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'already_finalized', v_already, 'order_id', v_payment.order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_snapppay_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_snapppay_payment(uuid) TO service_role;