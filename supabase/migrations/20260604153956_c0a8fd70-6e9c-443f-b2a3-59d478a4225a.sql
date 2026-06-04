CREATE TABLE public.rafieipay_debug_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  request_payload jsonb,
  request_headers jsonb,
  response_status int,
  response_body jsonb,
  error_code text,
  error_message text,
  enrollment_id uuid,
  success boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.rafieipay_debug_logs TO authenticated, anon;
GRANT ALL ON public.rafieipay_debug_logs TO service_role;
ALTER TABLE public.rafieipay_debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rafieipay logs" ON public.rafieipay_debug_logs FOR SELECT USING (true);
CREATE INDEX idx_rafieipay_debug_logs_created_at ON public.rafieipay_debug_logs (created_at DESC);