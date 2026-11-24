CREATE TABLE public.black_friday_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  discount_percentage integer NOT NULL DEFAULT 20,
  discount_code text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.black_friday_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.black_friday_services TO authenticated;
GRANT ALL ON public.black_friday_services TO service_role;
ALTER TABLE public.black_friday_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active Black Friday services" ON public.black_friday_services
  FOR SELECT USING (is_active OR public.is_academy_admin_safe(auth.uid()));
CREATE POLICY "Admins manage Black Friday services" ON public.black_friday_services
  FOR ALL TO authenticated USING (public.is_academy_admin_safe(auth.uid())) WITH CHECK (public.is_academy_admin_safe(auth.uid()));
CREATE OR REPLACE FUNCTION public.bf_services_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER bf_services_touch BEFORE UPDATE ON public.black_friday_services FOR EACH ROW EXECUTE FUNCTION public.bf_services_touch();