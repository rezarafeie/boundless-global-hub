
CREATE TABLE public.consultation_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'zarinpal',
  payment_status text NOT NULL DEFAULT 'pending',
  receipt_url text,
  gateway_authority text,
  gateway_ref_id text,
  source text NOT NULL DEFAULT 'landing',
  webinar_id uuid,
  admin_status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_reservations TO authenticated;
GRANT SELECT, INSERT ON public.consultation_reservations TO anon;
GRANT ALL ON public.consultation_reservations TO service_role;

ALTER TABLE public.consultation_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reservations"
  ON public.consultation_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Reservations are viewable"
  ON public.consultation_reservations FOR SELECT USING (true);
CREATE POLICY "Admins can update reservations"
  ON public.consultation_reservations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete reservations"
  ON public.consultation_reservations FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_consultation_reservations_updated_at
  BEFORE UPDATE ON public.consultation_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_consultation_reservations_created_at ON public.consultation_reservations (created_at DESC);

CREATE TABLE public.consultation_reservation_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT 'رزرو مشاوره دوره بدون مرز',
  description text NOT NULL DEFAULT 'با پرداخت هزینه رزرو، جلسه مشاوره اختصاصی دوره بدون مرز برای شما رزرو می‌شود.',
  price numeric NOT NULL DEFAULT 0,
  card_details text NOT NULL DEFAULT '',
  success_message text NOT NULL DEFAULT 'رزرو شما با موفقیت ثبت شد. کارشناسان ما به‌زودی با شما تماس می‌گیرند.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_reservation_settings_single_row CHECK (id = 1)
);

GRANT SELECT ON public.consultation_reservation_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.consultation_reservation_settings TO authenticated;
GRANT ALL ON public.consultation_reservation_settings TO service_role;

ALTER TABLE public.consultation_reservation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reservation settings"
  ON public.consultation_reservation_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update reservation settings"
  ON public.consultation_reservation_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can insert reservation settings"
  ON public.consultation_reservation_settings FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_consultation_reservation_settings_updated_at
  BEFORE UPDATE ON public.consultation_reservation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.consultation_reservation_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
